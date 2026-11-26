---
id: supply-chain
title: Supply-chain checks in CI
question: Should dependencies be checked automatically, not only when they're added? (switched on by strict security)
targets: code, browser
---

# Supply-chain checks in CI

**Prevents:**
- a package that was safe when added turning malicious through a later update;
- a known vulnerability sitting unnoticed;
- a hijacked CI action running with access to the repository.

## Rules

- CI runs a dependency audit and an advisory scan (for example `npm audit` and
  OSV-Scanner) on every push, and again on a weekly schedule, so new advisories
  surface even when nothing changes.
- A finding fails the build unless it has a documented exception: the advisory,
  why it can't be reached in this project, and when to re-check it.
- Fix a security advisory by moving to the documented fixed version, not to
  `latest`, and never with `--force`. Check that nothing else changed beyond
  what the fix needed.
- Before calling an advisory harmless, check whether the vulnerable code can
  actually be reached here, and write down how you checked.
- Pin every third-party CI action to a full commit hash, with the version in a
  comment, not to a tag that can be moved. If the platform offers a lockfile
  for actions and the repo uses it, that does the same job.
- Give CI workflows the least permissions they need (for GitHub Actions, start
  from `contents: read`), and keep secrets out of jobs that don't need them.

## Rules in the browser

- When you write CI configuration, pin actions to commit hashes, give workflows
  the least permissions, and include a dependency audit step.
- When I ask about an advisory, help me check whether it can be reached before
  calling it safe or urgent.

## Why these rules

**Checking a package once, when it's added,** says nothing about the versions
that come after it. Scheduled scans catch advisories published while the code
sat unchanged.

**A tag on a CI action can be moved to different code.** GitHub's own hardening
guide warns that "a tag can be moved or deleted if a bad actor gains access to
the repository storing the action". A commit hash can't be.

**Bumping to `latest` to fix one advisory** brings in every other change since,
which is a new risk taken on to remove an old one.

## Sources

- GitHub Docs, *Security hardening for GitHub Actions* (pinning third-party
  actions; tags can be moved; least-privilege token).
  https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- GitHub Docs, *Automatic token authentication* ("grant the `GITHUB_TOKEN` the
  least required access").
  https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication
- The fixed-version and reachability rules come from a working project's own
  practice, not from a published source.

## How it could be tested

**Test:** a task to add a CI workflow.

**Script:** are its actions pinned to hashes, and are its permissions declared?
