import { existsSync, statSync } from "node:fs";

const requiredFiles = ["dist/index.js", "dist/public/index.html"];
const missingFiles = requiredFiles.filter((file) => {
  try {
    return !existsSync(file) || statSync(file).size === 0;
  } catch {
    return true;
  }
});

if (missingFiles.length > 0) {
  console.error(`Deployment bundle is missing: ${missingFiles.join(", ")}`);
  process.exit(1);
}

console.log("Committed production bundle verified; skipping remote Vite build.");