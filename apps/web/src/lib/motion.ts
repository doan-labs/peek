/*
 * One vocabulary for movement, the same one Duo uses. Curves for anything
 * that only fades or travels a fixed distance; springs for anything with
 * weight. Reduced motion cuts the duration to NONE and never the `initial`
 * pose: `useReducedMotion()` is null on the server, so gating `initial` on it
 * would render one pose into the HTML and another into the hydration.
 */

/** The page's curve: a long, quiet settle. */
export const CURVE = [0.22, 1, 0.36, 1] as const

/** A piece landing: quick, settled, no visible overshoot. */
export const LAND = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.9,
} as const

/** The mark's quarter turn: heavy, one soft overshoot and nothing after. */
export const TURN = {
  type: 'spring',
  stiffness: 90,
  damping: 15,
  mass: 1.1,
} as const

export const NONE = { duration: 0 } as const

/** The intro, in seconds from first paint. One table so the beats stay in order. */
export const BEAT = {
  chrome: 0.1,
  pieces: 0.35,
  eyes: 1.05,
  turn: 1.55,
  rise: 2.5,
  word: 3.0,
  maker: 3.5,
  creatures: 3.7,
} as const
