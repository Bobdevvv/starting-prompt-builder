// The builder's logic: answers in, prompt text out. Pure functions over plain
// data, with no DOM and no browser APIs, so all of it is unit-tested.
//
// assemblePrompt must produce exactly what scripts/assemble-prompt.mjs produces:
// that script made the prompt that was tested (research/results.md), and
// tests/parity.test.ts holds the two to the same bytes.

import { FRAME, MODULES, type ModuleData } from "./modules.data";

export type Target = "code" | "browser";
export type SecurityLevel = "standard" | "strict";
export type ProcessLevel = "light" | "thorough";
export type Audience = "just-me" | "other-people";
export type GitChoice = "with-permission" | "main" | "pull-requests" | "hands-off";

export interface Answers {
  readonly target: Target;
  readonly security: SecurityLevel;
  readonly process: ProcessLevel;
  readonly audience: Audience;
  /** You decide, Claude advises (the "Who decides" rule set). On by default. */
  readonly userLeads: boolean;
  readonly usesPackages: boolean;
  readonly git: GitChoice;
  readonly hasTests: boolean;
  readonly isPublicRepo: boolean;
  readonly hasInterface: boolean;
  readonly handlesUserData: boolean;
  readonly promisesNoTracking: boolean;
  readonly isDeployed: boolean;
  readonly spansManySessions: boolean;
  readonly wantsToLearn: boolean;
  readonly hasReadableText: boolean;
}

/** Every visit starts here; nothing is remembered between visits (decision D10). */
export const DEFAULT_ANSWERS: Answers = {
  target: "code",
  security: "standard",
  process: "light",
  audience: "just-me",
  userLeads: true,
  usesPackages: false,
  git: "with-permission",
  hasTests: false,
  isPublicRepo: false,
  hasInterface: false,
  handlesUserData: false,
  promisesNoTracking: false,
  isDeployed: false,
  spansManySessions: false,
  wantsToLearn: false,
  hasReadableText: false,
};

export interface ModuleChoice {
  readonly id: string;
  /** The chosen variant, or null for a module without variants. */
  readonly variant: string | null;
}

/** A hand-made change to one module, on top of what the answers chose. */
export interface ModuleOverride {
  readonly isEnabled: boolean;
  readonly variant?: string;
}

export type ModuleOverrides = Readonly<Record<string, ModuleOverride>>;

export interface ProjectDescription {
  readonly what: string;
  readonly stack: string;
  readonly where: string;
  readonly goal: string;
}

export const EMPTY_PROJECT: ProjectDescription = { what: "", stack: "", where: "", goal: "" };

/** Shown in the prompt when a field is left empty, to fill in after pasting. */
export const PROJECT_PLACEHOLDERS: ProjectDescription = {
  what: "[what the project is]",
  stack: "[languages and frameworks]",
  where: "[new, or an existing repo: read the README and look around before you answer]",
  goal: "[what this session should achieve]",
};

export function findModule(moduleId: string): ModuleData | undefined {
  return MODULES.find((moduleData) => moduleData.id === moduleId);
}

export function isAvailableFor(moduleData: ModuleData, target: Target): boolean {
  return moduleData.targets.includes(target);
}

/** Which modules the answers switch on, and with which variant (modules/README.md, "The questions"). */
export function deriveChoices(answers: Answers): ModuleChoice[] {
  const isStrict = answers.security === "strict";
  const isThorough = answers.process === "thorough";
  const isForOthers = answers.audience === "other-people";
  const chosenVariants = new Map<string, string | null>();
  const choose = (moduleId: string, variant: string | null = null): void => {
    chosenVariants.set(moduleId, variant);
  };

  choose("core");
  if (answers.userLeads) choose("user-leads");
  if (answers.usesPackages || isStrict) choose("dependencies", isStrict ? "strict" : "ask-first");
  if (isStrict) {
    choose("supply-chain");
    choose("secrets-strict");
    choose("local-machine");
  }
  choose("git-workflow", answers.git);
  if (answers.hasTests || isForOthers || isThorough) choose("testing", isThorough ? "strict-gate" : "standard");
  if (answers.spansManySessions || isThorough) choose("work-log", isThorough ? "full" : "light");
  if (isThorough) choose("code-clarity");
  if (answers.isPublicRepo) choose("public-repo");
  if (answers.hasInterface) choose("accessibility");
  if (answers.handlesUserData) choose("user-data", answers.promisesNoTracking ? "privacy-first" : "standard");
  if (answers.isDeployed) choose("deploy-ops");
  if (isForOthers && answers.hasInterface) choose("budgets");
  if (answers.wantsToLearn) choose("explain-as-you-go");
  if (answers.hasReadableText) choose("writing");

  return MODULES
    .filter((moduleData) => chosenVariants.has(moduleData.id) && isAvailableFor(moduleData, answers.target))
    .map((moduleData) => ({ id: moduleData.id, variant: chosenVariants.get(moduleData.id) ?? null }));
}

/** The answers' choices with the hand-made overrides applied, in prompt order. The core is always on. */
export function resolveChoices(answers: Answers, overrides: ModuleOverrides): ModuleChoice[] {
  const derived = new Map(deriveChoices(answers).map((choice) => [choice.id, choice.variant]));
  const resolved: ModuleChoice[] = [];
  for (const moduleData of MODULES) {
    if (!isAvailableFor(moduleData, answers.target)) continue;
    const override = overrides[moduleData.id];
    const isEnabled = moduleData.id === "core" || (override ? override.isEnabled : derived.has(moduleData.id));
    if (!isEnabled) continue;
    const fallbackVariant = derived.get(moduleData.id) ?? moduleData.variants[0] ?? null;
    const requestedVariant = override?.variant ?? fallbackVariant;
    const variant = moduleData.variants.length === 0
      ? null
      : moduleData.variants.includes(requestedVariant ?? "") ? requestedVariant : moduleData.variants[0] ?? null;
    resolved.push({ id: moduleData.id, variant });
  }
  return resolved;
}

/** Warnings about choices that work against each other. */
export function findConflicts(choices: readonly ModuleChoice[]): string[] {
  const warnings: string[] = [];
  const variantOf = (moduleId: string): string | null | undefined =>
    choices.find((choice) => choice.id === moduleId)?.variant;
  if (variantOf("git-workflow") === "main" && variantOf("deploy-ops") !== undefined) {
    warnings.push(
      "Committing straight to main on a project that deploys means changes can reach production without " +
      "anyone reviewing them. That can be the right choice, but make it a deliberate one.");
  }
  return warnings;
}

/** The rules text for one module, variant and target, with the fallback described in modules/README.md. */
export function rulesFor(moduleData: ModuleData, variant: string | null, target: Target): string {
  const suffix = variant ? `: ${variant}` : "";
  const headings = target === "browser"
    ? [`Rules in the browser${suffix}`, "Rules in the browser", `Rules${suffix}`]
    : [`Rules${suffix}`];
  for (const heading of headings) {
    const body = moduleData.rules[heading];
    if (body) return body;
  }
  throw new Error(`Module ${moduleData.id} has no rules for variant "${variant ?? "none"}" in target ${target}`);
}

function filledProject(project: ProjectDescription): ProjectDescription {
  const valueOr = (value: string, placeholder: string): string => value.trim() || placeholder;
  return {
    what: valueOr(project.what, PROJECT_PLACEHOLDERS.what),
    stack: valueOr(project.stack, PROJECT_PLACEHOLDERS.stack),
    where: valueOr(project.where, PROJECT_PLACEHOLDERS.where),
    goal: valueOr(project.goal, PROJECT_PLACEHOLDERS.goal),
  };
}

function ruleSections(choices: readonly ModuleChoice[], target: Target): string[] {
  return choices.map((choice) => {
    const moduleData = findModule(choice.id);
    if (!moduleData) throw new Error(`Unknown module ${choice.id}`);
    return `## ${moduleData.title}\n\n${rulesFor(moduleData, choice.variant, target)}`;
  });
}

/** The starting prompt: opening, rules, the project, and what the first reply should be. */
export function assemblePrompt(target: Target, choices: readonly ModuleChoice[], project: ProjectDescription): string {
  const filled = filledProject(project);
  // Replacement functions, not strings, so "$&" and the like in a user's text stay as typed.
  const projectText = FRAME.project
    .replace("{what it is}", () => filled.what)
    .replace("{stack}", () => filled.stack)
    .replace("{where it stands}", () => filled.where)
    .replace("{goal}", () => filled.goal);
  const firstReply = target === "browser" ? FRAME.firstReplyBrowser : FRAME.firstReplyCode;
  const parts = [
    FRAME.opening,
    ...ruleSections(choices, target),
    `## The project\n\n${projectText}`,
    `## Your first reply\n\n${firstReply}`,
  ];
  return parts.join("\n\n") + "\n";
}

/**
 * A CLAUDE.md for Claude Code: every rules section word for word, then a short
 * description of the project. The session's goal and the first-reply
 * instructions are left out, because they belong to one session only.
 */
export function assembleClaudeMd(choices: readonly ModuleChoice[], project: ProjectDescription): string {
  const filled = filledProject(project);
  const parts = [
    "# CLAUDE.md\n\nThe rules for working on this project. Follow them as written, in every session.",
    ...ruleSections(choices, "code"),
    `## The project\n\n- **What it is:** ${filled.what}\n- **Built with:** ${filled.stack}`,
  ];
  return parts.join("\n\n") + "\n";
}

export interface TextSize {
  readonly lines: number;
  readonly words: number;
}

/** Counts the same way scripts/assemble-prompt.mjs reports sizes. */
export function measureText(text: string): TextSize {
  return {
    lines: text.split("\n").length,
    words: text.split(/\s+/).filter(Boolean).length,
  };
}
