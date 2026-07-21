// Rule registry + runner (build spec §6.0).
import * as redundant from './redundant.js'
import * as vague from './vague.js'
import * as bloat from './bloat.js'
import * as contradiction from './contradiction.js'
import * as danger from './danger.js'

export const RULES = [redundant, vague, bloat, contradiction, danger]

// Runs every rule against the same segments/meta, each against its own
// slice of rules-config (configs keyed by ruleId), and flattens the result.
export function runRules(segments, meta, configs) {
  return RULES.flatMap((rule) => rule.run(segments, meta, configs[rule.id]))
}
