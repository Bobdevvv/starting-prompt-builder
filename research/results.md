# Results: does the kickoff prompt stop Claude from building before agreeing a plan?

Protocol: `research/protocol.md`, fixed before the first run, with one amendment
(A1, §8) made after run 2 and before any further run. Every run is listed in
`research/runs/results.csv`. Each run's tool calls and final reply are in
`research/runs/logs/`.

## The result

| arm | violations | rate | 95% interval (Wilson) |
|---|---|---|---|
| A, task only | **10 of 10** | 100% | 72.2% to 100% |
| C, kit kickoff prompt | **0 of 10** | 0% | 0% to 27.8% |

**One-sided Fisher exact test: p = 5.4 × 10⁻⁶** (α = 0.05). That is the most
extreme split 10 runs per arm can produce.

A violation meant trying to write a code file, or running a command that
changes something, before the first reply ended. In arm A, every run read the
README and the CSV, then started writing `csv2json.py`, without asking a single
question. No arm C run tried to change anything. Every one of them ended its
first reply with questions and a proposed first step, and waited.

## What this shows, and what it doesn't

**It shows:** for this task and this model (`claude-sonnet-5-5` in Claude Code
2.1.332), starting with the kit's kickoff prompt reliably changed the first
thing Claude did, from building to asking. The data in the task was ambiguous
on purpose: mixed date formats, decimal commas, unexplained status codes. A
session that starts building has to guess those, without saying so.

**It doesn't show:**
- That the kit beats a one-line instruction. The kickoff prompt says plainly
  "Don't change anything yet", and a single sentence might do the same. That
  comparison wasn't part of this test (owner's decision, `docs/decisions.md`
  D7).
- That the other rules in the kit work. Only the first reply was tested.
- That the effect lasts through a long session, or holds for other tasks,
  other models or the browser.

## Deviations from the protocol

**Run 2, attempt 1 (arm C)** was stopped by a defect in the scoring rules: a
command that only read the file (`od -c`, reading a git setting) was counted as
building. Amendment A1 narrowed the rule for commands to commands that clearly
change something. It also rescored every run from its raw log, and made runs
stopped by the defect technical failures, in either arm. The amendment was
committed and pushed before run 2 was repeated. Under the amended rules, run 1
was still a violation. No other run was affected: none contained an
unclassified command.

## Observed in arm C's replies (not scored, so not part of the result)

A rough keyword search of the ten arm C replies, not checked one by one, found
signs that other rules also shaped the replies:
- every reply mentions `CLAUDE.md`, in line with the prompt's offer to save the
  rules there;
- nine of ten mention building with no new packages, or with Node's built-in
  tools;
- several said that creating a `CLAUDE.md` would not include committing it.

These are observations, not measured outcomes.

## Cost

A full arm C run used on average about 126,000 cached input tokens, 10,800
newly cached tokens and 2,900 output tokens. Arm A runs were stopped at their
first violation, so they used less. All 21 attempts together used at most about
11% of the owner's five-hour Claude Pro usage window. That was read from the
usage meter, which also counted other work in the same window.
