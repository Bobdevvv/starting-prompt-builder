// The builder's interface. The only file that touches the browser; all logic
// lives in engine.ts. Built from standard form controls, so keyboard use and
// screen readers work without extra code. Nothing is stored between visits
// (decision D10).

import {
  DEFAULT_ANSWERS, EMPTY_PROJECT, assembleClaudeMd, assemblePrompt, findConflicts, isAvailableFor, measureText,
  resolveChoices, type Answers, type GitChoice, type ModuleOverrides, type ProjectDescription,
} from "./engine";
import { MODULES } from "./modules.data";

type OutputKind = "prompt" | "claude-md";
type BooleanAnswer = { [K in keyof Answers]: Answers[K] extends boolean ? K : never }[keyof Answers];

interface Option<T extends string> { readonly value: T; readonly label: string }

const QUICK_QUESTIONS: ReadonlyArray<{ key: "target" | "security" | "process" | "audience"; legend: string;
  options: ReadonlyArray<Option<string>> }> = [
  { key: "target", legend: "Where will you use the prompt?", options: [
    { value: "code", label: "Claude Code" }, { value: "browser", label: "claude.ai in the browser" }] },
  { key: "security", legend: "How strict should security be?", options: [
    { value: "standard", label: "Standard" }, { value: "strict", label: "Strict" }] },
  { key: "process", legend: "How much process?", options: [
    { value: "light", label: "Light" }, { value: "thorough", label: "Thorough" }] },
  { key: "audience", legend: "Who is it for?", options: [
    { value: "just-me", label: "Just me" }, { value: "other-people", label: "Other people" }] },
];

const GIT_OPTIONS: ReadonlyArray<Option<GitChoice>> = [
  { value: "with-permission", label: "Claude runs git, but asks before commits and pushes" },
  { value: "pull-requests", label: "Claude works on branches and opens pull requests" },
  { value: "main", label: "Claude commits straight to main" },
  { value: "hands-off", label: "I handle git myself" },
];

/** Project facts. `isAsked` hides a question that the quick answers already settled. */
const FACT_QUESTIONS: ReadonlyArray<{ key: BooleanAnswer; label: string; isAsked: (a: Answers) => boolean }> = [
  { key: "usesPackages", label: "It uses third-party packages", isAsked: (a) => a.security !== "strict" },
  { key: "hasTests", label: "It has, or should have, automated tests",
    isAsked: (a) => a.process !== "thorough" && a.audience !== "other-people" },
  { key: "isPublicRepo", label: "The repository is public, or will be", isAsked: () => true },
  { key: "hasInterface", label: "It has an interface that people use", isAsked: () => true },
  { key: "handlesUserData", label: "It handles data about the people who use it", isAsked: () => true },
  { key: "promisesNoTracking", label: "It promises its users they aren't tracked",
    isAsked: (a) => a.handlesUserData },
  { key: "isDeployed", label: "It gets deployed, or runs on a server", isAsked: () => true },
  { key: "spansManySessions", label: "I'll work on it across many sessions",
    isAsked: (a) => a.target === "code" && a.process !== "thorough" },
  { key: "wantsToLearn", label: "I want to learn along the way, not only get results", isAsked: () => true },
  { key: "hasReadableText", label: "It has text people read, such as docs or interface copy", isAsked: () => true },
];

const PROJECT_FIELDS: ReadonlyArray<{ key: keyof ProjectDescription; label: string; hint: string }> = [
  { key: "what", label: "What it is", hint: "For example: a habit tracker that runs in the browser" },
  { key: "stack", label: "Built with", hint: "For example: TypeScript and Vite" },
  { key: "where", label: "Where it stands", hint: "For example: an existing repo, or starting from nothing" },
  { key: "goal", label: "This session's goal", hint: "For example: add a weekly overview screen" },
];

const VARIANT_LABELS: Readonly<Record<string, string>> = {
  "ask-first": "Ask first", strict: "Strict: approved list only", "with-permission": "Asks before commits and pushes",
  main: "Straight to main", "pull-requests": "Branches and pull requests", "hands-off": "I handle git",
  standard: "Standard", "strict-gate": "Strict gate", light: "Light", full: "Full ticket process",
  "privacy-first": "Privacy-first",
};

const STYLE_TEXT = `
.cssk { width: 100%; box-sizing: border-box; color: var(--color-text); font-family: var(--font-sans);
  border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-panel); padding: 16px; }
.cssk *, .cssk *::before, .cssk *::after { box-sizing: border-box; }
.cssk h3 { font-size: 1rem; margin: 20px 0 8px; color: var(--color-text); }
.cssk h3:first-child { margin-top: 0; }
.cssk p.cssk-note { color: var(--color-muted); font-size: 0.875rem; margin: 0 0 8px; }
.cssk fieldset { border: 0; margin: 0 0 12px; padding: 0; min-width: 0; }
.cssk legend { font-weight: 600; margin-bottom: 4px; padding: 0; }
.cssk-choices { display: flex; flex-wrap: wrap; gap: 8px; }
.cssk-choice, .cssk-check { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 12px;
  border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-panel-2); cursor: pointer; }
.cssk-choices .cssk-choice { flex: 1 1 140px; }
.cssk-check { margin-bottom: 6px; }
.cssk input[type="radio"], .cssk input[type="checkbox"] { width: 18px; height: 18px; margin: 0; flex: none;
  accent-color: var(--color-accent); }
.cssk-module { border: 1px solid var(--color-border); border-radius: 4px; padding: 8px 12px; margin-bottom: 6px;
  background: var(--color-panel-2); }
.cssk-module .cssk-check { border: 0; padding: 0 0; background: none; margin: 0; font-weight: 600; }
.cssk-module p { color: var(--color-muted); font-size: 0.8125rem; margin: 0 0 6px 26px; }
.cssk select, .cssk input[type="text"], .cssk textarea { width: 100%; min-height: 44px; font: inherit;
  color: var(--color-text); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px;
  padding: 8px 10px; }
.cssk-module select { margin-left: 26px; width: calc(100% - 26px); }
.cssk label.cssk-field { display: block; font-weight: 600; margin: 10px 0 4px; }
.cssk textarea { font-family: var(--font-mono); font-size: 0.8125rem; line-height: 1.5; min-height: 280px;
  resize: vertical; white-space: pre-wrap; }
.cssk-warning { border: 1px solid var(--color-down); border-radius: 4px; padding: 8px 12px; margin: 8px 0; }
.cssk-warning::before { content: "Warning: "; font-weight: 600; color: var(--color-down); }
.cssk-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0; }
.cssk button { min-height: 44px; min-width: 44px; padding: 8px 14px; font: inherit; font-weight: 600;
  color: var(--color-text); background: var(--color-panel-2); border: 1px solid var(--color-border);
  border-radius: 4px; cursor: pointer; }
.cssk button[aria-pressed="true"] { border-color: var(--color-accent); color: var(--color-accent); }
.cssk button.cssk-primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg); }
.cssk-size { font-family: var(--font-mono); color: var(--color-muted); font-size: 0.8125rem; margin-left: auto; }
.cssk-status { min-height: 1.5em; font-size: 0.875rem; color: var(--color-muted); }
.cssk :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.cssk-choice:focus-within, .cssk-check:focus-within { border-color: var(--color-accent); }
.cssk [hidden] { display: none !important; }
`;

let instanceCount = 0;

function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K, properties: Partial<Record<string, string>> = {}, children: ReadonlyArray<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const created = document.createElement(tagName);
  for (const [name, value] of Object.entries(properties)) {
    if (value !== undefined) created.setAttribute(name, value);
  }
  created.append(...children);
  return created;
}

/**
 * Mounts the builder into `root`. Returns a teardown that removes every
 * listener, cancels pending work and frees any download that is still waiting.
 */
export function initEmbeddedEntry(root: HTMLElement): () => void {
  instanceCount += 1;
  const idPrefix = `cssk${instanceCount}`;
  const listeners = new AbortController();
  const { signal } = listeners;
  const pendingTimers = new Set<number>();
  const pendingDownloadUrls = new Set<string>();

  let answers: Answers = { ...DEFAULT_ANSWERS };
  let overrides: Record<string, { isEnabled: boolean; variant?: string }> = {};
  let project: ProjectDescription = { ...EMPTY_PROJECT };
  let outputKind: OutputKind = "prompt";

  const style = element("style", {}, [STYLE_TEXT]);
  const container = element("div", { class: "cssk" });

  // Step 1: the four quick questions.
  container.append(element("h3", {}, ["1. Four quick questions"]));
  for (const question of QUICK_QUESTIONS) {
    const fieldset = element("fieldset", {}, [element("legend", {}, [question.legend])]);
    const choices = element("div", { class: "cssk-choices" });
    for (const option of question.options) {
      const input = element("input", { type: "radio", name: `${idPrefix}-${question.key}`, value: option.value });
      input.checked = answers[question.key] === option.value;
      input.addEventListener("change", () => {
        answers = { ...answers, [question.key]: option.value } as Answers;
        update();
      }, { signal });
      choices.append(element("label", { class: "cssk-choice" }, [input, option.label]));
    }
    fieldset.append(choices);
    container.append(fieldset);
  }

  // Step 2: facts about the project.
  container.append(element("h3", {}, ["2. About the project"]));
  const gitFieldset = element("fieldset", {}, [element("legend", {}, ["How should git work?"])]);
  for (const option of GIT_OPTIONS) {
    const input = element("input", { type: "radio", name: `${idPrefix}-git`, value: option.value });
    input.checked = answers.git === option.value;
    input.addEventListener("change", () => { answers = { ...answers, git: option.value }; update(); }, { signal });
    gitFieldset.append(element("label", { class: "cssk-check" }, [input, option.label]));
  }
  container.append(gitFieldset);
  const factFieldset = element("fieldset", {}, [element("legend", {}, ["Tick what applies"])]);
  const factLabels = new Map<BooleanAnswer, HTMLLabelElement>();
  for (const fact of FACT_QUESTIONS) {
    const input = element("input", { type: "checkbox" });
    input.addEventListener("change", () => { answers = { ...answers, [fact.key]: input.checked }; update(); }, { signal });
    const label = element("label", { class: "cssk-check" }, [input, fact.label]);
    factLabels.set(fact.key, label);
    factFieldset.append(label);
  }
  container.append(factFieldset);

  // Step 3: every module, adjustable by hand.
  container.append(element("h3", {}, ["3. Adjust the rules"]));
  container.append(element("p", { class: "cssk-note" },
    ["Your answers above switched these on or off. Change anything here; your changes win."]));
  const moduleControls = new Map<string, { box: HTMLElement; checkbox: HTMLInputElement; select: HTMLSelectElement | null }>();
  for (const moduleData of MODULES) {
    const checkbox = element("input", { type: "checkbox", id: `${idPrefix}-m-${moduleData.id}` });
    const box = element("div", { class: "cssk-module" }, [
      element("label", { class: "cssk-check", for: `${idPrefix}-m-${moduleData.id}` }, [checkbox, moduleData.title]),
      element("p", {}, [`Prevents: ${moduleData.prevents}`]),
    ]);
    if (moduleData.id === "core") {
      checkbox.checked = true;
      checkbox.disabled = true;
    }
    checkbox.addEventListener("change", () => {
      overrides = { ...overrides, [moduleData.id]: { ...overrides[moduleData.id], isEnabled: checkbox.checked } };
      update();
    }, { signal });
    let select: HTMLSelectElement | null = null;
    if (moduleData.variants.length > 1) {
      select = element("select", { "aria-label": `${moduleData.title}: which version` });
      for (const variant of moduleData.variants) {
        select.append(element("option", { value: variant }, [VARIANT_LABELS[variant] ?? variant]));
      }
      const variantSelect = select;
      variantSelect.addEventListener("change", () => {
        overrides = { ...overrides, [moduleData.id]: { isEnabled: true, variant: variantSelect.value } };
        update();
      }, { signal });
      box.append(variantSelect);
    }
    moduleControls.set(moduleData.id, { box, checkbox, select });
    container.append(box);
  }
  const resetButton = element("button", { type: "button" }, ["Undo my changes to the rules"]);
  resetButton.addEventListener("click", () => { overrides = {}; update(); }, { signal });
  const warnings = element("div");
  container.append(element("div", { class: "cssk-row" }, [resetButton]), warnings);

  // Step 4: the project, all optional.
  container.append(element("h3", {}, ["4. Describe the project (optional)"]));
  container.append(element("p", { class: "cssk-note" },
    ["Anything left empty appears in the prompt as a [placeholder] to fill in after pasting."]));
  for (const field of PROJECT_FIELDS) {
    const inputId = `${idPrefix}-p-${field.key}`;
    const input = element("input", { type: "text", id: inputId, placeholder: field.hint, autocomplete: "off" });
    input.addEventListener("input", () => { project = { ...project, [field.key]: input.value }; update(); }, { signal });
    container.append(element("label", { class: "cssk-field", for: inputId }, [field.label]), input);
  }

  // Output.
  container.append(element("h3", {}, ["5. Your prompt"]));
  const promptButton = element("button", { type: "button", "aria-pressed": "true" }, ["Starting prompt"]);
  const claudeMdButton = element("button", { type: "button", "aria-pressed": "false" }, ["CLAUDE.md"]);
  const sizeText = element("span", { class: "cssk-size" });
  const outputId = `${idPrefix}-output`;
  const output = element("textarea", { id: outputId, readonly: "", rows: "16", spellcheck: "false",
    "aria-label": "The generated text" });
  const copyButton = element("button", { type: "button", class: "cssk-primary" }, ["Copy"]);
  const downloadButton = element("button", { type: "button" }, ["Download"]);
  const status = element("div", { class: "cssk-status", role: "status", "aria-live": "polite" });
  container.append(
    element("div", { class: "cssk-row" }, [promptButton, claudeMdButton, sizeText]),
    output,
    element("div", { class: "cssk-row" }, [copyButton, downloadButton]),
    status,
  );

  promptButton.addEventListener("click", () => { outputKind = "prompt"; update(); }, { signal });
  claudeMdButton.addEventListener("click", () => { outputKind = "claude-md"; update(); }, { signal });

  copyButton.addEventListener("click", () => {
    const text = output.value;
    const showManualCopy = (): void => {
      output.focus();
      output.select();
      status.textContent = "Your browser didn't allow copying. The text is selected: press Ctrl+C (Cmd+C on a Mac).";
    };
    if (!navigator.clipboard?.writeText) {
      showManualCopy();
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => { if (!signal.aborted) status.textContent = "Copied."; },
      () => { if (!signal.aborted) showManualCopy(); },
    );
  }, { signal });

  downloadButton.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([output.value], { type: "text/markdown;charset=utf-8" }));
    pendingDownloadUrls.add(url);
    const link = element("a", { href: url, download: outputKind === "claude-md" ? "CLAUDE.md" : "starting-prompt.md" });
    link.click();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      pendingDownloadUrls.delete(url);
      pendingTimers.delete(timer);
    }, 0);
    pendingTimers.add(timer);
    status.textContent = outputKind === "claude-md" ? "Downloaded CLAUDE.md." : "Downloaded starting-prompt.md.";
  }, { signal });

  function update(): void {
    for (const fact of FACT_QUESTIONS) {
      const label = factLabels.get(fact.key);
      if (!label) continue;
      label.hidden = !fact.isAsked(answers);
      const input = label.querySelector("input");
      if (input) input.checked = answers[fact.key];
    }
    gitFieldset.hidden = answers.target !== "code";

    const choices = resolveChoices(answers, overrides);
    for (const moduleData of MODULES) {
      const controls = moduleControls.get(moduleData.id);
      if (!controls) continue;
      controls.box.hidden = !isAvailableFor(moduleData, answers.target);
      const choice = choices.find((c) => c.id === moduleData.id);
      controls.checkbox.checked = choice !== undefined;
      if (controls.select) {
        controls.select.value = choice?.variant ?? overrides[moduleData.id]?.variant ?? moduleData.variants[0] ?? "";
        controls.select.disabled = choice === undefined;
      }
    }
    resetButton.disabled = Object.keys(overrides).length === 0;

    warnings.replaceChildren(...findConflicts(choices).map((text) => element("p", { class: "cssk-warning" }, [text])));

    if (answers.target === "browser") outputKind = "prompt";
    claudeMdButton.hidden = answers.target !== "code";
    promptButton.setAttribute("aria-pressed", String(outputKind === "prompt"));
    claudeMdButton.setAttribute("aria-pressed", String(outputKind === "claude-md"));

    output.value = outputKind === "claude-md"
      ? assembleClaudeMd(choices, project)
      : assemblePrompt(answers.target, choices, project);
    const size = measureText(output.value);
    sizeText.textContent = `${size.lines} lines · ${size.words} words`;
    status.textContent = "";
  }

  root.append(style, container);
  update();

  return () => {
    listeners.abort();
    for (const timer of pendingTimers) window.clearTimeout(timer);
    pendingTimers.clear();
    for (const url of pendingDownloadUrls) URL.revokeObjectURL(url);
    pendingDownloadUrls.clear();
    style.remove();
    container.remove();
  };
}
