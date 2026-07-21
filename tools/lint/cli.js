#!/usr/bin/env node
// Runs the lint rule engine (index.js/rules/rules-config, all ported
// verbatim from the frontend repo's src/lib/lint/ — see
// project/PROGRESS.md's "Live linter/token-count feedback" entry for what
// that engine does and why the wizard and CI must never diverge on it) over
// a list of entry filenames given as argv. Prints one JSON report to stdout
// — { results: [...], blocked: bool } — and exits non-zero if any file has
// a 'block'-severity finding, so the PR check goes red.
//
// Usage: node cli.js entries/foo--bar.md entries/baz--qux.md
// Called by .github/workflows/pr-check.yml with the entries/*.md files
// changed in the PR (see that file for how the list is computed).

import { readFileSync } from 'node:fs'
import { parseEntryFrontmatter } from '../entry-parser.mjs'
import { lintEntry } from './index.js'
import { lintConfigs } from './load.js'

function main(filenames) {
  if (filenames.length === 0) {
    console.log(JSON.stringify({ results: [], blocked: false }))
    return
  }

  const results = []
  for (const path of filenames) {
    const filename = path.split('/').pop()
    let raw
    try {
      raw = readFileSync(path, 'utf8')
    } catch {
      // File was deleted in this PR (a rename/removal shows up in the diff
      // too) — nothing to lint.
      continue
    }

    let parsed
    try {
      parsed = parseEntryFrontmatter(filename, raw)
    } catch (err) {
      results.push({
        path,
        findings: [{
          ruleId: 'SCHEMA',
          severity: 'block',
          message: err.message,
        }],
        blocked: true,
      })
      continue
    }

    const { meta, content } = parsed
    const { tokens, findings, blocked } = lintEntry(content, { kind: meta.kind }, lintConfigs)
    results.push({ path, tokens, findings, blocked })
  }

  const blocked = results.some((r) => r.blocked)
  console.log(JSON.stringify({ results, blocked }, null, 2))
  process.exitCode = blocked ? 1 : 0
}

main(process.argv.slice(2))
