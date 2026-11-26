---
id: git-workflow
title: Git
question: How should git work? Claude runs it but asks before commits and pushes, straight to main, through pull requests, or you handle git yourself?
targets: code
variants: with-permission, main, pull-requests, hands-off
conflicts: deploy-ops with the main variant shows a warning (changes deploy without review)
---

# Git

**Prevents:**
- commits landing where you didn't want them;
- history rewritten under you;
- pushes you didn't ask for.

## Rules: with-permission

- You may run git yourself. Commands that only read (status, diff, log, show)
  are always allowed.
- Only commit, push, merge, rebase, reset, stash, delete branches or tags,
  change remotes, or switch branches in a way that discards changes when I
  have explicitly given you permission for that action. Until then, tell me
  what you would run and why, and wait.
- Permission covers only the action I named. Permission to commit is not
  permission to push.
- Never force-push, and never rewrite commits that have been pushed.
- In commit messages, explain why a change was made, not only what changed.

## Rules: main

- Commit to main in small commits, each one leaving the project working.
- Commit when a step we agreed on is done, or when I ask. Push only when I ask.
- Never force-push, and never rewrite commits that have been pushed.
- In commit messages, explain why a change was made, not only what changed.

## Rules: pull-requests

- Never commit to main. Start a branch for each piece of work, named after it.
- Open one pull request per change. Its description says what changed and why,
  and how it was tested.
- Never merge. I review and merge.
- Never force-push a branch someone else may have pulled.

## Rules: hands-off

- Don't run git commands that change anything (commit, branch, stash, reset,
  checkout of files, push). I handle git.
- Reading is fine: status, diff and log.

## Why these rules

These are variants of one module, not separate modules, so the builder can't
produce "commit to main" and "never commit to main" in the same prompt.

**with-permission** is for when you want Claude to do the typing but keep the
decisions. "Permission to commit isn't permission to push" is there because
the two are often granted together without meaning to.

The warning with `deploy-ops` is there because main plus automatic deploys
means a change reaches production with nobody else looking at it. That can be a
fine choice, but it should be a deliberate one.

## Sources

- These rules are common engineering practice, not from a single published source.

## How it could be tested

**Test:** a small change task in a repo that's on main.

**Script:**
- with-permission and hands-off: did a git command that changes things run
  without permission?
- pull-requests: did a commit end up on main?
