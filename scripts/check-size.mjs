// Measures the builder's JavaScript, gzipped, against the host's hard cap of
// 50 KB (docs/embedded-entry-spec.md §3). The code is measured unminified, as
// plain TypeScript output, so the host's minified build will be smaller: this
// number is an upper bound.
//
//   node scripts/check-size.mjs   exits 1 above the cap

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { BUNDLE_FILES, PREVIEW_DIR, buildPreview } from "./build-preview.mjs";

const CAP_BYTES = 50 * 1024;

buildPreview();
const combined = BUNDLE_FILES.map((name) => readFileSync(join(PREVIEW_DIR, name), "utf8")).join("\n");
const gzippedBytes = gzipSync(combined, { level: 9 }).length;
for (const name of BUNDLE_FILES) {
  const text = readFileSync(join(PREVIEW_DIR, name), "utf8");
  console.log(`  ${name.padEnd(18)} ${(text.length / 1024).toFixed(1)} KB raw, ${(gzipSync(text, { level: 9 }).length / 1024).toFixed(1)} KB gzipped`);
}
console.log(`total: ${(combined.length / 1024).toFixed(1)} KB raw, ${(gzippedBytes / 1024).toFixed(1)} KB gzipped ` +
  `(cap ${CAP_BYTES / 1024} KB, unminified, so an upper bound)`);
if (gzippedBytes > CAP_BYTES) {
  console.error("Over the cap. Stop and report the measured size (CLAUDE.md rule 5).");
  process.exit(1);
}
