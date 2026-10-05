/* The sheet's dark scheme, pinned. The home page is ink whatever the system
 * says, so a sheet figure set on it wears its dark values. Mirrors the DARK
 * side of sheet in tokens.stylex.ts. */
import * as stylex from '@stylexjs/stylex'
import { sheet } from '@/lib/tokens.stylex'

export const inkSheet = stylex.createTheme(sheet, {
  '--page': '#121110',
  '--fg': '#ECE8E0',
  '--soft': '#B5B0A6',
  '--quiet': '#8A847B',
  '--rule': 'rgba(236, 232, 224, 0.12)',
  '--rule-strong': 'rgba(236, 232, 224, 0.24)',
  '--chip': '#1D1B19',
  '--wash': '#1A1918',
  '--code-bg': '#171615',
  '--code-key': '#FF8A73',
  '--code-str': '#A5CDB1',
  '--code-tag': '#C3B6EE',
  '--code-fn': '#A8BCDC',
  '--code-num': '#D9C284',
  '--code-prop': '#ECE8E0',
  '--code-punct': '#7D776E',
  '--code-com': '#7D776E',
  '--code-flash': 'rgba(238, 91, 70, 0.16)',
  '--red': '#EE5B46',
  '--scrim': 'rgba(0, 0, 0, 0.6)',
  '--edge': 'rgba(236, 232, 224, 0.16)',
})
