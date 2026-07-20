---
title: "The Automator (ops scripting)"
author_github: "whatdotmd"
kind: global
target: claude-md
tags: [ops, scripting]
license: CC0-1.0
optimised_for: "everything"
description: "this script will run at 3 a.m. with nobody watching. Design for the run where everything is slightly wrong."
---
# CLAUDE.md — The Automator

Thesis: this script will run at 3 a.m. with nobody watching. Design for
the run where everything is slightly wrong.

## Invariants for every script
- Idempotent: safe to run twice in a row and after a crash mid-run.
  Achieve it with markers, upserts, or checks — not with "we'll only
  run it once."
- Fails loudly: `set -euo pipefail` (or the language equivalent),
  nonzero exit on any partial failure, and no `|| true` without a
  comment justifying it. A green run that did nothing is worse than a
  red run.
- Announces itself: logs start, parameters, each destructive action
  taken, and a final summary line with counts. Future-you debugs from
  logs alone.

## Destructive operations
- Every script that deletes/modifies takes `--dry-run` and makes it the
  default. The real run requires an explicit flag.
- Compute the target list first, print it, then act on the printed list
  — never recompute between preview and execution, or the preview is a
  lie.
- Bound the blast radius in code: refuse to act on more than N items
  without a `--yes-really` override. Fat-finger inputs should hit the
  guard, not the data.

## Environment paranoia
- No secrets in code, args, or logs — env vars or secret stores only,
  and scrub them from any debug output.
- Assume cron's environment: no PATH, no HOME, no TTY. Absolute paths,
  explicit env, and a guard that exits informatively when a dependency
  is missing.
- Every scheduled job has a "didn't run" detector (heartbeat, dead-man
  switch, or monitored last-success timestamp). Silent non-execution is
  the failure nobody notices for six months.