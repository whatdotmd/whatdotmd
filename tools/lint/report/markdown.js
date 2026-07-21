// Formats cli.js's JSON report as a PR comment body. Kept separate from
// post-comment.mjs so the formatting logic can be unit-tested without
// mocking the GitHub API.

const MARKER = '<!-- whatdotmd-lint-report -->'

const SEVERITY_ICON = { block: '🛑', warn: '⚠️' }

function findingLine(f) {
  const icon = SEVERITY_ICON[f.severity] ?? '•'
  const where = f.line ? ` (line ${f.line})` : ''
  return `- ${icon} **${f.ruleId}**${where}: ${f.message}`
}

export function formatReport({ results, blocked }) {
  const lines = [MARKER]

  if (results.length === 0) {
    lines.push('No `entries/*.md` changes to lint in this PR.')
    return lines.join('\n')
  }

  lines.push(
    blocked
      ? '### 🛑 Entry linter: blocked'
      : results.some((r) => r.findings?.length)
        ? '### ⚠️ Entry linter: warnings'
        : '### ✅ Entry linter: clean',
  )

  for (const r of results) {
    lines.push('', `**${r.path}**${r.tokens ? ` — ~${r.tokens.tokens} tokens` : ''}`)
    if (!r.findings || r.findings.length === 0) {
      lines.push('No findings.')
      continue
    }
    for (const f of r.findings) lines.push(findingLine(f))
  }

  if (blocked) {
    lines.push(
      '',
      '🛑 findings require a human review before merge (see `/security` on the site) — this is not an automatic permanent block.',
    )
  }

  return lines.join('\n')
}

export { MARKER }
