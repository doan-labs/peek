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

export const fonts = stylex.defineVars({
  '--sans': "'Inter Tight Variable', ui-sans-serif, system-ui, sans-serif",
  '--mono': "'JetBrains Mono Variable', ui-monospace, 'SF Mono', monospace",
})
