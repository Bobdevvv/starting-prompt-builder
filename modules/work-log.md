---
id: work-log
title: Work log
question: Will you work on it across many sessions?
targets: code
variants: light, full
---

# Work log

**Prevents:**
- each new session starting from zero;
- a change breaking something earlier work relied on;
- settled decisions being argued again.

## Rules: light

- Keep one Markdown file per piece of work in `tickets/`, with the goal, the
  plan, the status, and the evidence that it was tested.
- Before starting, search `tickets/` for related work and list what this change
  might affect.
- Record decisions and their reasons in `docs/decisions.md`, and read it before
  proposing something it already settled.
- At the end of a session, update the ticket with what's done and what's next.

## Rules: full

- Every change belongs to a ticket in `tickets/`. If there isn't one, write it
  first, then stop and wait for my approval before implementing it. A ticket
  written and built in the same turn gives me no chance to weigh in.
- A ticket holds:
  - the goal;
  - an impact analysis: related tickets, and what this might affect,
    functionally and technically;
  - the testing evidence;
  - an impact log;
  - closing notes: known limitations, what not to change without re-reading
    related work, and what was deferred.
- Write the impact analysis before any code. After the change, add a dated
  entry to the impact log of every ticket it affected.
- At the start of a session, read the ticket index and the ticket you're
  working on. Then say which files you read, and which you skipped and why.
- Significant decisions get an entry in `docs/decisions.md` with their context,
  the alternatives considered and the consequences. Don't reopen one without
  saying so.
- If something important lives only in our chat, write it down before the
  session ends.

## Why these rules

**A session remembers nothing of the last one.** Anything not written down is
gone.
- **light:** the cheapest memory that survives.
- **full:** adds the checks that matter once a project grows. The impact
  analysis stops a fix in one place from breaking another. Stopping after
  writing a ticket keeps you in the decision. Saying which files were read lets
  you catch a session that skipped the one that mattered.

**full is a lot of process.** It pays off on a long-lived project and slows a
weekend one down. Pick it deliberately.

## Sources

- These rules come from a working project's own process and naming conventions, not from a published source.

## How it could be tested

**Test:** a feature request in a repo with a `tickets/` folder.

**Script (full):** were code files changed in the same turn the ticket was
created?
