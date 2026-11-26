# Modules

Each file is one module. The **core** goes into every prompt. Every other module
is switched on by the questions below, and can then be adjusted by hand.

You can use these without the builder: copy the **Rules** of the modules you
want into the first message of a session.

## Format

```
---
id:         short name, used in links and in the builder
title:      what the builder shows
question:   what switches it on (none for the core)
targets:    code, browser, or both: where it applies
variants:   only for modules that offer a choice; pick exactly one
conflicts:  modules it clashes with, and what happens
---
```

Then these sections:

| section | goes into the prompt? | purpose |
|---|---|---|
| **Prevents** | no | the failure this module exists to stop |
| **Rules** (or **Rules: variant**) | yes | for Claude Code |
| **Rules in the browser** | yes | for claude.ai, where Claude cannot run commands or read your files. If missing, **Rules** is used as is. |
| **Why these rules** | no | the reasoning, for the person choosing |
| **How it could be tested** | no | an action that would show the rule being broken, and whether a script could detect it |

## Writing rules that get followed

- **Give the reason when it isn't obvious.** Anthropic's prompting guide:
  explaining the motivation behind an instruction helps, and "Claude can
  generalize from the explanation".
- **Say what to do, not only what to avoid.** The same guide recommends this for
  formatting ("Tell Claude what to do instead of what not to do"). We apply it
  more widely as a judgement call: "read secrets from the environment" leaves
  less to invent than "don't hardcode secrets".
- **Calm wording.** The guide says recent Claude models respond more strongly to
  the system prompt, and that aggressive wording written for older models can
  now make them over-trigger. "The fix is to soften any aggressive language."
  Claude Code's best-practices guide adds that if Claude keeps ignoring a line,
  "adding IMPORTANT probably won't fix it".
- **Short.** Claude Code's memory guide recommends keeping a `CLAUDE.md` under
  200 lines, because "longer files consume more context and reduce adherence".
  The best-practices guide: every line "takes a little of Claude's attention on
  every task, whether it's relevant or not."

### Sources

- Anthropic, *Prompting best practices*.
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Claude Code Docs, *Memory* (CLAUDE.md).
  https://code.claude.com/docs/en/memory
- Claude Code Docs, *Best practices*.
  https://code.claude.com/docs/en/best-practices

## The questions

### Step 1: four quick questions

These decide most of the prompt.

| question | answers | what it changes |
|---|---|---|
| **Where will you start the session?** | Claude Code / another coding agent / a chat in the browser | Which version of each rule is used. Coding agents all get the same rules; Claude Code is offered a `CLAUDE.md`, other agents an `AGENTS.md`. Modules that only apply to coding agents (`git-workflow`, `work-log`, `local-machine`) are left out in the browser. |
| **How strict should security be?** | Standard / Strict | **Strict:** `dependencies` becomes strict, and `supply-chain`, `secrets-strict` and `local-machine` are added. |
| **How much structure should Claude follow?** | Light / Thorough | **Thorough:** `testing` becomes strict-gate, `work-log` becomes full, and `code-clarity` is added. |
| **Who will use what you're building?** | Only me / Other people too | **Other people too:** `testing` is added, plus `accessibility` and `budgets` if it has an interface. This is about the people who use the result, not about who can see the code (that is the public-repository question). |

### Step 2: facts about the project

Each fact adds one module. A fact is only asked if step 1 hasn't already
decided it.

| question | module |
|---|---|
| It uses third-party packages. | `dependencies` (the security answer picks the variant) |
| Who handles git? Claude, asking before commits and pushes / Claude, committing straight to main / Claude, through branches and pull requests / I do. | `git-workflow` (the answer picks the variant) |
| It has, or should have, automated tests. | `testing` (the structure answer picks the variant) |
| The repository is public, or will be. | `public-repo` |
| It has an interface that people use. | `accessibility` |
| It handles data about the people who use it, such as accounts, payments or IP addresses in logs. It promises them they aren't tracked. | `user-data` (privacy-first if both apply) |
| It gets deployed, or runs on a server. | `deploy-ops` |
| I'll work on it over many sessions. | `work-log` (the structure answer picks the variant) |
| I want to learn along the way, not only get results. | `explain-as-you-go` |
| It has documentation or other text that people read. | `writing` |

### Advanced: fine-tune the rules

Every module and variant can be switched on or off by hand. Anything changed
here overrides the answers above. The builder shows the prompt's length as you
go, and warns when two choices conflict (for example, committing straight to
main on a project that gets deployed).

## The modules

`frame.md` holds the text around the modules: the opening, the project fields,
and "Your first reply". `scripts/assemble-prompt.mjs` puts a prompt together
from a profile, and the samples are generated with it.

| module | variants | targets |
|---|---|---|
| `core` | none | both |
| `dependencies` | ask-first, strict | both |
| `supply-chain` | none | both |
| `secrets-strict` | none | both |
| `local-machine` | none | Claude Code |
| `git-workflow` | with-permission, main, pull-requests, hands-off | Claude Code |
| `testing` | standard, strict-gate | both |
| `work-log` | light, full | Claude Code |
| `code-clarity` | none | both |
| `public-repo` | none | both |
| `accessibility` | none | both |
| `user-data` | standard, privacy-first | both |
| `deploy-ops` | none | both |
| `budgets` | none | both |
| `explain-as-you-go` | none | both |
| `writing` | none | both |
