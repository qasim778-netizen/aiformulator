import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { db } from "./db";
import { users as usersTable } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { detectCountryFromRequest } from "./geoip";

/**
 * Real Google OAuth 2.0 setup.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL   (e.g. https://aiformulator.net/api/auth/google/callback)
 *
 * Routes mounted:
 *   GET  /api/auth/google           → redirects to Google's consent page
 *   GET  /api/auth/google/callback  → Google sends user back here
 */

export function isGoogleAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}

function getCallbackURL(req?: Request): string {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  if (req) {
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    return `${proto}://${req.get("host")}/api/auth/google/callback`;
  }
  return "https://aiformulator.net/api/auth/google/callback";
}

async function findOrCreateGoogleUser(profile: Profile, country: string): Promise<{ id: string; isAdmin: boolean } | null> {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value?.toLowerCase().trim();
  if (!email) return null;

  const firstName = profile.name?.givenName || (profile.displayName?.split(" ")[0] ?? null);
  const lastName = profile.name?.familyName || (profile.displayName?.split(" ").slice(1).join(" ") || null);
  const profileImageUrl = profile.photos?.[0]?.value || null;

  // 1) Look up existing user by googleId or email
  const existing = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.googleId, googleId), eq(usersTable.email, email)))
    .limit(1);

  if (existing.length > 0) {
    const u = existing[0];
    // Backfill country if missing; otherwise keep existing
    const nextCountry =
      u.country && u.country.trim() !== "" && u.country !== "N/A"
        ? u.country
        : country || "N/A";
    // Link googleId / refresh profile data on every login
    const [updated] = await db
      .update(usersTable)
      .set({
        googleId,
        firstName: u.firstName || firstName,
        lastName: u.lastName || lastName,
        profileImageUrl: profileImageUrl || u.profileImageUrl,
        country: nextCountry,
        loginProvider: u.loginProvider === "email" && u.password ? u.loginProvider : "google",
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, u.id))
      .returning({ id: usersTable.id, isAdmin: usersTable.isAdmin });
    console.log(`[GoogleAuth] existing user ${u.id} country=${nextCountry}`);
    return updated;
  }

  // 2) Create new user (no password — OAuth-only)
  const [created] = await db
    .insert(usersTable)
    .values({
      id: randomUUID(),
      email,
      password: "",
      firstName,
      lastName,
      country: country || "N/A",
      googleId,
      profileImageUrl,
      loginProvider: "google",
      lastLoginAt: new Date(),
      isAdmin: false,
    })
    .returning({ id: usersTable.id, isAdmin: usersTable.isAdmin });

  console.log(`[GoogleAuth] new user ${created?.id} country=${country || "N/A"}`);
  return created;
}

export function setupGoogleAuth(app: Express) {
  if (!isGoogleAuthConfigured()) {
    console.warn(
      "[GoogleAuth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in disabled."
    );
  } else {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: getCallbackURL(),
          passReqToCallback: true,
        },
        async (req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done: any) => {
          try {
            const country = await detectCountryFromRequest(req).catch(() => "N/A");
            const user = await findOrCreateGoogleUser(profile, country);
            if (!user) return done(null, false, { message: "No email returned from Google." });
            return done(null, user);
          } catch (err) {
            console.error("[GoogleAuth] verify error:", err);
            return done(err as Error);
          }
        }
      )
    );
    console.log("[GoogleAuth] Google OAuth strategy registered.");
  }

  // Start the OAuth flow → redirect straight to Google
  app.get("/api/auth/google", (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).send(
        "Google sign-in is not configured on the server. Please use email login."
      );
    }
    // Persist optional returnTo so we can redirect back after callback
    const returnTo = (req.query.returnTo as string) || "";
    if (returnTo) (req.session as any).postLoginRedirect = returnTo;

    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      session: false,
    })(req, res, next);
  });

  // Google sends user back here
  app.get("/api/auth/google/callback", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "google",
      { session: false, failureRedirect: "/login?error=google" },
      (err: any, user: any) => {
        if (err) {
          console.error("[GoogleAuth] callback error:", err);
          return res.redirect("/login?error=google");
        }
        if (!user) return res.redirect("/login?error=google");

        // Establish our own session (matches POST /api/login pattern)
        (req.session as any).userId = user.id;
        (req.session as any).save((saveErr: any) => {
          if (saveErr) {
            console.error("[GoogleAuth] session save error:", saveErr);
            return res.redirect("/login?error=session");
          }
          const redirectTo =
            (req.session as any).postLoginRedirect ||
            (user.isAdmin ? "/admin" : "/my-account");
          delete (req.session as any).postLoginRedirect;
          return res.redirect(redirectTo);
        });
      }
    )(req, res, next);
  });
}
