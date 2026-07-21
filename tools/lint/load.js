// Node-side rules-config loader, used by cli.js. Ported from the frontend
// repo's src/lib/lint/loadConfigs.node.js — see that file's Vite-side
// counterpart (loadConfigs.browser.js) for how the wizard loads the same
// configs in-browser. Keep both in sync if rules-config/*.yaml changes.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const configDir = join(dirname(fileURLToPath(import.meta.url)), 'rules-config')
const read = (name) => parse(readFileSync(join(configDir, name), 'utf8'))

export const lintConfigs = {
  REDUNDANT: read('redundant.yaml'),
  VAGUE: read('vague.yaml'),
  BLOAT: read('thresholds.yaml'),
  CONTRADICTION: read('contradiction.yaml'),
  DANGER: read('danger.yaml'),
}
