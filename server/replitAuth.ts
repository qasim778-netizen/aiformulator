import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
  user.id = user.claims?.sub; // Set user.id for admin middleware
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  // Add localhost domains for development
  if (process.env.NODE_ENV === "development") {
    domains.push("localhost:5000", "127.0.0.1:5000", "localhost", "127.0.0.1");
  }
  
  for (const domain of domains) {
    // Use http for localhost in development, https for everything else
    const isLocalhost = domain.includes('localhost') || domain.includes('127.0.0.1');
    const protocol = (process.env.NODE_ENV === 'development' && isLocalhost) ? 'http' : 'https';
    
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const hostname = req.hostname;
    const strategyName = `replitauth:${hostname}`;
    
    // Check if strategy exists, otherwise use first available strategy
    const availableStrategies = Object.keys((passport as any)._strategies);
    const targetStrategy = availableStrategies.includes(strategyName) ? strategyName : availableStrategies.find(s => s.startsWith('replitauth:'));
    
    if (!targetStrategy) {
      return res.status(500).json({ message: "No authentication strategy available" });
    }
    
    passport.authenticate(targetStrategy, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname;
    const strategyName = `replitauth:${hostname}`;
    
    // Check if strategy exists, otherwise use first available strategy
    const availableStrategies = Object.keys((passport as any)._strategies);
    const targetStrategy = availableStrategies.includes(strategyName) ? strategyName : availableStrategies.find(s => s.startsWith('replitauth:'));
    
    if (!targetStrategy) {
      return res.redirect("/api/login");
    }
    
    passport.authenticate(targetStrategy, async (err: any, user: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/api/login");
      }
      
      if (!user) {
        return res.redirect("/api/login");
      }
      
      // Log in the user
      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/api/login");
        }
        
        try {
          // Check if user is admin by email
          const { DatabaseStorage } = await import("./database-storage");
          const storage = new DatabaseStorage();
          const userEmail = user.claims?.email;
          const isUserAdmin = userEmail ? await storage.isUserAdminByEmail(userEmail) : false;
          
          // Redirect based on admin status
          if (isUserAdmin) {
            return res.redirect("/admin");
          } else {
            return res.redirect("/"); // Regular users go to home page
          }
        } catch (error) {
          console.error("Error checking admin status during login:", error);
          // Default to home page if there's an error
          return res.redirect("/");
        }
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  // First check if user is authenticated
  const user = req.user as any;
  
  console.log("🔍 Admin Check - isAuthenticated:", req.isAuthenticated());
  console.log("🔍 Admin Check - user exists:", !!user);
  console.log("🔍 Admin Check - user object:", user ? { id: user.id, claims: user.claims } : "no user");
  
  if (!req.isAuthenticated() || !user) {
    console.log("❌ Admin Check - Not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Import storage dynamically to avoid circular dependency
    const { DatabaseStorage } = await import("./database-storage");
    const storage = new DatabaseStorage();
    
    // Check if user is admin by email (more reliable than ID)
    const userEmail = user.claims?.email;
    console.log("🔍 Admin Check - user email:", userEmail);
    
    if (!userEmail) {
      console.log("❌ Admin Check - No email found");
      return res.status(401).json({ message: "Unauthorized: No email found" });
    }
    
    const isUserAdmin = await storage.isUserAdminByEmail(userEmail);
    console.log("🔍 Admin Check - isUserAdmin result:", isUserAdmin);
    
    if (!isUserAdmin) {
      console.log("❌ Admin Check - User is not admin");
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    console.log("✅ Admin Check - Success, proceeding");
    return next();
  } catch (error) {
    console.error("❌ Admin Check - Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};