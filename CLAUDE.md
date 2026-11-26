# CLAUDE.md: read this first, every session

claude-session-starter is a kit that builds a starting prompt for a new Claude
session (Claude Code or claude.ai in the browser) from a short questionnaire and
a set of combinable rule modules. It also ships as an embedded entry on the
owner's personal site, and it includes one small test of whether its kickoff
prompt changes what a session does.

Read before working:

1. `docs/decisions.md`: what has been decided and why. Do not re-open a
   decision without saying so.
2. `research/protocol.md`: before touching anything in `research/`.
3. `docs/embedded-entry-spec.md`: before touching `src/`. This is a local copy
   of the host site's contract and is never committed. The host owns it, so
   never edit it here. If it seems wrong, flag it to the owner.

## Rules

1. **Scope: this folder only.** Other projects in the parent folder may be read
   for reference and are never written to.
2. **Propose, stop, wait.** Anything new, meaning a module, a feature, a change
   to the protocol, or a dependency, is proposed to the owner first. Build it
   only after they answer. A plan that was approved covers only what it
   described.
3. **No test runs without a go-ahead.** The owner is on a Claude Pro
   subscription and every run uses its allowance. Before any run, state how
   many runs, which model, and what they are for, then wait.
4. **The protocol is fixed before the first run.** Once arm C's hash is
   recorded in `research/protocol.md` §8 and committed, the protocol changes
   only through a dated amendment in §8, with the reason, and the write-up
   reports it. Never repeat a run to get a different outcome. Every run is
   reported.
5. **The host contract is hard** (`docs/embedded-entry-spec.md`): no runtime
   dependencies, no network calls, strict TypeScript, a pure `engine.ts` (no
   DOM, no `Date.now()`, no `Math.random()`), a `view.ts` that exports
   `initEmbeddedEntry(root)` with a complete teardown, at most 50 KB gzipped,
   280 to 728 px wide, the host's colour tokens, keyboard operable, reduced
   motion honoured. If the size cap cannot be met, stop and report the
   measured size.
6. **Public-repo hygiene.** Nothing personal is committed: no names beyond the
   GitHub handle, no email, no local paths, no usernames in logs, and nothing
   that identifies or describes the owner's private projects. Test logs are
   scrubbed before commit (protocol §6).
7. **Dependencies.** The two exact-pinned dev dependencies in `package.json`
   are all there is. Adding one needs the owner's approval.
8. **Interface text is not output text.** What the kit generates may name
   tools and practices. The kit's own labels and messages say what it does and
   how to use it, never how it is built or hosted.
9. **Prompts are generated, never hand-edited.** `samples/` and
   `research/arm-c-prompt.md` come from `scripts/assemble-prompt.mjs`. To change
   one, change the module or the profile and regenerate.

## Layout

```
modules/        the rule modules and the frame around them, plain Markdown (the product)
samples/        generated example prompts, with the profiles they came from
scripts/        zero-dependency Node scripts (assembling prompts, running the test)
src/            the builder: engine.ts, engine.test.ts, view.ts (not written yet)
research/       protocol, fixture, arm C prompt, scorer, results
docs/           decisions
```
