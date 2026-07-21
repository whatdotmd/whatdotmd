// Token counting (build spec §5). Counts the RAW entry.md, pre-strip — the
// agent reading the file pays for every character, code blocks and comments
// included, so this is deliberately independent of strip.js segmentation.
import { countTokens } from 'gpt-tokenizer/encoding/cl100k_base'

const HEURISTIC_CHARS_PER_TOKEN = 3.6
const HEADING_RE = /^(#{1,6})\s+(.*)$/

function countText(text) {
  if (!text) return { tokens: 0, method: 'tiktoken-cl100k' }
  try {
    return { tokens: countTokens(text), method: 'tiktoken-cl100k' }
  } catch {
    // Never fail the run because token counting failed (spec §1) — degrade
    // to a heuristic and say so; this only happens on disallowed special
    // tokenizer strings (e.g. a literal "<|endoftext|>") appearing in input.
    return { tokens: Math.ceil(text.length / HEURISTIC_CHARS_PER_TOKEN), method: 'heuristic' }
  }
}

// Splits into sections keyed by the document's top-level heading depth (the
// shallowest heading level present), so nested subheadings roll up into
// their nearest top-level ancestor. Content before the first heading is
// dropped from the breakdown (still counted in the total).
function splitTopLevelSections(markdown) {
  const lines = markdown.split('\n')
  const headingLevels = lines
    .map((line) => line.match(HEADING_RE))
    .filter(Boolean)
    .map((m) => m[1].length)
  if (headingLevels.length === 0) return []

  const topLevel = Math.min(...headingLevels)
  const sections = []
  let current = null

  for (const line of lines) {
    const match = line.match(HEADING_RE)
    if (match && match[1].length === topLevel) {
      if (current) sections.push(current)
      current = { heading: match[2].trim(), lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}

// Returns { tokens, method, label, perSection } per spec §5/§7.1.
export function countEntryTokens(markdown) {
  const total = countText(markdown)
  const perSection = {}
  for (const { heading, lines } of splitTopLevelSections(markdown)) {
    perSection[heading] = countText(lines.join('\n')).tokens
  }
  return { tokens: total.tokens, method: total.method, label: 'approx.', perSection }
}
