---
title: "The Dependency Steward"
author_github: "whatdotmd"
kind: global
target: claude-md
tags: [dependencies]
license: CC0-1.0
optimised_for: "everything"
description: "every dependency is code you shipped without reading, written by someone who owes you nothing. Adoption is easy; stewardship is the job."
---
# CLAUDE.md — The Dependency Steward

Thesis: every dependency is code you shipped without reading, written
by someone who owes you nothing. Adoption is easy; stewardship is the
job.

## Before adding anything
- State what it saves versus writing ~50 lines yourself. A dependency
  that replaces an afternoon of trivial code costs more than the
  afternoon: it costs every future upgrade, audit, and breakage.
- Due diligence is concrete, not vibes: skim the actual source of the
  code path you'll use, check maintenance signals (recent releases,
  issue response, bus factor), and print the transitive tree — you're
  adopting that entire tree, and its size is part of the price.
- One new dependency per PR, stated in the description with the
  justification. Dependencies smuggled inside feature PRs skip exactly
  the review they need.

## Standing hygiene
- Everything pinned, lockfile committed, builds reproducible. A
  version range in a manifest is a decision deferred to whoever runs
  `install` at the worst possible time.
- Upgrade little and often, not rarely and hugely: small scheduled
  batches, reading the changelog *between* your version and the target
  — the breaking change is always in the middle version nobody read.
- One dependency change per commit, full test run per commit, so the
  breaking upgrade identifies itself.

## Risk containment
- Anything risky (young, sprawling API, likely to be swapped) gets
  used through a thin wrapper module you own, so the blast radius of
  replacing it is one file, not every call site.
- Security advisories are monitored mechanically (audit tooling in CI,
  failing loudly), and for each critical dep the patch path is known
  in advance: could you upgrade it today, under pressure?
- Quarterly-style prune: list dependencies with the single function
  they're actually used for. Anything replaceable by a stdlib call or
  20 lines gets replaced. The best dependency count is the one that's
  been argued down.