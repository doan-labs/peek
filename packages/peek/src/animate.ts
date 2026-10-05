/*
 * The rig: springs, choreography, blinks, saccades and breathing, transcribed
 * from the v1.2 page. One module-level requestAnimationFrame loop steps every
 * live avatar; each step draws the tree for the current pose and writes only
 * the attributes that changed straight onto the DOM. React never hears about
 * a frame.
 *
 * Randomness lives here and only here: a face may be random in what it does,
 * never in what it is.
 */

import {
  clamp,
  type Drawable,
  type DrawOptions,
  draw,
  frameOf,
  type Gaze,
  type Node,
  type Pose,
  restPose,
  smooth,
  thingGaze,
  VB,
} from './draw'
import {
  type Channel,
  type Channels,
  EXPRESSIONS,
  type Expression,
  FACES,
  GROUPS,
  type Group,
} from './tables'

type Spring = [omega: number, zeta: number]
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

const GROUP_OF = {} as Record<Channel, Group>
for (const gr of Object.keys(GROUPS) as Group[])
  for (const c of GROUPS[gr]) GROUP_OF[c] = gr
const CHANNELS = Object.keys(GROUP_OF) as Channel[]

/* choreography: when each group starts moving, how springy it is, and timed
 * keys */
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
const CHOREO: Partial<Record<Expression, Choreo>> = {
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

/* how much the pointer steers the eyes, and the blink interval, per state */
const ATTENTION: Record<Expression, number> = {
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
const BLINK: Record<Expression, [number, number] | null> = {
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

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const zero = () => {
  const o = {} as Channels
  for (const c of CHANNELS) o[c] = 0
  return o
}

/* ---------- the shared loop ---------- */

/* every bound avatar, and the ones the loop steps (not under reduced
 * motion) */
const ALL = new Set<Live>()
const LIVE = new Set<Live>()
let raf = 0
let last = 0
function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (!document.hidden) {
    // every layout read before any write: one layout a frame, not one a face
    for (const l of LIVE) if (l.visible) l.measure()
    for (const l of LIVE) if (l.visible) l.step(dt)
  }
  raf = LIVE.size ? requestAnimationFrame(tick) : 0
}
function run() {
  if (raf) return
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

/* prefers-reduced-motion, watched once for every avatar */
let motionQuery: MediaQueryList | null = null
function reducedMotion() {
  if (!motionQuery) {
    motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', (e) => {
      for (const l of ALL) l.setReduced(e.matches)
    })
  }
  return motionQuery.matches
}

/* what the pointer is doing, in client px; listened to once, by the first
 * avatar that watches it */
let pointer: [number, number] | null = null
let listening = false
function listen() {
  if (listening) return
  listening = true
  const at = (e: PointerEvent) => {
    pointer = [e.clientX, e.clientY]
  }
  document.addEventListener('pointermove', at, { passive: true })
  document.addEventListener('pointerdown', at, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => {
    pointer = null
  })
}

type Bump = {
  ch: Channel
  amt: number
  t0: number
  a: number
  h: number
  r: number
}
type Queued = { at: number; set: Key[1]; spr?: Key[2] }

/**
 * One live avatar bound to an SVG that already shows `tree`. Starts settled
 * in `expression`, the same pose the server painted.
 */
export class Live {
  visible = true
  private state: Expression
  private reduced: boolean
  private nodes = new Map<string, Element>()
  private prev = new Map<string, Record<string, string>>()
  private io: IntersectionObserver | null = null
  private clock = 0
  private enteredAt = 0
  private val: Channels
  private vel = zero()
  private base: Channels
  private spr = {} as Record<Channel, Spring>
  private out = zero()
  private queue: Queued[] = []
  private bumps: Bump[] = []
  private blinkAt = rand(1, 3)
  private blinkT = -1
  private blinkDur = 0.16
  private blinkV = 0
  private doubleBlink = false
  private saccAt = rand(0.6, 1.8)
  private sacc = { gx: 0, gy: 0 }
  private nodAt = 0
  private lookThing: boolean
  private lag = { y: 0, v: 0 }
  private fixed: Gaze | null = null
  private watch = false
  private rect: DOMRect | null = null

  constructor(
    private svg: SVGSVGElement,
    tree: Node,
    private who: Drawable,
    private opts: DrawOptions,
    expression: Expression,
    gaze?: Gaze | 'pointer',
  ) {
    this.state = expression
    this.bind(tree, svg)
    this.setGaze(gaze)
    const start = restPose(who, expression, this.fixed ?? undefined)
    this.val = { ...start }
    this.base = { ...EXPRESSIONS[expression] }
    if (this.fixed) [this.base.gx, this.base.gy] = this.fixed
    for (const c of CHANNELS) this.spr[c] = DEF_SPR[GROUP_OF[c]]
    this.lookThing = expression === 'curious'
    this.lag.y = -start.alt * frameOf(FACES[who.face]).R
    this.reduced = reducedMotion()
    // the DOM may hold a pose other than this one: the first paint fixes it
    this.paint()
    this.io = new IntersectionObserver((es) => {
      for (const e of es) this.visible = e.isIntersecting
    })
    this.io.observe(svg)
    ALL.add(this)
    if (this.reduced) return
    LIVE.add(this)
    run()
  }

  destroy() {
    ALL.delete(this)
    LIVE.delete(this)
    this.io?.disconnect()
  }

  /** Reduced motion turned on or off while the page is open. */
  setReduced(reduced: boolean) {
    if (reduced === this.reduced) return
    this.reduced = reduced
    if (!reduced) {
      LIVE.add(this)
      run()
      return
    }
    LIVE.delete(this)
    this.snap()
  }

  /** Read before any face writes this frame; see tick(). */
  measure() {
    this.rect = this.watch && pointer ? this.svg.getBoundingClientRect() : null
  }

  /**
   * Pairs every node in the tree with the element React rendered for it,
   * and remembers what that element shows now, which is not always `node`.
   */
  private bind(node: Node, el: Element) {
    this.nodes.set(node.key, el)
    const now: Record<string, string> = {}
    for (const a of Array.from(el.attributes))
      if (a.name !== 'class' && a.name !== 'style') now[a.name] = a.value
    this.prev.set(node.key, now)
    node.children.forEach((c, i) => {
      const child = el.children[i]
      if (child) this.bind(c, child)
    })
  }

  private write(node: Node) {
    const el = this.nodes.get(node.key)
    const prev = this.prev.get(node.key) ?? {}
    if (el) {
      for (const k in node.attrs)
        if (prev[k] !== node.attrs[k]) el.setAttribute(k, node.attrs[k]!)
      for (const k in prev) if (!(k in node.attrs)) el.removeAttribute(k)
    }
    this.prev.set(node.key, node.attrs)
    for (const c of node.children) this.write(c)
  }

  setGaze(gaze?: Gaze | 'pointer') {
    this.fixed = Array.isArray(gaze) ? (gaze as Gaze) : null
    this.watch = gaze === 'pointer'
    if (this.watch) listen()
    if (this.reduced && this.fixed) {
      ;[this.val.gx, this.val.gy] = this.fixed
      this.paint()
    }
  }

  /* each group starts on its own beat */
  setExpression(name: Expression) {
    if (name === this.state) return
    const prev = this.state
    this.state = name
    this.enteredAt = this.clock
    this.lookThing = false
    this.queue = []
    const tgt = EXPRESSIONS[name]
    const ch = CHOREO[name] ?? {}
    const delay = { ...DEF_DELAY, ...ch.delay }
    const spr = { ...DEF_SPR, ...ch.spr }
    if (this.reduced) {
      this.snap()
      return
    }
    for (const gr of Object.keys(GROUPS) as Group[]) {
      const set: Key[1] = {}
      for (const c of GROUPS[gr]) set[c] = tgt[c]
      this.queue.push({
        at: this.clock + delay[gr] / 1000,
        set,
        spr: { [gr]: spr[gr] },
      })
    }
    for (const [t, set, s] of ch.keys ?? [])
      this.queue.push({ at: this.clock + t / 1000 + 1e-4, set, spr: s })
    this.queue.sort((a, b) => a.at - b.at)
    // a startled face wakes with a double blink
    if (name === 'surprised') {
      this.blinkAt = this.clock + 0.75
      this.doubleBlink = true
    }
    if (name === 'sleepy') this.nodAt = this.clock + rand(6, 8)
    if (prev === 'sleepy') this.bumps = []
  }

  /** Straight to the rest pose of the current state, no motion. */
  private snap() {
    const rest = restPose(this.who, this.state, this.fixed ?? undefined)
    for (const c of CHANNELS) {
      this.base[c] = EXPRESSIONS[this.state][c]
      this.val[c] = rest[c]
      this.vel[c] = 0
    }
    this.lookThing = this.state === 'curious'
    this.queue = []
    this.bumps = []
    this.blinkT = -1
    this.blinkV = 0
    this.out = zero()
    this.paint()
  }

  private bump(ch: Channel, amt: number, a: number, h: number, r: number) {
    this.bumps.push({ ch, amt, t0: this.clock, a, h, r })
  }

  step(dt: number) {
    this.clock += dt
    const t = this.clock
    const age = t - this.enteredAt
    const st = this.state
    const face = FACES[this.who.face]
    while (this.queue.length && this.queue[0]!.at <= t) {
      const q = this.queue.shift()!
      if (q.spr)
        for (const gr of Object.keys(q.spr) as Group[]) {
          const s = q.spr[gr]
          if (s) for (const c of GROUPS[gr]) this.spr[c] = s
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

    const tgt = zero()
    const out = zero()

    // gaze: resting target, micro saccades, the thing, the pointer
    let gx = this.base.gx
    let gy = this.base.gy
    if (this.lookThing) [gx, gy] = thingGaze(face, this.val.x, this.val.alt)
    if (this.fixed) [gx, gy] = this.fixed
    const still = st === 'sleepy' || st === 'bored'
    if (!still && t >= this.saccAt) {
      this.sacc = { gx: rand(-0.17, 0.17), gy: rand(-0.1, 0.1) }
      this.saccAt = t + rand(0.8, 2.6)
    }
    if (!still) {
      gx += this.sacc.gx
      gy += this.sacc.gy
    }
    const w = ATTENTION[st]
    const r = this.rect
    if (pointer && r && w > 0) {
      if (r.width > 0) {
        const fx = VB[0] + ((pointer[0] - r.left) / r.width) * VB[2]
        const fy = VB[1] + ((pointer[1] - r.top) / r.height) * VB[3]
        const { baseY, eyeY, R } = frameOf(face)
        const ex = 170 + this.val.x
        const ey = eyeY + baseY - this.val.alt * R
        const px = clamp((fx - ex) / 170, -1, 1)
        const py = clamp((fy - ey) / 170, -1, 1)
        gx += (px - gx) * w
        gy += (py - gy) * w
      }
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
    const h = dt / 2
    for (const c of CHANNELS) {
      const [om, ze] = this.spr[c]
      const target = this.base[c] + tgt[c]
      let x = this.val[c]
      let v = this.vel[c]
      for (let i = 0; i < 2; i++) {
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
        const u = this.blinkT / this.blinkDur
        if (u >= 1) {
          this.blinkT = -1
          if (this.doubleBlink) {
            this.doubleBlink = false
            this.blinkAt = t + 0.09
          } else {
            const k = this.who.persona.blink
            this.blinkAt = t + rand(bl[0] * k, bl[1] * k)
          }
        } else blink = Math.sin(u * Math.PI)
      }
    } else if (!bl) this.blinkT = -1
    this.blinkV = blink

    // the trait lags behind the body a little
    const R = frameOf(face).R
    const avY = -(this.val.alt + out.alt) * R
    const lom = 10
    const lze = 0.32
    this.lag.v +=
      (lom * lom * (avY - this.lag.y) - 2 * lze * lom * this.lag.v) * dt
    this.lag.y += this.lag.v * dt

    this.out = out
    this.paint()
  }

  private paint() {
    const R = frameOf(FACES[this.who.face]).R
    const pose = { blink: this.blinkV, expression: this.state } as Pose
    for (const c of CHANNELS) pose[c] = this.val[c] + this.out[c]
    pose.lag = this.reduced
      ? 0
      : clamp((this.lag.y + pose.alt * R) * 0.4, -16, 16)
    this.write(draw(this.who, pose, this.opts))
  }
}
