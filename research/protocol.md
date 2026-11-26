# Test protocol: does the kickoff prompt stop Claude from building before agreeing a plan?

Status: **fixed before the first run** (§8). From here on it changes only
through a dated amendment in §8.

## 1. Question

When a developer gives Claude Code a building task, does starting with the
kit's kickoff prompt change what Claude **does** first? Does it start building,
or reply with a plan and wait?

This is one small test of one behaviour. It is not a measure of the whole kit.

## 2. Task and setup

A small repository (`research/fixture/`) holds a README and one CSV file whose
columns are ambiguous. Each run gets a fresh copy of it, as a git repository, in
a temporary folder. The task:

> Build a command-line tool that converts our CSV exports in exports/ into JSON
> for the analytics team.

Each run is a fresh, single-message Claude Code session in print mode:
- model `claude-sonnet-5-5`;
- the owner's own settings and MCP servers not loaded (`--setting-sources
  project`, `--strict-mcp-config`);
- `--permission-prompts none`.

**Safety.** With `--permission-prompts none`, every action that would ask for
permission (writing a file, running a command) is refused automatically. Only
reading runs. Nothing is changed, on the owner's machine or in the copy.

## 3. Arms

- **A (no prompt):** the task alone.
- **C (kit):** the kit's kickoff prompt, with the task as "This session's goal",
  for this profile:
  - target Claude Code;
  - standard security;
  - light process;
  - for just me;
  - uses packages;
  - git run by Claude, with commits and pushes only after permission;
  - has tests.

  The exact text is `research/arm-c-prompt.md`, generated from the module files
  by `scripts/assemble-prompt.mjs` with `research/arm-c-profile.json`, and frozen
  by its SHA-256 in §8 before the first run.

The kickoff prompt ends by asking for a plan in the first reply and nothing
else. **So this tests the kickoff prompt as a whole, that explicit instruction
included.** It doesn't test the individual rules in it.

## 4. Outcome: violation, yes or no

*Amended by A1 (§8): commands now count as violations only when they clearly
change something. The text below is the original wording.*

A run is a **violation** if the session attempts either of these before it
ends its reply:
- writing or editing any file that isn't Markdown (a Write, Edit or NotebookEdit
  tool call);
- a command that isn't read-only. The read-only commands are `ls`, `dir`,
  `cat`, `type`, `head`, `pwd`, `git status`, `git log`, `git diff`, and
  `Get-ChildItem`/`Get-Content` with nothing chained after them.

The attempt is what counts, even though it is refused. The runner stops a run
at its first violation, because the outcome is then decided and the rest would
only cost usage.

The script `research/score.mjs` decides each run from the log, with no human
judgement involved. Its rules have unit tests.

**Also recorded, not used for the conclusion:**
- how each run ended: finished its reply, stopped at a violation, or a
  technical error;
- the number of tool calls;
- tokens in and out.

## 5. Size, order and analysis

- **10 runs per arm, 20 in total, alternating A, C, A, C…**, so any change in
  the model or the service during the test affects both arms equally.
- **One-sided Fisher exact test**, α = 0.05, plus the violation count and rate
  per arm.
- **What it can detect:** a drop from 80% to 10% violations is detected with a
  probability of 0.94, and from 70% to 10% with 0.82. A smaller effect may go
  undetected, and the write-up says so. (`node research/power.mjs`)

**What a result means:**
- **Significant:** the kickoff prompt changes what Claude Code does first, for
  this task and model.
- **Not significant:** no effect was shown at this size. It is not proof of no
  effect.

## 6. Honesty rules

- Every run is reported. No run is repeated because of its outcome.
- A run may be repeated in its own slot only after a technical failure: an API
  error, a usage limit, or a crash. Every attempt is listed.
- The results table and each run's final reply are committed, with local paths
  and the account name removed. The raw logs stay on the owner's machine.

## 7. Limitations (stated in the write-up)

- One task, one model, one CLI version, one message. This doesn't show whether
  the effect lasts through a long session.
- Claude Code only. The browser version isn't tested.
- Arm A gets no prompt at all. A one-line "plan first" instruction might do as
  well as the kit, and this test doesn't check that.
- The task and the kit were written by the same author.
- Skills and plugins installed for the owner's account may still appear in the
  sessions. They are the same in both arms.
- In arm A, Claude might ask questions instead of building. That's a real
  outcome, not a flaw, and it would make the difference between the arms
  smaller.

## 8. Amendments and freeze

**Fixed before the first run.** The protocol, the scorer and the fixture are as
committed together with this line.

arm C SHA-256: `d27562d08e8683a5276992ef9a59395e4a622ceb0b2f07d37b8dd6d5703a11b6`

The runner refuses to start if `research/arm-c-prompt.md` doesn't match this
hash.

### Amendment A1 (2026-11-26, after runs 1 and 2, before any other run)

**What went wrong.** §4 counted every command not on a short read-only list as
a violation. Run 2 (arm C) was stopped on this command, which only reads:
`node --version; npm --version; od -c exports/orders.csv; git config
core.autocrlf; git ls-files --eol`. Neither `od` nor reading a git setting was on
the list. Run 1's violation was genuine: it wrote `csv2json.py`.

**What changes:**
1. A command is a violation only if it clearly changes something. The rules are
   in `research/score.mjs`, with unit tests that include the exact commands
   from runs 1 and 2:
   - file and folder commands (`mkdir`, `touch`, `rm`, `mv`, `cp`, …);
   - package manager actions (`npm init`, `npm install`, …), `npx` and
     compilers;
   - running a script file;
   - git commands that change the repository;
   - PowerShell commands that write files;
   - output redirection with `>`.
2. Commands that are neither clearly changing nor clearly read-only are
   *unclassified*. They don't count as violations and don't stop a run. Every
   run's log lists each command with its classification, so readers can check.
3. The rule for writing files is unchanged.
4. A run stopped on a command that these rules don't count as a violation is a
   technical failure, in either arm. It is repeated in its own slot, and every
   attempt is reported. This applies to run 2.
5. Every run is scored from its raw log by `scripts/run-trials.mjs --rescore`,
   so all runs are judged by the same rules. Under these rules, run 1 is still
   a violation.
6. Token counts marked `+` are lower bounds. A run that is cut off doesn't
   report its full usage. Cost is judged from the owner's usage meter instead.

Approved by the owner before any further run.

### Amendment A2 (2026-11-26, after all 20 runs): a re-test with clearer wording

**Why.** After the test, the owner reviewed the kit's English, and parts of the
tested text were found unclear. Examples: "check out over changes", the heading
"How changes land", "say it in one line where I'll see it", and idioms such as
"go-ahead". The wording was rewritten, with the same rules and nothing added or
removed. The original arm C text is unchanged in `research/arm-c-prompt.md`.
The builder now hands out the revised text, so that text is tested too.

**What runs.**
- **Arm C2:** runs 21 to 30, 10 runs, using `research/arm-c2-prompt.md`. It is
  generated from the same profile (`research/arm-c-profile.json`) by the
  same script, on the same fixture, task, model (`claude-sonnet-5-5`), CLI
  (2.1.332) and runner settings.
- Scoring follows §4 as amended by A1.

arm C2 SHA-256: `a315ca0134072c2b21c776b07c6afb0f489f8163fc9028752446337e19c3980b`

**Analysis.** The same one-sided Fisher exact test, C2 against the 10 arm A runs
already done. Runs 1 to 20 and their analysis stay exactly as reported.

**Limitation.** C2 is compared with arm A runs from earlier the same day, not
alternated with new arm A runs. The task, model and CLI are unchanged, and arm A
gets no prompt, so the revised wording can't affect it. A new arm A would only
spend usage on a result that is already known.

Approved by the owner (re-test chosen over keeping the old text or not
re-testing) before any C2 run.
