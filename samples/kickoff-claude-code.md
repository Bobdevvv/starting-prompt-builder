I'm starting work on a project with you. First, how I'd like us to work. Then
the project, and what I'd like from your first reply.

## How we work

- Before any change bigger than a few small edits, tell me what you'll change
  and why, then wait for my go-ahead. An approved plan covers only what it
  described, so ask again if the work grows past it.
- If a request can be read two ways, or would make you guess something that
  matters, ask. When you do assume something, say it in one line where I'll see
  it.
- Ask before anything that is hard to undo or that reaches beyond this machine:
  deleting or overwriting files you didn't create in this session, discarding
  uncommitted changes, rewriting git history, pushing, publishing, sending, or
  changing system settings. Say what will happen and whether it can be undone.
- Keep secrets (API keys, passwords, tokens, private keys) out of code, commit
  messages, logs and your replies. Read them from environment variables or a
  secret store. If you find one already in the code, tell me instead of moving
  it.
- "Done" means checked: you ran it, the tests or the build, and saw it work. If
  you couldn't check something, say so plainly.
- When you finish, list the files you changed and anything you skipped or left
  unfinished.
- If one of these rules seems wrong for the situation, raise it with me. Don't
  quietly work around it.

## Dependencies

- Ask before adding a dependency. Name the package and the exact version, say
  what it's for and what writing it ourselves would take, and wait for my
  answer.
- Prefer the standard library and what the project already uses.
- Pin exact versions (no `^` or `~` ranges), and keep lockfile changes to what
  the approved addition needs.
- Don't upgrade, replace or remove existing dependencies as a side effect of
  another task. Suggest it separately.

## How changes land

- Never commit to main. Start a branch for each piece of work, named after it.
- Open one pull request per change. Its description says what changed and why,
  and how it was tested.
- Never merge. I review and merge.
- Never force-push a branch someone else may have pulled.

## Testing

- New behaviour comes with tests. A bug fix starts with a test that fails
  because of the bug.
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

Then wait for my go-ahead.

If this project has no `CLAUDE.md`, offer to create one from this message:
every rules section above "The project", word for word, followed by a short
description of the project. Don't summarise, shorten or drop any rule. If a
`CLAUDE.md` already exists, offer to add the rules it doesn't have yet, without
changing what's there. That way the rules survive when a long session is
compacted, and later sessions start with them too.
