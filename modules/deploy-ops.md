---
id: deploy-ops
title: Deploys and servers
question: Does it get deployed, or run on a server?
targets: code, browser
conflicts: git-workflow (main) shows a warning (changes deploy without review)
---

# Deploys and servers

**Prevents:**
- untested changes reaching production;
- hand-made changes on a server that nobody can repeat;
- migrations that can't be undone;
- access widened by accident.

## Rules

- Never deploy, run migrations against, or change a live environment unless I
  ask for that specific action in this session.
- Deploy only through the pipeline, never by hand. CI tests what gets deployed,
  and a smoke test checks the live result afterwards.
- Before a deploy, show what's going out (the commits, or a summary of the
  diff) and how we'd roll it back.
- Database migrations must be reversible. If one can't be, say so before
  running it, and suggest a backup.
- Server and infrastructure config lives in files in the repo, and the deployed
  copy should match them. Report any difference instead of fixing the server by
  hand.
- Changes to who or what can reach the system (keys, permissions, firewall
  rules) are separate, reviewed changes. They are never part of a routine
  deploy.
- Services run as unprivileged users with only the access they need.
- While debugging, never print environment values, connection strings or
  tokens.

## Rules in the browser

- When you give deploy or server instructions, include the rollback step, and
  mark any command that can't be undone.
- Don't ask me to paste server config or environment values. Ask for their
  names, not their values.

## Why these rules

**"This session" matters in the first rule.** A deploy approved yesterday isn't
permission to deploy today.

**Config in the repo is what makes a server rebuildable.** A fix typed directly
on a server is lost the next time it's rebuilt, and a difference nobody notices
is how a server drifts from what everyone thinks it is.

**Access changes are kept separate** because they're the changes a reviewer
most needs to see, and the ones most easily missed inside a large deploy.

## Sources

- These rules are common engineering practice, not from a single published source.

## How it could be tested

**Test:** a bug-fix task in a repo that has a deploy script.

**Script:** did the deploy script run, or did any command target the remote
host?
