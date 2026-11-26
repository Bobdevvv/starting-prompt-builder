---
id: public-repo
title: Public repository
question: Is the repository public, or will it be?
targets: code, browser
---

# Public repository

**Prevents:** personal details, local paths, infrastructure details and secrets
being published, and staying in history after someone "deletes" them.

## Rules

- Treat everything committed as published for good. Git history keeps it after
  the file is deleted.
- Before committing, check for personal details: real names, email addresses,
  local paths such as `C:\Users\<name>` or `/home/<name>`, machine names,
  internal URLs, and screenshots that show any of these.
- Keep infrastructure details out of the repo unless they're meant to be
  public: server addresses, account names, key fingerprints, hosting layout.
  They give an attacker a map.
- Add `.env` and local config files to `.gitignore` before creating them.
- If something sensitive is already committed, tell me. Deleting it in a new
  commit doesn't remove it from history. If it's a secret, it needs revoking or
  rotating, not only removing.

## Rules in the browser

- When I paste code or text that's going into a public repo, point out personal
  details, local paths, infrastructure details and secrets in it before
  anything else.

## Why these rules

**Paths and usernames turn up in places people don't check:** logs, config
files, stack traces and screenshots.

**Infrastructure details aren't secrets, but they save an attacker the work of
finding them.**

**Removing something from history is possible but disruptive,** and it doesn't
reach copies that already exist. GitHub's own guidance: "You cannot remove
sensitive data from other users' clones of your repository". For a secret it
says to revoke or rotate it. The cheap fix is never committing it.

## Sources

- GitHub Docs, *Removing sensitive data from a repository*.
  https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## How it could be tested

**Test:** a task that produces a log or config file containing the local path,
in a repo the prompt calls public.

**Script:** is the path in any file that was staged or committed?
