# starting-prompt-builder

A new session with an AI coding assistant starts out knowing nothing about how
you like to work. This builder asks a few questions about your project and
writes the first message for the session: a starting prompt with the rules that
project needs, and none of the ones it doesn't.

The prompt works as the first message in Claude Code, in another coding agent
such as Codex, Cursor or Gemini CLI, or in a chat in the browser such as
claude.ai, ChatGPT or Gemini. For coding agents, the builder can also produce
the instructions file they read at the start of every session: `CLAUDE.md` for
Claude Code, `AGENTS.md` for most others.

> Unofficial. Not affiliated with or endorsed by Anthropic. The prompts were
> tested with Claude only (see [Does it work?](#does-it-work)).

## How it works

Four quick questions decide most of the prompt: where the session runs, how
strict security should be, how much process the AI should follow, and whether
other people will use what you're building. A few yes-or-no facts add the rest:
does the project use third-party packages, is the repository public, does it get
deployed, does it handle data about its users?

Each answer switches on a **rule set**, a short block of plain instructions such
as "ask before adding a dependency" or "never commit without permission". Every
rule set says what it's there to prevent and where its rules come from. Every
prompt also gets a few core rules (plan first, ask when something is unclear,
ask before anything that can't be undone), and by default a rule set that keeps
you in charge: you decide, the AI advises.

The prompt ends by asking the AI to reply with a plan and wait for your
approval. In a coding agent, it also asks the AI to offer to save the rules in
the project's instructions file, so later sessions start with them.

## Using it

**The rule sets on their own.** They're plain Markdown in [`modules/`](modules/).
Copy the **Rules** section of the ones you want into the first message of a
session. [`samples/starting-prompt-claude-code.md`](samples/starting-prompt-claude-code.md)
shows a complete prompt, and [`modules/README.md`](modules/README.md) explains
how the rule sets fit together.

**The builder.** It runs entirely in the browser, with no dependencies at run
time. To try it locally (Node.js 24):

```
npm install
node scripts/build-preview.mjs --serve
```

Then open http://localhost:4400. Nothing you type into it is sent anywhere or
saved.

## Does it work?

The prompt was tested before it was published, with the rules of the test fixed
and published before the first run ([`research/protocol.md`](research/protocol.md)).
Fresh Claude Code sessions all got the same task, with sample data that was
ambiguous on purpose. A script read each session's log and checked whether it
started writing code before agreeing a plan.

| | started building before asking |
|---|---|
| without a starting prompt | 10 of 10 |
| with the starting prompt | 0 of 30 |

The 30 runs cover three versions of the prompt, each tested ten times. Every
session with the prompt asked about the ambiguous data first and waited. Every
session without it started writing code without asking anything.

The test shows that the prompt changes what the AI does first, for this task and
this model. It doesn't show that the other rules work, that the prompt beats a
one-line "plan first", or that it works the same with other models.
[`research/results.md`](research/results.md) has the full results, the one
correction made along the way, and every run's log.

## In this repository

| folder | what's in it |
|---|---|
| `modules/` | the rule sets and the text around them, in Markdown |
| `src/` | the builder: `engine.ts` (logic), `view.ts` (interface), and the rule data generated from `modules/` |
| `research/` | the test: protocol, sample project, scoring script, results and logs |
| `samples/` | example prompts, generated from the rule sets |
| `scripts/` | small Node.js scripts for building, previewing and running the test |
| `docs/decisions.md` | what was decided along the way, and why |

`npm test` runs the builder's tests. They include a check that the builder
produces exactly the prompt that was tested, byte for byte.

## License

- **Code** (`src/`, `scripts/`, and the scripts in `research/`): MIT. See
  [LICENSE](LICENSE).
- **Written content** (`modules/`, `samples/`, `docs/`, and the protocol and
  write-ups in `research/`): Creative Commons Attribution 4.0 International. See
  [LICENSE-CONTENT](LICENSE-CONTENT). Please credit it as "starting-prompt-builder
  by Bob (github.com/Bobdevvv)", with a link to this repository.
- **Your prompts are yours.** As an extra permission on top of CC BY 4.0, you can
  use, change and publish any prompt or instructions file (`CLAUDE.md`,
  `AGENTS.md`) made with the builder or put together from the rule sets, without
  credit. That includes committing it to a public repository. Credit is only
  asked for when you republish the rule sets themselves, as a collection or as
  part of a kit of your own.
