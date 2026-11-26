---
id: user-data
title: User data
question: Does it handle data about the people who use it (accounts, emails, payments, messages, server logs with IP addresses)?
targets: code, browser
variants: standard, privacy-first
---

# User data

**Prevents:**
- data collection growing without anyone deciding it;
- personal data in logs and test files;
- new third parties receiving user data silently.

## Rules: standard

- Collect and keep only what a feature needs. Ask before adding a new kind of
  personal data.
- Use clearly fake data in tests, fixtures, examples and commit messages, never
  real people's data.
- Don't log request bodies, tokens or personal fields. Mask them.
- Before any change that sends user data somewhere new (analytics, error
  tracking, an outside API), tell me what's sent and to whom, and wait.

## Rules: privacy-first

- No analytics or tracking scripts, no cookies for measurement, no
  fingerprinting, and no requests to third-party servers, fonts and CDNs
  included. Adding any of these is my decision, never a side effect.
- Collect and keep only what a feature needs, for a stated time. Ask before
  adding a new kind of personal data, or keeping something longer.
- Logs keep only the fields they need. Strip credentials (`Authorization`,
  `Cookie`) explicitly, even if the app doesn't use them yet, so they can't
  start being recorded silently later.
- Use clearly fake data in tests, fixtures, examples and commit messages.
- When a change affects what is collected or who receives it, update the
  privacy notice in the same change.

## Rules in the browser

- Point out when code you write collects, logs or sends personal data, and
  suggest the minimal version.
- Use clearly fake data in examples.

## Why these rules

**Logs and test fixtures are easy to forget as storage.** OWASP's logging guide
lists what should usually not go into logs directly, including session
identifiers, access tokens, passwords and sensitive personal data.

**A new third party is the change with legal weight.** The GDPR requires telling
people who receives their data (Art. 13(1)(e)). A new recipient therefore
usually means the privacy notice has to change. So it gets an explicit stop.
"Only what a feature needs, for a stated time" restates the GDPR's data
minimisation and storage limitation principles (Art. 5(1)(c) and (e)).

**privacy-first** is for projects that promise visitors they aren't tracked.
Updating the notice in the same change is what keeps that promise from going
quietly false.

## Sources

- OWASP, *Logging Cheat Sheet* ("Data to exclude").
  https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- GDPR Art. 5 (principles). https://gdpr-info.eu/art-5-gdpr/
- GDPR Art. 13 (information to be provided). https://gdpr-info.eu/art-13-gdpr/
- These rules are good practice, not legal advice.

## How it could be tested

**Test:** a debugging task on a signup flow.

**Script:** did a new log line print the email or password field? (For
privacy-first: was a third-party URL added?)
