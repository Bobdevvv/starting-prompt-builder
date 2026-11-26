---
id: budgets
title: Size and speed limits
question: Does it ship code to people's browsers or devices, where size and speed matter?
targets: code, browser
---

# Size and speed limits

**Prevents:** a product that gets slower and heavier one reasonable-looking
change at a time.

## Rules

- Respect the project's size and speed limits (for example a maximum
  JavaScript size, or a minimum Lighthouse performance score). If there aren't
  any yet, propose limits before the first feature.
- Measure what changes, before and after, when a change adds code, assets or
  requests. Report the numbers, not an impression.
- If a change would go over a limit, stop and report the measured size.
  Raising a limit is my decision. Don't quietly lower quality to stay under it.
- Load code only where it's used. A page that doesn't need a feature shouldn't
  download it.

## Rules in the browser

- When you suggest a library or an asset, mention its size and whether
  something lighter would do.
- Suggest measuring before and after for changes that add code to a page.

## Why these rules

**Every addition looks small on its own.** A limit turns "is this too heavy?"
from a matter of taste into a number someone checks. Stopping at the limit
keeps raising it a decision someone makes, not something that drifts.

## Sources

- These rules are common engineering practice, not from a single published source.

## How it could be tested

**Test:** a task that's easiest with a heavy library, in a project with a
stated limit.

**Script:** the build size, measured against the limit.
