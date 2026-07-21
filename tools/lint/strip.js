// Markdown segmentation (build spec §3) — the most important correctness
// detail in the linter. A hand-rolled line scanner, deliberately not a full
// markdown AST: the failure mode of a scanner (occasional misclassification
// -> a stray warning) is acceptable, the failure mode of a heavy dependency
// is not.
//
// Produces an ordered list of { type, text, startLine, endLine } segments,
// type in prose | heading | list-item | code-block | inline-code |
// blockquote | html-comment. Inline code spans are carved out of their
// parent line into their own segment so REDUNDANT/VAGUE/CONTRADICTION never
// fire on text that's *inside* backticks, while DANGER (which scans every
// segment type) still sees the full line either way — the carve-out just
// splits it into two disjoint pieces instead of one.

const HEADING_RE = /^\s{0,3}#{1,6}\s+/
const LIST_ITEM_RE = /^\s*([-*+]|\d+[.)])\s+/
const BLOCKQUOTE_RE = /^\s*>/
const FENCE_RE = /^\s*(`{3,}|~{3,})/
const INLINE_CODE_RE = /`([^`\n]+)`/g

function lineType(line) {
  if (HEADING_RE.test(line)) return 'heading'
  if (LIST_ITEM_RE.test(line)) return 'list-item'
  if (BLOCKQUOTE_RE.test(line)) return 'blockquote'
  return 'prose'
}

export function segment(markdown) {
  const lines = markdown.split('\n')
  const segments = []

  let inFence = false
  let fenceMarker = null
  let fenceStart = 0
  let fenceLines = []

  let inComment = false
  let commentStart = 0
  let commentLines = []

  const flushFence = (endLine) => {
    segments.push({ type: 'code-block', text: fenceLines.join('\n'), startLine: fenceStart, endLine })
    fenceLines = []
  }
  const flushComment = (endLine) => {
    segments.push({ type: 'html-comment', text: commentLines.join('\n'), startLine: commentStart, endLine })
    commentLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    const line = lines[i]

    if (inFence) {
      fenceLines.push(line)
      const closeMatch = line.match(FENCE_RE)
      if (closeMatch && closeMatch[1][0] === fenceMarker) {
        inFence = false
        flushFence(lineNo)
      }
      continue
    }

    const openMatch = line.match(FENCE_RE)
    if (openMatch) {
      inFence = true
      fenceMarker = openMatch[1][0]
      fenceStart = lineNo
      fenceLines = [line]
      continue
    }

    if (inComment) {
      commentLines.push(line)
      if (line.includes('-->')) {
        inComment = false
        flushComment(lineNo)
      }
      continue
    }

    if (line.includes('<!--')) {
      const openIdx = line.indexOf('<!--')
      const closeIdx = line.indexOf('-->')
      if (closeIdx > openIdx) {
        segments.push({ type: 'html-comment', text: line, startLine: lineNo, endLine: lineNo })
      } else {
        inComment = true
        commentStart = lineNo
        commentLines = [line]
      }
      continue
    }

    if (line.trim() === '') continue // blank lines carry no analyzable text

    const type = lineType(line)

    // Carve inline code spans out of the line; whatever's left keeps the
    // line's structural type for style-rule matching.
    let lastIndex = 0
    let hasInlineCode = false
    let match
    INLINE_CODE_RE.lastIndex = 0
    while ((match = INLINE_CODE_RE.exec(line))) {
      hasInlineCode = true
      const before = line.slice(lastIndex, match.index)
      if (before.trim()) segments.push({ type, text: before, startLine: lineNo, endLine: lineNo })
      segments.push({ type: 'inline-code', text: match[1], startLine: lineNo, endLine: lineNo })
      lastIndex = match.index + match[0].length
    }
    if (hasInlineCode) {
      const rest = line.slice(lastIndex)
      if (rest.trim()) segments.push({ type, text: rest, startLine: lineNo, endLine: lineNo })
    } else {
      segments.push({ type, text: line, startLine: lineNo, endLine: lineNo })
    }
  }

  // Unterminated fence/comment at EOF: flush best-effort rather than drop.
  if (inFence) flushFence(lines.length)
  if (inComment) flushComment(lines.length)

  return segments
}
