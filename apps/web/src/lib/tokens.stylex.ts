/* The palette, lifted from the teaser: an ink ground, bone type, one signal
 * red spent on dots. The creature inks live in lib/rig.ts, which draws
 * outside StyleX. Never a hex in a component. */
import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  '--ground': '#121110',
  '--bone': '#F3F0E8',
  '--muted': '#878178',
  '--faint': '#4A4640',
  '--signal': '#EE5B46',
  '--fog': '#C8D6E8',
  '--clay': '#F1CDBF',
  '--lav': '#D8CDF0',
})

/* The package managers' own colours, for their logos on a picked tab. From
 * the same icon set as the paths in manager-logo.tsx. */
export const brands = stylex.defineVars({
  '--npm': '#E53935',
  '--bun': '#FFF8E1',
  '--pnpm': '#FFB300',
  '--yarn': '#0288D1',
})

/* The playground at /play, from the v1.2 sheet (peek.html): a white page
 * and an ink fg that swap with the system scheme. Signal is spent on
 * selection only; the edge rings an ink frame on a dark page. */
const DARK = '@media (prefers-color-scheme: dark)'
export const sheet = stylex.defineVars({
  '--page': { default: '#FFFFFF', [DARK]: '#121110' },
  '--fg': { default: '#1A1918', [DARK]: '#ECE8E0' },
  '--soft': { default: '#5E5A55', [DARK]: '#B5B0A6' },
  // AA for the 10 to 11px mono, on --page and on --chip, in both schemes
  '--quiet': { default: '#706B65', [DARK]: '#8A847B' },
  '--rule': {
    default: 'rgba(26, 25, 24, 0.12)',
    [DARK]: 'rgba(236, 232, 224, 0.12)',
  },
  '--rule-strong': {
    default: 'rgba(26, 25, 24, 0.22)',
    [DARK]: 'rgba(236, 232, 224, 0.24)',
  },
  '--chip': { default: '#F3F0E8', [DARK]: '#1D1B19' },
  // a hover or a selected row, quieter than a chip
  '--wash': { default: '#F6F5F2', [DARK]: '#1A1918' },
  // /docs code, tinted from the body inks' deep partners so a snippet reads
  // as Peek's own: keywords, strings, tags, calls, numbers, props, punctuation,
  // comments. Every tone holds AA on --code-bg in its scheme.
  '--code-bg': { default: '#FBFAF7', [DARK]: '#171615' },
  '--code-key': { default: '#B4442F', [DARK]: '#FF8A73' },
  '--code-str': { default: '#3B7550', [DARK]: '#A5CDB1' },
  '--code-tag': { default: '#5A4FA8', [DARK]: '#C3B6EE' },
  '--code-fn': { default: '#2C6390', [DARK]: '#A8BCDC' },
  '--code-num': { default: '#94601F', [DARK]: '#D9C284' },
  '--code-prop': { default: '#1A1918', [DARK]: '#ECE8E0' },
  '--code-punct': { default: '#8A847B', [DARK]: '#7D776E' },
  '--code-com': { default: '#8A847B', [DARK]: '#7D776E' },
  // a line that just changed in a live snippet
  '--code-flash': {
    default: 'rgba(229, 65, 45, 0.10)',
    [DARK]: 'rgba(238, 91, 70, 0.16)',
  },
  '--red': { default: '#E5412D', [DARK]: '#EE5B46' },
  '--scrim': {
    default: 'rgba(26, 25, 24, 0.32)',
    [DARK]: 'rgba(0, 0, 0, 0.6)',
  },
  '--edge': {
    default: 'rgba(26, 25, 24, 0)',
    [DARK]: 'rgba(236, 232, 224, 0.16)',
  },
})

export const fonts = stylex.defineVars({
  '--sans': "'Inter Tight Variable', ui-sans-serif, system-ui, sans-serif",
  '--mono': "'JetBrains Mono Variable', ui-monospace, 'SF Mono', monospace",
})
