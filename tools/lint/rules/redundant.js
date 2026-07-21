// REDUNDANT (warn) — instructions the agent already follows by default.
// Build spec §6.1. Config: rules-config/redundant.yaml.
import { compilePhrase, excerpt } from './match.js'

export const id = 'REDUNDANT'
export const severity = 'warn'

// Visibility matrix (spec §3): style rules never fire on code or comments —
// a code block *about* a phrase is advice, not the phrase.
const VISIBLE_TYPES = new Set(['prose', 'heading', 'list-item', 'blockquote'])

export function run(segments, meta, config) {
  const phrases = config?.phrases ?? []
  const findings = []

  phrases.forEach((phrase, i) => {
    const regex = compilePhrase(phrase)
    for (const seg of segments) {
      if (!VISIBLE_TYPES.has(seg.type)) continue
      const match = regex.exec(seg.text)
      if (!match) continue
      findings.push({
        ruleId: id,
        severity,
        line: seg.startLine,
        excerpt: excerpt(match[0]),
        message: `'${excerpt(match[0])}' costs tokens every turn without changing behavior — agents already do this. Cut it or make it specific.`,
        configRef: `redundant.yaml#phrases[${i}]`,
      })
    }
  })

  return findings
}
