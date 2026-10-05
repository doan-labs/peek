/*
 * The peek style's tables. Faces, inks and expressions are transcribed from
 * the Peek v1.2 page (peek.html); the new part types are drawn in the same
 * language and driven by the same channels.
 *
 * Every list is append-only and ordered: object key order is list order, and
 * the hash indexes into it. Never reorder or remove an entry. A version pins
 * how much of each list it may pick from (VERSIONS), so growing a list means
 * a new version, never a new result for an old one.
 */

type Pt = readonly [number, number]

/** Structure inks: never a body color. Signal stays in the interface. */
export const INK = {
  ink: '#1A1918',
  bone: '#F3F0E8',
  paper: '#FFFDF8',
} as const

export type FaceGeom = {
  /** `stroke` rounds the corners: a round-join outline in the body ink. */
  body:
    | { readonly d: string; readonly stroke?: number }
    | { readonly circle: readonly [number, number, number] }
  bottom: number
  /** How far the body sinks below the floor at rest. */
  sink: number
  eyes: readonly [Pt, Pt]
  rx: number
  ry: number
  pr: number
  brow: {
    readonly y: number
    readonly hw: number
    readonly arch: number
    readonly w: number
  }
  cheeks: readonly [Pt, Pt]
  crx: number
  cry: number
  mouth: {
    readonly x: number
    readonly y: number
    readonly w: number
    readonly d: number
    readonly sw: number
  }
  /**
   * The crown: the visible outline above the eyes, as a convex polygon grown
   * by `r` (a point grown by r is a circle). `poly[0]` is the top and the
   * polygon runs clockwise. Every trait sits on this outline, so any trait
   * fits any face.
   */
  crown: { readonly poly: readonly Pt[]; readonly r: number }
}

export const FACES = {
  diamond: {
    body: { d: 'M170 20L320 170L170 320L20 170Z' },
    bottom: 320,
    sink: 30,
    eyes: [
      [132.5, 155],
      [207.5, 155],
    ],
    rx: 20,
    ry: 27.5,
    pr: 10,
    brow: { y: 102.5, hw: 18.75, arch: 15, w: 5.62 },
    cheeks: [
      [117.5, 200],
      [222.5, 200],
    ],
    crx: 11.25,
    cry: 5.62,
    mouth: { x: 170, y: 218.75, w: 15, d: 16.25, sw: 4.38 },
    crown: {
      poly: [
        [170, 20],
        [320, 170],
        [170, 320],
        [20, 170],
      ],
      r: 0,
    },
  },
  semicircle: {
    body: { d: 'M0 255A170 170 0 0 1 340 255Z' },
    bottom: 255,
    sink: 0,
    eyes: [
      [102.5, 175],
      [237.5, 175],
    ],
    rx: 30,
    ry: 25,
    pr: 11.25,
    brow: { y: 127.5, hw: 25, arch: 15, w: 5.62 },
    cheeks: [
      [55, 212.5],
      [285, 212.5],
    ],
    crx: 11.25,
    cry: 5.62,
    mouth: { x: 170, y: 221.25, w: 16.25, d: 16.25, sw: 4.38 },
    crown: { poly: [[170, 255]], r: 170 },
  },
  circle: {
    body: { circle: [170, 170, 150] },
    bottom: 320,
    sink: 20,
    eyes: [
      [112.8, 162.2],
      [227.2, 162.2],
    ],
    rx: 29.9,
    ry: 29.9,
    pr: 13,
    brow: { y: 110.2, hw: 23.4, arch: 15.6, w: 5.85 },
    cheeks: [
      [84.2, 203.8],
      [255.8, 203.8],
    ],
    crx: 11.7,
    cry: 5.85,
    mouth: { x: 170, y: 223.3, w: 16.9, d: 16.9, sw: 4.55 },
    crown: { poly: [[170, 170]], r: 150 },
  },
  /* The v2.1 spec (M50 12L92 88H8Z on a 100u grid, 8u round joins, eyes at
   * 62u) scaled x3.4 about the centre. */
  triangle: {
    body: { d: 'M170 40.8L312.8 299.2L27.2 299.2Z', stroke: 27.2 },
    bottom: 312.8,
    sink: 0,
    eyes: [
      [132.6, 210.8],
      [207.4, 210.8],
    ],
    rx: 20.4,
    ry: 27.2,
    pr: 10,
    brow: { y: 166.6, hw: 18.7, arch: 15.3, w: 5.62 },
    cheeks: [
      [98.6, 238],
      [241.4, 238],
    ],
    crx: 11.5,
    cry: 5.75,
    mouth: { x: 170, y: 254, w: 17, d: 16.25, sw: 4.38 },
    crown: {
      poly: [
        [170, 40.8],
        [312.8, 299.2],
        [27.2, 299.2],
      ],
      r: 13.6,
    },
  },
} as const satisfies Record<string, FaceGeom>

/**
 * Body inks, each with a deep partner at the same hue. The body fills the
 * face and the lids, the deep ink carries cheeks and trait. The first four
 * are from v1.2; butter, rose and aqua are provisional, matched to the same
 * OKLCH lightness and chroma.
 */
export const COLORS = {
  lavender: { body: '#D8CDF0', deep: '#BDAEE6' },
  fog: { body: '#C8D6E8', deep: '#A8BCDC' },
  clay: { body: '#F1CDBF', deep: '#E2A893' },
  mint: { body: '#CFE7D6', deep: '#A5CDB1' },
  butter: { body: '#ECE2B9', deep: '#D9C284' },
  rose: { body: '#EFCAD7', deep: '#DFA4BA' },
  aqua: { body: '#BDE1E5', deep: '#8FC7D1' },
} as const

/** Discrete anatomy. Each part reads every channel its feature owns. */
export const PARTS = {
  eyes: ['oval', 'bead', 'ring'],
  brows: ['arch', 'bar', 'wedge', 'dash'],
  mouth: ['poly', 'round', 'line', 'box'],
  cheeks: ['oval', 'dots', 'lines'],
  trait: ['square', 'fin', 'ring', 'dot', 'peak'],
} as const

export type Face = keyof typeof FACES
export type Color = keyof typeof COLORS
export type Part = keyof typeof PARTS
export type Eyes = (typeof PARTS.eyes)[number]
export type Brows = (typeof PARTS.brows)[number]
export type Mouth = (typeof PARTS.mouth)[number]
export type Cheeks = (typeof PARTS.cheeks)[number]
export type Trait = (typeof PARTS.trait)[number]
export type Axis = 'face' | 'color' | Part

/** How much of each list a version may pick from. Append-only too. */
export const VERSIONS: Record<number, Record<Axis, number>> = {
  1: { face: 4, color: 7, eyes: 3, brows: 4, mouth: 4, cheeks: 3, trait: 5 },
}
export const LATEST = 1

/* ---------- state: channels and the 11 expressions ---------- */

export const GROUPS = {
  eyes: ['lid', 'lower', 'lidTilt', 'eyeS', 'lidAsym'],
  pupil: ['pupil', 'gx', 'gy', 'shine'],
  brows: ['browY', 'browTilt', 'browArch', 'browW', 'browAsym'],
  mouth: ['mw', 'mt', 'mb', 'mx', 'my', 'mk'],
  body: ['alt', 'rot', 'x', 'sx', 'sy'],
  extra: ['blush', 'hair', 'dim', 'thing'],
} as const
export type Group = keyof typeof GROUPS
export type Channel = (typeof GROUPS)[Group][number]
export type Channels = Record<Channel, number>

const BASE: Channels = {
  alt: 0,
  rot: 0,
  x: 0,
  sx: 1,
  sy: 1,
  lid: 0.1,
  lower: 0,
  lidTilt: 0,
  eyeS: 1,
  lidAsym: 0,
  pupil: 1,
  gx: 0,
  gy: 0,
  shine: 0.7,
  browY: 0,
  browTilt: 0,
  browArch: 0.4,
  browW: 1,
  browAsym: 0,
  mw: 0.72,
  mt: 0,
  mb: 0.5,
  mx: 0,
  my: 0,
  mk: 0,
  blush: 0,
  hair: 0,
  dim: 0,
  thing: 0,
}

const S = (o: Partial<Channels>): Readonly<Channels> => ({ ...BASE, ...o })
export const EXPRESSIONS = {
  normal: S({}),
  happy: S({
    lid: 0,
    lower: 0.42,
    shine: 1,
    gy: -0.05,
    browY: -5,
    browArch: 1,
    mw: 1,
    mb: 1,
    blush: 1,
    hair: 0.45,
    alt: 0.05,
  }),
  sad: S({
    lid: 0.42,
    lidTilt: 16,
    pupil: 0.95,
    gy: 0.8,
    shine: 0,
    browY: 3,
    browTilt: 14,
    browArch: 0,
    mw: 0.8,
    mt: -0.55,
    mb: -0.55,
    my: 6,
    alt: -0.16,
    sy: 0.985,
    hair: -0.75,
  }),
  angry: S({
    lid: 0.34,
    lidTilt: -22,
    lower: 0.12,
    pupil: 0.82,
    gy: 0.1,
    shine: 0,
    browY: 5,
    browTilt: -21,
    browArch: 0,
    browW: 1.3,
    mw: 0.8,
    mt: -0.08,
    mb: -0.08,
    my: 3,
    sx: 1.02,
    sy: 0.98,
    hair: 0.25,
  }),
  sleepy: S({
    lid: 1,
    lidTilt: 4,
    pupil: 0.9,
    gy: 0.5,
    shine: 0,
    browY: 6,
    browTilt: 3,
    browArch: 0.15,
    browW: 0.9,
    mw: 0.35,
    mt: -0.3,
    mb: 0.3,
    my: 2,
    alt: -1.12,
    rot: -3,
    hair: -1,
  }),
  curious: S({
    lid: 0,
    eyeS: 1.06,
    pupil: 1.05,
    shine: 1,
    browY: -3,
    browAsym: 9,
    browArch: 0.8,
    mw: 0.38,
    mt: -0.36,
    mb: 0.36,
    rot: 6,
    alt: -0.32,
    hair: 0.3,
    thing: 1,
  }),
  surprised: S({
    lid: 0,
    eyeS: 1.2,
    pupil: 0.66,
    shine: 0.8,
    browY: -13,
    browArch: 1,
    mw: 0.55,
    mt: -0.62,
    mb: 0.62,
    alt: 0.36,
    hair: 1,
  }),
  excited: S({
    lid: 0,
    lower: 0.5,
    eyeS: 1.08,
    pupil: 1.08,
    shine: 1,
    browY: -9,
    browArch: 1,
    mw: 1.15,
    mb: 1.3,
    blush: 1,
    hair: 1,
    alt: 0.12,
  }),
  confused: S({
    lid: 0.22,
    lidAsym: 0.28,
    lidTilt: -4,
    pupil: 0.92,
    gx: -0.35,
    gy: -0.45,
    shine: 0.3,
    browY: -2,
    browAsym: 11,
    browTilt: -5,
    browArch: 0.3,
    mw: 0.6,
    mt: -0.1,
    mb: 0.12,
    mx: 5,
    mk: 13,
    rot: -7,
    alt: -0.05,
    hair: 0.1,
  }),
  bored: S({
    lid: 0.5,
    pupil: 0.9,
    gx: -0.55,
    gy: 0.25,
    shine: 0,
    browY: 3,
    browArch: 0.1,
    mw: 0.55,
    mt: 0,
    mb: 0.04,
    mx: -5,
    alt: -0.34,
    hair: -0.45,
    dim: 1,
  }),
  attentive: S({
    lid: 0,
    eyeS: 1.1,
    pupil: 0.8,
    gy: -0.1,
    shine: 1,
    browY: -7,
    browArch: 0.7,
    mw: 0.55,
    mb: 0.4,
    alt: 0.15,
    sy: 1.03,
    hair: 0.65,
  }),
} as const
export type Expression = keyof typeof EXPRESSIONS
