---
title: "General project management: documentation before implementation"
author_github: "howdood"
kind: global
target: claude-md
tags: [product, process, documentation]
license: CC0-1.0
optimised_for: "Claude Code"
description: "General project management: documentation-before-implementation always"
---
# End to end project

## Ground rules - approach

- Be token-savvy: you are the most expensive model available. Use lower-order sub-agents (Sonnett, Haiku) for anything that can be achieved accurately by a lower-order model; at the same time don't spin up more than two at any time to avoid hitting the five-hour usage limit.
- Remember that long sessions cost more. Pause and prompt the user (me) to clear the context window at intervals: i.e at any point where the context is costing more in tokens than it's adding in understanding.
- Read the docs, maintain the docs. Where I am genuinely unsure or keen for more input I have marked sections or lines with ?
- Plan before executing
- Ask for clarification / approval where unsure
- Don't assume success. Set clear measurable goals, test / verify, and iterate until right.
- Never assume you are smarter than me. When I want you to red-team something I will say so.
- Don't push back on decisions already made unless there is a significant technical or legal issue - ask yourself, is this a hill I would die on, or a personal preference that I should subordinate to the user's better judgement?
- Minimum code that does the work. No extra features not pre-agreed in the docs. If we need more, ask / approve / update docs before implementing - NB this doesn't apply to the deliberately under-specced frontend. You can be creative there.
- If your changes make content obselete, flag and seek approval before deleting.
- Code must be human-readable. Use comments regularly to answer the question 'what does this function / block actually do?'
- While in development and testing, push frequently to git main. We are currently in: development.
- Use the documentation in project/ as your second brain / memory - but keep it human-readable.
- When doing front-end fixes on visual issues, pause and ask the user to verify - don't use tokens on visual verification from within the terminal
- When working with AWS CLI or advising on AWS console use, ensure you have read the latest documentation first - it's probably changed. Store non-obvious / critical info in docs/maintainer/AWS.md for subsequent reference.
- When planning as a more advanced model, ensure that the agreed steps for execution are written into TODO.md so that a future subagent can follow them without error or ambiguity.

## Overview

This project is a <what>. Its production implementation is a database, a thin serverless API (API Gateway + Lambda — see project/backend/ARCHITECTURE.md), and a web frontend. Detailed specification for each element is linked below.

## Non-negotiables - do not challenge any of these

- The scope and aim of the project are clear. Don't push back with suggestions about how to make it more useful for the end user.
- No individual's data will be used in testing and development; once in production, data held in the production database is covered by UK GDPR and may never be accessed by any AI.
- AWS for hosting; all data held in UK
- Frontend react + Vite + tailwind
- Data security is a priority, but user management (2fa and password resets etc) delegated to client data manager: central user management will be adding data manager accounts; from a client's point of view they should be running their own tenancy within the platform with minimal need to reach out for support.
- For anything touching the AWS backend: write a bash script for me to review and run in server_scripts. **never complete AWS CLI actions for me**

## Documentation
** ensure these are updated as you go. Any folder with more than three files in it needs an INDEX.md (one line per file) - see the INDEX.md in methodology/ for an example **
** default to more and smaller files in each folder. Don't put lots of info in any single large file **
- project/TODO.md : main project progress tracker. The first thing to read in any session
- project/PROGRESS.md : not appropriate to use TODO.md as a logger of every issue. Once a top-level item is marked as complete, migrate the full description here and just leave the first sentence of the item checked in TODO.
- docs/user : read-me for the end user. Not a priority; can be created later.
- docs/maintainer : technical guides for any humans running the project. Need to be updated as we build
- project/frontend/ : UX, page navigation, style guides, branding
- project/backend/ : database specification, user roles etc
- project/methodology/ : information about how we handle the data