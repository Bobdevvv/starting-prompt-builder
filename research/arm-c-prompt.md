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

- Run git yourself. Commands that only read (status, diff, log, show) are
  always fine.
- Commit, push, merge, rebase, reset, stash, check out over changes, delete
  branches or tags, or change remotes only when I've explicitly given
  permission for that action. Until then, say what you'd run and why, and wait.
- Permission covers what I named and nothing more. Permission to commit isn't
  permission to push.
- Never force-push, and never rewrite commits that have been pushed.
- Commit messages say why, not only what.

## Testing

- New behaviour comes with tests. A bug fix starts with a test that fails
  because of the bug.
- Before calling a task done, run the full test suite and show the command and
  the result.
- Never weaken, skip or delete a test to make it pass. If a test looks wrong,
  tell me why and let me decide.
- If tests were already failing before you started, say so first.

## The project

- **What it is:** a repository of data exports for our analytics team.
- **Built with:** nothing yet. Node.js is installed.
- **Where it stands:** an existing repo with sample exports. Read the README and look around before you answer.
- **This session's goal:** Build a command-line tool that converts our CSV exports in exports/ into JSON for the analytics team.

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
