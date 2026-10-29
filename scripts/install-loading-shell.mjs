// Install ONLY the loading shell into an existing release's HTML. Asset URLs,
// SEO tags, API/backend files and the React bundle are deliberately untouched.
import { readFileSync, copyFileSync, writeFileSync, renameSync, existsSync, constants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function applyLoadingShell(template, target) {
  const assetsBefore = target.match(/(?:src|href)=["']\/assets\/[^"']+["']/g) || [];
  let output = target;
  for (const name of ["shell", "status"]) {
    const pattern = new RegExp(`\\s*<!-- app-loading-${name}:start -->[\\s\\S]*?<!-- app-loading-${name}:end -->\\s*`, "g");
    const block = template.match(pattern)?.[0].trim();
    if (!block) throw new Error(`Loading ${name} is absent from source template`);
    output = output.replace(pattern, "");
    const anchor = name === "shell" ? /<head[^>]*>/i : /<body[^>]*>/i;
    if (!anchor.test(output)) throw new Error(`Missing ${name} insertion point`);
    output = output.replace(anchor, match => `${match}\n${block}\n`);
  }
  if (JSON.stringify(output.match(/(?:src|href)=["']\/assets\/[^"']+["']/g) || []) !== JSON.stringify(assetsBefore)) {
    throw new Error("Refusing to change existing release asset references");
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [templatePath, targetPath, backupPath] = process.argv.slice(2);
  if (!templatePath || !targetPath || !backupPath) throw new Error("Usage: node install-loading-shell.mjs source-template target-html backup-html");
  const original = readFileSync(targetPath, "utf8");
  const output = applyLoadingShell(readFileSync(templatePath, "utf8"), original);
  // Never activate HTML referencing an incomplete release.
  for (const match of original.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)) {
    const asset = path.resolve(path.dirname(targetPath), `.${match[1].split(/[?#]/)[0]}`);
    if (!asset.startsWith(path.resolve(path.dirname(targetPath)) + path.sep) || !existsSync(asset)) {
      throw new Error("Referenced frontend asset is absent: " + match[1]);
    }
  }
  copyFileSync(targetPath, backupPath, constants.COPYFILE_EXCL);
  const temporary = `${targetPath}.loading-shell.tmp`;
  writeFileSync(temporary, output, { mode: 0o644 });
  renameSync(temporary, targetPath);
  console.log("Loading shell installed atomically; existing assets and SEO preserved. Backup saved.");
}
