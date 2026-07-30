---
name: Replit database environments
description: Distinguishes Replit development and production PostgreSQL data during external migrations.
---

Replit development and production databases are separate. The workspace `DATABASE_URL` can point to development, while the deployed application uses the production database. External migrations must obtain the connection string from Database → Production → Settings/Connection details and verify representative production counts before importing.

**Why:** A development export can look valid while omitting live users, content, and records that exist only in production.

**How to apply:** For migrations to Supabase or another provider, create the dump from the explicit production connection string, keep the destination separate until counts are confirmed, and compare schema plus representative row counts after restore.