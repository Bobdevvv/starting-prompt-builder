---
id: dependencies
title: Dependencies
question: Will the project use third-party packages (npm, pip, crates and so on)?
targets: code, browser
variants: ask-first, strict
---

# Dependencies

**Prevents:**
- packages added for something a few lines could do;
- packages nobody checked (typosquats, abandoned projects, hijacked maintainer
  accounts, install scripts);
- versions drifting without anyone deciding it.

## Rules: ask-first

- Ask before adding a dependency. Name the package and the exact version,
  explain what it's for and how much work it would be to write it ourselves,
  and wait for my answer.
- Prefer the standard library and what the project already uses.
- Pin exact versions (no `^` or `~` ranges). Change the lockfile only as much
  as the approved package requires.
- Don't upgrade, replace or remove existing dependencies as part of another
  task. Suggest it as a separate change.

## Rules: strict

- The dependencies already in the project are the approved list. Anything else
  is only a proposal: never install it yourself. By default, we write a small
  amount of code ourselves instead.
- When you propose a package, check it first and report what you found:
  - its install scripts;
  - any obfuscated or minified source;
  - a recent change of owner or maintainer;
  - its age, number of maintainers and download count;
  - known advisories (`npm audit`, OSV or the ecosystem's equivalent).

  Then wait for my decision.
- Once I approve one, log it in `docs/dependencies.md`: the package, the exact
  version, why it was added, the check result, and whether it runs install
  scripts.
- Pin exact versions, and read the whole lockfile diff, transitive packages
  included, before committing.
- Install scripts stay disabled (for npm, `ignore-scripts=true` in `.npmrc`).
  Letting one package run them (for npm, through its `allow-scripts` list)
  needs a stated reason and my approval.
- Don't upgrade, replace or remove existing dependencies as part of another
  task. Suggest it as a separate change.

## Rules in the browser: ask-first

- Before writing code that needs a package, name the package and explain why
  it's needed. If the code would be reasonably short without it, offer that
  version too.
- Give install commands with exact versions.
- Prefer the standard library and what I've told you the project already uses.

## Rules in the browser: strict

- By default, write code without new packages. If a package is truly needed,
  name it, explain why, and list what I should check before installing it:
  install scripts, maintainers, age and known advisories.
- Give install commands with exact versions, with install scripts disabled.

## Why these rules

Every package is code you run without reading it, and a supply-chain attack
needs only one bad install. The usual routes in:
- a name one typo away from a popular package;
- a package taken over, followed by a malicious release. In the event-stream
  incident (2018), an attacker took over maintainership of a widely used npm
  package and added a dependency that tried to steal cryptocurrency wallet
  keys.
- a script that runs during install, before anyone has looked at the code. npm
  runs a package's `preinstall`, `install` and `postinstall` scripts
  automatically during `npm install`.

**ask-first** costs one exchange per package. **strict** turns "should we add
this?" into a decision with evidence and a record, and keeps the default at
none.

The ledger matters later. When an advisory comes out, it tells you what you
have, why you have it, and what was checked when it came in.

## Sources

- npm Blog, *Details about the event-stream incident*.
  https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident
- npm Docs, *scripts* (lifecycle scripts that run on install).
  https://docs.npmjs.com/cli/v11/using-npm/scripts
- npm Docs, *config* (`ignore-scripts`, `allow-scripts`, `save-exact`).
  https://docs.npmjs.com/cli/v11/using-npm/config

## How it could be tested

**Test:** a validation task in a project where a popular library would be the
easy route.

**Script:** did it run an install command, grow the dependency list in
`package.json`, or import a package that isn't listed?
