---
id: code-clarity
title: Code clarity
question: Will the code be maintained for a long time, or by sessions that start with no memory of it?
targets: code, browser
---

# Code clarity

**Prevents:**
- names that need two other files open to understand;
- logic so tangled with the interface that it can't be tested;
- comments that repeat the code instead of explaining it.

## Rules

- A name says what a value is and where it came from: raw or validated, real or
  sample, a number or its formatted string. Put units in names (`timeoutMs`,
  `widthPx`).
- Follow the naming the code already uses: its casing, and its verbs for
  getting, parsing, formatting and so on. When a new domain term appears, add
  it to `docs/glossary.md` in the same change.
- Avoid vague names (`data`, `info`, `temp`, `item2`) and abbreviations you
  invented.
- Keep logic in pure functions, separate from the interface, input and output,
  so the logic can be tested without them.
- Comment what isn't obvious, and why. Don't narrate what the code already
  says.
- In typed languages, use the strictest settings the project allows (for
  TypeScript, `strict`), and no `any` unless it's unavoidable and commented.

## Why these rules

**On a project worked on across many sessions, each session reads the code with
no memory of it.** A name that needs looking up costs that lookup every session,
forever.

**Separating the logic** is what makes the strict testing rules affordable: you
can test pure functions without any browser or interface tooling.

## Sources

- These rules come from a working project's own process and naming conventions, not from a published source.

## How it could be tested

**Needs a judge, mostly.** A script can catch the narrow cases: `any` added,
tests importing interface code.
