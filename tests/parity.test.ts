// Repo-only checks (not part of the handover): the builder must hand out
// exactly the prompt that was tested, and the generated module data must
// match the Markdown it comes from.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePrompt, deriveChoices, DEFAULT_ANSWERS, type Answers, type ModuleChoice } from "../src/engine";
// @ts-expect-error: plain JavaScript build script, no type declarations
import { renderModuleDataFile } from "../scripts/build-modules.mjs";
// @ts-expect-error: plain JavaScript reference script, no type declarations
import { assemblePrompt as referenceAssemblePrompt } from "../scripts/assemble-prompt.mjs";

interface Profile {
  target: "code" | "browser";
  answers: Record<string, unknown>;
  modules: [string, string?][];
  project: { what: string; stack: string; where: string; goal: string };
}

const readText = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readProfile = (path: string): Profile => JSON.parse(readText(path)) as Profile;
const choicesOf = (profile: Profile): ModuleChoice[] =>
  profile.modules.map(([id, variant]) => ({ id, variant: variant ?? null }));

// The profiles' answers use the questionnaire's wording; this maps them to the engine's.
function answersOf(profile: Profile): Answers {
  const raw = profile.answers;
  return {
    ...DEFAULT_ANSWERS,
    target: profile.target,
    security: raw.security as Answers["security"],
    process: raw.process as Answers["process"],
    audience: raw.for === "other people" ? "other-people" : "just-me",
    userLeads: raw.userLeads === true,
    usesPackages: raw.packages === true,
    git: raw.git as Answers["git"],
    hasTests: raw.tests === true,
    isPublicRepo: raw.public === true,
    hasInterface: raw.interface === true,
    handlesUserData: raw.userData === true,
    isDeployed: raw.deployed === true,
    spansManySessions: raw.manySessions === true,
    wantsToLearn: raw.learn === true,
    hasReadableText: raw.writing === true,
  };
}

describe("the builder hands out the tested prompt", () => {
  const armC = readProfile("research/arm-c-profile.json");

  it("produces the re-tested text, research/arm-c2-prompt.md, byte for byte from the arm C profile", () => {
    expect(assemblePrompt(armC.target, choicesOf(armC), armC.project)).toBe(readText("research/arm-c2-prompt.md"));
  });

  it("derives exactly arm C's modules from arm C's answers (before Who decides existed)", () => {
    expect(deriveChoices(answersOf(armC))).toEqual(choicesOf(armC));
  });

  it("produces the C3 text, research/arm-c3-prompt.md, byte for byte, and derives its modules from its answers", () => {
    const armC3 = readProfile("research/arm-c3-profile.json");
    expect(assemblePrompt(armC3.target, choicesOf(armC3), armC3.project)).toBe(readText("research/arm-c3-prompt.md"));
    expect(deriveChoices(answersOf(armC3))).toEqual(choicesOf(armC3));
  });

  it("matches the reference script for the sample profile too", () => {
    const sample = readProfile("samples/starting-prompt-claude-code.profile.json");
    const fromEngine = assemblePrompt(sample.target, choicesOf(sample), sample.project);
    expect(fromEngine).toBe(referenceAssemblePrompt(sample));
    expect(fromEngine).toBe(readText("samples/starting-prompt-claude-code.md"));
    expect(deriveChoices(answersOf(sample))).toEqual(choicesOf(sample));
  });
});

// The builder tells visitors that nothing they enter is sent or saved. These
// checks keep that sentence true: none of the shipped files may use the network
// or browser storage.
describe("the privacy note stays true", () => {
  const FORBIDDEN = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/, /sendBeacon/, /localStorage/,
    /sessionStorage/, /indexedDB/, /document\.cookie/, /navigator\.serviceWorker/, /new\s+Image\s*\(/, /import\s*\(/];
  for (const file of ["src/view.ts", "src/engine.ts", "src/modules.data.ts"]) {
    it(`${file} makes no network requests and stores nothing`, () => {
      const source = readText(file);
      for (const pattern of FORBIDDEN) expect(source, `${file} matches ${pattern}`).not.toMatch(pattern);
    });
  }
});

describe("generated module data", () => {
  it("src/modules.data.ts matches modules/*.md (run npm run build:modules if not)", () => {
    expect(readText("src/modules.data.ts")).toBe(renderModuleDataFile());
  });
});
