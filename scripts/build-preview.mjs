// Compiles src/ to plain JavaScript for the local preview and the size check.
//
//   node scripts/build-preview.mjs           build dist/preview/
//   node scripts/build-preview.mjs --serve   build, then serve it at http://localhost:4400
//
// The preview page defines the host site's colour tokens, so the builder looks
// as it will in place. Nothing here is part of the handover.

import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PREVIEW_DIR = join(REPO_ROOT, "dist", "preview");
export const BUNDLE_FILES = ["engine.js", "modules.data.js", "view.js"];

const PREVIEW_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Builder preview</title>
<style>
  :root {
    --color-bg: #0e0f13; --color-panel: #16181f; --color-panel-2: #1d2029; --color-border: #262a35;
    --color-text: #e9eaee; --color-muted: #9299a6; --color-up: #2ecc8f; --color-down: #f4506b;
    --color-accent: #e8b64c;
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, "Cascadia Code", monospace;
  }
  /* Stands in for the host site's pinned header, which publishes its height in this variable. */
  :root { --sticky-header-height: 56px; }
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
  .fake-header { position: sticky; top: 0; z-index: 1; height: var(--sticky-header-height); display: flex;
    align-items: center; padding: 0 20px; background: var(--color-panel-2); border-bottom: 1px solid var(--color-border);
    color: var(--color-muted); font-size: 0.875rem; }
  main { max-width: 728px; margin: 0 auto; padding: 24px 20px; }
  .preview-test { margin-bottom: 16px; padding: 10px 12px; border: 1px dashed var(--color-border); border-radius: 4px;
    color: var(--color-muted); font-size: 0.875rem; }
  .preview-test button { min-height: 44px; padding: 8px 14px; margin-top: 8px; font: inherit; color: var(--color-text);
    background: var(--color-panel-2); border: 1px solid var(--color-border); border-radius: 4px; }
</style>
</head>
<body>
<div class="fake-header">Stand-in for the site's pinned header (preview only)</div>
<main>
  <div class="preview-test">
    <strong>Preview test, not part of the builder.</strong> This button removes the builder from the page,
    the way the site does when someone leaves the page, and adds it back on the second click. It checks that
    removing the builder leaves nothing behind.
    <br><button type="button" id="toggle-mount">Remove the builder</button>
  </div>
  <div id="root"></div>
</main>
<script type="module">
  import { initEmbeddedEntry } from "./view.js";
  const root = document.getElementById("root");
  const toggle = document.getElementById("toggle-mount");
  let teardown = initEmbeddedEntry(root);
  toggle.addEventListener("click", () => {
    if (teardown) { teardown(); teardown = null; toggle.textContent = "Add the builder back"; }
    else { teardown = initEmbeddedEntry(root); toggle.textContent = "Remove the builder"; }
  });
</script>
</body>
</html>
`;

export function buildPreview() {
  rmSync(PREVIEW_DIR, { recursive: true, force: true });
  mkdirSync(PREVIEW_DIR, { recursive: true });
  const tscPath = join(REPO_ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscPath, "-p", "tsconfig.json", "--noEmit", "false", "--rootDir", "src", "--outDir", PREVIEW_DIR,
    "--declaration", "false", "--sourceMap", "false"], { cwd: REPO_ROOT, stdio: "inherit" });
  // Browsers need file extensions on relative imports; the TypeScript sources leave them off.
  for (const name of readdirSync(PREVIEW_DIR).filter((file) => file.endsWith(".js"))) {
    const path = join(PREVIEW_DIR, name);
    writeFileSync(path, readFileSync(path, "utf8").replace(/from "(\.\/[\w.-]+?)(?<!\.js)"/g, 'from "$1.js"'));
  }
  rmSync(join(PREVIEW_DIR, "engine.test.js"), { force: true });
  writeFileSync(join(PREVIEW_DIR, "index.html"), PREVIEW_PAGE);
}

if (process.argv[1]?.endsWith("build-preview.mjs")) {
  buildPreview();
  console.log(`built ${PREVIEW_DIR}`);
  if (process.argv.includes("--serve")) {
    const contentTypes = { ".html": "text/html", ".js": "text/javascript" };
    createServer((request, response) => {
      const requested = normalize(decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/")).replace(/^([\\/])+/, "");
      const path = join(PREVIEW_DIR, requested || "index.html");
      if (!path.startsWith(PREVIEW_DIR)) { response.writeHead(403).end(); return; }
      try {
        const body = readFileSync(path);
        response.writeHead(200, { "content-type": `${contentTypes[extname(path)] ?? "text/plain"}; charset=utf-8` });
        response.end(body);
      } catch {
        response.writeHead(404).end("Not found");
      }
    }).listen(4400, "127.0.0.1", () => console.log("Preview: http://localhost:4400  (Ctrl+C to stop)"));
  }
}
