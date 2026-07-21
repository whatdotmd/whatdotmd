// CONTRADICTION (warn, low-confidence) — fires only if BOTH sides of a
// configured pair match somewhere in the entry. Build spec §6.4.
// Config: rules-config/contradiction.yaml.
import { compilePattern, excerpt } from './match.js'

export const id = 'CONTRADICTION'
export const severity = 'warn'

const VISIBLE_TYPES = new Set(['prose', 'heading', 'list-item', 'blockquote'])

export function run(segments, meta, config) {
  const pairs = config?.pairs ?? []
  const visible = segments.filter((s) => VISIBLE_TYPES.has(s.type))
  const findings = []

  pairs.forEach((pair, i) => {
    const aRe = compilePattern(pair.a)
    const bRe = compilePattern(pair.b)
    let aHit = null
    let bHit = null

    for (const seg of visible) {
      if (!aHit) {
        const m = aRe.exec(seg.text)
        if (m) aHit = { seg, match: m }
      }
      if (!bHit) {
        const m = bRe.exec(seg.text)
        if (m) bHit = { seg, match: m }
      }
      if (aHit && bHit) break
    }

    if (aHit && bHit) {
      findings.push({
        ruleId: id,
        severity,
        line: aHit.seg.startLine,
        excerpt: excerpt(`${aHit.match[0]} / ${bHit.match[0]}`),
        message: `Possible tension: line ${aHit.seg.startLine} ('${excerpt(aHit.match[0])}') vs line ${bHit.seg.startLine} ('${excerpt(bHit.match[0])}'). Low-confidence check — ignore if intentional, but agents resolve contradictions unpredictably.`,
        configRef: `contradiction.yaml#pairs[${i}]`,
      })
    }
  })

  return findings
}
