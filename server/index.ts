import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrate";
import { warmCache, db } from "./db";
import { sql } from "drizzle-orm";
import { getSeoMetaForUrl, injectSeoMeta, generateFormulationPrerender, generateBlogPrerender, generateStaticPrerender, generateCategoryPrerender } from "./seo-middleware";
import { storage } from "./storage";

// Environment validation function
function validateEnvironment() {
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Optional vars with warnings
  const optionalVars = [
    { name: 'OPENAI_API_KEY', description: 'OpenAI API functionality will be disabled' },
    { name: 'SESSION_SECRET', description: 'Session management may be insecure' },
    { name: 'REPLIT_DOMAINS', description: 'Replit authentication will be disabled' }
  ];
  
  optionalVars.forEach(({ name, description }) => {
    if (!process.env[name]) {
      console.warn(`⚠️  Optional environment variable ${name} not set: ${description}`);
    }
  });
  
  console.log('✅ Environment validation passed');
}

const app = express();

// Enable HTML/CSS/JS compression for better performance (gzip/Brotli)
app.use(compression({
  filter: (req, res) => {
    // Compress everything except images and already compressed files
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  // Enable Brotli compression when supported by client
}));

// WWW redirect middleware - force non-www version for consistency
app.use((req, res, next) => {
  const host = req.get('host');
  if (host && host.startsWith('www.')) {
    const newHost = host.slice(4); // Remove 'www.'
    const protocol = req.header('x-forwarded-proto') || req.protocol;
    return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
  }
  next();
});

// Formulation URL redirect middleware - handle old URLs with category suffixes
app.use((req, res, next) => {
  const path = req.path;
  
  // Only process formulation URLs
  if (path.startsWith('/formulation/')) {
    const slug = path.replace('/formulation/', '');
    
    // Check if slug has old category suffixes and redirect to clean version
    const categorySuffixes = [
      '-baby-formula', '-oral-formula', '-skin-formula', '-beauty-formula',
      '-cleaning-formula', '-detergent-formula', '-leather-formula', 
      '-mens-formula', '-men-formula', '-organic-formula', '-shoe-formula', 
      '-general-formula', '-construction-formula', '-skincare-formula',
      '-automotive-formula', '-agricultural-formula', '-water-treatment-formula',
      '-pet-care-formula', '-hair-formula', '-grooming-formula', '-textile-formula',
      '-3d-printing-formula', '-packaging-formula',
      // Also handle -formulation suffixes
      '-baby-formulation', '-oral-formulation', '-skin-formulation', '-beauty-formulation',
      '-cleaning-formulation', '-detergent-formulation', '-leather-formulation',
      '-mens-formulation', '-men-formulation', '-organic-formulation', '-shoe-formulation',
      '-general-formulation', '-construction-formulation', '-skincare-formulation',
      '-automotive-formulation', '-agricultural-formulation', '-water-treatment-formulation',
      '-pet-care-formulation', '-hair-formulation', '-grooming-formulation', '-textile-formulation',
      '-3d-printing-formulation', '-packaging-formulation'
    ];
    
    for (const suffix of categorySuffixes) {
      if (slug.endsWith(suffix)) {
        const cleanSlug = slug.replace(suffix, '');
        const protocol = req.header('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        return res.redirect(301, `${protocol}://${host}/formulation/${cleanSlug}`);
      }
    }
  }
  
  next();
});

app.use(express.json({ limit: '50mb' })); // Increased limit for base64 image data
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate environment variables first
    validateEnvironment();
    
    // Run database migrations
    await runMigrations();

    // One-time data fix: publish all active formulations that are still in draft.
    // All active formulations are publicly visible on the site, so draft status
    // was preventing Google from indexing them. Uses direct DB update (not storage
    // layer) to bypass caching and guarantee the write lands. Safe on every restart.
    try {
      const result = await db.execute(sql`
        UPDATE formulations
        SET status = 'published', updated_at = NOW()
        WHERE is_active = true AND status != 'published'
        RETURNING id
      `);
      const count = result.rows.length;
      if (count > 0) {
        console.log(`✅ Auto-published ${count} active formulations`);
      } else {
        console.log(`✅ All active formulations already published`);
      }
    } catch (err) {
      console.error("Auto-publish failed (non-fatal):", err);
    }

    // Warm cache on startup
    await warmCache();
  
  // Register API routes BEFORE Vite middleware to ensure API calls reach Express
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // SSR meta tag injection: handle SEO routes before Vite/static catch-all.
  // We read the HTML template directly, inject the correct meta tags, and send.
  // This works in both dev and production (avoids res.sendFile stream issues).
  const SITE_URL = "https://aiformulator.net";

  async function serveSeoPage(req: Request, res: Response, next: NextFunction) {
    const url = req.originalUrl.split("?")[0].split("#")[0];

    // Detect dynamic routes — a missing slug here must return 404, not 200.
    // Static routes (/about, /faq, etc.) fall through to React normally.
    const isDynamicRoute = /^\/(formulation|category|blog)\//.test(url);

    let htmlPath: string;
    if (app.get("env") === "development") {
      htmlPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
    } else {
      htmlPath = path.resolve(import.meta.dirname, "public", "index.html");
    }

    let seoMeta;
    try {
      seoMeta = await getSeoMetaForUrl(url);
    } catch (e) {
      return next();
    }

    if (!seoMeta) {
      if (isDynamicRoute) {
        // Slug not found in DB → return proper HTTP 404 so Google deindexes it.
        // We still send the React shell so users get a usable UI.
        try {
          const html = await fs.promises.readFile(htmlPath, "utf-8");
          return res.status(404).set({ "Content-Type": "text/html" }).send(html);
        } catch {
          return res.status(404).send("Not found");
        }
      }
      return next();
    }

    // Always set canonical to the exact URL the user is visiting,
    // not the DB slug (which may have old suffixes like -mens-formula).
    seoMeta.canonicalUrl = `${SITE_URL}${req.path}`;

    let html: string;
    try {
      html = await fs.promises.readFile(htmlPath, "utf-8");
    } catch (e) {
      return next();
    }

    html = injectSeoMeta(html, seoMeta);

    // Inject pre-rendered body content into <div id="root"> so crawlers see
    // real H1, sections, and page text before JavaScript loads.
    // React replaces this entirely once the SPA boots — it's only for crawlers.
    try {
      let prerender: string | null = null;
      const formulationMatch = url.match(/^\/formulation\/(.+)$/);
      const blogMatch = url.match(/^\/blog\/(.+)$/);
      const categoryMatch = url.match(/^\/category\/(.+)$/);
      if (formulationMatch) {
        prerender = await generateFormulationPrerender(formulationMatch[1]);
      } else if (blogMatch) {
        prerender = await generateBlogPrerender(blogMatch[1]);
      } else if (categoryMatch) {
        prerender = await generateCategoryPrerender(categoryMatch[1]);
      } else {
        prerender = await generateStaticPrerender(url);
      }
      if (prerender) {
        html = html.replace('<div id="root"></div>', `<div id="root">${prerender}</div>`);
        // NOTE: Do NOT hide #ssr-content with display:none — Google treats that
        // as hidden/cloaked content and ignores it (causes Soft 404).
        // The prerendered HTML is briefly visible until React hydrates and
        // replaces it — this is the correct SSR pattern (same as Next.js).
      }
    } catch (e) {
      console.error("Prerender injection failed:", e);
      // Continue without prerender — don't fail the whole response
    }

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  }

  // Redirect /collection/:slug → /category/:slug (old URL pattern)
  app.get("/collection/:slug", (req: Request, res: Response) => {
    const protocol = req.header("x-forwarded-proto") || req.protocol;
    const host = req.get("host");
    return res.redirect(301, `${protocol}://${host}/category/${req.params.slug}`);
  });

  // Dynamic pages — SSR canonical + meta injection
  app.get("/formulation/:slug", serveSeoPage);
  app.get("/category/:slug", serveSeoPage);
  app.get("/blog/:slug", serveSeoPage);

  // Static pages — SSR canonical + meta injection
  const staticRoutes = [
    "/",
    "/browse",
    "/collection",
    "/blog",
    "/about",
    "/faq",
    "/demo",
    "/terms-of-service",
    "/privacy-policy",
    "/disclaimer",
    "/signup",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/my-account",
  ];
  staticRoutes.forEach(route => app.get(route, serveSeoPage));

  // Setup Vite/static serving AFTER API routes are registered
  // This ensures API routes are handled first before the catch-all
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
  
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
})();
