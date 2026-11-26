import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANSWERS, EMPTY_PROJECT, PROJECT_PLACEHOLDERS, assembleClaudeMd, assemblePrompt, deriveChoices,
  findConflicts, findModule, measureText, resolveChoices, rulesFor, type Answers, type ModuleChoice,
} from "./engine";
import { MODULES } from "./modules.data";

const idsOf = (choices: readonly ModuleChoice[]): string[] => choices.map((choice) => choice.id);
const variantOf = (choices: readonly ModuleChoice[], moduleId: string): string | null | undefined =>
  choices.find((choice) => choice.id === moduleId)?.variant;
const answers = (changes: Partial<Answers>): Answers => ({ ...DEFAULT_ANSWERS, ...changes });

describe("deriveChoices", () => {
  it("starts from the core and the default git rules for Claude Code", () => {
    expect(deriveChoices(DEFAULT_ANSWERS)).toEqual([
      { id: "core", variant: null },
      { id: "git-workflow", variant: "with-permission" },
    ]);
  });

  it("drops modules that only apply to Claude Code when the target is the browser", () => {
    const choices = deriveChoices(answers({ target: "browser", security: "strict", process: "thorough" }));
    expect(idsOf(choices)).not.toContain("git-workflow");
    expect(idsOf(choices)).not.toContain("work-log");
    expect(idsOf(choices)).not.toContain("local-machine");
    expect(idsOf(choices)).toContain("supply-chain");
  });

  it("strict security switches on the strict dependency rules and three security modules", () => {
    const choices = deriveChoices(answers({ security: "strict" }));
    expect(variantOf(choices, "dependencies")).toBe("strict");
    expect(idsOf(choices)).toEqual(expect.arrayContaining(["supply-chain", "secrets-strict", "local-machine"]));
  });

  it("standard security with packages asks first", () => {
    expect(variantOf(deriveChoices(answers({ usesPackages: true })), "dependencies")).toBe("ask-first");
  });

  it("thorough process sets the strict testing gate, the full work log and code clarity", () => {
    const choices = deriveChoices(answers({ process: "thorough" }));
    expect(variantOf(choices, "testing")).toBe("strict-gate");
    expect(variantOf(choices, "work-log")).toBe("full");
    expect(idsOf(choices)).toContain("code-clarity");
  });

  it("building for other people adds testing, and accessibility and budgets when there's an interface", () => {
    expect(idsOf(deriveChoices(answers({ audience: "other-people" })))).toContain("testing");
    const withInterface = deriveChoices(answers({ audience: "other-people", hasInterface: true }));
    expect(idsOf(withInterface)).toEqual(expect.arrayContaining(["accessibility", "budgets"]));
  });

  it("picks the privacy-first variant only when the project promises no tracking", () => {
    expect(variantOf(deriveChoices(answers({ handlesUserData: true })), "user-data")).toBe("standard");
    expect(variantOf(deriveChoices(answers({ handlesUserData: true, promisesNoTracking: true })), "user-data"))
      .toBe("privacy-first");
  });

  it("keeps modules in prompt order", () => {
    const allOn = answers({ security: "strict", process: "thorough", audience: "other-people", usesPackages: true,
      hasTests: true, isPublicRepo: true, hasInterface: true, handlesUserData: true, isDeployed: true,
      spansManySessions: true, wantsToLearn: true, hasReadableText: true });
    expect(idsOf(deriveChoices(allOn))).toEqual(MODULES.map((moduleData) => moduleData.id));
  });
});

describe("resolveChoices", () => {
  it("switches a derived module off, and a module that wasn't derived on with its first variant", () => {
    const choices = resolveChoices(answers({ usesPackages: true }), {
      dependencies: { isEnabled: false },
      testing: { isEnabled: true },
    });
    expect(idsOf(choices)).not.toContain("dependencies");
    expect(variantOf(choices, "testing")).toBe("standard");
  });

  it("never switches the core off", () => {
    expect(idsOf(resolveChoices(DEFAULT_ANSWERS, { core: { isEnabled: false } }))).toContain("core");
  });

  it("applies a chosen variant and ignores one the module doesn't have", () => {
    expect(variantOf(resolveChoices(DEFAULT_ANSWERS, { "git-workflow": { isEnabled: true, variant: "main" } }),
      "git-workflow")).toBe("main");
    expect(variantOf(resolveChoices(DEFAULT_ANSWERS, { "git-workflow": { isEnabled: true, variant: "nonsense" } }),
      "git-workflow")).toBe("with-permission");
  });

  it("ignores overrides for modules that don't exist in the target", () => {
    const choices = resolveChoices(answers({ target: "browser" }), { "work-log": { isEnabled: true } });
    expect(idsOf(choices)).not.toContain("work-log");
  });
});

describe("findConflicts", () => {
  it("warns about committing to main on a project that deploys", () => {
    const choices = resolveChoices(answers({ git: "main", isDeployed: true }), {});
    expect(findConflicts(choices)).toHaveLength(1);
    expect(findConflicts(resolveChoices(answers({ isDeployed: true }), {}))).toHaveLength(0);
  });
});

describe("rulesFor", () => {
  it("has rules for every module, every variant and every target it applies to", () => {
    for (const moduleData of MODULES) {
      const variants = moduleData.variants.length > 0 ? moduleData.variants : [null];
      for (const target of moduleData.targets) {
        for (const variant of variants) {
          expect(rulesFor(moduleData, variant, target as "code" | "browser").length, `${moduleData.id} ${variant} ${target}`)
            .toBeGreaterThan(20);
        }
      }
    }
  });

  it("falls back to the module's general browser rules when a variant has none of its own", () => {
    const userData = findModule("user-data");
    if (!userData) throw new Error("user-data module missing");
    expect(rulesFor(userData, "privacy-first", "browser")).toBe(userData.rules["Rules in the browser"]);
  });
});

describe("assemblePrompt", () => {
  const choices = resolveChoices(answers({ usesPackages: true }), {});

  it("puts the opening first, then the rules, the project and the first reply", () => {
    const prompt = assemblePrompt("code", choices, EMPTY_PROJECT);
    const order = ["I'm starting work", "## How we work", "## Dependencies", "## How changes land",
      "## The project", "## Your first reply"].map((text) => prompt.indexOf(text));
    expect(order.every((position, i) => position >= 0 && (i === 0 || position > (order[i - 1] ?? -1)))).toBe(true);
    expect(prompt.endsWith("\n")).toBe(true);
  });

  it("fills empty project fields with placeholders, and keeps what the person typed exactly", () => {
    expect(assemblePrompt("code", choices, EMPTY_PROJECT)).toContain(PROJECT_PLACEHOLDERS.goal);
    const prompt = assemblePrompt("code", choices, { ...EMPTY_PROJECT, what: "a tool that costs $& and $1" });
    expect(prompt).toContain("a tool that costs $& and $1");
  });

  it("never includes the parts of a module meant for the person choosing it", () => {
    const allChoices = resolveChoices(answers({ security: "strict", process: "thorough", isDeployed: true }), {});
    const prompt = assemblePrompt("code", allChoices, EMPTY_PROJECT);
    for (const leak of ["**Prevents:**", "## Why", "## Sources", "## How it could be tested", "---\nid:"]) {
      expect(prompt).not.toContain(leak);
    }
  });

  it("asks the browser for a plan without offering a CLAUDE.md", () => {
    const prompt = assemblePrompt("browser", resolveChoices(answers({ target: "browser" }), {}), EMPTY_PROJECT);
    expect(prompt).toContain("Don't write any code yet.");
    expect(prompt).not.toContain("CLAUDE.md");
  });
});

describe("assembleClaudeMd", () => {
  it("keeps every rules section and leaves out what belongs to one session", () => {
    const choices = resolveChoices(answers({ usesPackages: true, hasTests: true }), {});
    const claudeMd = assembleClaudeMd(choices, { what: "a converter", stack: "Node", where: "new", goal: "start" });
    for (const choice of choices) expect(claudeMd).toContain(`## ${findModule(choice.id)?.title}`);
    expect(claudeMd).toContain("- **What it is:** a converter");
    expect(claudeMd).not.toContain("Your first reply");
    expect(claudeMd).not.toContain("This session's goal");
  });
});

describe("measureText", () => {
  it("counts lines and words", () => {
    expect(measureText("one two\nthree\n")).toEqual({ lines: 3, words: 3 });
  });
});
