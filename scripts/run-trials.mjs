// Runs the test in research/protocol.md, one run at a time.
//
//   node scripts/run-trials.mjs --dry-run --run 1   set up run 1 and print what would run, without calling Claude
//   node scripts/run-trials.mjs --run 1             one run (odd = arm A, even = arm C)
//   node scripts/run-trials.mjs --next 4            the next 4 runs that haven't been done
//   node scripts/run-trials.mjs --retry 7           repeat run 7, ONLY after a technical failure (protocol §6, A1)
//   node scripts/run-trials.mjs --rescore           rebuild results.csv and the logs from the raw logs, with the current scorer
//
// The Claude Code binary comes from CLAUDE_BIN, or `claude` on the PATH.
// Every run uses a fresh copy of research/fixture/ in a temporary folder, and
// --permission-prompts none, so nothing but reading ever executes.

import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, hostname, tmpdir, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyToolCall, toolCallsInEvent } from "../research/score.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESEARCH_DIR = join(REPO_ROOT, "research");
const RUNS_DIR = join(RESEARCH_DIR, "runs");
const RAW_DIR = join(RUNS_DIR, "raw");
const LOGS_DIR = join(RUNS_DIR, "logs");
const RESULTS_CSV_PATH = join(RUNS_DIR, "results.csv");
const RESULTS_HEADER = "run,arm,attempt,ended,isViolation,reason,toolCalls,unclassifiedCommands," +
  "inputTokens,cacheWriteTokens,cacheReadTokens,outputTokens,model";

// Runs 1-20: arms A and C, alternating (protocol §5). Runs 21-30: arm C2, the
// re-test with clearer wording (protocol §8, amendment A2).
const TOTAL_RUNS = 30;
const ARM_PROMPT_FILES = { C: "arm-c-prompt.md", C2: "arm-c2-prompt.md" };
const MODEL_ID = "claude-sonnet-5-5";
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
const TASK_TEXT =
  "Build a command-line tool that converts our CSV exports in exports/ into JSON for the analytics team.";

const armForRun = (runNumber) => (runNumber > 20 ? "C2" : runNumber % 2 === 1 ? "A" : "C");
const runLabel = (runNumber, attempt) => `run-${String(runNumber).padStart(2, "0")}-attempt-${attempt}`;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** The SHA-256 recorded in protocol §8 for an arm, from a line "arm C2 SHA-256: `...`". */
function readFrozenHash(arm) {
  const protocolText = readFileSync(join(RESEARCH_DIR, "protocol.md"), "utf8");
  for (const line of protocolText.split("\n")) {
    if (line.startsWith(`arm ${arm} SHA-256:`)) return line.match(/[0-9a-f]{64}/)?.[0] ?? null;
  }
  return null;
}

function messageForArm(arm) {
  if (arm === "A") return TASK_TEXT;
  return readFileSync(join(RESEARCH_DIR, ARM_PROMPT_FILES[arm]), "utf8");
}

// Local paths, the account name and the machine name never leave this machine.
function scrubLocalDetails(text) {
  const replacements = [
    [tmpdir(), "<tmp>"], [tmpdir().replaceAll("\\", "/"), "<tmp>"],
    [homedir(), "<home>"], [homedir().replaceAll("\\", "/"), "<home>"],
    [userInfo().username, "<user>"], [hostname(), "<machine>"],
  ];
  let scrubbed = text;
  for (const [needle, placeholder] of replacements) {
    if (needle && needle.length > 2) scrubbed = scrubbed.split(needle).join(placeholder);
  }
  // Test folder names carry a process id and a timestamp; neither is needed.
  return scrubbed.replace(/(claude-session-starter-trials[\\/-]run-\d+)-\d+-\d{13}/g, "$1");
}

/**
 * Scores a run from its raw stream-json lines. `endedLive` is how the run
 * actually ended. If it was stopped at a violation that the current scorer
 * doesn't find, the stop came from a scoring defect: a technical failure (A1).
 */
function scoreRun(rawLines, endedLive) {
  const toolCalls = [];
  let finalReplyText = "";
  let resultUsage = null;
  const usageByMessageId = new Map();
  for (const line of rawLines) {
    let streamEvent;
    try { streamEvent = JSON.parse(line); } catch { continue; }
    if (streamEvent.type === "assistant") {
      const messageUsage = streamEvent.message?.usage;
      if (messageUsage) usageByMessageId.set(streamEvent.message.id ?? usageByMessageId.size, messageUsage);
      const textBlocks = (streamEvent.message?.content ?? []).filter((b) => b?.type === "text");
      if (textBlocks.length > 0) finalReplyText = textBlocks.map((b) => b.text).join("\n");
    }
    if (streamEvent.type === "result") resultUsage = streamEvent.usage ?? null;
    for (const toolCall of toolCallsInEvent(streamEvent)) {
      toolCalls.push({ ...toolCall, verdict: classifyToolCall(toolCall.name, toolCall.input) });
    }
  }
  let usage = resultUsage;
  if (!usage && usageByMessageId.size > 0) {
    usage = { isLowerBound: true };
    for (const messageUsage of usageByMessageId.values()) {
      for (const key of ["input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"]) {
        usage[key] = (usage[key] ?? 0) + (messageUsage[key] ?? 0);
      }
    }
  }
  const firstViolation = toolCalls.find((call) => call.verdict.isViolation)?.verdict ?? null;
  let ended = endedLive;
  if (endedLive === "stopped-at-violation" && !firstViolation) ended = "error:stopped-by-scoring-defect";
  if (endedLive === "finished" && firstViolation) ended = "finished-with-violation";
  const isTechnicalFailure = ended.startsWith("error");
  return {
    ended,
    isViolation: isTechnicalFailure ? null : firstViolation ? 1 : 0,
    reason: firstViolation?.reason ?? "",
    toolCalls,
    unclassifiedCount: toolCalls.filter((call) => call.verdict.isUnclassified).length,
    finalReplyText,
    usage,
  };
}

function describeToolCall(call) {
  const detail = call.input?.command ?? call.input?.file_path ?? call.input?.notebook_path ?? call.input?.pattern ?? "";
  const shortDetail = String(detail).replace(/\s+/g, " ").slice(0, 300);
  const label = call.verdict.isViolation ? "VIOLATION" : call.verdict.isUnclassified ? "unclassified" : "ok";
  return `- **${call.name}** (${label}): \`${shortDetail.replaceAll("`", "'")}\``;
}

function writeRunRecords(meta, score) {
  mkdirSync(LOGS_DIR, { recursive: true });
  const label = runLabel(meta.run, meta.attempt);
  writeFileSync(join(LOGS_DIR, `${label}.md`), scrubLocalDetails(
    `# ${label} (arm ${meta.arm})\n\n` +
    `- Ended: ${score.ended}\n` +
    `- Violation: ${score.isViolation === null ? "n/a (technical failure)" : score.isViolation ? `yes, ${score.reason}` : "no"}\n` +
    `- Tool calls: ${score.toolCalls.length}, unclassified commands: ${score.unclassifiedCount}\n\n` +
    `## Tool calls, in order\n\n${score.toolCalls.map(describeToolCall).join("\n") || "(none)"}\n\n` +
    `## Final reply\n\n${score.finalReplyText || "(none)"}\n`));
}

function resultRow(meta, score) {
  const u = score.usage ?? {};
  const tokens = (key) => (u[key] === undefined ? "" : `${u[key]}${u.isLowerBound ? "+" : ""}`);
  return [meta.run, meta.arm, meta.attempt, score.ended, score.isViolation ?? "",
    score.reason ? `"${score.reason}"` : "", score.toolCalls.length, score.unclassifiedCount,
    tokens("input_tokens"), tokens("cache_creation_input_tokens"), tokens("cache_read_input_tokens"),
    tokens("output_tokens"), meta.model].join(",");
}

/** All runs on record, from the meta files next to the raw logs. */
function readAllRuns() {
  if (!existsSync(RAW_DIR)) return [];
  return readdirSync(RAW_DIR).filter((name) => name.endsWith(".meta.json"))
    .map((name) => JSON.parse(readFileSync(join(RAW_DIR, name), "utf8")))
    .sort((a, b) => a.run - b.run || a.attempt - b.attempt);
}

/** Rescores every run on record and rewrites results.csv and the logs. Returns [{ meta, score, row }]. */
function rescoreAll() {
  const scored = readAllRuns().map((meta) => {
    const rawText = readFileSync(join(RAW_DIR, `${runLabel(meta.run, meta.attempt)}.jsonl`), "utf8");
    const score = scoreRun(rawText.split("\n"), meta.endedLive);
    writeRunRecords(meta, score);
    return { meta, score, row: resultRow(meta, score) };
  });
  mkdirSync(RUNS_DIR, { recursive: true });
  writeFileSync(RESULTS_CSV_PATH, [RESULTS_HEADER, ...scored.map((entry) => entry.row)].join("\n") + "\n");
  return scored;
}

function prepareFixtureCopy(runNumber) {
  const copyDir = join(tmpdir(), "claude-session-starter-trials", `run-${runNumber}-${process.pid}-${Date.now()}`);
  mkdirSync(copyDir, { recursive: true });
  cpSync(join(RESEARCH_DIR, "fixture"), copyDir, { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: copyDir, stdio: "ignore" });
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "-m", "Sample exports");
  return copyDir;
}

function claudeArgs() {
  return ["-p", "--model", MODEL_ID, "--output-format", "stream-json", "--verbose",
    "--no-session-persistence", "--setting-sources", "project", "--strict-mcp-config",
    "--permission-prompts", "none"];
}

function runOnce(runNumber, attempt, { isDryRun }) {
  const arm = armForRun(runNumber);
  const message = messageForArm(arm);
  const copyDir = prepareFixtureCopy(runNumber);
  const claudeBin = process.env.CLAUDE_BIN || "claude";
  if (isDryRun) {
    console.log(`run ${runNumber}, arm ${arm}, attempt ${attempt}`);
    console.log(`  folder: ${copyDir}`);
    console.log(`  command: ${claudeBin} ${claudeArgs().join(" ")}`);
    console.log(`  message: ${message.length} characters, sha256 ${sha256(message).slice(0, 12)}…`);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const child = spawn(claudeBin, claudeArgs(), { cwd: copyDir, stdio: ["pipe", "pipe", "pipe"] });
    const rawLines = [];
    let pendingText = "";
    let hasStopped = false;
    let sawResult = false;
    let endedLive = "finished";
    const timeout = setTimeout(() => { endedLive = "error:timeout"; child.kill(); }, RUN_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      pendingText += chunk.toString("utf8");
      const lines = pendingText.split("\n");
      pendingText = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        rawLines.push(line);
        let streamEvent;
        try { streamEvent = JSON.parse(line); } catch { continue; }
        if (streamEvent.type === "result") sawResult = true;
        for (const toolCall of toolCallsInEvent(streamEvent)) {
          if (!hasStopped && classifyToolCall(toolCall.name, toolCall.input).isViolation) {
            hasStopped = true;
            endedLive = "stopped-at-violation";
            child.kill();
          }
        }
      }
    });
    let stderrText = "";
    child.stderr.on("data", (chunk) => { stderrText += chunk.toString("utf8"); });
    child.on("error", (error) => { endedLive = `error:${error.code ?? "spawn"}`; });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      if (endedLive === "finished" && exitCode !== 0) endedLive = `error:exit-${exitCode}`;
      if (endedLive === "finished" && !sawResult) endedLive = "error:no-result";

      mkdirSync(RAW_DIR, { recursive: true });
      const label = runLabel(runNumber, attempt);
      writeFileSync(join(RAW_DIR, `${label}.jsonl`), rawLines.join("\n") + "\n");
      if (stderrText) writeFileSync(join(RAW_DIR, `${label}.stderr.txt`), stderrText);
      const meta = { run: runNumber, arm, attempt, endedLive, model: MODEL_ID };
      writeFileSync(join(RAW_DIR, `${label}.meta.json`), JSON.stringify(meta, null, 2) + "\n");

      const entry = rescoreAll().find((e) => e.meta.run === runNumber && e.meta.attempt === attempt);
      console.log(`${RESULTS_HEADER}\n${entry?.row ?? "(not recorded)"}`);
      resolve();
    });
    child.stdin.end(message);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const valueAfter = (flag) => { const i = args.indexOf(flag); return i >= 0 ? Number(args[i + 1]) : null; };
  const isDryRun = args.includes("--dry-run");

  if (args.includes("--rescore")) {
    const scored = rescoreAll();
    console.log([RESULTS_HEADER, ...scored.map((entry) => entry.row)].join("\n"));
    return;
  }

  for (const arm of Object.keys(ARM_PROMPT_FILES)) {
    const frozenHash = readFrozenHash(arm);
    const actualHash = sha256(messageForArm(arm));
    if (frozenHash !== actualHash) {
      const message = `arm ${arm} is not frozen in protocol §8, or its text changed.\n` +
        `  frozen: ${frozenHash ?? "none"}\n  actual: ${actualHash}`;
      if (!isDryRun) { console.error(`Refusing to run: ${message}`); process.exit(1); }
      console.log(`(dry run) ${message}`);
    }
  }

  const scored = rescoreAll();
  const attemptsFor = (runNumber) => scored.filter((e) => e.meta.run === runNumber).length;
  const lastEndedFor = (runNumber) => scored.filter((e) => e.meta.run === runNumber).at(-1)?.score.ended;

  let runsToDo = [];
  const isRetry = valueAfter("--retry") !== null;
  if (valueAfter("--run")) {
    runsToDo = [valueAfter("--run")];
  } else if (valueAfter("--next")) {
    runsToDo = Array.from({ length: TOTAL_RUNS }, (_, i) => i + 1)
      .filter((n) => attemptsFor(n) === 0).slice(0, valueAfter("--next"));
  } else if (isRetry) {
    const runNumber = valueAfter("--retry");
    if (!lastEndedFor(runNumber)?.startsWith("error")) {
      console.error(`Refusing to retry run ${runNumber}: only a technical failure may be repeated (protocol §6, A1).`);
      process.exit(1);
    }
    runsToDo = [runNumber];
  } else {
    console.error("Give --run N, --next N, --retry N or --rescore (optionally with --dry-run).");
    process.exit(1);
  }

  for (const runNumber of runsToDo) {
    if (runNumber < 1 || runNumber > TOTAL_RUNS) { console.error(`No run ${runNumber}.`); continue; }
    if (!isDryRun && !isRetry && attemptsFor(runNumber) > 0) {
      console.error(`Run ${runNumber} already has an attempt; use --retry only after a technical failure.`);
      continue;
    }
    await runOnce(runNumber, attemptsFor(runNumber) + 1, { isDryRun });
  }
}

main();
