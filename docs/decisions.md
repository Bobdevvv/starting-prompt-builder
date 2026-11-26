# Decisions

Each entry records what was decided, by whom, and why. Change one only by
adding a new entry that supersedes it.

## D1. Name and repository
**Decided by the owner.** The public GitHub repository is `claude-session-starter`,
in lowercase kebab-case. GitHub sets no naming rule; kebab-case is the dominant
convention because it matches URLs and package names. The README says plainly
that the project is unofficial and not affiliated with Anthropic.

## D2. Where it runs
**Decided by the owner, implemented on the host side.** The builder runs inside
the owner's site as an embedded Projects entry. The host allows code that runs
entirely in the visitor's browser, with no server calls, in any section. This
repo is the source, and it hands a folder over to the host. It is not hosted
separately and has no backend.

## D3. What it produces
**Decided by the owner.**
- **Main output: a starting prompt.** It is self-contained and works in Claude Code
  and in claude.ai.
- **Secondary output: a `CLAUDE.md`**, for Claude Code only.

## D4. Targets (replaced by D12)
**Decided by the owner.** Claude Code and claude.ai browser sessions, and nothing
else for now. Exports for other assistants (such as `AGENTS.md`) are out of scope.

## D5. Module design
A small core is always included. Optional modules are added on top of it.
- Rules that contradict each other are variants of one module and can't both be
  picked.
- A clash between two modules is declared in the module files and shown to the
  person when they pick both.
- Each module states what it prevents and the test that would show it working.

## D6. Keep the output short
The generated text is read at the start of every session, so its length costs
attention. In the `CLAUDE.md` output, longer guidance goes in separate files
linked by path, not pulled in with `@import`, because imports load at session
start, which is what the split is meant to avoid. The starting prompt carries
everything inline, because a browser session cannot open files.

**Verified against Claude Code's memory docs:** "Imported files are expanded and
loaded into context alongside the CLAUDE.md that references them". So `@import`
saves no context, and linking by path is the right choice.
(https://code.claude.com/docs/en/memory)

## D6b. In Claude Code, the starting prompt hands over to a `CLAUDE.md`
Found during the source check. Claude Code re-reads the project-root `CLAUDE.md`
after compaction, but instructions "given only in conversation" can be lost
when a long session is compacted. A starting prompt is conversation, so in
Claude Code its rules aren't guaranteed to last a long session. That's why the
Claude Code starting prompt ends by offering to save its rules as a `CLAUDE.md`.
The browser version doesn't need this: claude.ai has no `CLAUDE.md`.
(https://code.claude.com/docs/en/memory, "Instructions seem lost after
`/compact`")

## D7. The study
**Decided by the owner:** it has to stand up to scrutiny, and it has to be in
proportion to a personal project on a Pro plan. A first design (three rules,
three arms, 195 runs) was dropped as out of proportion.

**The test as decided:**
- one behaviour: plan before building;
- two arms: no prompt, and the kit's starting prompt;
- 10 runs per arm;
- rules fixed before the first run, and scored by a script from the session's
  own log;
- every run reported.

It can show a large effect clearly, and it says plainly that it can't detect a
small one. The design is in `research/protocol.md`.

**A one-line comparison arm was considered and declined by the owner.** No prompt
is what users have by default, and the test is about the kit. So the write-up
compares the kit with no prompt, and doesn't claim the kit beats a one-line
instruction.

## D8. Dependencies
`typescript` and `vitest` as dev dependencies only, exact-pinned to the versions
the host already uses, so the handover code works there unchanged. No runtime
dependencies.

## D9. Licence
**Decided by the owner:** MIT for code (`LICENSE`) and CC BY 4.0 for written
content (`LICENSE-CONTENT`, the official legal code, unmodified). The README
adds one permission on top of CC BY: prompts and `CLAUDE.md` files made from
the modules may be used and published without credit. Otherwise, everyone who
commits a generated `CLAUDE.md` to a public repo would owe an attribution
notice, which defeats the purpose of the kit. Credit is still asked for when
someone republishes the modules themselves.

## D10. The builder remembers nothing
**Decided by the owner.** Every visit starts from the same blank form, and nothing
is stored in the browser. Every project is different, and leftover answers from
the last project are an easy way to generate the wrong rules without noticing.

## D11. The handover folder has five files
**Decided by the owner.** The host's spec lists four (`engine.ts`,
`engine.test.ts`, `view.ts`, `README.md`). The module text is kept in a fifth,
generated file, `modules.data.ts`, so the rules stay separate from the logic.
That file can be regenerated from `modules/` and checked by a test, and it
changes only when the wording changes. The handover README explains this.

**D8, installed (2026-11-26):** `typescript` 7.0.2 and `vitest` 4.1.12, exact
versions, with `ignore-scripts=true`. The lockfile has 92 packages, all from
`registry.npmjs.org`, and `npm audit` found 0 vulnerabilities. The only package
that declares an install script is `fsevents`, which is macOS-only and doesn't
install on Windows; install scripts are off regardless.

## D12. Other coding agents and browser chats (replaces D4)
**Decided by the owner.** The builder supports three places to use a prompt:
- **Claude Code.** The prompt offers a `CLAUDE.md`.
- **Another coding agent**, such as Codex, Cursor or Gemini CLI. It gets the same
  rules, and the prompt offers an `AGENTS.md`, the file many other agents read.
- **A chat in the browser**, such as claude.ai, ChatGPT or Gemini.

The rules already address "you", so no rule text changed, and the Claude Code
prompt is still exactly the tested text. The builder says "the AI" where it means
the assistant. **The prompts were tested with Claude only** (Claude Code, one
Sonnet model). The builder, the README and the write-up say so, and describe
other tools as expected to work, not tested.
