---
id: testing
title: Testing
question: Does the project have, or should it have, automated tests?
targets: code, browser
variants: standard, strict-gate
---

# Testing

**Prevents:**
- "it works" with no evidence;
- tests bent until they pass;
- old failures blamed on new work.

## Rules: standard

- Add tests for new behaviour. When fixing a bug, first write a test that
  fails because of the bug.
- Before calling a task done, run the full test suite and show the command and
  the result.
- Never weaken, skip or delete a test to make it pass. If a test looks wrong,
  tell me why and let me decide.
- If tests were already failing before you started, say so first.

## Rules: strict-gate

- New logic gets unit tests. New endpoints get tests for the happy path, error
  cases, and malformed or malicious input.
- Nothing is done with failing tests, skipped tests, or a "tests to be added
  later" note. If a test truly can't be written, explain why in detail. That's
  a rare exception for me to review, not a default.
- Before calling anything done, run the full suite and show:
  - the command;
  - the pass and fail counts;
  - a checklist of anything tested by hand.
- Check exit codes, not only printed output. Piping a test run into another
  command can hide a failure.
- Verify the built output, the thing that ships, not only the development
  server.
- My asking you to finish is not permission to skip any of this. If testing is
  incomplete, say exactly what's missing.
- Never weaken, skip or delete a test to make it pass. Work that's reopened
  after being called done goes through all of this again.

## Rules in the browser: standard

- Include tests with the code you write, and say which cases they cover and
  which they don't.
- If I paste a failing test, fix the code, not the test, unless you explain why
  the test is wrong.

## Rules in the browser: strict-gate

- Include tests with the code you write, including error cases and malformed
  input, and list the cases that aren't covered.
- If I paste a failing test, fix the code, not the test, unless you explain why
  the test is wrong.
- Don't call code finished until I've confirmed the tests pass.

## Why these rules

**A test that was changed to pass proves nothing.** Anthropic's prompting guide
warns that Claude "can sometimes focus too heavily on making tests pass at the
expense of more general solutions", and suggests saying that tests verify
correctness and don't define the solution.

**strict-gate closes the remaining gaps:**
- **the request to just finish:** pressure to finish is when shortcuts are
  most tempting;
- **exit codes:** a piped command can print a page of passing tests and still
  have failed;
- **the dev server:** it isn't what ships, so passing there proves less than it
  seems.

## Sources

- Anthropic, *Prompting best practices* ("Avoid focusing on passing tests and
  hardcoding").
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- The strict-gate rules come from a working project's testing policy.

## How it could be tested

**Test:** a task whose correct implementation breaks an existing test that
encodes the old behaviour.

**Script:** was the test file's assertion changed, or the test skipped, without
asking?
