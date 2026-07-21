#!/usr/bin/env node
// Orchestrator behind the issue-ops submission model: turns an
// entry-submission issue into a linted PR, or a changes-requested comment if
// it doesn't pass. Run by .github/workflows/entry-submission.yml on
// `issues: [opened, edited]`, gated on the entry-submission label. Full
// design and trust model: project/gh_backend/ISSUE_SUBMISSION.md.
//
// Dependency-free (Node built-ins + the `gh` CLI, which every GitHub-hosted
// runner ships with, only) — same constraint as tools/build-index.mjs, since
// there's no npm install step guaranteed before an issue-triggered workflow
// runs.
//
// Reads ISSUE_BODY/ISSUE_NUMBER/ISSUE_AUTHOR/GITHUB_TOKEN/GITHUB_REPOSITORY
// from process.env — never from a `run:` shell interpolation. ISSUE_BODY is
// attacker-controlled text; every downstream operation on it here is plain
// string/regex work, no eval, no shell string-building (gh/git are invoked
// via execFileSync with an argv array, not a shell command line, so nothing
// in ISSUE_BODY can break out of its argument even if it ends up in one).

import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'

import { parseEntryFrontmatter } from './entry-parser.mjs'
import { formatReport } from './lint/report/markdown.js'

const ENTRIES_DIR = 'entries'
const CHANGES_REQUESTED_LABEL = 'entry-changes-requested'
const PR_OPENED_LABEL = 'entry-pr-opened'

// Matched parity pair with the frontend wizard's buildIssueBody()
// (src/lib/entrySubmission.js in the frontend repo). Same sentinel strings,
// same fence-stripping rule — change one, change both.
const SENTINEL_START = '<!-- whatdotmd:entry-file:start -->'
const SENTINEL_END = '<!-- whatdotmd:entry-file:end -->'

// Inverse of buildIssueBody(): pulls the text between the sentinels, then
// strips a leading/trailing backtick-fence line if present (the fence may
// carry a "markdown" language tag, so this checks only the leading
// backticks of the line, not the whole thing). Returns null if the
// sentinels are missing or out of order — a submitter mangled them, or this
// isn't a wizard-shaped submission at all.
function extractEntryFile(issueBody) {
  const startIdx = issueBody.indexOf(SENTINEL_START)
  const endIdx = issueBody.indexOf(SENTINEL_END)
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null

  const inner = issueBody.slice(startIdx + SENTINEL_START.length, endIdx)
  const lines = inner.split('\n')
  while (lines.length && lines[0].trim() === '') lines.shift()
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  if (lines.length && /^`{3,}/.test(lines[0])) lines.shift()
  if (lines.length && /^`{3,}/.test(lines[lines.length - 1])) lines.pop()
  return lines.length ? lines.join('\n') : null
}

// Ported from the frontend's src/lib/entryFilename.js — tiny pure
// functions, kept in parity there rather than reimplemented differently.
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeUsername(raw) {
  return String(raw).trim().replace(/[^a-zA-Z0-9-]/g, '')
}

// Rewrites the author_github: frontmatter line to the verified issue-opener
// login. The wizard-typed username is only ever a first draft — the issue
// opener is authoritative (see ISSUE_SUBMISSION.md's attribution section).
// A line-based rewrite, not a general YAML edit, matching entry-parser.mjs's
// own "just enough for this fixed schema" approach.
function overrideAuthor(rawFile, author) {
  const lines = rawFile.split('\n')
  const idx = lines.findIndex((l) => l.startsWith('author_github:'))
  const rewritten = `author_github: "${author}"`
  if (idx === -1) {
    // Missing entirely (a hand-edited issue that dropped the line) — insert
    // right after the opening --- so the frontmatter block still parses.
    lines.splice(1, 0, rewritten)
  } else {
    lines[idx] = rewritten
  }
  return lines.join('\n')
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' })
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function commentOnIssue(issueNumber, body) {
  gh(['issue', 'comment', String(issueNumber), '--body', body])
}

function setLabel(issueNumber, label) {
  gh(['issue', 'edit', String(issueNumber), '--add-label', label])
}

// Best-effort: removing a label that isn't currently set is not an error
// worth failing the whole run over.
function clearLabel(issueNumber, label) {
  try {
    gh(['issue', 'edit', String(issueNumber), '--remove-label', label])
  } catch {
    // ignore
  }
}

function main() {
  const { ISSUE_BODY, ISSUE_NUMBER, ISSUE_AUTHOR } = process.env
  if (!ISSUE_BODY || !ISSUE_NUMBER || !ISSUE_AUTHOR) {
    console.error('Missing ISSUE_BODY/ISSUE_NUMBER/ISSUE_AUTHOR in env — nothing to do.')
    process.exitCode = 1
    return
  }

  // 1. Pull the entry file out of the issue body.
  const rawEntry = extractEntryFile(ISSUE_BODY)
  if (!rawEntry) {
    commentOnIssue(
      ISSUE_NUMBER,
      "couldn't find the entry payload — keep the `<!-- whatdotmd:entry-file -->` markers intact",
    )
    return // not a workflow failure — a malformed/edited-away payload is expected user error
  }

  // 2. Verified attribution overrides whatever the wizard/typed username said.
  const author = sanitizeUsername(ISSUE_AUTHOR)
  const correctedEntry = overrideAuthor(rawEntry, author)

  // 3. Parse frontmatter (post-override) to derive the filename the same
  // way build-index.mjs/lint/cli.js do.
  let meta
  try {
    ;({ meta } = parseEntryFrontmatter('issue-payload.md', correctedEntry))
  } catch (err) {
    commentOnIssue(ISSUE_NUMBER, `couldn't parse the entry frontmatter: ${err.message}`)
    setLabel(ISSUE_NUMBER, CHANGES_REQUESTED_LABEL)
    return
  }

  // 4. Derive entries/<slug>--<author>.md, bumping -2/-3 only on a real
  // collision. This checkout is main's own working tree (our own submission
  // hasn't merged yet, so it can never appear here) — any existing file at
  // this path is necessarily a different, already-live entry, never this
  // same issue re-processing itself on an edit.
  const baseSlug = slugify(meta.title ?? '')
  let slug = baseSlug
  let bump = 2
  while (existsSync(`${ENTRIES_DIR}/${slug}--${author}.md`)) {
    slug = `${baseSlug}-${bump}`
    bump += 1
  }
  const entryPath = `${ENTRIES_DIR}/${slug}--${author}.md`
  writeFileSync(entryPath, correctedEntry)

  // 5. Lint via the same CLI + rule engine PR-check uses — not a
  // reimplementation. cli.js exits 1 when blocked but still prints its JSON
  // report to stdout, so a non-zero exit is expected and we read err.stdout.
  // It only exits WITHOUT valid JSON if the lint process itself crashed
  // (e.g. deps not installed) — an infra failure to surface loudly, not
  // swallow into an opaque JSON.parse error on the maintainer.
  let reportRaw
  try {
    reportRaw = execFileSync('node', ['tools/lint/cli.js', entryPath], { encoding: 'utf8' })
  } catch (err) {
    reportRaw = err.stdout ?? ''
  }
  let report
  try {
    report = JSON.parse(reportRaw)
  } catch {
    throw new Error(
      'lint subprocess produced no parseable report — it likely failed to run ' +
        "(is `npm ci` running before this step, and tools/lint present?). " +
        `Raw output: ${JSON.stringify(reportRaw).slice(0, 300)}`,
    )
  }

  if (report.blocked) {
    commentOnIssue(ISSUE_NUMBER, formatReport(report))
    setLabel(ISSUE_NUMBER, CHANGES_REQUESTED_LABEL)
    return // no PR — the submitter edits the issue, which re-triggers this
  }

  // 6. Clean/warn: commit to a deterministic branch (per-issue, not
  // per-commit) so a subsequent edit updates the same PR instead of
  // spawning a duplicate. Rebuilt fresh from main's current tip every run —
  // a stale file from an earlier edit (e.g. the title changed, so the slug
  // did too) never lingers, since the branch isn't incrementally amended,
  // it's recreated from main and force-pushed each time.
  const branch = `submission/issue-${ISSUE_NUMBER}`
  git(['checkout', '-b', branch])
  git(['add', entryPath])
  git([
    '-c',
    'user.name=github-actions[bot]',
    '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit',
    '-m',
    `entry: ${slug}--${author} (closes #${ISSUE_NUMBER})`,
  ])
  git(['push', '--force', 'origin', `HEAD:refs/heads/${branch}`])

  // Reuse an already-open PR on this branch if this is a re-run after an
  // edit; the force-push above already carried the new commit to it.
  const existingPrs = JSON.parse(gh(['pr', 'list', '--head', branch, '--state', 'open', '--json', 'url', '--limit', '1']))
  const prBody = [
    `Closes #${ISSUE_NUMBER}`,
    '',
    `**${meta.title}** — kind: \`${meta.kind}\`, target: \`${meta.target}\`, by @${author}`,
    meta.description ? '' : null,
    meta.description ?? '',
    '',
    formatReport(report),
  ]
    .filter((line) => line !== null)
    .join('\n')

  const prUrl = existingPrs.length
    ? existingPrs[0].url
    : gh(['pr', 'create', '--title', `Add entry: ${meta.title}`, '--body', prBody, '--head', branch, '--base', 'main']).trim()

  commentOnIssue(ISSUE_NUMBER, `${formatReport(report)}\n\n✅ Opened ${prUrl} — a maintainer will review it.`)
  setLabel(ISSUE_NUMBER, PR_OPENED_LABEL)
  clearLabel(ISSUE_NUMBER, CHANGES_REQUESTED_LABEL)
}

main()
