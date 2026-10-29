import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyLoadingShell } from "../scripts/install-loading-shell.mjs";

test("static hotfix preserves every SEO tag, prerender and existing asset reference", () => {
  const template = readFileSync("client/index.html", "utf8");
  const original = '<!doctype html><html><head><title>Original title</title><meta name="description" content="Original SEO"><link rel="canonical" href="https://aiformulator.net/"><script type="module" src="/assets/original.js"></script><link rel="stylesheet" href="/assets/original.css"></head><body><div id="root"><div id="ssr-content">Original crawlable page</div></div></body></html>';
  const output = applyLoadingShell(template, original);
  for (const value of ["<title>Original title</title>", '<meta name="description" content="Original SEO">', '<link rel="canonical" href="https://aiformulator.net/">', 'src="/assets/original.js"', 'href="/assets/original.css"', '<div id="root"><div id="ssr-content">Original crawlable page</div></div>']) {
    assert.ok(output.includes(value));
  }
  assert.equal(applyLoadingShell(template, output), output, "installer is idempotent");
  assert.equal((output.match(/id="app-loading-bootstrap"/g) || []).length, 1);
});
