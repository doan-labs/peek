/* The inks as literals, for colours animated from JS: motion interpolates two
 * hex values, not two `var()` references. Keep them equal to the tokens of
 * the same name in tokens.stylex.ts. */
export const INKS = {
  bone: '#F3F0E8',
  fog: '#C8D6E8',
  clay: '#F1CDBF',
  lav: '#D8CDF0',
  ground: '#121110',
  paper: '#FFFDF8',
  ink: '#1A1918',
} as const
