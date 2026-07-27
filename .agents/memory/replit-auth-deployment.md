---
name: Replit Auth module-level crash
description: Why importing replitAuth.ts outside Replit crashes the app and how to guard it.
---

`server/replitAuth.ts` used to throw at module load if `REPLIT_DOMAINS` was not set. Because `server/routes.ts` imports `setupAuth` from that file at the top level, the whole server crashed on startup on non-Replit hosts.

**Why:** Replit OIDC setup code assumed a Replit environment and threw before any route could run.

**How to apply:** Keep the module importable by default. Only throw or skip inside `setupAuth()` when `REPLIT_DOMAINS` is missing, and still set up session/passport so email/Google auth keeps working. When `REPLIT_DOMAINS` is present, register the OIDC strategies as before.
