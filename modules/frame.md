---
id: frame
title: The text around the modules
targets: code, browser
---

# Frame

The kickoff prompt is: **Opening**, then each chosen module's rules under its
title as a `##` heading (the core's title is "How we work"), then
**The project**, then **Your first reply**. Text in `{braces}` is filled in by
the builder.

## Opening

I'm starting work on a project with you. First, how I'd like us to work. Then
the project, and what I'd like from your first reply.

## The project

- **What it is:** {what it is}
- **Built with:** {stack}
- **Where it stands:** {where it stands}
- **This session's goal:** {goal}

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

## Your first reply in the browser

Don't write any code yet. In your first reply:
- summarise the project and this session's goal in your own words;
- list anything that's unclear;
- propose the first step.

Then wait for my go-ahead.

## Why

**The first reply is a plan, not work,** so a misunderstanding costs one
message, not a session.

**The `CLAUDE.md` offer:** in Claude Code, instructions given only in the chat
can be lost when a long session is compacted, while the project's `CLAUDE.md`
is re-read from disk. "Word for word" matters because a summary is where rules
quietly get dropped or softened. The browser has no `CLAUDE.md`. There, the same
text can go into a claude.ai Project's instructions.

## Sources

- Claude Code Docs, *Memory* ("Instructions seem lost after `/compact`").
  https://code.claude.com/docs/en/memory
