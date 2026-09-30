/* The palette. Every colour in a component reads one of these; none is a hex
 * at the call site. Names keep their `--` so a canvas can read them too. */
import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  '--paper': '#f7f5f0',
  '--ink': '#1c1b18',
  '--ink-muted': '#6b6861',
})
