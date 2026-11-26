**Platform target: any**

# Starting prompt builder: handover

This folder holds an embedded Projects entry, built to `docs/embedded-entry-spec.md`
(§12 for Projects). Below are the frontmatter, the page body, and notes for the
host.

**Measured size:** {SIZE}

## Frontmatter

Ready to paste into `src/content/projects/starting-prompt-builder.md`. Check
`order` against the entries that exist when this lands.

```yaml
---
title: "Starting prompt builder for AI coding sessions"
slug: starting-prompt-builder
summary: "Answer a few questions and get the first message for a new AI coding session, with only the rules that project needs."
order: 30
topics: ["AI"]
kind: embedded
platform: any
facts:
  - "**What:** asks a few questions about a project and builds the first message for a new session with an AI coding assistant, containing only the rules that project needs."
  - "**Stack:** TypeScript with no dependencies, and the rules kept as plain Markdown."
  - "**Interesting bit:** the builder can only hand out text that was tested. A test compares its output with the tested prompt byte for byte, so changing the wording of a rule means testing it again. That is how a rewrite for clearer English ended up being tested ten more times."
links:
  source: "https://github.com/Bobdevvv/starting-prompt-builder"
  demo: ""
placeholder: false
---
```

**Topics:** `AI` is a new topic. None of the existing ones (Quant, Security,
Automation) describes the work by its real definition, and "AI" does: the
project is a tool for working with AI assistants.

**Preview image:** none supplied. The spec allows a screenshot of the tool's own
interface for a Projects entry, so the owner can take one of the builder on the
live page if they want a tile image.

## Page body

Everything below this line, up to "Notes for the host", is the body.

---

A new session with an AI coding assistant starts out knowing nothing about how
the person on the other end likes to work. It doesn't know that dependencies
need approval first, that nothing gets committed without asking, or that a plan
comes before any code. People who care about that tend to paste the same long
list of rules into every session, and most people paste nothing at all.

The builder makes that list per project. It asks four quick questions and a
handful of yes-or-no facts, and puts together a starting prompt that holds only
the rules the project needs. The prompt goes in as the first message of a
session, in Claude Code, in another coding agent such as Codex, Cursor or
Gemini CLI, or in a chat in the browser such as claude.ai, ChatGPT or Gemini.

## The short version

| To… | the builder has |
|---|---|
| Get a prompt that fits the project | four quick questions and a few facts about the project |
| See what ends up in the prompt | the list next to the questions, updated with every answer |
| Add or remove single rule sets | Advanced settings |
| Keep the rules for later sessions | a `CLAUDE.md` or `AGENTS.md` next to the prompt |
| Take it into a session | Copy and Download |

## Choosing the rules

The four quick questions decide most of the prompt: where the session runs, how
strict security should be, how much process the AI should follow, and whether
other people will use what is being built. The facts below them each add one
rule set. A project that uses third-party packages gets rules about asking
before adding one. A public repository gets rules about keeping names, local
paths and secrets out of every commit. A project that gets deployed gets rules
about never touching a live server unless asked to.

A rule set is a short block of plain instructions, and each one states what it
is there to prevent. Some come in versions. Git, for example, can be run by the
AI with commits and pushes only after permission, handled through branches and
pull requests, committed straight to main, or left entirely to the person. In
Advanced settings, every rule set can be switched on or off and every version
changed by hand.

Every prompt starts with the same core rules: plan before changing anything,
ask when a request could mean two things, ask before anything that can't be
undone, keep secrets out of the code, and only call something done after
checking it. By default it also says who is in charge. The person leads and
makes the decisions, and the AI advises, does what was asked and nothing more,
checks its work before showing it and owns its mistakes. There is deliberately
no "make no mistakes" rule. A model can't decide not to make mistakes, and
telling it to mostly makes it sound more certain than it is.

## Getting the prompt

The prompt ends by asking the AI to reply with a summary of the project, a list
of anything unclear and a proposed first step, and then to wait. In a coding
agent it also asks the AI to offer to save the rules, word for word, in the
project's instructions file, so that every later session starts with them. In
Claude Code, rules kept there also survive when a long session gets compacted,
which rules given only in the chat don't.

Fields left empty in the project description turn into placeholders in square
brackets, to be filled in after pasting. Copy puts the prompt on the clipboard
and Download saves it as a file. Everything stays in the browser. Nothing typed
into the builder is sent anywhere or saved, and it's gone when the page is
closed.

## Does it work?

A prompt like this is easy to write and hard to check, so this one was tested
before it went out. The test asked a single question: does the prompt stop the
AI from building before a plan has been agreed?

Fresh Claude Code sessions, each starting with no memory, all got the same task:
build a command-line tool that converts the project's CSV exports to JSON. The
sample file was ambiguous on purpose. Its dates came in two formats, some
amounts used a decimal comma and others a decimal point, and its status codes
were never explained. A session that starts building straight away has to guess
at all of that. A script read each session's log and checked whether it tried
to write code before its first reply was finished, so no run was scored by
hand, and the rules of the test were published before the first run.

| | started building before asking |
|---|---|
| without a starting prompt | 10 of 10 |
| with the starting prompt | 0 of 30 |

The 30 runs with the prompt cover three versions of it: the original, a rewrite
in clearer English, and the current default with the "who decides" rules added.
Each version ran ten times and came out 0 of 10. Against the runs without a
prompt, a one-sided Fisher exact test puts that at p = 5.4 × 10⁻⁶ for each
version. Without the prompt, every session looked through the project and
started writing a converter without asking a single question. One of them did
so without having read the CSV at all: its attempts to open the file failed,
and it went ahead anyway. With it, every
session replied with a long list of questions, always including the dates, the
decimals and the status codes, then proposed a first step and waited.

That is a narrow result, and the edges are worth stating. It shows that the
prompt changes what the AI does first, for this task and this model. It doesn't
show that the prompt does better than a single sentence such as "plan first",
that the other rules in it work, or that the effect lasts through a long
session. Every run used Claude. The rules address the AI as "you" and never name
a particular model, so they are expected to work in other tools too, but that
hasn't been tested.

One correction was made along the way. In the second run, a command that only
read the CSV file was scored as building, because the list of read-only commands
was incomplete. The rule was fixed, the fix was published before that run was
repeated, and every run was scored again under the corrected rule. The
protocol, all 41 attempts and their logs are in the repository.

## Where the rules come from

The rules started from the working rules of a long-running personal project.
The rest come from general engineering practice and from published guidance:
Anthropic's prompting documentation, the OWASP cheat sheets on secrets and
logging, GitHub's security guides, WCAG 2.2 and the GDPR. Every rule set in the
repository lists its sources, and where a rule is a judgement call rather than
something with a source behind it, it says so.

---

## Notes for the host

- **Files:** `engine.ts`, `engine.test.ts`, `view.ts` and `modules.data.ts`. That
  makes five files with this README, which the owner agreed to.
  `modules.data.ts` is generated from the repository's Markdown rule sets. It's a
  separate file so the rule text stays out of the logic, and it only changes
  when the wording does. Regenerate it in the repository; don't edit it here.
- **Entry point:** `initEmbeddedEntry(root)` in `view.ts`. The teardown removes
  every listener, cancels pending timers and revokes any download URL that's
  still waiting.
- **Storage and network:** none. There are no `localStorage` keys, no cookies and
  no requests. The repository's tests fail if any of them appear.
- **Controls:** standard form controls only: radio groups, checkboxes, selects,
  a `<details>` section and buttons. They all work with a keyboard and a
  pointer. Copy uses `navigator.clipboard.writeText` and announces the result in
  an `aria-live` region. If the clipboard refuses, the text in the read-only
  field is selected so it can be copied by hand. Download uses a local `Blob`;
  the object URL is revoked after the click and in the teardown.
- **Host values used:** the colour and font tokens from the spec, and
  `--sticky-header-height` (with 0 as the fallback). The "In the prompt" column
  uses it to stay below the pinned header while the page scrolls.
- **Motion:** colour fades, Advanced settings sliding open, and rule sets sliding
  into the summary list. With `prefers-reduced-motion: reduce`, all of it is
  off and the builder works the same.
- **Layout:** a container query sets the layout from the builder's own width:
  two columns from 600px, one below that. It works down to 280px. Text fields
  use 16px on touch screens, so phones don't zoom in on them.
- **Newer CSS, used only where supported:** `field-sizing: content` (a small
  script grows the fields where it's missing), `interpolate-size` and
  `::details-content` (without them, Advanced settings opens instantly), and
  `:has()` (it only greys out settled facts).

### Not yet certain

- The measured size is unminified, so it's an upper bound. The host's build
  should come out smaller.
- The builder hasn't been checked in a real browser or on a real phone by the
  author. All logic is unit tested and the type check is strict, but the look
  and the keyboard flow were only checked by the owner, in a local preview.
- The privacy line ("everything you enter here stays in your browser") is true
  of the builder's own code. The host page shouldn't add anything that reads
  the form.
