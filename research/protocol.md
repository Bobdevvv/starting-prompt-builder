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

Amendments: none.
