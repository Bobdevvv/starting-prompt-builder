**Platform target: any**

# Starting prompt builder

**One-line summary:** Answer a few questions and get the first message for a new AI coding session, with the rules that project needs and none it doesn't.

**Topics:** Developer tools, AI

**Key facts:**

- **What:** builds a starting prompt for a new session with an AI coding assistant, from four quick questions and a few facts about the project. It can also produce the instructions file a coding agent reads at the start of every session (`CLAUDE.md` or `AGENTS.md`).
- **Stack:** TypeScript, with no dependencies; the rules are plain Markdown, turned into data at build time.
- **Interesting bit:** the prompt was tested before it shipped. Fresh Claude Code sessions got a building task with deliberately ambiguous data. Without the prompt, 10 of 10 started writing code straight away; with it, 0 of 30 did, across three versions of the wording. Each asked about the data first and waited. The rules for the test were fixed and published before the first run.

**Public repository:** https://github.com/Bobdevvv/starting-prompt-builder

**Measured size:** {SIZE}

---

## Documentation (page body)

A new session with an AI coding assistant starts with no idea how you like to
work. Some people paste the same long list of rules into every session; most
paste nothing. This builder sits in between. It asks a few questions and puts
together a starting prompt with only the rules that fit the project.

### How it works

Four quick questions decide most of the prompt: where you'll use it (Claude
Code, another coding agent, or a chat in the browser), how strict security
should be, how much process the AI should follow, and who will use what you're
building. A few facts about the project add the rest: does it use third-party
packages, is the repository public, does it get deployed, does it handle data
about its users.

Each answer switches on a **rule set**: a short block of plain instructions, such
as asking before adding a dependency, keeping secrets out of the code, or never
committing without permission. Every rule set says what it's there to prevent.
Under **Advanced settings**, each one can be switched on or off by hand.

Every prompt starts with a few core rules: plan before changing anything, ask
when something is unclear, ask before anything that can't be undone, and only
call something done after checking it. By default it also includes **Who
decides**: you lead, and the AI advises, does exactly what you ask, checks its
work and owns its mistakes.

The prompt ends by asking the AI to reply with a plan and wait. For coding
agents, it also asks the AI to offer to save the rules in the project's
instructions file, so later sessions start with them too.

### How to use it

1. Answer the questions. The list on the right shows what the prompt will
   contain.
2. Optionally describe the project. Anything left empty becomes a placeholder
   to fill in after pasting.
3. Copy the prompt, or download it, and paste it as the first message of a new
   session.

Nothing you enter leaves your browser. It isn't sent anywhere or saved.

### Does it work?

The test asked one question: does the prompt stop the AI from building before a
plan is agreed? Fresh Claude Code sessions, each with no memory, were given the
same task: build a tool that converts CSV files to JSON. The sample data was
ambiguous on purpose, with mixed date formats, two decimal styles and
unexplained status codes. A session that starts building has to guess at those.

A script read each session's log and checked whether it tried to write code
before finishing its first reply. Nothing was judged by hand.

| | started building first |
|---|---|
| no prompt | **10 of 10** |
| with the starting prompt (three versions of the wording) | **0 of 30** |

That difference is far beyond chance (one-sided Fisher exact test, p = 5.4 ×
10⁻⁶ for each version). Without the prompt, every session silently picked one
reading of the data and started writing code. With it, every session asked about
the dates, the decimals and the status codes, and waited.

**What it doesn't show:** that the prompt beats a single sentence such as "plan
first", that the other rules work, that the effect lasts through a long session,
or that it holds for other AI models. The tests used Claude only. The rules
address the assistant as "you", so they're expected to work elsewhere, but
that hasn't been tested.

The protocol, every run's log and one correction made along the way (a command
that only read a file was first scored as building) are in the repository.

### Where the rules come from

The rules come from a real long-running project's own working rules, general
engineering practice, and published guidance: Anthropic's prompting
documentation, OWASP, GitHub's security guides, WCAG 2.2 and the GDPR. Each rule
set in the repository lists its sources, and says plainly where there isn't one.

---

## For the host (not for the page)

- **Files:** `engine.ts`, `engine.test.ts`, `view.ts`, `modules.data.ts` (five
  files with this README; agreed with the owner). `modules.data.ts` is generated
  from the repository's Markdown rule sets. Keeping it separate keeps the rules
  out of the logic, and it only changes when the wording does. Don't edit it here;
  regenerate it in the repository.
- **Entry point:** `initEmbeddedEntry(root)` in `view.ts`. It returns a teardown
  that removes every listener, cancels pending timers and revokes any download
  URL that's still waiting.
- **Storage:** none. No `localStorage` keys, no cookies, no network requests. The
  repository's tests fail if any of these appear.
- **Controls:** keyboard and pointer, all standard form controls (radio groups,
  checkboxes, selects, a `<details>` section, buttons). Copy uses
  `navigator.clipboard.writeText` and shows the result in an `aria-live`
  region. If the clipboard refuses, it selects the text in the read-only field
  so it can be copied by hand. Download uses a local `Blob`, and the object URL
  is revoked after the click and in the teardown.
- **Host variables used:** the colour and font tokens from the spec, and
  `--sticky-header-height` (falls back to 0). It keeps the "In the prompt"
  column below the pinned header while scrolling.
- **Motion:** colour fades, a slide-open for Advanced settings, and items sliding
  into the summary list. With `prefers-reduced-motion: reduce`, all of it is off
  and the builder works the same.
- **Layout:** it follows its own width with a container query: two columns from
  600px, one below. It's usable at 280px. Text fields use 16px on touch screens,
  so phones don't zoom in.
- **Newer CSS, used as progressive enhancement:** `field-sizing: content` (a JS
  fallback grows the fields where it's missing), `interpolate-size` and
  `::details-content` (without them, Advanced opens instantly), and `:has()`
  (only greys out the text of settled facts).

### Unsure about

- The measured size is unminified, so it's an upper bound. The host build should
  come in smaller.
- I couldn't check it in a real browser or on a real phone. All logic is unit
  tested and the type check is strict, but the visual result and keyboard flow
  were only checked by the owner, in a local preview.
- The privacy line ("everything you enter here stays in your browser") is true
  for the builder's own code. The host page shouldn't add anything that reads
  the form.
