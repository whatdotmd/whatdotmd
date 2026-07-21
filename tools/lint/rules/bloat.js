// BLOAT (warn; --strict promotes to block, spec §2 — the CLI's concern,
// not this rule's). Build spec §6.3. Fires once per entry on the total
// token count, which the caller must have already attached to meta.tokens
// (tokens.js counts the raw file; this rule doesn't re-derive it).
// Config: rules-config/thresholds.yaml.
export const id = 'BLOAT'
export const severity = 'warn'

export function run(segments, meta, config) {
  const limit = config?.bloat?.[meta.kind]
  if (!limit) return []

  const total = meta.tokens?.tokens ?? 0
  if (total <= limit) return []

  return [
    {
      ruleId: id,
      severity,
      line: null,
      excerpt: `${total} tokens`,
      message: `~${total} tokens (limit ${limit} for kind '${meta.kind}'). This is paid on every single turn. The best entries in this library are under half the limit.`,
      configRef: `thresholds.yaml#bloat.${meta.kind}`,
    },
  ]
}
