<!--
  whatdotmd entry template — for contributing directly on GitHub, without
  going through the whatdotmd.org /submit wizard.

  How to use this:
  1. Copy this file to entries/<slug>--<your-github-username>.md
       - <slug> = your title, lowercase, non-alphanumeric runs collapsed to
         single hyphens (e.g. "The Planner" -> "the-planner"). No folder —
         this is a single flat file.
       - <your-github-username> is literally your GitHub username, exactly
         as it appears in your profile URL.
       - Example: entries/the-planner--octocat.md
  2. Delete this instructional comment block and everything below it up to
     (not including) the "---" line — your real file must start with "---"
     on its very first line, or the index build will reject it.
  3. Fill in every field below. Every field is required.
  4. Replace this comment's placeholder content with your actual CLAUDE.md /
     AGENTS.md ground rules, below the closing "---".
  5. Open a pull request. A maintainer reviews it before it's merged; once
     merged, the build-index Action picks it up automatically (see
     project/gh_backend/INDEX_BUILD.md) and it appears on whatdotmd.org.

  Field reference:
  - title:          Free text, quoted.
  - author_github:  Your GitHub username, quoted — must match the
                     "--<username>" suffix on the filename exactly.
  - kind:            one of: global | preamble | section | project-template
  - target:          one of: claude-md | agents-md | universal
  - tags:            flow list, e.g. [planning, process] — lowercase,
                     hyphenated if multi-word, 1-6 tags.
  - license:         fixed at CC0-1.0 — do not change.
  - optimised_for:   free text, quoted, e.g. "Claude Code" or "everything"
                     if it's not tuned for a specific tool.
  - description:     free text, quoted, 20-240 characters — this is the
                     one-line summary shown on Browse cards.
-->
---
title: "Your entry title"
author_github: "your-github-username"
kind: global
target: claude-md
tags: [tag-one, tag-two]
license: CC0-1.0
optimised_for: "Claude Code"
description: "One sentence, 20-240 characters, shown on Browse cards."
---

# CLAUDE.md — Your entry title

Thesis: one sentence stating the dominant priority this file encodes.

## Section heading
- A rule or trigger, not an aspiration — something that changes what the
  agent would otherwise do.
