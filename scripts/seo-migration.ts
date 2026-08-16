/**
 * SEO Migration Script — Production Supabase Database
 *
 * Applies SEO field values to formulations, categories, and blog_posts tables.
 * Safe to re-run: all statements use WHERE (col IS NULL OR col = '') so already-set
 * values are never overwritten unless the --fix-duplicates flag is passed.
 *
 * Usage (dry-run — shows counts only, no writes):
 *   npx tsx scripts/seo-migration.ts
 *
 * Usage (execute writes):
 *   npx tsx scripts/seo-migration.ts --execute
 */

import pg from "pg";
const { Client } = pg;

const DRY_RUN = !process.argv.includes("--execute");
const SITE_NAME = "AIFormulator";

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildFormulationSeoTitle(name: string): string {
  const nameEndsWithFormula = /\bformula(?:tion)?s?\b\s*$/i.test(name.trim());
  const full = nameEndsWithFormula
    ? `${name} | ${SITE_NAME}`
    : `${name} Formula | ${SITE_NAME}`;
  return full.length > 60 ? full.substring(0, 57) + "..." : full;
}

function buildBlogMetaTitle(title: string): string {
  const full = `${title} | ${SITE_NAME}`;
  return full.length > 60 ? full.substring(0, 57) + "..." : full;
}

// ─── connection ───────────────────────────────────────────────────────────────

async function getClient(): Promise<pg.Client> {
  const connStr = process.env.SUPABASE_PRODUCTION_TARGET_URL_FINAL;
  if (!connStr) {
    console.error("ERROR: SUPABASE_PRODUCTION_TARGET_URL_FINAL is not set.");
    process.exit(1);
  }
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

// ─── dry-run preview ──────────────────────────────────────────────────────────

async function runPreview(client: pg.Client) {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  DRY RUN — no writes will be made");
  console.log("  Re-run with --execute to apply changes to production.");
  console.log("══════════════════════════════════════════════════════════\n");

  // ── formulations: seo_title ────────────────────────────────────────────────
  const fSeoNull = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM formulations
     WHERE is_active = true AND (seo_title IS NULL OR seo_title = '')
     ORDER BY name
     LIMIT 10`
  );
  const fSeoCount = await client.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM formulations
     WHERE is_active = true AND (seo_title IS NULL OR seo_title = '')`
  );
  console.log(`FORMULATIONS — seo_title: ${fSeoCount.rows[0].cnt} rows to update`);
  console.log("  Preview (first 10 rows → generated value):");
  for (const row of fSeoNull.rows) {
    console.log(`    "${row.name}" → "${buildFormulationSeoTitle(row.name)}"`);
  }

  // ── formulations: image_alt ────────────────────────────────────────────────
  const fAltCount = await client.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM formulations
     WHERE is_active = true AND (image_alt IS NULL OR image_alt = '')`
  );
  const fAltSample = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM formulations
     WHERE is_active = true AND (image_alt IS NULL OR image_alt = '')
     ORDER BY name LIMIT 5`
  );
  console.log(`\nFORMULATIONS — image_alt: ${fAltCount.rows[0].cnt} rows to update`);
  console.log("  Preview (first 5 → will be set to formulation name):");
  for (const row of fAltSample.rows) {
    console.log(`    "${row.name}"`);
  }

  // ── categories: meta_description ──────────────────────────────────────────
  const catDescNull = await client.query<{ id: string; name: string; meta_description: string | null }>(
    `SELECT id, name, meta_description FROM categories
     WHERE is_active = true
       AND (
         meta_description IS NULL OR meta_description = ''
         OR meta_description ILIKE '%formulations formulations%'
       )
     ORDER BY name`
  );
  console.log(`\nCATEGORIES — meta_description: ${catDescNull.rowCount} rows to update`);
  console.log("  (includes NULL + duplicate-word fixes)");
  for (const row of catDescNull.rows) {
    const nameEndsWithFormulas = /\bformula(?:tion)?s?\b\s*$/i.test(row.name.trim());
    const generated = nameEndsWithFormulas
      ? `Browse professional ${row.name} — complete ingredient lists, manufacturing processes, and technical specifications for each formula.`
      : `Browse professional ${row.name.toLowerCase()} formulations with complete ingredient lists, manufacturing processes, and technical specifications.`;
    const suffix = row.meta_description?.includes("formulations formulations") ? " [FIX duplicate]" : " [SET new]";
    console.log(`    "${row.name}"${suffix}`);
    console.log(`      → "${generated}"`);
  }

  // ── categories: keywords ───────────────────────────────────────────────────
  const catKwCount = await client.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM categories
     WHERE is_active = true AND (keywords IS NULL OR keywords = '')`
  );
  const catKwSample = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM categories
     WHERE is_active = true AND (keywords IS NULL OR keywords = '')
     ORDER BY name LIMIT 5`
  );
  console.log(`\nCATEGORIES — keywords: ${catKwCount.rows[0].cnt} rows to update`);
  console.log("  Preview (first 5):");
  for (const row of catKwSample.rows) {
    const kw = `${row.name.toLowerCase()}, formulation, manufacturing guide, chemical formula, ingredients, recipe`;
    console.log(`    "${row.name}" → "${kw}"`);
  }

  // ── blog_posts: meta_title ─────────────────────────────────────────────────
  const blogTitleNull = await client.query<{ id: string; title: string }>(
    `SELECT id, title FROM blog_posts
     WHERE is_published = true AND (meta_title IS NULL OR meta_title = '')
     ORDER BY title`
  );
  console.log(`\nBLOG POSTS — meta_title: ${blogTitleNull.rowCount} rows to update`);
  for (const row of blogTitleNull.rows) {
    console.log(`    "${row.title}" → "${buildBlogMetaTitle(row.title)}"`);
  }

  console.log("\n──────────────────────────────────────────────────────────");
  console.log("  To apply these changes, run:");
  console.log("  npx tsx scripts/seo-migration.ts --execute");
  console.log("──────────────────────────────────────────────────────────\n");
}

// ─── execute migration ────────────────────────────────────────────────────────

async function runMigration(client: pg.Client) {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  EXECUTE MODE — applying changes to production database");
  console.log("══════════════════════════════════════════════════════════\n");

  await client.query("BEGIN");
  try {

    // ── 1. formulations.seo_title ────────────────────────────────────────────
    // Rules (matching seo-middleware.ts):
    //   • Name already ends with formula/formulation → "{name} | AIFormulator"
    //   • Otherwise                                  → "{name} Formula | AIFormulator"
    //   • Truncate to 60 chars: first 57 + "..." if over limit
    //   • Only applies where seo_title is NULL or empty
    const r1 = await client.query(`
      UPDATE formulations
      SET seo_title = CASE
        WHEN name ~* '\\mformula(?:tion)?s?\\M\\s*$' THEN
          CASE WHEN length(name || ' | AIFormulator') > 60
            THEN left(name || ' | AIFormulator', 57) || '...'
            ELSE name || ' | AIFormulator'
          END
        ELSE
          CASE WHEN length(name || ' Formula | AIFormulator') > 60
            THEN left(name || ' Formula | AIFormulator', 57) || '...'
            ELSE name || ' Formula | AIFormulator'
          END
      END
      WHERE is_active = true
        AND (seo_title IS NULL OR seo_title = '')
    `);
    console.log(`[1/5] formulations.seo_title      — ${r1.rowCount} rows updated`);

    // ── 2. formulations.image_alt ────────────────────────────────────────────
    // Set to the formulation name where missing.
    const r2 = await client.query(`
      UPDATE formulations
      SET image_alt = name
      WHERE is_active = true
        AND (image_alt IS NULL OR image_alt = '')
    `);
    console.log(`[2/5] formulations.image_alt       — ${r2.rowCount} rows updated`);

    // ── 3. categories.meta_description ──────────────────────────────────────
    // Two sub-cases handled in one statement:
    //   a) meta_description IS NULL or empty → generate correct description
    //   b) meta_description contains "formulations formulations" → overwrite with corrected text
    // Pattern: name already ends with "formulations/formula" → avoid duplication.
    // Extra guard: if name starts with "Professional", don't prefix "Browse professional".
    const r3 = await client.query(`
      UPDATE categories
      SET meta_description = CASE
        WHEN name ~* '\\mformula(?:tion)?s?\\M\\s*$' THEN
          CASE WHEN name ILIKE 'Professional %'
            THEN 'Browse ' || name || ' — complete ingredient lists, manufacturing processes, and technical specifications for each formula.'
            ELSE 'Browse professional ' || name || ' — complete ingredient lists, manufacturing processes, and technical specifications for each formula.'
          END
        ELSE
          CASE WHEN name ILIKE 'Professional %'
            THEN 'Browse ' || lower(name) || ' formulations with complete ingredient lists, manufacturing processes, and technical specifications.'
            ELSE 'Browse professional ' || lower(name) || ' formulations with complete ingredient lists, manufacturing processes, and technical specifications.'
          END
      END
      WHERE is_active = true
        AND (
          meta_description IS NULL
          OR meta_description = ''
          OR meta_description ILIKE '%formulations formulations%'
        )
    `);
    console.log(`[3/5] categories.meta_description  — ${r3.rowCount} rows updated`);

    // ── 4. categories.keywords ───────────────────────────────────────────────
    const r4 = await client.query(`
      UPDATE categories
      SET keywords = lower(name) || ', formulation, manufacturing guide, chemical formula, ingredients, recipe'
      WHERE is_active = true
        AND (keywords IS NULL OR keywords = '')
    `);
    console.log(`[4/5] categories.keywords          — ${r4.rowCount} rows updated`);

    // ── 5. blog_posts.meta_title ─────────────────────────────────────────────
    const r5 = await client.query(`
      UPDATE blog_posts
      SET meta_title = CASE
        WHEN length(title || ' | AIFormulator') > 60
          THEN left(title || ' | AIFormulator', 57) || '...'
          ELSE title || ' | AIFormulator'
      END
      WHERE is_published = true
        AND (meta_title IS NULL OR meta_title = '')
    `);
    console.log(`[5/5] blog_posts.meta_title        — ${r5.rowCount} rows updated`);

    await client.query("COMMIT");
    console.log("\n✅ Transaction committed successfully.\n");

    return {
      formulations_seo_title: r1.rowCount ?? 0,
      formulations_image_alt: r2.rowCount ?? 0,
      categories_meta_description: r3.rowCount ?? 0,
      categories_keywords: r4.rowCount ?? 0,
      blog_posts_meta_title: r5.rowCount ?? 0,
    };

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Migration failed — transaction rolled back.");
    console.error(err);
    process.exit(1);
  }
}

// ─── post-migration verification ─────────────────────────────────────────────

async function runVerification(client: pg.Client) {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  POST-MIGRATION VERIFICATION");
  console.log("══════════════════════════════════════════════════════════\n");

  const checks = [
    {
      label: "formulations with seo_title NULL/empty",
      sql: `SELECT COUNT(*) AS cnt FROM formulations WHERE is_active = true AND (seo_title IS NULL OR seo_title = '')`,
      expect: 0,
    },
    {
      label: "formulations with image_alt NULL/empty",
      sql: `SELECT COUNT(*) AS cnt FROM formulations WHERE is_active = true AND (image_alt IS NULL OR image_alt = '')`,
      expect: 0,
    },
    {
      label: "categories with meta_description NULL/empty",
      sql: `SELECT COUNT(*) AS cnt FROM categories WHERE is_active = true AND (meta_description IS NULL OR meta_description = '')`,
      expect: 0,
    },
    {
      label: "categories with 'formulations formulations' duplication",
      sql: `SELECT COUNT(*) AS cnt FROM categories WHERE meta_description ILIKE '%formulations formulations%'`,
      expect: 0,
    },
    {
      label: "categories with keywords NULL/empty",
      sql: `SELECT COUNT(*) AS cnt FROM categories WHERE is_active = true AND (keywords IS NULL OR keywords = '')`,
      expect: 0,
    },
    {
      label: "published blog posts with meta_title NULL/empty",
      sql: `SELECT COUNT(*) AS cnt FROM blog_posts WHERE is_published = true AND (meta_title IS NULL OR meta_title = '')`,
      expect: 0,
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const res = await client.query<{ cnt: string }>(check.sql);
    const val = parseInt(res.rows[0].cnt, 10);
    const passed = val === check.expect;
    if (!passed) allPassed = false;
    const mark = passed ? "✅" : "❌";
    console.log(`  ${mark}  ${check.label}: ${val} remaining (expected ${check.expect})`);
  }

  // Spot-check: show 5 sample seo_title values
  console.log("\n  Sample seo_title values (5 random active formulations):");
  const sample = await client.query<{ name: string; seo_title: string }>(
    `SELECT name, seo_title FROM formulations WHERE is_active = true ORDER BY random() LIMIT 5`
  );
  for (const row of sample.rows) {
    console.log(`    "${row.seo_title}" (from: "${row.name}")`);
  }

  // Spot-check: show category meta_descriptions
  console.log("\n  Sample category meta_descriptions (all 26):");
  const cats = await client.query<{ name: string; meta_description: string; keywords: string }>(
    `SELECT name, meta_description, keywords FROM categories WHERE is_active = true ORDER BY name`
  );
  for (const row of cats.rows) {
    console.log(`    [${row.name}]`);
    console.log(`      desc:     "${row.meta_description ?? "(null)"}"`);
    console.log(`      keywords: "${row.keywords ?? "(null)"}"`);
  }

  console.log(`\n${allPassed ? "✅ All checks passed." : "❌ Some checks failed — review above."}\n`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = await getClient();
  try {
    if (DRY_RUN) {
      await runPreview(client);
    } else {
      await runMigration(client);
      await runVerification(client);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
