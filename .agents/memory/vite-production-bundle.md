---
name: Keep Vite dev server out of production bundle
description: Avoid bundling Vite and its dev-only plugins into the production server bundle.
---

`server/index.ts` imported `setupVite` and `serveStatic` from `server/vite.ts`, which in turn imports `vite`, `@replit/vite-plugin-runtime-error-modal`, and `nanoid`. In production, `serveStatic` is used, but the whole module still got bundled, pulling the dev-only dependencies into the production build.

**Why:** Some hosts install only production dependencies when running `npm start`, and a bundle containing static imports of `vite`/`nanoid` can fail to resolve. Even if it does not fail, it bloats the bundle and mixes dev tooling into production.

**How to apply:** Move `serveStatic` and the `log` helper into separate files that do not import Vite. Import `serveStatic` from the new file in `server/index.ts` and load `setupVite` via dynamic import only in development. In the esbuild build command, add `--external:./vite` so the production bundle does not inline the dev Vite module.
