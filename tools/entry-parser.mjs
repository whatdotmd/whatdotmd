// Shared frontmatter parser for entries/<slug>--<author_github>.md, used by
// both tools/build-index.mjs and tools/lint/cli.js. Factored out so there's
// exactly one place that understands the schema on the CI side (the other
// side is src/lib/entryFilename.js's buildEntryFile() in the frontend repo —
// see project/gh_backend/INDEX_BUILD.md). Dependency-free (Node built-ins
// only), same reasoning as build-index.mjs: no npm install guaranteed before
// this runs.

function unquote(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"')
  }
  return trimmed
}

function parseTags(value) {
  const inner = value.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!inner.trim()) return []
  return inner.split(',').map((t) => t.trim())
}

// filename is "<slug>--<author_github>.md" — split on the LAST '--' since
// author_github can't contain one (GitHub usernames disallow consecutive
// hyphens) but a hand-edited slug conceivably could.
export function slugFromFilename(filename) {
  const base = filename.replace(/\.md$/, '')
  const idx = base.lastIndexOf('--')
  return idx === -1 ? base : base.slice(0, idx)
}

// Returns { slug, meta, content } — meta is the raw frontmatter block as a
// plain object, content is the markdown body below it. Throws on malformed
// frontmatter; callers decide whether to skip or fail on that.
export function parseEntryFrontmatter(filename, raw) {
  const lines = raw.split('\n')
  if (lines[0] !== '---') throw new Error(`${filename}: missing frontmatter opening ---`)
  const closeIdx = lines.indexOf('---', 1)
  if (closeIdx === -1) throw new Error(`${filename}: missing frontmatter closing ---`)

  const meta = {}
  for (const line of lines.slice(1, closeIdx)) {
    const sepIdx = line.indexOf(': ')
    if (sepIdx === -1) continue
    const key = line.slice(0, sepIdx).trim()
    const value = line.slice(sepIdx + 2)
    meta[key] = key === 'tags' ? parseTags(value) : unquote(value)
  }

  const content = lines.slice(closeIdx + 1).join('\n').trimEnd()
  return { slug: slugFromFilename(filename), meta, content }
}
