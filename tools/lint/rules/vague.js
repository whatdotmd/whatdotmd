// VAGUE (warn) — unenforceable directives. Build spec §6.2.
// Config: rules-config/vague.yaml.
import { compilePhrase, excerpt } from './match.js'

export const id = 'VAGUE'
export const severity = 'warn'

const VISIBLE_TYPES = new Set(['prose', 'heading', 'list-item', 'blockquote'])

// Suppression heuristic (spec §6.2): a concrete operator on the same line —
// always/never/before/after/unless, a file path, or a backticked command —
// means the vagueness is actually scoped, e.g. "use good judgment about
// when to run `npm test` — always before commit".
const OPERATOR_RE = /\b(always|never|before|after|unless)\b|\/[\w.-]+\/|`[^`]+`/i

// Reconstructs each source line's full text (inline-code spans re-wrapped
// in backticks) so the suppression check sees the line as originally
// written, not just the slice a given segment carved out of it.
function lineTextMap(segments) {
  const map = new Map()
  for (const seg of segments) {
    const piece = seg.type === 'inline-code' ? `\`${seg.text}\`` : seg.text
    map.set(seg.startLine, (map.get(seg.startLine) ?? '') + piece)
  }
  return map
}

export function run(segments, meta, config) {
  const phrases = config?.phrases ?? []
  const lineMap = lineTextMap(segments)
  const findings = []

  phrases.forEach((phrase, i) => {
    const regex = compilePhrase(phrase)
    for (const seg of segments) {
      if (!VISIBLE_TYPES.has(seg.type)) continue
      const match = regex.exec(seg.text)
      if (!match) continue
      const fullLine = lineMap.get(seg.startLine) ?? seg.text
      if (OPERATOR_RE.test(fullLine)) continue
      findings.push({
        ruleId: id,
        severity,
        line: seg.startLine,
        excerpt: excerpt(match[0]),
        message: `'${excerpt(match[0])}' is unenforceable as written. State the testable behavior you want.`,
        configRef: `vague.yaml#phrases[${i}]`,
      })
    }
  })

  return findings
}
