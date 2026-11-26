I'm starting work on a project with you. Below are the rules I'd like us to
work by, a short description of the project, and what I'd like in your first
reply.

## How we work

- Before any change bigger than a few small edits, tell me what you'll change
  and why, then wait for my approval. My approval covers only the plan you
  described. If the work grows beyond it, ask again.
- If a request can be read in more than one way, or would make you guess
  something important, ask. If you do make an assumption, state it in one line
  in your reply.
- Ask before doing anything that is hard to undo or that affects anything
  outside this computer: deleting or overwriting files you didn't create in
  this session, discarding uncommitted changes, rewriting git history, pushing,
  publishing, sending messages, or changing system settings. Tell me what will
  happen and whether it can be undone.
- Keep secrets (API keys, passwords, tokens, private keys) out of code, commit
  messages, logs and your replies. Read them from environment variables or a
  secret store. If you find a secret already in the code, tell me. Don't move
  it somewhere else.
- Only call something done after you have checked it: run the code, the tests
  or the build, and see it work. If you couldn't check something, say so
  clearly.
- When you finish, list the files you changed, and anything you skipped or
  left unfinished.
- If one of these rules seems wrong for the situation, tell me. Don't quietly
  work around it.

## Dependencies

- Ask before adding a dependency. Name the package and the exact version,
  explain what it's for and how much work it would be to write it ourselves,
  and wait for my answer.
- Prefer the standard library and what the project already uses.
- Pin exact versions (no `^` or `~` ranges). Change the lockfile only as much
  as the approved package requires.
- Don't upgrade, replace or remove existing dependencies as part of another
  task. Suggest it as a separate change.

## Git

- Never commit to main. Start a branch for each piece of work, named after it.
- Open one pull request per change. Its description says what changed and why,
  and how it was tested.
- Never merge. I review and merge.
- Never force-push a branch someone else may have pulled.

## Testing

- Add tests for new behaviour. When fixing a bug, first write a test that
  fails because of the bug.
- Before calling a task done, run the full test suite and show the command and
  the result.
- Never weaken, skip or delete a test to make it pass. If a test looks wrong,
  tell me why and let me decide.
- If tests were already failing before you started, say so first.

## Public repository

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

## Accessibility

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

## Size and speed budgets

- Respect the project's budgets (for example a maximum JavaScript size, or a
  minimum Lighthouse performance score). If there aren't any yet, propose
  numbers before the first feature.
- Measure what changes, before and after, when a change adds code, assets or
  requests. Report the numbers, not an impression.
- If a change would go over a budget, stop and report the measured size.
  Raising a budget is my decision, and trimming quality quietly to fit is not
  the answer.
- Load code only where it's used. A page that doesn't need a feature shouldn't
  download it.

## The project

- **What it is:** a habit tracker that runs in the browser and keeps its data on the device.
- **Built with:** TypeScript and Vite.
- **Where it stands:** an existing repo. Read the README and look around before you answer.
- **This session's goal:** add a weekly overview screen.

## Your first reply

Don't change anything yet. In your first reply:
- summarise the project and this session's goal in your own words;
- list anything that's unclear;
- propose the first step.

Then wait for my approval.

If this project has no `CLAUDE.md`, offer to create one from this message:
every rules section above "The project", word for word, followed by a short
description of the project. Don't summarise, shorten or drop any rule. If a
`CLAUDE.md` already exists, offer to add the rules it doesn't have yet, without
changing what's there. That way the rules survive when a long session is
compacted, and later sessions start with them too.
