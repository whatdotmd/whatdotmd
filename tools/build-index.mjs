#!/usr/bin/env node
// Builds index.json (repo root) from every entries/*.md file. Run by
// .github/workflows/build-index.yml on every push to main that touches
// entries/**. Deliberately dependency-free Node built-ins only (via
// entry-parser.mjs, its one sibling import) — this file gets copied into
// whatdotmd/whatdotmd at tools/build-index.mjs, a repo this one has no
// local checkout of, so no npm install step to rely on. Copy
// entry-parser.mjs alongside it at tools/entry-parser.mjs.
//
// The frontmatter shape parsed here must exactly match what
// src/lib/entryFilename.js's buildEntryFile() in the frontend repo writes —
// that's the single source of truth for the schema. See
// project/gh_backend/INDEX_BUILD.md for the full mechanism writeup.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { parseEntryFrontmatter } from './entry-parser.mjs'

const ENTRIES_DIR = 'entries'
const OUT_FILE = 'index.json'

function parseEntry(filename, raw) {
  const { slug, meta, content } = parseEntryFrontmatter(filename, raw)
  const submitted_at = execFileSync(
    'git',
    ['log', '-1', '--format=%aI', '--', `${ENTRIES_DIR}/${filename}`],
    { encoding: 'utf8' },
  ).trim()

  return {
    slug,
    author_github: meta.author_github,
    title: meta.title,
    kind: meta.kind,
    target: meta.target,
    tags: meta.tags ?? [],
    license: meta.license,
    optimised_for: meta.optimised_for,
    description: meta.description,
    content,
    submitted_at,
  }
}

function main() {
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith('.md')).sort()
  const entries = []
  for (const filename of files) {
    // Every real entry is "<slug>--<author_github>.md" — anything without
    // the separator (a misplaced copy of the contributor template, a
    // README, a .gitkeep-style stray file) is skipped rather than crashing
    // the whole build or leaking a bogus entry onto the live site.
    if (!filename.replace(/\.md$/, '').includes('--')) {
      console.warn(`Skipping ${filename}: doesn't match <slug>--<author_github>.md`)
      continue
    }
    try {
      const raw = readFileSync(`${ENTRIES_DIR}/${filename}`, 'utf8')
      entries.push(parseEntry(filename, raw))
    } catch (err) {
      console.warn(`Skipping ${filename}: ${err.message}`)
    }
  }
  writeFileSync(OUT_FILE, `${JSON.stringify(entries, null, 2)}\n`)
  console.log(`Wrote ${OUT_FILE} with ${entries.length} entries.`)
}

main()
