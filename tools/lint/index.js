// lintEntry() — the one entry point callers use (the wizard now; a future
// CLI/GitHub Action once this is ported to the backend repo, see
// project/gh_backend/OVERVIEW.md). Build spec §7.1 JSON shape, minus the
// CI-only fields (linterVersion, configHash) that belong to the CLI wrapper.
//
// Deliberately takes `configs` as a parameter rather than loading
// rules-config itself: Node (tests, the future CLI) and the browser (Vite)
// read raw files differently, so this module stays free of any
// file-system or bundler-specific import syntax — see loadConfigs.*.js.
import { segment } from './strip.js'
import { countEntryTokens } from './tokens.js'
import { runRules } from './rules/index.js'

export function lintEntry(markdown, meta, configs) {
  const segments = segment(markdown)
  const tokens = countEntryTokens(markdown)
  const findings = runRules(segments, { ...meta, tokens }, configs)
  const blocked = findings.some((f) => f.severity === 'block')

  return { tokens, findings, blocked }
}
