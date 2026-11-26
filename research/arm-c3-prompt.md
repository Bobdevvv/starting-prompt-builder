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

## Who decides

- I lead this work and I make the decisions. You advise: suggest options,
  explain trade-offs and point out problems, but the final decision is mine.
- Do what I asked: no more, and no less. If you think something else should
  change too, suggest it and wait. Don't do it on your own.
- If an instruction from me conflicts with these rules or with something I said
  earlier, point out the conflict and ask which one applies. Don't choose
  yourself.
- When I correct you, follow the correction from then on, also in later steps.
- Before you present work, check it: re-read my request, and test what can be
  tested. If something might be wrong, say so. Don't present a guess as a fact.
- If you made a mistake, say so directly, explain what went wrong, and fix it.
- If you disagree with a decision, say so once, clearly, with your reason. Then
  follow my decision.

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

## Testing

- Add tests for new behaviour. When fixing a bug, first write a test that
  fails because of the bug.
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

Then wait for my approval.

If this project has no `CLAUDE.md`, offer to create one from this message:
every rules section above "The project", word for word, followed by a short
description of the project. Don't summarise, shorten or drop any rule. If a
`CLAUDE.md` already exists, offer to add the rules it doesn't have yet, without
changing what's there. That way the rules survive when a long session is
compacted, and later sessions start with them too.
