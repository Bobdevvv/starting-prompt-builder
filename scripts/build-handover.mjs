// Builds the handover folder for the host site: the builder's code, the
// generated rule data, the README (with the measured size filled in) and one
// sample output. Regenerated from src/ every time, so it can't drift.
//
//   node scripts/build-handover.mjs

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { BUNDLE_FILES, PREVIEW_DIR, buildPreview } from "./build-preview.mjs";

const REPO_ROOT = join(import.meta.dirname, "..");
const SLUG = "starting-prompt-builder";
const HANDOVER_DIR = join(REPO_ROOT, "handover", SLUG);
const SOURCE_FILES = ["engine.ts", "engine.test.ts", "view.ts", "modules.data.ts"];

buildPreview();
const combined = BUNDLE_FILES.map((name) => readFileSync(join(PREVIEW_DIR, name), "utf8")).join("\n");
const gzippedKb = (gzipSync(combined, { level: 9 }).length / 1024).toFixed(1);
const sizeText = `${gzippedKb} KB gzipped, all JavaScript including the rule text, measured unminified ` +
  "(an upper bound; the cap is 50 KB).";

rmSync(HANDOVER_DIR, { recursive: true, force: true });
mkdirSync(HANDOVER_DIR, { recursive: true });
for (const name of SOURCE_FILES) copyFileSync(join(REPO_ROOT, "src", name), join(HANDOVER_DIR, name));
const readme = readFileSync(join(REPO_ROOT, "handover", "README.template.md"), "utf8").replace("{SIZE}", sizeText);
writeFileSync(join(HANDOVER_DIR, "README.md"), readme);
copyFileSync(join(REPO_ROOT, "samples", "starting-prompt-claude-code.md"), join(HANDOVER_DIR, "sample-output.md"));
console.log(`wrote handover/${SLUG}/ (${SOURCE_FILES.length} code files, README.md, sample-output.md); ${sizeText}`);
