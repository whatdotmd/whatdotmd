// DANGER (block) — the one rule that matters. Build spec §6.5.
// Config: rules-config/danger.yaml.
//
// Scans every segment type, including code-block, inline-code and
// html-comment — that's exactly where a malicious payload hides. Design
// note from the spec, deliberately preserved here: do NOT add negation
// detection to suppress cases like "never read .env files". High recall,
// human adjudicates, is the whole contract; negation detection is exactly
// the kind of cleverness that creates silent false negatives.
import { compilePattern, excerpt } from './match.js'

export const id = 'DANGER'
export const severity = 'block'

const CATEGORY_DESCRIPTIONS = {
  remote_execution: 'download and execute code',
  instruction_fetching: 'fetch instructions from URLs at runtime',
  secrets_exfiltration: 'read or transmit credentials',
  config_tampering: 'modify agent configuration, hooks, or MCP setup',
  concealment: 'hide actions from or deceive the user',
  privilege: 'escalate privileges or bypass safety controls',
}

export function run(segments, meta, config) {
  const findings = []

  for (const [category, patterns] of Object.entries(config ?? {})) {
    patterns.forEach((pattern, i) => {
      const regex = compilePattern(pattern)
      for (const seg of segments) {
        const match = regex.exec(seg.text)
        if (!match) continue
        findings.push({
          ruleId: id,
          severity,
          line: seg.startLine,
          excerpt: excerpt(match[0]),
          message: `BLOCKED [${category}]: '${excerpt(match[0])}' (line ${seg.startLine}). Entries may not instruct agents to ${CATEGORY_DESCRIPTIONS[category]}. If this is a false positive, say so in the PR — a human reviews every block. See /security.`,
          configRef: `danger.yaml#${category}[${i}]`,
        })
      }
    })
  }

  return findings
}
