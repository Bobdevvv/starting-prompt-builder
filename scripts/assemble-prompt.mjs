// Assembles a kickoff prompt from modules/ and a profile, so samples and the
// test's arm C come straight from the module files instead of being copied by
// hand. The builder's engine will do the same in TypeScript; this is the
// reference it must match.
//
//   node scripts/assemble-prompt.mjs <profile.json> <output.md>
//
// A profile: { "target": "code" | "browser",
//              "modules": [ ["core"], ["dependencies", "ask-first"], ... ],
//              "project": { "what": "...", "stack": "...", "where": "...", "goal": "..." } }

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODULES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "modules");

function readModule(moduleId) {
  const text = readFileSync(join(MODULES_DIR, `${moduleId}.md`), "utf8").replaceAll("\r\n", "\n");
  const title = text.match(/^title:\s*(.+)$/m)?.[1].trim() ?? moduleId;
  return { text, title };
}

// The body of a "## heading" section, without leading or trailing blank lines.
function sectionBody(moduleText, heading) {
  const lines = moduleText.split("\n");
  const start = lines.indexOf(`## ${heading}`);
  if (start < 0) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n").trim();
}

// Rules for a module, variant and target, falling back as modules/README.md describes.
function rulesFor(moduleText, variant, target) {
  const suffix = variant ? `: ${variant}` : "";
  const candidates = target === "browser"
    ? [`Rules in the browser${suffix}`, `Rules in the browser`, `Rules${suffix}`]
    : [`Rules${suffix}`];
  for (const heading of candidates) {
    const body = sectionBody(moduleText, heading);
    if (body) return body;
  }
  throw new Error(`No rules found for variant "${variant ?? "none"}", target ${target}`);
}

export function assemblePrompt(profile) {
  const frame = readModule("frame").text;
  const parts = [sectionBody(frame, "Opening")];
  for (const [moduleId, variant] of profile.modules) {
    const { text, title } = readModule(moduleId);
    const heading = moduleId === "core" ? "How we work" : title;
    parts.push(`## ${heading}\n\n${rulesFor(text, variant, profile.target)}`);
  }
  const project = sectionBody(frame, "The project")
    .replace("{what it is}", profile.project.what)
    .replace("{stack}", profile.project.stack)
    .replace("{where it stands}", profile.project.where)
    .replace("{goal}", profile.project.goal);
  parts.push(`## The project\n\n${project}`);
  const firstReplyHeading = profile.target === "browser" ? "Your first reply in the browser" : "Your first reply";
  parts.push(`## Your first reply\n\n${sectionBody(frame, firstReplyHeading)}`);
  return parts.join("\n\n") + "\n";
}

if (process.argv[1]?.endsWith("assemble-prompt.mjs")) {
  const [profilePath, outputPath] = process.argv.slice(2);
  if (!profilePath || !outputPath) {
    console.error("Usage: node scripts/assemble-prompt.mjs <profile.json> <output.md>");
    process.exit(1);
  }
  const prompt = assemblePrompt(JSON.parse(readFileSync(profilePath, "utf8")));
  writeFileSync(outputPath, prompt);
  console.log(`${outputPath}: ${prompt.split("\n").length} lines, ${prompt.split(/\s+/).filter(Boolean).length} words`);
}
