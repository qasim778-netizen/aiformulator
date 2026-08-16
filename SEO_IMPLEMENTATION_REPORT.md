# SEO Implementation Report — AIFormulator.net
**Date:** 2026-08-08  
**Scope:** Production-safe SEO system — one reusable system covering all existing and future formulations.  
**DB structure:** Unchanged. No formulation content modified. No new records created.

---

## 1. Changes Made

### A. Meta Title Pattern (`server/seo-middleware.ts`, `client/src/pages/formulation.tsx`)

**Before:** Fallback title was just the truncated formulation name.  
**After:** Fallback title follows the required pattern:

```
{Product Name} Formula | AIFormulator
```

If the product name already ends with "formula" or "formulation", the redundant word is skipped:

```
Chamomile and Lavender Baby Bath Oil Formulation | AIFormulator
```

Manually stored `seoTitle` values are always preserved when they exist and are topically related to the formulation name.

---

### B. Open Graph + Twitter Cards — Full Suite

Added server-side injection (`server/seo-middleware.ts → injectSeoMeta`) and client-side hydration (`formulation.tsx`, `category.tsx`, `blog-post.tsx`) for:

| Tag | Previous state | After |
|---|---|---|
| `og:title` | Present | Present (improved content) |
| `og:description` | Present | Present (improved content) |
| `og:type` | Present | Present |
| `og:url` | **Missing** | ✓ Added |
| `og:image` | **Missing** | ✓ Added (absolute URL, from DB image field) |
| `twitter:card` | Present | Present |
| `twitter:title` | Present | Present |
| `twitter:description` | Present | Present |
| `twitter:image` | **Missing** | ✓ Added |

When a formulation or category has an image stored, that image is used. When no image exists, the fallback `og:image` is `https://aiformulator.net/og-image.jpg` (static placeholder — see Remaining Issues).

All `og:image` values are guaranteed to be absolute URLs. Relative paths from the DB are prepended with `https://aiformulator.net`.

---

### C. JSON-LD Structured Data

**Added to formulation pages** (`client/src/pages/formulation.tsx`):

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Formulation Name",
  "description": "...",
  "url": "https://aiformulator.net/formulation/slug",
  "image": "https://aiformulator.net/uploads/formulations/...",
  "datePublished": "...",
  "dateModified": "...",
  "publisher": { "@type": "Organization", "name": "AIFormulator" }
}
```

Only uses data present in the database. No ratings, prices, reviews, or claims invented.

**Added to category pages** (`client/src/pages/category.tsx`):

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Category Name Formulations",
  "description": "...",
  "url": "https://aiformulator.net/category/slug",
  "hasPart": [ { "@type": "TechArticle", "name": "...", "url": "..." }, ... ]
}
```

Up to 20 visible formulations are listed as `hasPart` items.

**Already present (unchanged):**
- Home: Organization + WebSite JSON-LD
- Blog listing: JSON-LD
- Blog posts: BlogPosting + BreadcrumbList + conditional HowTo/FAQ JSON-LD
- All pages: BreadcrumbList JSON-LD (via shared `Breadcrumb` component)

---

### D. robots.txt Improvements (`server/routes.ts`)

Added missing disallowed paths:

```
# Added:
Disallow: /admin-dashboard   (was missing despite existing)
Disallow: /login/            (trailing-slash variant)
Disallow: /my-account        (user account — private, noindex in seoMeta already)
Disallow: /formulation-confirmation/  (post-action page, not for indexing)
```

All indexable formulation, category, and blog pages remain fully crawlable.

---

### E. XML Sitemap (`server/routes.ts`)

Added `/contact` page to the sitemap:

```xml
<loc>https://aiformulator.net/contact</loc>
<changefreq>monthly</changefreq>
<priority>0.4</priority>
```

Lowered priority of legal pages (`/terms-of-service`, `/privacy-policy`, `/disclaimer`) from 0.5 to 0.3 to signal their lower editorial importance relative to formulation content.

Sitemap total URLs: **39** (10 static + categories with active formulations + all active formulations + published blog posts).

All formulations in sitemap are active. Empty categories are excluded by existing logic.

---

### F. 404 Handling Fix (`client/src/App.tsx`)

**Before:** The catch-all route rendered `<Home />` for any unknown URL, causing soft 404s.

**After:** The catch-all route renders `<NotFound />`:

```tsx
<Route component={NotFound} />
```

Unknown formulation slugs already returned HTTP 404 from the server (via `serveSeoPage` middleware). This fix makes the client-side also render the correct not-found UI.

---

### G. HTML Template Baseline Tags (`client/index.html`)

Added `og:url` and `og:image` and `twitter:image` baseline placeholders to the HTML template so the server-side `injectSeoMeta` function can replace them via regex on every page request:

```html
<meta property="og:url" content="https://aiformulator.net/" />
<meta property="og:image" content="https://aiformulator.net/og-image.jpg" />
<meta name="twitter:image" content="https://aiformulator.net/og-image.jpg" />
```

---

### H. Automatic Coverage for Future Formulations

Because the SEO system is entirely code-driven (no hardcoded titles or descriptions):

- Every new formulation created via admin automatically gets:
  - Title: `{Name} Formula | AIFormulator` (or custom `seoTitle` if set)
  - Meta description: `Professional {Name} formulation with complete manufacturing guide...` (or custom `metaDescription` if set)
  - Canonical URL: `https://aiformulator.net/formulation/{slug}`
  - JSON-LD TechArticle schema
  - Full og:* and twitter:* meta suite
  - Sitemap inclusion (on next sitemap request)
  - og:image from the uploaded formulation image

---

## 2. Database Fields / Tables Modified

**None.** All changes are code-only. No `UPDATE`, `INSERT`, or `ALTER` statements were executed. Existing database values for `seoTitle`, `metaDescription`, `keywords`, `image`, `slug` are read and used as the source of truth.

---

## 3. URL Changes and Redirects

No existing URLs were changed. No new redirect mappings were added beyond what already existed.

**Pre-existing redirect infrastructure (unchanged):**

| Pattern | Type | Target |
|---|---|---|
| `www.aiformulator.net → aiformulator.net` | 301 | WWW → non-WWW |
| `/formulation/{slug}-{category-suffix}` | 301 | Clean slug |
| `/collection/{slug}` | 301 | `/category/{slug}` |

---

## 4. Metadata Changes Summary

| Page type | Title | Description | og:url | og:image | twitter:image | JSON-LD |
|---|---|---|---|---|---|---|
| Formulation | ✓ Pattern applied | ✓ From DB / smart fallback | ✓ Added | ✓ Added | ✓ Added | ✓ TechArticle |
| Category | ✓ From DB / smart fallback | ✓ From DB / smart fallback | ✓ Added | ✓ Added | ✓ Added | ✓ CollectionPage |
| Blog post | ✓ From DB | ✓ From DB | ✓ Added | ✓ Added | ✓ Added | Already present |
| Home | ✓ Existing | ✓ Existing | ✓ Added | Placeholder | Placeholder | Already present |
| Static pages | ✓ Existing | ✓ Existing | ✓ Added | Placeholder | Placeholder | N/A |

---

## 5. Internal Linking (existing — no changes required)

Already present and working:
- Formulation page → parent category (breadcrumb + left sidebar)
- Formulation page → 2–6 related formulations from same category (Related section)
- Category page → all formulations in that category (card grid)
- Browse / Collection → all categories
- Home → category links
- Blog posts → relevant formulation/category links (manual, admin-controlled)

No changes were needed. The existing structure already provides strong internal linking for every formulation.

---

## 6. Image SEO

- Formulation detail image: uses `formulation.imageAlt || formulation.name` as `alt` attribute (already present in `formulation.tsx`)
- Category card images: use `formulation.name` as `alt` (already present in `category.tsx`)
- Related product images: use `product.name` as `alt` (already present)
- All card images: `loading="lazy"` already applied
- `og:image` and `twitter:image` now populated from DB image paths (absolute URLs)

---

## 7. Sitemap and robots Changes

| Item | Before | After |
|---|---|---|
| `robots.txt` | Missing `/my-account`, `/formulation-confirmation/` | ✓ Added |
| `robots.txt` | `Disallow: /admin-dashboard` missing | ✓ Added |
| Sitemap | Missing `/contact` | ✓ Added |
| Sitemap | Legal pages at priority 0.5 | Lowered to 0.3 |

---

## 8. Validation Results

All checks verified against the running development server:

| Check | Result |
|---|---|
| `/robots.txt` returns HTTP 200 | ✓ |
| `/sitemap.xml` returns HTTP 200 | ✓ |
| Known formulation slug → HTTP 200 | ✓ |
| Unknown formulation slug → HTTP 404 | ✓ |
| Known category slug → HTTP 200 | ✓ |
| `/collection/{slug}` → 301 → `/category/{slug}` | ✓ |
| Old URL suffix `/formulation/x-leather-formula` → 301 → `/formulation/x` | ✓ |
| Formulation page canonical tag correct | ✓ |
| Category page canonical tag correct | ✓ |
| Full og:* suite on formulation pages | ✓ |
| Full twitter:* suite on formulation pages | ✓ |
| og:image absolute URL | ✓ |
| JSON-LD TechArticle on formulation pages | ✓ (client-rendered) |
| JSON-LD CollectionPage on category pages | ✓ (client-rendered) |
| BreadcrumbList JSON-LD on all content pages | ✓ (existing) |

---

## 9. Remaining Issues

### 9.1 `og:image` placeholder file missing
The fallback `og:image` is `https://aiformulator.net/og-image.jpg`. This file does not currently exist. For formulations and categories that have no image in the database, social shares will get a broken image.

**Fix:** Upload a 1200×630 px branded image as `public/og-image.jpg` in the project and commit it.

### 9.2 Some stored `metaDescription` values contain word duplication
A small number of categories have pre-existing stored `metaDescription` values in the database that contain phrasing like "baby care formulations formulations" (the category name was inserted into a template that appended "formulations" again). These stored values override the now-corrected fallback template.

**Fix (optional DB update):** Run a targeted UPDATE on the `categories` table to clear malformed `metaDescription` values so the corrected fallback template is used instead. This would be a very narrow DB change — not a schema change, only updating `metaDescription` column for affected rows.

### 9.3 Old Replit Object Storage paths in `og:image`
Categories and formulations whose images were not yet migrated to local storage still reference `/objects/uploads/...` paths. These are now served as absolute URLs (`https://aiformulator.net/objects/...`) but will return HTTP 500 on Hostinger since that route depends on Replit Object Storage.

**Fix:** Complete the image migration (upload `migration/uploads-hostinger.tar.gz` to Hostinger and configure `UPLOADS_DIR`). The 36 formulations whose original Replit objects no longer exist will need replacement images.

### 9.4 `og-image.jpg` placeholder — Twitter/OG for pages without images
Static pages (home, browse, blog listing, legal) use the placeholder `og-image.jpg`. Once a real branded image is placed at that path, all static pages will have correct social card images automatically.

### 9.5 Demo page in sitemap but marked noindex
`/demo` is not in the sitemap (correct — it was not added). Robots.txt disallows it. This is consistent.
