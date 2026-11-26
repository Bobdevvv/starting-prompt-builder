// The builder's interface, laid out like an order ticket: compact controls on
// the left, a live summary of the chosen rule sets on the right, the generated
// text below. The only file that touches the browser; all logic lives in
// engine.ts. Built from standard form controls (radio groups, checkboxes,
// selects, <details>), so keyboard use and screen readers work without extra
// code. Nothing is stored between visits (decision D10). Animations are short
// and decorative only; with prefers-reduced-motion they are all switched off,
// and the builder works exactly the same.

import {
  DEFAULT_ANSWERS, EMPTY_PROJECT, assembleClaudeMd, assemblePrompt, findConflicts, findModule, isAvailableFor,
  measureText, resolveChoices, type Answers, type GitChoice, type ProjectDescription,
} from "./engine";
import { MODULES } from "./modules.data";

type OutputKind = "prompt" | "claude-md";
type BooleanAnswer = { [K in keyof Answers]: Answers[K] extends boolean ? K : never }[keyof Answers];
type SegmentKey = "target" | "security" | "process" | "audience";

interface SegmentOption { readonly value: string; readonly label: string; readonly detail: string }

const SEGMENTS: ReadonlyArray<{ key: SegmentKey; label: string; question: string; options: readonly SegmentOption[] }> = [
  { key: "target", label: "Where", question: "Where will you start the session?", options: [
    { value: "code", label: "Claude Code", detail: "Claude Code, in your terminal or editor." },
    { value: "browser", label: "Browser", detail: "claude.ai in your browser. Rules about git and your computer are left out." },
  ] },
  { key: "security", label: "Security", question: "How strict should security be?", options: [
    { value: "standard", label: "Standard", detail: "Ask before adding packages. Keep secrets out of code." },
    { value: "strict", label: "Strict", detail: "Approved packages only, automatic dependency checks, secrets in a secret store, nothing outside the project folder." },
  ] },
  { key: "process", label: "Structure", question: "How much structure should Claude follow?", options: [
    { value: "light", label: "Light", detail: "Plan first, then ask before risky steps." },
    { value: "thorough", label: "Thorough", detail: "A ticket for every change, proof that tests pass, a decision log and naming rules." },
  ] },
  { key: "audience", label: "Users", question: "Who will use what you're building?", options: [
    { value: "just-me", label: "Only me", detail: "Only you will use the result." },
    { value: "other-people", label: "Others too", detail: "Other people will use the result. Adds testing, and accessibility and size limits if it has an interface." },
  ] },
];

const GIT_OPTIONS: ReadonlyArray<{ value: GitChoice; label: string }> = [
  { value: "with-permission", label: "Claude, asking before commits and pushes" },
  { value: "pull-requests", label: "Claude, through branches and pull requests" },
  { value: "main", label: "Claude, committing straight to main" },
  { value: "hands-off", label: "I do" },
];

/** Project facts. `isAsked` hides a fact that the answers above already decided. */
const FACTS: ReadonlyArray<{ key: BooleanAnswer; label: string; isAsked: (a: Answers) => boolean }> = [
  { key: "usesPackages", label: "Uses third-party packages", isAsked: (a) => a.security !== "strict" },
  { key: "hasTests", label: "Has, or should have, automated tests",
    isAsked: (a) => a.process !== "thorough" && a.audience !== "other-people" },
  { key: "isPublicRepo", label: "The repository is public", isAsked: () => true },
  { key: "hasInterface", label: "Has an interface people use", isAsked: () => true },
  { key: "handlesUserData", label: "Handles data about its users", isAsked: () => true },
  { key: "promisesNoTracking", label: "Promises users they aren't tracked", isAsked: (a) => a.handlesUserData },
  { key: "isDeployed", label: "Gets deployed, or runs on a server", isAsked: () => true },
  { key: "spansManySessions", label: "I'll work on it over many sessions",
    isAsked: (a) => a.target === "code" && a.process !== "thorough" },
  { key: "wantsToLearn", label: "I want to learn along the way", isAsked: () => true },
  { key: "hasReadableText", label: "Has documentation or other text people read", isAsked: () => true },
];

const PROJECT_FIELDS: ReadonlyArray<{ key: keyof ProjectDescription; label: string; hint: string }> = [
  { key: "what", label: "What it is", hint: "a habit tracker that runs in the browser" },
  { key: "stack", label: "Built with", hint: "TypeScript and Vite" },
  { key: "where", label: "Where it stands", hint: "an existing repo, or starting from nothing" },
  { key: "goal", label: "This session's goal", hint: "add a weekly overview screen" },
];

const VARIANT_LABELS: Readonly<Record<string, string>> = {
  "ask-first": "ask first", strict: "approved only", "with-permission": "asks first", main: "to main",
  "pull-requests": "pull requests", "hands-off": "you handle it", standard: "standard", "strict-gate": "proof required",
  light: "light", full: "full tickets", "privacy-first": "privacy-first",
};

const STYLE_TEXT = `
.cssk { container-type: inline-size; width: 100%; color: var(--color-text); font-family: var(--font-sans);
  font-size: 0.9375rem; line-height: 1.45; }
.cssk *, .cssk *::before, .cssk *::after { box-sizing: border-box; }
.cssk-ticket { border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-panel); }
.cssk-bar { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px;
  border-bottom: 1px solid var(--color-border); font-family: var(--font-mono); font-size: 0.75rem;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-muted); }
.cssk-bar strong { color: var(--color-text); font-weight: 600; }
.cssk-grid { display: grid; grid-template-columns: 1fr; }
@container (min-width: 600px) { .cssk-grid { grid-template-columns: minmax(0, 1fr) 220px; }
  .cssk-side { border-top: 0 !important; border-left: 1px solid var(--color-border); }
  .cssk-side-inner { position: sticky; top: calc(var(--sticky-header-height, 0px) + 12px);
    max-height: calc(100vh - var(--sticky-header-height, 0px) - 24px); overflow-y: auto; } }
.cssk-main { padding: 4px 14px 14px; min-width: 0; }
.cssk-side { padding: 12px 14px; border-top: 1px solid var(--color-border); min-width: 0; }
.cssk-side-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cssk-side-head button { min-height: 36px; padding: 4px 10px; font-size: 0.8125rem; }
.cssk-label { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--color-muted); }
.cssk fieldset { border: 0; margin: 0; padding: 12px 0 0; min-width: 0; }
.cssk legend { padding: 0; margin-bottom: 6px; float: left; width: 100%; }
.cssk legend + * { clear: both; }
.cssk-segment { display: flex; border: 1px solid var(--color-border); border-radius: 4px; overflow: hidden; }
.cssk-segment label { flex: 1 1 0; position: relative; display: block; cursor: pointer; }
.cssk-segment label + label { border-left: 1px solid var(--color-border); }
.cssk-segment span { display: flex; align-items: center; justify-content: center; min-height: 44px; padding: 6px 8px;
  text-align: center; font-size: 0.875rem; color: var(--color-muted); background: var(--color-bg); }
.cssk-segment input:checked + span { color: var(--color-bg); background: var(--color-accent); font-weight: 600; }
.cssk-segment input:focus-visible + span { outline: 2px solid var(--color-text); outline-offset: -4px; }
.cssk-visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; border: 0; }
.cssk-detail { margin: 6px 0 0; font-size: 0.8125rem; color: var(--color-muted); min-height: 1.45em; }
.cssk-facts { display: grid; grid-template-columns: 1fr; gap: 0 16px; }
@container (min-width: 460px) { .cssk-facts { grid-template-columns: 1fr 1fr; } }
.cssk-check { display: flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; font-size: 0.875rem; }
.cssk input[type="checkbox"] { width: 18px; height: 18px; margin: 0; flex: none; accent-color: var(--color-accent); }
.cssk select, .cssk input[type="text"], .cssk textarea { width: 100%; min-height: 44px; font: inherit;
  font-size: 0.875rem; color: var(--color-text); background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: 4px; padding: 8px 10px; }
@media (pointer: coarse) { .cssk select, .cssk input[type="text"], .cssk textarea { font-size: 16px; } }
.cssk details { margin-top: 18px; border: 1px solid var(--color-border); border-left: 3px solid var(--color-accent);
  border-radius: 4px; background: var(--color-panel-2);
  scroll-margin-top: calc(var(--sticky-header-height, 0px) + 12px); }
.cssk summary { min-height: 60px; display: flex; align-items: center; gap: 12px; padding: 10px 12px; cursor: pointer;
  list-style: none; }
.cssk summary:hover { background: var(--color-bg); }
.cssk summary::-webkit-details-marker { display: none; }
.cssk summary::before { content: "+"; display: flex; align-items: center; justify-content: center; flex: none;
  width: 28px; height: 28px; border: 1px solid var(--color-accent); border-radius: 4px;
  font-family: var(--font-mono); font-size: 1.125rem; color: var(--color-accent); }
.cssk summary::after { content: "Show"; margin-left: auto; flex: none; font-family: var(--font-mono);
  font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-accent); }
.cssk details[open] > summary::after { content: "Hide"; }
.cssk summary strong { display: block; font-size: 0.9375rem; color: var(--color-accent); }
.cssk summary small { display: block; font-size: 0.8125rem; color: var(--color-muted); }
.cssk details[open] > summary { border-bottom: 1px solid var(--color-border); }
.cssk-advanced-body { padding: 0 12px 12px; }
.cssk details[open] > summary::before { content: "\\2212"; }
.cssk-module { padding: 6px 0 10px; border-bottom: 1px solid var(--color-border); }
.cssk-module:last-of-type { border-bottom: 0; }
.cssk-module .cssk-check { min-height: 36px; font-weight: 600; }
.cssk-module p { margin: 0 0 6px 28px; font-size: 0.8125rem; color: var(--color-muted); }
.cssk-module select { margin-left: 28px; width: calc(100% - 28px); min-height: 40px; }
.cssk-fields { display: grid; grid-template-columns: 1fr; gap: 0 12px; }
@container (min-width: 460px) { .cssk-fields { grid-template-columns: 1fr 1fr; } }
.cssk-field { display: block; margin-top: 10px; }
.cssk-field .cssk-label { display: block; margin-bottom: 4px; }
.cssk-list { list-style: none; margin: 8px 0 12px; padding: 0; font-size: 0.8125rem; }
.cssk-list li { display: flex; justify-content: space-between; gap: 8px; padding: 5px 0;
  border-bottom: 1px dashed var(--color-border); }
.cssk-list li span:last-child { font-family: var(--font-mono); color: var(--color-muted); text-align: right; }
.cssk-warning { margin: 0 0 12px; padding-left: 10px; border-left: 2px solid var(--color-down); font-size: 0.8125rem; }
.cssk-warning strong { color: var(--color-down); }
.cssk button { min-height: 44px; min-width: 44px; padding: 8px 14px; font: inherit; font-size: 0.875rem;
  font-weight: 600; color: var(--color-text); background: var(--color-panel-2); border: 1px solid var(--color-border);
  border-radius: 4px; cursor: pointer; }
.cssk button:disabled { cursor: default; color: var(--color-muted); }
.cssk button.cssk-primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg); }
.cssk-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.cssk-actions button { flex: 1 1 auto; }
.cssk-output { border-top: 1px solid var(--color-border); padding: 12px 14px 14px; }
.cssk-output-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;
  margin-bottom: 8px; }
.cssk-tabs { display: flex; gap: 4px; }
.cssk-tabs button { background: none; border-color: transparent; color: var(--color-muted); }
.cssk-tabs button[aria-pressed="true"] { color: var(--color-text); border-color: var(--color-border);
  background: var(--color-bg); }
.cssk-size { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted); }
.cssk textarea { font-family: var(--font-mono); font-size: 0.75rem; line-height: 1.55; min-height: 300px;
  resize: vertical; }
.cssk-status { min-height: 1.45em; margin-top: 8px; font-size: 0.8125rem; color: var(--color-muted); }
.cssk :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.cssk [hidden] { display: none !important; }

/* Motion. Short and decorative only: nothing depends on it. */
.cssk { interpolate-size: allow-keywords; }
.cssk-segment span { transition: background-color 180ms ease, color 180ms ease; }
.cssk-check, .cssk button, .cssk summary, .cssk select, .cssk input[type="text"] {
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease; }
.cssk input[type="checkbox"] { transition: transform 120ms ease; }
.cssk input[type="checkbox"]:active { transform: scale(0.88); }
.cssk summary::before { transition: background-color 180ms ease, color 180ms ease; }
.cssk details[open] > summary::before { background: var(--color-accent); color: var(--color-bg); }
.cssk details::details-content { height: 0; overflow: clip;
  transition: height 240ms ease, content-visibility 240ms allow-discrete; }
.cssk details[open]::details-content { height: auto; }
@keyframes cssk-reveal { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.cssk details[open] .cssk-advanced-body { animation: cssk-reveal 240ms ease-out; }
@keyframes cssk-enter { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
.cssk-list li.cssk-enter { animation: cssk-enter 220ms ease-out; }
@keyframes cssk-changed { from { color: var(--color-accent); } }
.cssk-list li span.cssk-changed { animation: cssk-changed 700ms ease-out; }
@media (prefers-reduced-motion: reduce) {
  .cssk *, .cssk *::before, .cssk *::after, .cssk details::details-content {
    animation: none !important; transition: none !important; }
}
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
  const ticket = element("div", { class: "cssk-ticket" });
  const barCount = element("strong");
  const mainColumn = element("div", { class: "cssk-main" });
  const sideColumn = element("div", { class: "cssk-side" });
  ticket.append(
    element("div", { class: "cssk-bar" }, [element("span", {}, ["New session"]), element("span", {}, [barCount])]),
    element("div", { class: "cssk-grid" }, [mainColumn, sideColumn]),
  );
  container.append(ticket);

  // The four questions that decide most of the prompt, as segmented controls.
  const segmentDetails = new Map<SegmentKey, HTMLParagraphElement>();
  for (const segment of SEGMENTS) {
    const detail = element("p", { class: "cssk-detail", id: `${idPrefix}-${segment.key}-detail` });
    segmentDetails.set(segment.key, detail);
    const options = element("div", { class: "cssk-segment" });
    for (const option of segment.options) {
      const input = element("input", { type: "radio", class: "cssk-visually-hidden", name: `${idPrefix}-${segment.key}`,
        value: option.value, "aria-describedby": detail.id });
      input.checked = answers[segment.key] === option.value;
      input.addEventListener("change", () => {
        answers = { ...answers, [segment.key]: option.value } as Answers;
        update();
      }, { signal });
      options.append(element("label", {}, [input, element("span", {}, [option.label])]));
    }
    mainColumn.append(element("fieldset", {}, [
      element("legend", {}, [element("span", { class: "cssk-label", "aria-hidden": "true" }, [segment.label]),
        element("span", { class: "cssk-visually-hidden" }, [segment.question])]),
      options, detail,
    ]));
  }

  // "Who decides": on by default, shown here rather than in Advanced because it shapes every reply.
  const leadInput = element("input", { type: "checkbox" });
  leadInput.checked = answers.userLeads;
  leadInput.addEventListener("change", () => {
    answers = { ...answers, userLeads: leadInput.checked };
    // This switch and the same rule set in Advanced settings must never disagree: the switch wins.
    const { "user-leads": _replaced, ...otherOverrides } = overrides;
    overrides = otherOverrides;
    update();
  }, { signal });
  mainColumn.append(element("fieldset", {}, [
    element("legend", {}, [element("span", { class: "cssk-label" }, ["Who decides"])]),
    element("label", { class: "cssk-check" }, [leadInput,
      "You lead: Claude advises, does exactly what you ask, checks its work and owns its mistakes"]),
  ]));

  // Git, as a select: four choices are too many for a segmented row at 280px.
  const gitId = `${idPrefix}-git`;
  const gitSelect = element("select", { id: gitId });
  for (const option of GIT_OPTIONS) gitSelect.append(element("option", { value: option.value }, [option.label]));
  gitSelect.value = answers.git;
  gitSelect.addEventListener("change", () => {
    answers = { ...answers, git: gitSelect.value as GitChoice };
    update();
  }, { signal });
  const gitField = element("label", { class: "cssk-field", for: gitId }, [
    element("span", { class: "cssk-label" }, ["Who handles git"]), gitSelect]);
  mainColumn.append(gitField);

  // Facts about the project.
  const factLabels = new Map<BooleanAnswer, HTMLLabelElement>();
  const facts = element("div", { class: "cssk-facts" });
  for (const fact of FACTS) {
    const input = element("input", { type: "checkbox" });
    input.addEventListener("change", () => { answers = { ...answers, [fact.key]: input.checked }; update(); }, { signal });
    const label = element("label", { class: "cssk-check" }, [input, fact.label]);
    factLabels.set(fact.key, label);
    facts.append(label);
  }
  mainColumn.append(element("fieldset", {}, [
    element("legend", {}, [element("span", { class: "cssk-label" }, ["The project (select all that apply)"])]), facts]));

  // The project description, all optional.
  const fields = element("div", { class: "cssk-fields" });
  for (const field of PROJECT_FIELDS) {
    const inputId = `${idPrefix}-p-${field.key}`;
    const input = element("input", { type: "text", id: inputId, placeholder: field.hint, autocomplete: "off" });
    input.addEventListener("input", () => { project = { ...project, [field.key]: input.value }; update(); }, { signal });
    fields.append(element("label", { class: "cssk-field", for: inputId }, [
      element("span", { class: "cssk-label" }, [field.label]), input]));
  }
  mainColumn.append(element("fieldset", {}, [
    element("legend", {}, [element("span", { class: "cssk-label" },
      ["Describe it (optional; empty fields become [placeholders])"])]), fields]));

  // Advanced: every rule set, adjustable by hand. Collapsed by default.
  const advancedCount = element("small");
  const advancedSummary = element("summary", {}, [element("span", {}, [
    element("strong", {}, ["Advanced settings"]), advancedCount])]);
  const advanced = element("details", { id: `${idPrefix}-advanced` }, [advancedSummary]);
  const advancedBody = element("div", { class: "cssk-advanced-body" }, [element("p", { class: "cssk-detail" },
    ["Your answers above already chose these rule sets. Anything you change here overrides those answers."])]);
  advanced.append(advancedBody);
  const moduleControls = new Map<string, { box: HTMLElement; checkbox: HTMLInputElement; select: HTMLSelectElement | null }>();
  for (const moduleData of MODULES) {
    const checkboxId = `${idPrefix}-m-${moduleData.id}`;
    const checkbox = element("input", { type: "checkbox", id: checkboxId });
    const box = element("div", { class: "cssk-module" }, [
      element("label", { class: "cssk-check", for: checkboxId }, [checkbox,
        moduleData.id === "core" ? "Core rules (always included)" : moduleData.title]),
      element("p", {}, [`Prevents ${moduleData.prevents}`]),
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
      const variantSelect = element("select", { "aria-label": `${moduleData.title}: which version` });
      for (const variant of moduleData.variants) {
        variantSelect.append(element("option", { value: variant }, [VARIANT_LABELS[variant] ?? variant]));
      }
      variantSelect.addEventListener("change", () => {
        overrides = { ...overrides, [moduleData.id]: { isEnabled: true, variant: variantSelect.value } };
        update();
      }, { signal });
      box.append(variantSelect);
      select = variantSelect;
    }
    moduleControls.set(moduleData.id, { box, checkbox, select });
    advancedBody.append(box);
  }
  const resetButton = element("button", { type: "button" }, ["Reset to my answers"]);
  resetButton.addEventListener("click", () => { overrides = {}; update(); }, { signal });
  advancedBody.append(element("div", { class: "cssk-actions" }, [resetButton]));
  mainColumn.append(advanced);

  // The summary column: what is in the prompt right now, and the actions.
  const summaryList = element("ul", { class: "cssk-list", "aria-label": "Rule sets in the prompt" });
  const warnings = element("div");
  const copyButton = element("button", { type: "button", class: "cssk-primary" }, ["Copy"]);
  const downloadButton = element("button", { type: "button" }, ["Download"]);
  // "Change" opens Advanced settings and moves focus there, for people who look at the summary first.
  const changeButton = element("button", { type: "button", "aria-controls": advanced.id }, ["Change"]);
  changeButton.addEventListener("click", () => {
    advanced.open = true;
    advancedSummary.focus();
  }, { signal });
  // The inner wrapper is the part that scrolls along with the page, within its own column.
  sideColumn.append(element("div", { class: "cssk-side-inner" }, [
    element("div", { class: "cssk-side-head" }, [element("span", { class: "cssk-label" }, ["In the prompt"]), changeButton]),
    summaryList, warnings, element("div", { class: "cssk-actions" }, [copyButton, downloadButton])]));

  // The generated text.
  const promptTab = element("button", { type: "button", "aria-pressed": "true" }, ["Starting prompt"]);
  const claudeMdTab = element("button", { type: "button", "aria-pressed": "false" }, ["CLAUDE.md"]);
  const sizeText = element("span", { class: "cssk-size" });
  const output = element("textarea", { readonly: "", rows: "16", spellcheck: "false", "aria-label": "The generated text" });
  const status = element("div", { class: "cssk-status", role: "status", "aria-live": "polite" });
  ticket.append(element("div", { class: "cssk-output" }, [
    element("div", { class: "cssk-output-head" }, [element("div", { class: "cssk-tabs" }, [promptTab, claudeMdTab]), sizeText]),
    output, status,
  ]));

  promptTab.addEventListener("click", () => { outputKind = "prompt"; update(); }, { signal });
  claudeMdTab.addEventListener("click", () => { outputKind = "claude-md"; update(); }, { signal });

  copyButton.addEventListener("click", () => {
    const showManualCopy = (): void => {
      output.focus();
      output.select();
      status.textContent = "Your browser didn't allow copying. The text is selected: press Ctrl+C (Cmd+C on a Mac).";
    };
    if (!navigator.clipboard?.writeText) {
      showManualCopy();
      return;
    }
    navigator.clipboard.writeText(output.value).then(
      () => { if (!signal.aborted) status.textContent = "Copied."; },
      () => { if (!signal.aborted) showManualCopy(); },
    );
  }, { signal });

  downloadButton.addEventListener("click", () => {
    const fileName = outputKind === "claude-md" ? "CLAUDE.md" : "starting-prompt.md";
    const url = URL.createObjectURL(new Blob([output.value], { type: "text/markdown;charset=utf-8" }));
    pendingDownloadUrls.add(url);
    element("a", { href: url, download: fileName }).click();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      pendingDownloadUrls.delete(url);
      pendingTimers.delete(timer);
    }, 0);
    pendingTimers.add(timer);
    status.textContent = `Downloaded ${fileName}.`;
  }, { signal });

  // The summary list keeps one <li> per rule set, so only real changes animate:
  // a rule set that is added slides in, and a changed version flashes once.
  // Typing in a text field changes neither, so nothing moves while typing.
  const summaryItems = new Map<string, { item: HTMLLIElement; value: HTMLSpanElement }>();
  let isFirstRender = true;
  const playOnce = (target: HTMLElement, className: string): void => {
    target.classList.remove(className);
    void target.offsetWidth; // restart the animation if it is already running
    target.classList.add(className);
    target.addEventListener("animationend", () => target.classList.remove(className), { once: true, signal });
  };

  function renderSummary(choices: ReturnType<typeof resolveChoices>): void {
    const wantedIds = new Set(choices.map((choice) => choice.id));
    for (const [moduleId, entry] of summaryItems) {
      if (!wantedIds.has(moduleId)) {
        entry.item.remove();
        summaryItems.delete(moduleId);
      }
    }
    for (const choice of choices) {
      const valueText = choice.variant ? VARIANT_LABELS[choice.variant] ?? choice.variant : "on";
      let entry = summaryItems.get(choice.id);
      if (!entry) {
        const name = choice.id === "core" ? "Core rules" : findModule(choice.id)?.title ?? choice.id;
        const value = element("span", {}, [valueText]);
        entry = { item: element("li", {}, [element("span", {}, [name]), value]), value };
        summaryItems.set(choice.id, entry);
        if (!isFirstRender) playOnce(entry.item, "cssk-enter");
      } else if (entry.value.textContent !== valueText) {
        entry.value.textContent = valueText;
        playOnce(entry.value, "cssk-changed");
      }
      // appendChild moves an existing item without re-creating it, so its animation isn't replayed.
      summaryList.appendChild(entry.item);
    }
    isFirstRender = false;
  }

  function update(): void {
    for (const segment of SEGMENTS) {
      const selected = segment.options.find((option) => option.value === answers[segment.key]);
      const detail = segmentDetails.get(segment.key);
      if (detail) detail.textContent = selected?.detail ?? "";
    }
    gitField.hidden = answers.target !== "code";
    for (const fact of FACTS) {
      const label = factLabels.get(fact.key);
      if (!label) continue;
      label.hidden = !fact.isAsked(answers);
      const input = label.querySelector("input");
      if (input) input.checked = answers[fact.key];
    }

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
    leadInput.checked = choices.some((choice) => choice.id === "user-leads");
    resetButton.disabled = Object.keys(overrides).length === 0;
    const availableCount = MODULES.filter((moduleData) => isAvailableFor(moduleData, answers.target)).length;
    advancedCount.textContent =
      `Turn individual rule sets on or off. ${choices.length} of ${availableCount} are included now.`;

    renderSummary(choices);
    warnings.replaceChildren(...findConflicts(choices).map((text) =>
      element("p", { class: "cssk-warning" }, [element("strong", {}, ["Check: "]), text])));

    if (answers.target === "browser") outputKind = "prompt";
    claudeMdTab.hidden = answers.target !== "code";
    promptTab.setAttribute("aria-pressed", String(outputKind === "prompt"));
    claudeMdTab.setAttribute("aria-pressed", String(outputKind === "claude-md"));

    output.value = outputKind === "claude-md"
      ? assembleClaudeMd(choices, project)
      : assemblePrompt(answers.target, choices, project);
    const size = measureText(output.value);
    sizeText.textContent = `${size.lines} lines · ${size.words} words`;
    barCount.textContent = `${choices.length} rule sets`;
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
