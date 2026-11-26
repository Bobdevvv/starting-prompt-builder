# starting-prompt-builder

Build the first prompt of a new Claude session from a few questions. You get
the rules that project actually needs, and none of the ones it doesn't.

> Unofficial. Not affiliated with or endorsed by Anthropic.

**Status: in development.** The modules can be used by hand (see `samples/` for
a full example). The builder that asks the questions and assembles the prompt
works, and is being prepared for the owner's site.

## What it will do

- Ask four quick questions (where you'll use it, how strict security should be,
  how much process, who will use the result), then a few facts about the
  project: does it deploy, handle user data, use third-party packages, live in
  a public repo?
- Pick a small **core** of rules plus the **modules** that fit the answers.
- Produce a **starting prompt** to paste as the first message of a session: in
  Claude Code, in another coding agent (Codex, Cursor, Gemini CLI and others),
  or in a chat in the browser (claude.ai, ChatGPT, Gemini). For coding agents it
  can also produce the instructions file they read at the start of every
  session: `CLAUDE.md` for Claude Code, `AGENTS.md` for most others.

**Tested with Claude.** The prompts were tested in Claude Code with a Claude
Sonnet model (see below). The rules are written to any assistant ("you"), so
they're expected to work with other tools too, but that hasn't been tested.

Every module states what it prevents. The modules are plain Markdown in
`modules/`, so you can use them without the builder.

## Does it work?

One small test, with its rules fixed before the first run
(`research/protocol.md`). Fresh Claude Code sessions got a building task with
deliberately ambiguous data, half of them with the kit's starting prompt and half
without. A script read each session's log and checked whether it started
building before agreeing on a plan.

**Without the kit, 10 of 10 sessions started writing code straight away. With
it, 0 of 10 did.** Each of those asked about the ambiguous data and waited
(p = 5.4 × 10⁻⁶). After the wording was rewritten for clearer English, the
revised prompt was tested again: 0 of 10 again. So was the current default,
which adds the "Who decides" rules: 0 of 10. That makes 0 of 30 kit runs against
10 of 10 without a prompt. What this does and doesn't show,
and the corrections made along the way, are in `research/results.md`.

## License

- **Code** (`src/`, `scripts/`, and the scripts in `research/`): MIT, see
  [LICENSE](LICENSE).
- **Written content** (`modules/`, `samples/`, `docs/`, and the protocol and
  write-ups in `research/`): Creative Commons Attribution 4.0 International,
  see [LICENSE-CONTENT](LICENSE-CONTENT). Credit: "starting-prompt-builder by
  Bob (github.com/Bobdevvv)", with a link to this repository.
- **Your prompts are yours.** As an extra permission on top of CC BY 4.0, you
  may use, change and publish any prompt or instructions file (`CLAUDE.md`,
  `AGENTS.md`) made with the builder,
  or put together from the modules' Rules sections, without credit. That
  includes committing it to a public repository. Credit is only asked for when
  you republish the modules themselves, as a collection or in a kit of your
  own.
