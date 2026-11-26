---
id: accessibility
title: Accessibility
question: Does it have an interface that people use (web, app, or desktop)?
targets: code, browser
---

# Accessibility

**Prevents:** interfaces that only work with a mouse, can't be read by a screen
reader, or rely on colour alone.

## Rules

- Text contrast meets WCAG 2.2 AA: at least 4.5:1, or 3:1 for large text.
- Every meaningful image has alt text, every input has a label, and every
  button and link has a name a screen reader can announce. Set the page's
  language.
- Use real elements (`button`, `label`, headings) before ARIA attributes.
- Every action works with the keyboard alone, and keyboard focus is always
  visible.
- Never use colour as the only signal.
- Honour `prefers-reduced-motion` by changing the experience, not just
  shortening animations. Remove non-essential motion, and keep the reduced
  version fully usable. Nothing flashes more than three times a second.
- Layouts work at 320 px wide without horizontal scrolling. Touch targets are
  at least 24 by 24 px, and 44 by 44 px where the layout allows.
- Detect what the device can do (`pointer`, `hover` media queries), never which
  device it is. No user-agent sniffing.
- Announce important changes (errors, results, completion) in an `aria-live`
  region or as visible text.

## Why these rules

**The first two rules cover the failures found most often.** The WebAIM Million
2026 report tested a million home pages automatically and found WCAG failures
on 95.9% of them. Six kinds of error made up 96% of all errors found:

| error | share of pages |
|---|---|
| low-contrast text | 83.9% |
| missing alt text | 53.1% |
| missing form labels | 51% |
| empty links | 46.3% |
| empty buttons | 30.6% |
| missing page language | 13.5% |

**A named standard gives the session something concrete to check,** where
"make it accessible" doesn't. The WCAG criteria behind these rules:

| criterion | level |
|---|---|
| contrast (1.4.3) | AA |
| use of colour (1.4.1) | A |
| keyboard (2.1.1) | A |
| focus visible (2.4.7) | AA |
| three flashes (2.3.1) | A |
| reflow at 320 px (1.4.10) | AA |
| target size, 24 px minimum (2.5.8) | AA |
| status messages (4.1.3) | AA |

Two rules go beyond AA on purpose: 44 px targets (2.5.5) and motion from
interactions (2.3.3) are AAA.

**Capability detection** handles the touchscreen laptop and the tablet with a
keyboard. MDN calls user-agent sniffing "very hard to do reliably" and "often a
cause of bugs".

## Sources

- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*.
  https://www.w3.org/TR/WCAG22/
- WebAIM, *The WebAIM Million* (2026 report). https://webaim.org/projects/million/
- W3C, *Using ARIA*, "First rule of ARIA use" (now a discontinued draft, kept
  for reference; the rule is still widely taught). https://www.w3.org/TR/using-aria/
- MDN, *Browser detection using the user agent string*.
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent
- MDN, *prefers-reduced-motion*.
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## How it could be tested

**Test:** a task to build a small form or a menu.

**Script, partly:**
- inputs without labels;
- buttons or links without a name;
- `div`s with click handlers instead of buttons;
- `outline: none` with no replacement;
- user-agent checks.

**Needs a judge:** whether it works by keyboard in practice.
