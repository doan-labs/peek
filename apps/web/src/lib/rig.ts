/*
 * One living Peek creature, drawn into an SVG it owns. Transcribed from the
 * Avatar Studio sketch (v1.1), the triangle from Peek v1.2: the same shapes,
 * channels, states, springs and choreography, so a face here reads the way
 * it did in the teaser.
 *
 * Every frame writes attributes straight onto the nodes. React never hears
 * about a frame: the component mounts a rig and calls `update(dt)` from one
 * shared loop.
 *
 * Dropped from the studio: the riso plates and grain (one static grain over
 * the whole page stands in), the background, and the dot lattice. What a
 * curious creature looks at is `thing`, set by the page to the mark.
 */

const NS = 'http://www.w3.org/2000/svg'

export const INK = {
  ink: '#1A1918',
  paper: '#FFFDF8',
}

type Mouth = {
  type: 'poly' | 'round'
  x: number
  y: number
  w: number
  d: number
  sw: number
}
type Shape = {
  /** `stroke` rounds the corners: a round-join outline in the body ink. */
  body: { d: string; stroke?: number } | { circle: [number, number, number] }
  bottom: number
  sink: number
  fill: string
  deep: string
  eyes: [[number, number], [number, number]]
  rx: number
  ry: number
  pr: number
  brow: { y: number; hw: number; arch: number; w: number }
  cheeks: [[number, number], [number, number]]
  crx: number
  cry: number
  mouth: Mouth
  trait: 'square' | 'fin' | 'ring' | 'dot'
  /** Altitude out of sight, below the floor, trait and all. */
  hide?: number
}

export const SHAPES = {
  diamond: {
    body: { d: 'M170 20L320 170L170 320L20 170Z' },
    bottom: 320,
    sink: 30,
    fill: '#D8CDF0',
    deep: '#BDAEE6',
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
    mouth: { type: 'poly', x: 170, y: 218.75, w: 15, d: 16.25, sw: 4.38 },
    trait: 'square',
  },
  semicircle: {
    body: { d: 'M0 255A170 170 0 0 1 340 255Z' },
    bottom: 255,
    sink: 0,
    fill: '#C8D6E8',
    deep: '#A8BCDC',
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
    mouth: { type: 'round', x: 170, y: 221.25, w: 16.25, d: 16.25, sw: 4.38 },
    trait: 'fin',
  },
  circle: {
    body: { circle: [170, 170, 150] },
    bottom: 320,
    sink: 20,
    fill: '#F1CDBF',
    deep: '#E2A893',
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
    mouth: { type: 'round', x: 170, y: 223.3, w: 16.9, d: 16.9, sw: 4.55 },
    trait: 'ring',
  },
  /* The v2.1 spec (M50 12L92 88H8Z on a 100u grid, 8u round joins, eyes at
   * 62u) scaled x3.4 about the centre. */
  triangle: {
    body: { d: 'M170 40.8L312.8 299.2L27.2 299.2Z', stroke: 27.2 },
    bottom: 312.8,
    sink: 0,
    fill: '#CFE7D6',
    deep: '#A5CDB1',
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
    mouth: { type: 'round', x: 170, y: 254, w: 17, d: 16.25, sw: 4.38 },
    trait: 'dot',
    // its eyes sit low, so -2.4 leaves the apex and the dot showing
    hide: -3.5,
  },
} satisfies Record<string, Shape>

export type ShapeKey = keyof typeof SHAPES

/* The frame: viewBox -30 -30 400 400, the floor on its bottom edge. */
export const VB = [-30, -30, 400, 400] as const
const FLOOR = 370

const GROUPS = {
  eyes: ['lid', 'lower', 'lidTilt', 'eyeS', 'lidAsym'],
  pupil: ['pupil', 'gx', 'gy', 'shine'],
  brows: ['browY', 'browTilt', 'browArch', 'browW', 'browAsym'],
  mouth: ['mw', 'mt', 'mb', 'mx', 'my', 'mk'],
  body: ['alt', 'rot', 'x', 'sx', 'sy'],
  extra: ['blush', 'hair', 'dim', 'thing'],
} as const
type Group = keyof typeof GROUPS
type Channel = (typeof GROUPS)[Group][number]
type Pose = Record<Channel, number>
type Spring = [omega: number, zeta: number]

const GROUP_OF = {} as Record<Channel, Group>
for (const g of Object.keys(GROUPS) as Group[])
  for (const c of GROUPS[g]) GROUP_OF[c] = g
const CHANNELS = Object.keys(GROUP_OF) as Channel[]

const BASE: Pose = {
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

const S = (o: Partial<Pose>): Pose => ({ ...BASE, ...o })
export const STATES = {
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
}
export type State = keyof typeof STATES

/* Choreography: when each group starts moving, how springy it is, and timed
 * keys. A key's value may be a function of the channel's current value. */
type KeyValue = number | ((v: number) => number)
type Key = [
  at: number,
  set: Partial<Record<Channel | 'look', KeyValue>>,
  spr?: Partial<Record<Group, Spring>>,
]
type Choreo = {
  delay?: Partial<Record<Group, number>>
  spr?: Partial<Record<Group, Spring>>
  keys?: Key[]
}
const DEF_DELAY: Record<Group, number> = {
  eyes: 0,
  pupil: 50,
  brows: 110,
  mouth: 170,
  extra: 140,
  body: 230,
}
const DEF_SPR: Record<Group, Spring> = {
  eyes: [14, 0.82],
  pupil: [15, 0.8],
  brows: [11, 0.72],
  mouth: [12, 0.74],
  body: [7, 0.72],
  extra: [8, 0.5],
}
const CHOREO: Partial<Record<State, Choreo>> = {
  happy: {
    delay: {
      eyes: 0,
      pupil: 40,
      brows: 120,
      mouth: 200,
      extra: 220,
      body: 280,
    },
    spr: { body: [9, 0.42], extra: [9, 0.35] },
    keys: [
      [280, { alt: 0.2 }, { body: [11, 0.5] }],
      [520, { alt: 0.05 }, { body: [8, 0.38] }],
    ],
  },
  sad: {
    delay: {
      eyes: 0,
      pupil: 160,
      brows: 260,
      mouth: 380,
      extra: 420,
      body: 560,
    },
    spr: {
      eyes: [6, 0.95],
      pupil: [5, 0.95],
      brows: [6, 0.95],
      mouth: [6, 0.9],
      body: [3.2, 0.95],
      extra: [3, 0.9],
    },
  },
  angry: {
    delay: { brows: 0, eyes: 40, pupil: 60, mouth: 160, body: 100, extra: 60 },
    spr: { brows: [18, 0.7], eyes: [16, 0.75], body: [14, 0.5] },
  },
  sleepy: {
    delay: {
      eyes: 0,
      pupil: 200,
      brows: 750,
      mouth: 950,
      extra: 900,
      body: 1150,
    },
    spr: {
      eyes: [2.6, 1],
      pupil: [3, 1],
      brows: [3.2, 1],
      mouth: [3, 1],
      extra: [2.4, 0.9],
      body: [1.9, 1],
    },
    keys: [
      [0, { lid: 0.62 }],
      [1300, { lid: 1 }],
    ],
  },
  curious: {
    delay: { eyes: 0, pupil: 0, brows: 220, mouth: 320, extra: 0, body: 0 },
    spr: { body: [6, 0.95] },
    keys: [
      [0, { alt: -0.8, rot: 0, gx: 0, gy: -0.1, thing: 0 }],
      [900, { alt: -0.56 }, { body: [2.2, 1] }],
      [1500, { thing: 1 }, { extra: [5, 0.9] }],
      [2200, { look: 1 }, { pupil: [6, 0.9] }],
      [2500, { rot: 7 }, { body: [3, 0.9] }],
      [2900, { alt: -0.32 }, { body: [2, 1] }],
    ],
  },
  surprised: {
    delay: { eyes: 0, pupil: 0, brows: 0, mouth: 40, extra: 60, body: 0 },
    spr: {
      eyes: [30, 0.62],
      pupil: [26, 0.7],
      brows: [24, 0.55],
      mouth: [22, 0.6],
      extra: [15, 0.32],
    },
    keys: [
      [0, { alt: (v) => v - 0.1, sy: 0.9, sx: 1.05 }, { body: [30, 1] }],
      [110, { alt: 0.36, sy: 1.08, sx: 0.97 }, { body: [17, 0.42] }],
      [380, { sy: 1, sx: 1 }, { body: [10, 0.5] }],
    ],
  },
  excited: {
    delay: { eyes: 0, pupil: 30, brows: 80, mouth: 140, extra: 120, body: 180 },
    spr: { body: [9, 0.4], extra: [12, 0.3] },
  },
  confused: {
    delay: {
      eyes: 0,
      brows: 60,
      pupil: 100,
      mouth: 250,
      body: 200,
      extra: 200,
    },
    spr: { body: [5, 0.7] },
  },
  bored: {
    delay: {
      eyes: 0,
      pupil: 300,
      brows: 500,
      mouth: 600,
      extra: 700,
      body: 800,
    },
    spr: {
      eyes: [3, 1],
      pupil: [2.5, 1],
      brows: [3, 1],
      mouth: [3, 1],
      body: [1.6, 1],
      extra: [2, 1],
    },
  },
  attentive: {
    delay: {
      eyes: 0,
      pupil: 180,
      brows: 90,
      mouth: 240,
      extra: 200,
      body: 360,
    },
    spr: {
      eyes: [20, 0.8],
      pupil: [20, 0.85],
      brows: [16, 0.7],
      body: [5, 0.78],
      extra: [11, 0.4],
    },
  },
}

/* How much the pointer steers the eyes, and the blink interval, per state. */
const ATTENTION: Record<State, number> = {
  normal: 0.8,
  happy: 0.6,
  sad: 0.2,
  angry: 0.6,
  sleepy: 0,
  curious: 1,
  surprised: 0.5,
  excited: 0.5,
  confused: 0.3,
  bored: 0.1,
  attentive: 1,
}
const BLINK: Record<State, [number, number] | null> = {
  normal: [2.4, 5],
  happy: [2.2, 4],
  sad: [3, 6],
  angry: [3.5, 6],
  sleepy: null,
  curious: [3.5, 6],
  surprised: [3, 5],
  excited: [1.8, 3.2],
  confused: [2, 4],
  bored: [4.5, 7.5],
  attentive: [4.5, 7.5],
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const f2 = (v: number) => Math.round(v * 100) / 100
const strokeFor = (px: number) =>
  px >= 96 ? 1 : px >= 56 ? 1.25 : px >= 40 ? 1.6 : px >= 30 ? 2 : 2.4

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> | null,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag)
  if (attrs) for (const k in attrs) n.setAttribute(k, String(attrs[k]))
  if (parent) parent.appendChild(n)
  return n
}

let UID = 0

type Eye = {
  white: SVGEllipseElement
  pupil: SVGCircleElement
  shine: SVGCircleElement
  lid: SVGRectElement
  lower: SVGEllipseElement
  closed: SVGPathElement
}
type Bump = {
  ch: Channel
  amt: number
  t0: number
  a: number
  h: number
  r: number
}

export class Rig {
  readonly svg: SVGSVGElement
  state: State = 'normal'
  /** The pointer, in frame units, or null when it is away. */
  pointer: [number, number] | null = null
  /** Where the eyes go, in frame units, in any state and at once. */
  gaze: [number, number] | null = null
  /** What a curious creature turns to, in frame units. */
  thing: [number, number] = [330, 20]

  private sh: Shape
  private still: boolean
  private clock = 0
  private enteredAt = 0
  private val = { ...BASE }
  private vel = {} as Pose
  private base = { ...BASE }
  private spr = {} as Record<Channel, Spring>
  private out = {} as Pose
  private queue: { at: number; set: Key[1]; spr?: Key[2] }[] = []
  private bumps: Bump[] = []
  private blinkAt = rand(1, 3)
  private blinkT = -1
  private blinkDur = 0.16
  private blinkV = 0
  private doubleBlink = false
  private saccAt = rand(0.6, 1.8)
  private sacc = { gx: 0, gy: 0 }
  private nodAt = 0
  private lookThing = false
  private lag = { y: 0, v: 0 }
  private st = 1
  private baseY: number
  private eyeY: number
  private R: number
  private hide: number

  /** The body, the one part that answers the pointer. */
  readonly body: SVGGElement
  private eyeClip: SVGEllipseElement[] = []
  private lidClip: SVGEllipseElement[] = []
  private eyes: Eye[]
  private brows: SVGPathElement[]
  private mouth: SVGPathElement
  private cheeks: SVGEllipseElement[]
  private traitG: SVGGElement
  private traitEl: SVGElement

  constructor(host: Element, shape: ShapeKey, still: boolean) {
    this.sh = SHAPES[shape]
    this.still = still
    const sh = this.sh
    this.baseY = FLOOR + sh.sink - sh.bottom
    this.eyeY = sh.eyes[0][1]
    // altitude -1 puts the eye line on the floor
    this.R = FLOOR - (this.eyeY + this.baseY)
    this.hide = sh.hide ?? -2.4
    for (const c of CHANNELS) {
      this.vel[c] = 0
      this.out[c] = 0
      this.spr[c] = DEF_SPR[GROUP_OF[c]]
    }

    const u = `r${++UID}`
    const svg = el('svg', { viewBox: VB.join(' '), 'aria-hidden': 'true' })
    this.svg = svg
    const defs = el('defs', null, svg)
    el(
      'rect',
      { x: VB[0], y: VB[1], width: VB[2], height: VB[3] },
      el('clipPath', { id: `${u}-f` }, defs),
    )
    for (let i = 0; i < 2; i++) {
      this.eyeClip.push(
        el(
          'ellipse',
          { cx: 0, cy: 0 },
          el('clipPath', { id: `${u}-e${i}` }, defs),
        ),
      )
      this.lidClip.push(
        el(
          'ellipse',
          { cx: 0, cy: 0 },
          el('clipPath', { id: `${u}-l${i}` }, defs),
        ),
      )
    }
    const clip = el('g', { 'clip-path': `url(#${u}-f)` }, svg)
    this.body = el('g', null, clip)

    if ('d' in sh.body) {
      const { d, stroke } = sh.body
      el(
        'path',
        stroke
          ? {
              d,
              fill: sh.fill,
              stroke: sh.fill,
              'stroke-width': stroke,
              'stroke-linejoin': 'round',
            }
          : { d, fill: sh.fill },
        this.body,
      )
    } else {
      const [cx, cy, r] = sh.body.circle
      el('circle', { cx, cy, r, fill: sh.fill }, this.body)
    }
    this.cheeks = sh.cheeks.map(([x, y]) =>
      el(
        'ellipse',
        { cx: x, cy: y, rx: sh.crx, ry: sh.cry, fill: sh.deep },
        this.body,
      ),
    )
    this.traitG = el('g', null, this.body)
    this.traitEl =
      sh.trait === 'square'
        ? el(
            'rect',
            { x: -11, y: -11, width: 22, height: 22, fill: sh.deep },
            this.traitG,
          )
        : sh.trait === 'fin'
          ? el(
              'path',
              { d: 'M0 0L0 -40A40 40 0 0 1 40 0Z', fill: sh.deep },
              this.traitG,
            )
          : sh.trait === 'dot'
            ? el(
                'circle',
                { cx: 0, cy: 0, r: 12.5, fill: sh.deep },
                this.traitG,
              )
            : el(
                'circle',
                {
                  cx: 0,
                  cy: 0,
                  r: 12.5,
                  fill: 'none',
                  stroke: sh.deep,
                  'stroke-width': 7,
                },
                this.traitG,
              )

    this.eyes = sh.eyes.map(([x, y], i) => {
      const g = el('g', { transform: `translate(${x} ${y})` }, this.body)
      const inner = el('g', { 'clip-path': `url(#${u}-e${i})` }, g)
      const white = el('ellipse', { cx: 0, cy: 0, fill: INK.paper }, inner)
      const pupil = el('circle', { fill: INK.ink }, inner)
      const shine = el('circle', { fill: INK.paper }, inner)
      const lids = el('g', { 'clip-path': `url(#${u}-l${i})` }, g)
      const lid = el('rect', { fill: sh.fill }, lids)
      const lower = el('ellipse', { fill: sh.fill }, lids)
      const closed = el(
        'path',
        { fill: 'none', stroke: INK.ink, 'stroke-linecap': 'round' },
        g,
      )
      return { white, pupil, shine, lid, lower, closed }
    })
    this.brows = sh.eyes.map(() =>
      el(
        'path',
        {
          fill: 'none',
          stroke: INK.ink,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        this.body,
      ),
    )
    this.mouth = el(
      'path',
      {
        fill: INK.ink,
        stroke: INK.ink,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      this.body,
    )

    host.appendChild(svg)
    this.resize(host.getBoundingClientRect().width || 400)
  }

  /** Stroke weights thicken as the creature shrinks, so a face holds at 40px. */
  resize(px: number) {
    this.st = strokeFor(px)
    this.render()
  }

  /**
   * Starts below the floor, out of sight, then peeks: eyes over the edge
   * first, a look around, and only then the full rise into `state`.
   */
  enter(delay: number, state: State) {
    if (this.still) return this.setState(state)
    this.away(true)
    this.rise(delay, state)
  }

  /** Ducks back below the floor, quick, then peeks in again as it entered. */
  duck(delay: number, state: State) {
    if (this.still) return
    this.away()
    this.rise(delay, state)
  }

  /** Ducks below the floor and stays there; `snap` puts it there at once. */
  away(snap = false) {
    if (this.still) return
    if (snap) {
      this.val.alt = this.base.alt = this.hide
      this.val.lid = this.base.lid = 1
    }
    this.queue = [
      {
        at: this.clock,
        set: { alt: this.hide, lid: 1 },
        spr: { body: [12, 1], eyes: [16, 1] },
      },
    ]
    this.pending = null
  }

  private rise(delay: number, state: State) {
    const at = this.clock + delay
    this.queue.push(
      {
        at,
        set: { alt: -0.82, lid: 0.1 },
        spr: { body: [4.2, 0.92], eyes: [9, 0.9] },
      },
      { at: at + 0.35, set: { gx: -0.5 }, spr: { pupil: [9, 0.9] } },
      { at: at + 0.8, set: { gx: 0.45 } },
      { at: at + 1.15, set: { gx: 0 } },
    )
    this.queue.sort((a, b) => a.at - b.at)
    this.enteredAt = at + 1.2
    this.pending = { at: at + 1.2, state }
  }
  private pending: { at: number; state: State } | null = null

  setState(name: State, { restart = false } = {}) {
    if (name === this.state && !restart) return
    const prev = this.state
    this.state = name
    this.enteredAt = this.clock
    this.lookThing = false
    this.queue = []
    this.pending = null
    const tgt = STATES[name]
    const ch = CHOREO[name] ?? {}
    const delay = { ...DEF_DELAY, ...ch.delay }
    const spr = { ...DEF_SPR, ...ch.spr }
    if (this.still) {
      for (const c of CHANNELS) {
        this.base[c] = this.val[c] = tgt[c]
        this.vel[c] = 0
      }
      this.lookThing = name === 'curious'
      this.render()
      return
    }
    for (const g of Object.keys(GROUPS) as Group[]) {
      const set: Key[1] = {}
      for (const c of GROUPS[g]) set[c] = tgt[c]
      this.queue.push({
        at: this.clock + delay[g] / 1000,
        set,
        spr: { [g]: spr[g] },
      })
    }
    for (const [t, set, s] of ch.keys ?? [])
      this.queue.push({ at: this.clock + t / 1000 + 1e-4, set, spr: s })
    this.queue.sort((a, b) => a.at - b.at)
    // a startled creature wakes with a double blink
    if (name === 'surprised') {
      this.blinkAt = this.clock + 0.75
      this.doubleBlink = true
    }
    if (name === 'sleepy') this.nodAt = this.clock + rand(6, 8)
    if (prev === 'sleepy' && name !== 'sleepy') this.bumps = []
  }

  private bump(ch: Channel, amt: number, a: number, h: number, r: number) {
    this.bumps.push({ ch, amt, t0: this.clock, a, h, r })
  }

  private eyePos(): [number, number] {
    return [170 + this.val.x, this.eyeY + this.baseY - this.val.alt * this.R]
  }

  update(dt: number) {
    if (this.still) return
    this.clock += dt
    const t = this.clock
    const age = t - this.enteredAt
    const st = this.state

    if (this.pending && t >= this.pending.at) {
      const { state } = this.pending
      this.pending = null
      this.setState(state, { restart: true })
    }
    while (this.queue.length && this.queue[0]!.at <= t) {
      const q = this.queue.shift()!
      if (q.spr)
        for (const g of Object.keys(q.spr) as Group[]) {
          const s = q.spr[g]
          if (s) for (const c of GROUPS[g]) this.spr[c] = s
        }
      for (const c of Object.keys(q.set) as (Channel | 'look')[]) {
        if (c === 'look') {
          this.lookThing = true
          continue
        }
        const v = q.set[c]!
        this.base[c] = typeof v === 'function' ? v(this.val[c]) : v
      }
    }

    const tgt = {} as Pose
    const out = {} as Pose
    for (const c of CHANNELS) {
      tgt[c] = 0
      out[c] = 0
    }

    // gaze: resting target, micro saccades, the thing, the pointer
    let gx = this.base.gx
    let gy = this.base.gy
    const [ex, ey] = this.eyePos()
    if (this.lookThing) {
      gx = clamp((this.thing[0] - ex) / 150, -1, 1)
      gy = clamp((this.thing[1] - ey) / 150, -1, 1)
    }
    if (this.gaze) {
      gx = clamp((this.gaze[0] - ex) / 150, -1, 1)
      gy = clamp((this.gaze[1] - ey) / 150, -1, 1)
    }
    const quiet = st === 'sleepy' || st === 'bored'
    if (!quiet && t >= this.saccAt) {
      this.sacc = { gx: rand(-0.17, 0.17), gy: rand(-0.1, 0.1) }
      this.saccAt = t + rand(0.8, 2.6)
    }
    if (!quiet) {
      gx += this.sacc.gx
      gy += this.sacc.gy
    }
    const w = ATTENTION[st]
    if (this.pointer && w > 0 && !this.pending) {
      const px = clamp((this.pointer[0] - ex) / 170, -1, 1)
      const py = clamp((this.pointer[1] - ey) / 170, -1, 1)
      gx += (px - gx) * w
      gy += (py - gy) * w
    }
    tgt.gx = gx - this.base.gx
    tgt.gy = gy - this.base.gy

    // per-state life
    const br =
      st === 'sleepy'
        ? 1.3
        : st === 'bored'
          ? 1.2
          : st === 'attentive'
            ? 2.6
            : 2.1
    const ba = st === 'sleepy' ? 0.018 : st === 'attentive' ? 0.004 : 0.007
    out.sy += ba * Math.sin(t * br)
    out.alt += (st === 'sleepy' ? 0.03 : 0.008) * Math.sin(t * br + 1.1)
    if (st === 'happy') out.rot += 1.4 * Math.sin(t * 1.7)
    if (st === 'angry') {
      out.x += 7 * Math.sin(age * 42) * Math.exp(-age * 6)
      out.x += 0.35 * Math.sin(t * 31)
    }
    if (st === 'excited') {
      const ph = age % 1.5
      if (ph < 0.9) {
        const h = Math.max(0, Math.sin((ph / 0.45) * Math.PI))
        out.alt += h * 0.17
        out.sy += h * 0.045
        out.rot += 2 * Math.sin(t * 9) * h
      }
    }
    if (st === 'confused') {
      tgt.gx += 0.45 * Math.sin(age * 1.1)
      out.rot += 2.2 * Math.sin(age * 0.7)
    }
    if (st === 'bored') tgt.gx += 0.22 * Math.sin(t * 0.33)
    if (st === 'sleepy' && t >= this.nodAt && age > 3) {
      // nods back up, half opens its eyes, gives in again
      this.bump('alt', 0.3, 0.14, 0.5, 1.6)
      this.bump('lid', -0.5, 0.14, 0.45, 1.3)
      this.bump('hair', 0.6, 0.12, 0.4, 1.2)
      this.nodAt = t + rand(6.5, 9.5)
    }
    if ((st === 'sad' || st === 'bored') && Math.random() < dt / 7) {
      this.bump('sy', -0.035, 0.5, 0.25, 0.9)
      this.bump('alt', -0.05, 0.5, 0.25, 0.9)
    }

    // springs, two substeps
    const n = 2
    const h = dt / n
    for (const c of CHANNELS) {
      const [om, ze] = this.spr[c]
      const target = this.base[c] + tgt[c]
      let x = this.val[c]
      let v = this.vel[c]
      for (let i = 0; i < n; i++) {
        v += (om * om * (target - x) - 2 * ze * om * v) * h
        x += v * h
      }
      this.val[c] = x
      this.vel[c] = v
    }

    this.bumps = this.bumps.filter((b) => {
      const u = t - b.t0
      if (u > b.a + b.h + b.r) return false
      const e =
        u < b.a
          ? smooth(0, 1, u / b.a)
          : u < b.a + b.h
            ? 1
            : 1 - smooth(0, 1, (u - b.a - b.h) / b.r)
      out[b.ch] += b.amt * e
      return true
    })

    // blinks
    const bl = BLINK[st]
    let blink = 0
    if (bl && this.val.lid < 0.75) {
      if (this.blinkT < 0 && t >= this.blinkAt) {
        this.blinkT = 0
        this.blinkDur = st === 'bored' ? 0.42 : 0.16
      }
      if (this.blinkT >= 0) {
        this.blinkT += dt
        const k = this.blinkT / this.blinkDur
        if (k >= 1) {
          this.blinkT = -1
          if (this.doubleBlink) {
            this.doubleBlink = false
            this.blinkAt = t + 0.09
          } else this.blinkAt = t + rand(bl[0], bl[1])
        } else blink = Math.sin(k * Math.PI)
      }
    } else if (!bl) this.blinkT = -1
    this.blinkV = blink

    // the trait lags behind the body a little
    const avY = -(this.val.alt + out.alt) * this.R
    const lom = 10
    const lze = 0.32
    this.lag.v +=
      (lom * lom * (avY - this.lag.y) - 2 * lze * lom * this.lag.v) * dt
    this.lag.y += this.lag.v * dt

    this.out = out
    this.render()
  }

  /** Pokes it: a startled pop, then back to what it was doing, or `then`. */
  poke(then?: State) {
    const back = then ?? (this.state === 'surprised' ? 'happy' : this.state)
    this.setState('surprised', { restart: true })
    this.pending = { at: this.clock + 1.3, state: back }
  }

  private render() {
    const sh = this.sh
    const V = this.val
    const O = this.out
    const g = (c: Channel) => V[c] + (O[c] || 0)
    const alt = g('alt')
    const rot = g('rot')
    const x = g('x')
    const sx = g('sx')
    const sy = g('sy')
    const B = sh.bottom
    const ty = this.baseY - alt * this.R
    this.body.setAttribute(
      'transform',
      `translate(${f2(x)} ${f2(ty)}) rotate(${f2(rot)} 170 ${B}) translate(170 ${B}) scale(${f2(sx * 1000) / 1000} ${f2(sy * 1000) / 1000}) translate(-170 ${-B})`,
    )
    const dim = clamp(g('dim'), 0, 1)
    this.body.style.filter =
      dim > 0.01 ? `saturate(${(1 - dim * 0.55).toFixed(3)})` : ''

    // eyes
    const eyeS = g('eyeS')
    const rx = sh.rx * eyeS
    const ry = sh.ry * eyeS
    const lid0 = g('lid')
    const lidAsym = g('lidAsym')
    const lower = clamp(g('lower'), 0, 1)
    const blink = this.blinkV
    const pr = sh.pr * g('pupil')
    const rangeX = Math.max(0, sh.rx - sh.pr) * 0.9
    const rangeY = Math.max(0, sh.ry - sh.pr) * 0.8
    const gx = clamp(g('gx'), -1.1, 1.1)
    const gy = clamp(g('gy'), -1.1, 1.1)
    const tilt = g('lidTilt')
    const shine = clamp(g('shine'), 0, 1)
    const sw = sh.brow.w * this.st
    this.eyes.forEach((e, i) => {
      const side = i === 0 ? -1 : 1
      let lid = clamp(lid0 + (i === 0 ? lidAsym : -lidAsym * 0.3), 0, 1)
      lid = lid + (1 - lid) * blink
      this.eyeClip[i]!.setAttribute('rx', `${f2(rx)}`)
      this.eyeClip[i]!.setAttribute('ry', `${f2(ry)}`)
      this.lidClip[i]!.setAttribute('rx', `${f2(rx + 1.6)}`)
      this.lidClip[i]!.setAttribute('ry', `${f2(ry + 1.6)}`)
      e.white.setAttribute('rx', `${f2(rx)}`)
      e.white.setAttribute('ry', `${f2(ry)}`)
      const px = gx * rangeX
      const py = gy * rangeY
      e.pupil.setAttribute('cx', `${f2(px)}`)
      e.pupil.setAttribute('cy', `${f2(py)}`)
      e.pupil.setAttribute('r', `${f2(pr)}`)
      e.shine.setAttribute('cx', `${f2(px + pr * 0.44)}`)
      e.shine.setAttribute('cy', `${f2(py - pr * 0.44)}`)
      e.shine.setAttribute('r', `${f2(pr * 0.3)}`)
      e.shine.setAttribute('opacity', `${f2(shine)}`)
      // upper lid: a straight cut, tilted
      const edge = -ry - 1.6 + lid * (2 * ry + 3.2)
      const a = side * tilt
      e.lid.setAttribute('x', `${f2(-rx * 2.2)}`)
      e.lid.setAttribute('width', `${f2(rx * 4.4)}`)
      e.lid.setAttribute('y', `${f2(-ry * 3)}`)
      e.lid.setAttribute('height', `${f2(Math.max(0, edge + ry * 3))}`)
      e.lid.setAttribute('transform', `rotate(${f2(a)})`)
      // lower lid: a wide arc pushing up from below, the smiling squint
      const lrx = rx * 1.55
      const lry = ry * 1.15
      const top = ry + 1.6 - lower * ry * 1.5
      e.lower.setAttribute('rx', `${f2(lrx)}`)
      e.lower.setAttribute('ry', `${f2(lry)}`)
      e.lower.setAttribute('cy', `${f2(top + lry)}`)
      // closed eye: a hairline drawn once the lid is down
      const co = smooth(0.86, 1, lid)
      if (co > 0.01) {
        const yy = Math.min(edge, ry) - 1
        const hw = rx * 0.92
        e.closed.setAttribute(
          'd',
          `M${f2(-hw)} ${f2(yy - 2)}Q0 ${f2(yy + 6)} ${f2(hw)} ${f2(yy - 2)}`,
        )
        e.closed.setAttribute('transform', `rotate(${f2(a * 0.6)})`)
        e.closed.setAttribute('stroke-width', `${f2(sw * 0.85)}`)
        e.closed.setAttribute('opacity', `${f2(co)}`)
      } else e.closed.setAttribute('opacity', '0')
    })

    // brows
    const browY = g('browY') - (eyeS - 1) * sh.ry * 0.9
    const btilt = g('browTilt')
    const arch = g('browArch')
    const basym = g('browAsym')
    this.brows.forEach((p, i) => {
      const side = i === 0 ? -1 : 1
      const ex = sh.eyes[i]![0]
      const yy = sh.brow.y + browY + (i === 1 ? -basym : basym * 0.3)
      const hw = sh.brow.hw
      const c = -sh.brow.arch * arch
      p.setAttribute('d', `M${f2(-hw)} 0Q0 ${f2(c)} ${f2(hw)} 0`)
      p.setAttribute(
        'transform',
        `translate(${ex} ${f2(yy)}) rotate(${f2(side * btilt)})`,
      )
      p.setAttribute('stroke-width', `${f2(sw * g('browW'))}`)
    })

    // mouth
    const m = sh.mouth
    const mw = m.w * Math.max(0.05, g('mw'))
    const mt = g('mt') * m.d
    const mb = g('mb') * m.d
    let d: string
    if (m.type === 'poly')
      d = `M${f2(-mw)} 0L0 ${f2(mt)}L${f2(mw)} 0L0 ${f2(mb)}Z`
    else {
      const k = 4 / 3
      d = `M${f2(-mw)} 0C${f2(-mw)} ${f2(mb * k)} ${f2(mw)} ${f2(mb * k)} ${f2(mw)} 0C${f2(mw)} ${f2(mt * k)} ${f2(-mw)} ${f2(mt * k)} ${f2(-mw)} 0Z`
    }
    this.mouth.setAttribute('d', d)
    this.mouth.setAttribute(
      'transform',
      `translate(${f2(m.x + g('mx'))} ${f2(m.y + g('my'))}) rotate(${f2(g('mk'))})`,
    )
    this.mouth.setAttribute('stroke-width', `${f2(m.sw * this.st)}`)

    // cheeks
    const blush = clamp(g('blush'), 0, 1)
    this.cheeks.forEach((c, i) => {
      const [cx, cy] = sh.cheeks[i]!
      c.setAttribute('opacity', `${f2(blush)}`)
      c.setAttribute(
        'transform',
        `translate(${cx} ${f2(cy - lower * 4)}) scale(${f2(0.6 + 0.4 * blush)}) translate(${-cx} ${-cy})`,
      )
    })

    // signature trait
    const hair = g('hair')
    const lag = clamp((this.lag.y - -alt * this.R) * 0.4, -16, 16)
    if (sh.trait === 'square') {
      const yy = -2 - hair * 10 + lag
      const r = 22 + hair * 23
      this.traitG.setAttribute(
        'transform',
        `translate(170 ${f2(yy)}) rotate(${f2(r)})`,
      )
    } else if (sh.trait === 'fin') {
      const r = -22 + (hair >= 0 ? hair * 20 : hair * 55) - lag * 0.8
      this.traitG.setAttribute(
        'transform',
        `translate(108.6 ${f2(102.9 + lag * 0.25)}) rotate(${f2(r)})`,
      )
    } else if (sh.trait === 'dot') {
      // rests on the rounded apex; lifts clear of it when perky, rolls over
      // the tip and down the right slope when low
      const rr = 13.6 + 12.5
      const s = clamp(-hair, 0, 1.2)
      const th = (Math.min(1, s / 0.35) * 61.05 * Math.PI) / 180
      const travel = (Math.max(0, s - 0.35) / 0.65) * 92
      const cx = 170 + rr * Math.sin(th) + 0.4837 * travel
      let cy = 40.8 - rr * Math.cos(th) + 0.8753 * travel
      if (hair > 0) cy -= hair * 18
      cy += lag * (s > 0.35 ? 0.3 : 1)
      this.traitG.setAttribute(
        'transform',
        `translate(${f2(cx)} ${f2(cy)}) scale(${f2(1 + Math.max(0, hair) * 0.1)})`,
      )
    } else {
      const ang =
        ((-55 - hair * 14 - (hair < 0 ? hair * -21 : 0) + lag * 0.9) *
          Math.PI) /
        180
      const s = 1 + Math.max(0, hair) * 0.1
      this.traitG.setAttribute(
        'transform',
        `translate(${f2(170 + 158 * Math.cos(ang))} ${f2(170 + 158 * Math.sin(ang))}) scale(${f2(s)})`,
      )
      this.traitEl.setAttribute(
        'stroke-width',
        `${f2(7 * (this.state === 'angry' ? 1.25 : 1))}`,
      )
    }
  }
}
