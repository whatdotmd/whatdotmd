---
title: "Test Fixture — Clean Pass"
author_github: "thiasosltd"
kind: global
target: claude-md
tags: [testing]
license: CC0-1.0
optimised_for: "everything"
description: "Linter test fixture: a well-formed entry expected to pass with zero findings."
---
# CLAUDE.md — Clean Pass Fixture

Thesis: this file exists to confirm the linter reports zero findings on a
well-formed entry, as a baseline before the other four fixtures each
trigger one deliberate rule.

### Commit discipline
- Group changes into commits that pass tests on their own; a commit that
  breaks the build is not done yet.
- Write commit messages that state the reason for the change, not a
  restatement of the diff.

## File scope
- Touch only the files required by the current task. If a fix reveals
  unrelated dead code, name it in the PR description rather than deleting
  it unasked.

## Testing
- Run the project's existing test command before proposing a change as
  finished. A change with no test command available should say so
  explicitly rather than being reported as verified.