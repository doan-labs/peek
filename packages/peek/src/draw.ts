/*
 * One pure geometry function: an identity and a pose in, a plain node tree
 * out. The per-frame drawing is transcribed from render() in the v1.2 page,
 * so a static frame of an expression is the pose the rig settles to. The
 * animator calls the same function every frame and writes the difference.
 *
 * Structure depends only on the identity and the options, never the pose,
 * so a live tree keeps the same nodes frame to frame. A static tree drops
 * what is invisible (opacity 0) to stay small.
 */

import type { Axes, Persona } from './identity'
import {
  ACCESSORY_INK,
  type Channel,
  type Channels,
  COLORS,
  EXPRESSIONS,
  type Expression,
  FACES,
  type FaceGeom,
  INK,
} from './tables'

export type Node = {
  tag: string
  key: string
  attrs: Record<string, string>
  children: Node[]
}

export type Frame = 'ink' | 'bone' | 'paper' | 'none'
export type Gaze = readonly [x: number, y: number]

export type Pose = Channels & {
  /** 0..1, the blink closing both lids. */
  blink: number
  /** The trait's lag behind the body, frame units, clamped to 16. */
  lag: number
  /** The ring thickens when angry: the one place a state is read by name. */
  expression: Expression
}

export type DrawOptions = {
  /** Prefix for every id in the tree. Unique per avatar on a page. */
  id: string
  /** Rendered size in px: drives the stroke ramp and the riso print. */
  size: number
  frame: Frame
  /** false clips the frame to a circle. */
  square: boolean
  /** Riso plates, misregistration and grain. Fades out below 120px. */
  riso: boolean
  /** The accessible name; false marks the avatar decorative. */
  title: string | false
  /** Keep invisible nodes so an animator can write into them. */
  live?: boolean
}

export type Drawable = Axes & { persona: Persona }

/* The frame: viewBox -30 -30 400 400, the floor on its bottom edge. */
export const VB = [-30, -30, 400, 400] as const
const FLOOR = 370
const THING: Gaze = [330, 20]

export const clamp = (v: number, a: number, b: number) =>
  v < a ? a : v > b ? b : v
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const f2 = (v: number) => String(Math.round(v * 100) / 100)
const f3 = (v: number) => String(Math.round(v * 1000) / 1000)
const strokeFor = (px: number) =>
  px >= 96 ? 1 : px >= 56 ? 1.25 : px >= 40 ? 1.6 : px >= 30 ? 2 : 2.4
const RAD = Math.PI / 180
// the sprout, drawn upward from where it is planted
const STEM = 'M0 0Q3 -19 0 -36'
const LEAF0 = 'M0 -33C-24 -30 -38 -52 -25 -53C-12 -54 -2 -43 0 -33Z'
const LEAF1 = 'M0 -33C5 -54 28 -61 27 -48C26 -36 11 -31 0 -33Z'

/** Where a face rests: the body offset, the eye line, one altitude unit. */
export function frameOf(face: FaceGeom) {
  const baseY = FLOOR + face.sink - face.bottom
  const eyeY = face.eyes[0][1]
  // altitude -1 puts the eye line on the floor
  return { baseY, eyeY, R: FLOOR - (eyeY + baseY) }
}

/** The eyes' aim at the thing in the corner, from wherever they are. */
export function thingGaze(face: FaceGeom, x: number, alt: number): Gaze {
  const { baseY, eyeY, R } = frameOf(face)
  const ey = eyeY + baseY - alt * R
  return [
    clamp((THING[0] - 170 - x) / 150, -1, 1),
    clamp((THING[1] - ey) / 150, -1, 1),
  ]
}

/**
 * The pose an expression settles to. A curious face ends up looking at the
 * thing in the corner; an explicit gaze wins over both.
 */
export function restPose(
  who: Pick<Axes, 'face'>,
  expression: Expression,
  gaze?: Gaze,
): Pose {
  const s = EXPRESSIONS[expression]
  const pose: Pose = { ...s, blink: 0, lag: 0, expression }
  // the choreography's last key leaves curious leaning 7, not the table's 6
  if (expression === 'curious') pose.rot = 7
  const g =
    gaze ??
    (expression === 'curious' ? thingGaze(FACES[who.face], 0, s.alt) : null)
  if (g) [pose.gx, pose.gy] = g
  return pose
}

/**
 * A point on the crown outline grown by `d`, reached by walking `u` along it
 * from the top (where the outward normal points straight up); u > 0 walks
 * right. Returns the point and the normal's bearing in degrees.
 */
export function seat(
  crown: FaceGeom['crown'],
  d: number,
  u: number,
): { x: number; y: number; a: number } {
  const R = Math.max(0, crown.r + d)
  const at = ([x, y]: readonly [number, number], b: number) => ({
    x: x + R * Math.sin(b),
    y: y - R * Math.cos(b),
    a: b / RAD,
  })
  const P = crown.poly
  if (P.length === 1) return at(P[0]!, R ? u / R : 0)
  const n = P.length
  const dir = u >= 0 ? 1 : -1
  let left = Math.abs(u)
  let i = 0
  let b = 0
  for (let step = 0; step < n; step++) {
    const j = (i + dir + n) % n
    const [x0, y0] = P[i]!
    const [x1, y1] = P[j]!
    const ex = x1 - x0
    const ey = y1 - y0
    const L = Math.hypot(ex, ey)
    const nx = (dir * ey) / L
    const ny = (-dir * ex) / L
    const be = Math.atan2(nx, -ny)
    let db = be - b
    while (dir * db < 0) db += dir * 2 * Math.PI
    const arc = R * Math.abs(db)
    if (left <= arc) return at(P[i]!, R ? b + (dir * left) / R : b)
    left -= arc
    if (left <= L)
      return {
        x: x0 + (ex / L) * left + R * nx,
        y: y0 + (ey / L) * left + R * ny,
        a: be / RAD,
      }
    left -= L
    i = j
    b = be
  }
  return at(P[i]!, b)
}

/** Signed distance from a point to the crown outline, negative inside. */
export function depth(crown: FaceGeom['crown'], x: number, y: number) {
  const P = crown.poly
  if (P.length === 1) return Math.hypot(x - P[0]![0], y - P[0]![1]) - crown.r
  let out = -Infinity
  let near = Infinity
  for (let i = 0; i < P.length; i++) {
    const [ax, ay] = P[i]!
    const [bx, by] = P[(i + 1) % P.length]!
    const ex = bx - ax
    const ey = by - ay
    const L2 = ex * ex + ey * ey
    const L = Math.sqrt(L2)
    out = Math.max(out, ((x - ax) * ey - (y - ay) * ex) / L)
    const t = clamp(((x - ax) * ex + (y - ay) * ey) / L2, 0, 1)
    near = Math.min(near, Math.hypot(x - ax - t * ex, y - ay - t * ey))
  }
  return (out <= 0 ? out : near) - crown.r
}

/*
 * The ring is worn at one o'clock, 158 x 35deg along the crown from the top.
 * On a low or narrow crown that spot sits on the brow's outer end, so the
 * ring walks on down the outline until it clears the end at every height the
 * brow reaches (surprised, the widest persona, the heaviest brow), and rests
 * a little past that so it can still ride up, never back onto the brow.
 * Returns where it rests and how far up it may ride.
 */
const RING_U = 158 * 35 * RAD
export function ringWalk(sh: FaceGeom): { rest: number; min: number } {
  const ex = sh.eyes[1][0] + sh.brow.hw + 7
  const top = sh.brow.y - 30
  const bottom = sh.brow.y + 8
  let u = RING_U
  for (; u < 400; u += 2) {
    const s = seat(sh.crown, 8, u)
    const dx = s.x - ex
    const dy = s.y - clamp(s.y, top, bottom)
    if (s.x > ex ? Math.hypot(dx, dy) > 27 : s.y < top - 27) break
  }
  return u > RING_U ? { rest: u + 20, min: u } : { rest: u, min: -Infinity }
}

type Attrs = Record<string, string | number | false | undefined>
function n(tag: string, key: string, attrs: Attrs, children: Node[] = []) {
  const out: Record<string, string> = {}
  for (const k in attrs) {
    const v = attrs[k]
    if (v !== undefined && v !== false) out[k] = String(v)
  }
  return { tag, key, attrs: out, children }
}

/** Drops what cannot be seen: opacity 0, then groups left empty. */
function prune(node: Node): Node | null {
  if (node.attrs.opacity === '0') return null
  const children = node.children.map(prune).filter((c) => c !== null)
  if (node.tag === 'g' && children.length === 0) return null
  return { ...node, children }
}

export function draw(who: Drawable, pose: Pose, o: DrawOptions): Node {
  const sh: FaceGeom = FACES[who.face]
  const { body: fill, deep } = COLORS[who.color]
  const P = who.persona
  const mul = P.mul as Partial<Record<Channel, number>>
  const add = P.add as Partial<Record<Channel, number>>
  const g = (c: Channel) => pose[c] * (mul[c] ?? 1) + (add[c] ?? 0)
  const spread = P.spread
  const id = o.id
  const st = strokeFor(o.size)
  const { baseY, R } = frameOf(sh)
  const defs: Node[] = []

  // the frame
  const VBr = { x: VB[0], y: VB[1], width: VB[2], height: VB[3] }
  defs.push(
    n('clipPath', 'frame.clip', { id: `${id}-f` }, [
      o.square
        ? n('rect', 'frame.clip.shape', VBr)
        : n('circle', 'frame.clip.shape', { cx: 170, cy: 170, r: 200 }),
    ]),
  )

  // riso: registration error grows with size, nothing at 120px, about 1px
  // per plate at 480px and up; gentle edge wander plus mottled ink voids,
  // a different seed per plate
  const k = o.riso ? smooth(120, 480, o.size) : 0
  const riso = k > 0.01
  const upp = VB[2] / Math.max(o.size, 1)
  const mk = k * k
  const plate = (p: 'A' | 'B', seedA: number, seedB: number, sc: number) =>
    n(
      'filter',
      `riso.${p}`,
      {
        id: `${id}-p${p}`,
        x: '-20%',
        y: '-20%',
        width: '140%',
        height: '140%',
        'color-interpolation-filters': 'sRGB',
      },
      [
        n('feTurbulence', `riso.${p}.warp`, {
          type: 'fractalNoise',
          baseFrequency: '0.032',
          numOctaves: 2,
          seed: seedA,
          result: 'warp',
        }),
        n('feDisplacementMap', `riso.${p}.disp`, {
          in: 'SourceGraphic',
          in2: 'warp',
          scale: f2(sc * k),
          xChannelSelector: 'R',
          yChannelSelector: 'G',
          result: 'moved',
        }),
        n('feTurbulence', `riso.${p}.grain`, {
          type: 'fractalNoise',
          baseFrequency: '0.85',
          numOctaves: 2,
          seed: seedB,
          result: 'grain',
        }),
        n('feColorMatrix', `riso.${p}.mask`, {
          in: 'grain',
          type: 'matrix',
          values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f3(-8 * mk)} 0 0 0 ${f3(1 + 5.85 * mk)}`,
          result: 'mask',
        }),
        n('feComposite', `riso.${p}.out`, {
          in: 'moved',
          in2: 'mask',
          operator: 'in',
        }),
      ],
    )
  const grainy = riso && o.frame !== 'none'
  if (riso) defs.push(plate('A', 4, 11, 3.2), plate('B', 9, 23, 2.2))
  if (grainy) {
    // bone speckle on ink, ink speckle on light grounds
    const [r, gg, b] =
      o.frame === 'ink' ? [0.953, 0.941, 0.91] : [0.102, 0.098, 0.094]
    defs.push(
      n(
        'filter',
        'grain.filter',
        {
          id: `${id}-grain`,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          'color-interpolation-filters': 'sRGB',
        },
        [
          n('feTurbulence', 'grain.noise', {
            type: 'fractalNoise',
            baseFrequency: '0.9',
            numOctaves: 2,
            seed: 5,
          }),
          n('feColorMatrix', 'grain.matrix', {
            type: 'matrix',
            values: `0 0 0 0 ${r}  0 0 0 0 ${gg}  0 0 0 0 ${b}  7 0 0 0 -5.1`,
          }),
        ],
      ),
    )
  }

  // colour drains a little when bored
  const dim = clamp(g('dim'), 0, 1)
  if (o.live || dim > 0.01)
    defs.push(
      n(
        'filter',
        'dim.filter',
        { id: `${id}-dim`, 'color-interpolation-filters': 'sRGB' },
        [
          n('feColorMatrix', 'dim.matrix', {
            type: 'saturate',
            values: f3(1 - dim * 0.55),
          }),
        ],
      ),
    )

  // the body
  const alt = g('alt')
  const rot = g('rot')
  const x = g('x')
  const sx = g('sx')
  const sy = g('sy')
  const B = sh.bottom
  const ty = baseY - alt * R
  const sc = (v: number) => Math.round(v * 100000) / 100000
  const bodyNode =
    'd' in sh.body
      ? n('path', 'body', {
          d: sh.body.d,
          fill,
          stroke: sh.body.stroke ? fill : undefined,
          'stroke-width': sh.body.stroke,
          'stroke-linejoin': sh.body.stroke ? 'round' : undefined,
        })
      : n('circle', 'body', {
          cx: sh.body.circle[0],
          cy: sh.body.circle[1],
          r: sh.body.circle[2],
          fill,
        })

  // eyes
  const eyeS = g('eyeS')
  const rx = sh.rx * eyeS
  const ry = sh.ry * eyeS
  const lid0 = g('lid')
  const lidAsym = g('lidAsym')
  const lower = clamp(g('lower'), 0, 1)
  const blink = pose.blink
  const pupil = g('pupil')
  const gx = clamp(g('gx'), -1.1, 1.1)
  const gy = clamp(g('gy'), -1.1, 1.1)
  const tilt = g('lidTilt')
  const shine = clamp(g('shine'), 0, 1)
  const sw = sh.brow.w * st
  const bead = who.eyes === 'bead'
  const eyes = sh.eyes.map(([ex, ey], i) => {
    const side = i === 0 ? -1 : 1
    const kk = `eye${i}`
    let lid = clamp(lid0 + (i === 0 ? lidAsym : -lidAsym * 0.3), 0, 1)
    lid = lid + (1 - lid) * blink
    defs.push(
      n('clipPath', `${kk}.clip`, { id: `${id}-e${i}` }, [
        n('ellipse', `${kk}.clip.shape`, {
          cx: 0,
          cy: 0,
          rx: f2(rx),
          ry: f2(ry),
        }),
      ]),
      n('clipPath', `${kk}.lidclip`, { id: `${id}-l${i}` }, [
        n('ellipse', `${kk}.lidclip.shape`, {
          cx: 0,
          cy: 0,
          rx: f2(rx + 1.6),
          ry: f2(ry + 1.6),
        }),
      ]),
    )
    // what sits in the socket: a pupil on paper, a bare bead, or a rimmed eye
    const br = Math.min(sh.rx, sh.ry) * 0.62
    const pr = bead ? br * eyeS * (0.4 + 0.6 * pupil) : sh.pr * pupil
    const base = bead ? br : sh.pr
    const px = gx * Math.max(0, sh.rx - base) * 0.9
    const py = gy * Math.max(0, sh.ry - base) * 0.8
    // capped so a small rimmed eye stays an eye, not an ink blot
    const rimW = Math.min(sw * 0.8, Math.min(sh.rx, sh.ry) * 0.28)
    const inner: Node[] = []
    if (!bead)
      inner.push(
        n('ellipse', `${kk}.white`, {
          cx: 0,
          cy: 0,
          rx: f2(rx),
          ry: f2(ry),
          fill: INK.paper,
        }),
      )
    inner.push(
      n('circle', `${kk}.pupil`, {
        cx: f2(px),
        cy: f2(py),
        r: f2(pr),
        fill: INK.ink,
      }),
      n('circle', `${kk}.shine`, {
        cx: f2(px + pr * 0.44),
        cy: f2(py - pr * 0.44),
        r: f2(pr * (bead ? 0.26 : 0.3)),
        fill: INK.paper,
        opacity: f2(shine),
      }),
    )
    if (who.eyes === 'ring')
      inner.push(
        n('ellipse', `${kk}.rim`, {
          cx: 0,
          cy: 0,
          rx: f2(rx - rimW / 2),
          ry: f2(ry - rimW / 2),
          fill: 'none',
          stroke: INK.ink,
          'stroke-width': f2(rimW),
        }),
      )
    // upper lid: a straight cut, tilted, same as the v1.0 sad and angry lids
    const edge = -ry - 1.6 + lid * (2 * ry + 3.2)
    const a = side * tilt
    // lower lid: a wide arc pushing up from below, the smiling squint
    const lrx = rx * 1.55
    const lry = ry * 1.15
    const top = ry + 1.6 - lower * ry * 1.5
    const parts: Node[] = [
      n('g', `${kk}.inner`, { 'clip-path': `url(#${id}-e${i})` }, inner),
      n('g', `${kk}.lids`, { 'clip-path': `url(#${id}-l${i})` }, [
        n('rect', `${kk}.lid`, {
          x: f2(-rx * 2.2),
          y: f2(-ry * 3),
          width: f2(rx * 4.4),
          height: f2(Math.max(0, edge + ry * 3)),
          transform: `rotate(${f2(a)})`,
          fill,
        }),
        n('ellipse', `${kk}.lower`, {
          cx: 0,
          cy: f2(top + lry),
          rx: f2(lrx),
          ry: f2(lry),
          fill,
        }),
      ]),
    ]
    // a rimmed eye inks its lid edges too, so the outline follows the lids
    if (who.eyes === 'ring')
      parts.push(
        n(
          'g',
          `${kk}.edges`,
          {
            'clip-path': `url(#${id}-e${i})`,
            fill: 'none',
            stroke: INK.ink,
            'stroke-width': f2(rimW),
          },
          [
            n('path', `${kk}.edge`, {
              d: `M${f2(-rx * 2.2)} ${f2(edge)}H${f2(rx * 2.2)}`,
              transform: `rotate(${f2(a)})`,
              opacity: lid > 0.02 ? 1 : 0,
            }),
            n('ellipse', `${kk}.edge.lower`, {
              cx: 0,
              cy: f2(top + lry),
              rx: f2(lrx),
              ry: f2(lry),
              opacity: lower > 0.02 ? 1 : 0,
            }),
          ],
        ),
      )
    // closed eye: a hairline drawn once the lid is down
    const co = smooth(0.86, 1, lid)
    const yy = Math.min(edge, ry) - 1
    const hw = rx * 0.92
    parts.push(
      n('path', `${kk}.closed`, {
        d: `M${f2(-hw)} ${f2(yy - 2)}Q0 ${f2(yy + 6)} ${f2(hw)} ${f2(yy - 2)}`,
        transform: `rotate(${f2(a * 0.6)})`,
        fill: 'none',
        stroke: INK.ink,
        'stroke-linecap': 'round',
        'stroke-width': f2(sw * 0.85),
        opacity: co > 0.01 ? f2(co) : 0,
      }),
    )
    return n(
      'g',
      kk,
      {
        // a bead has no white to show where it looks, so the whole eye leans
        transform: bead
          ? `translate(${f2(ex + side * spread + gx * 6)} ${f2(ey + gy * 6)})`
          : `translate(${f2(ex + side * spread)} ${ey})`,
      },
      parts,
    )
  })

  // brows
  const browY = g('browY') - (eyeS - 1) * sh.ry * 0.9
  const btilt = g('browTilt')
  const arch = g('browArch')
  const basym = g('browAsym')
  const bw = sw * g('browW')
  const brows = sh.eyes.map(([ex], i) => {
    const side = i === 0 ? -1 : 1
    const hw = sh.brow.hw
    const c = -sh.brow.arch * arch
    // half-length, arch depth and stroke weight per type
    const [w, ca, k2] =
      who.brows === 'bar'
        ? [hw * 0.9, c * 0.3, 1.75]
        : who.brows === 'dash'
          ? [hw * 0.42, c * 0.25, 1.9]
          : [hw, c, 1]
    // wedge: tapered, heavy at the inner end, toward the nose
    const ti = bw * 1.7
    const to = bw * 0.45
    const [tl, tr] = side < 0 ? [to, ti] : [ti, to]
    const wedge = who.brows === 'wedge'
    const [hl, hr] = wedge ? [tl / 2 + to / 2, tr / 2 + to / 2] : [0, 0]
    const half = (t: number) => (wedge ? hl + (hr - hl) * t : (bw * k2) / 2)
    // a brow never leaves the face: raised into the outline, it stops there
    const bx = ex + side * spread
    const by = sh.brow.y + browY + (i === 1 ? -basym : basym * 0.3)
    const cos = Math.cos(side * btilt * RAD)
    const sin = Math.sin(side * btilt * RAD)
    const inside = (dy: number) => {
      for (let t = 0; t <= 1; t += 0.25) {
        const lx = w * (2 * t - 1)
        const ly = 2 * t * (1 - t) * ca
        const px = bx + lx * cos - ly * sin
        const py = by + dy + lx * sin + ly * cos
        if (depth(sh.crown, px, py) + half(t) + 2 > 0) return false
      }
      return true
    }
    let lo = 0
    let hi = 0
    if (!inside(0)) {
      hi = 40
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2
        if (inside(mid)) hi = mid
        else lo = mid
      }
    }
    const transform = `translate(${f2(bx)} ${f2(by + hi)}) rotate(${f2(side * btilt)})`
    const key = `brow${i}`
    if (wedge) {
      const dm = ((tl + tr) / 2) * 0.75
      return n('path', key, {
        d: `M${f2(-hw)} ${f2(-tl / 2)}Q0 ${f2(c - dm)} ${f2(hw)} ${f2(-tr / 2)}L${f2(hw)} ${f2(tr / 2)}Q0 ${f2(c + dm)} ${f2(-hw)} ${f2(tl / 2)}Z`,
        transform,
        fill: INK.ink,
        stroke: INK.ink,
        'stroke-linejoin': 'round',
        'stroke-width': f2(to),
      })
    }
    return n('path', key, {
      d: `M${f2(-w)} 0Q0 ${f2(ca)} ${f2(w)} 0`,
      transform,
      fill: 'none',
      stroke: INK.ink,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': f2(bw * k2),
    })
  })

  // mouth
  const m = sh.mouth
  const mw = m.w * Math.max(0.05, g('mw'))
  const mt = g('mt') * m.d
  const mb = g('mb') * m.d
  const kb = 4 / 3
  const w7 = mw * 0.72
  // line: one open stroke along the middle of the lips, so it stays a line
  // in every state: a smile, a frown, or flat where the others open
  const mid = ((mt + mb) / 2) * kb
  const d =
    who.mouth === 'poly'
      ? `M${f2(-mw)} 0L0 ${f2(mt)}L${f2(mw)} 0L0 ${f2(mb)}Z`
      : who.mouth === 'box'
        ? `M${f2(-mw)} 0L${f2(-w7)} ${f2(mb)}L${f2(w7)} ${f2(mb)}L${f2(mw)} 0L${f2(w7)} ${f2(mt)}L${f2(-w7)} ${f2(mt)}Z`
        : who.mouth === 'line'
          ? `M${f2(-mw)} 0C${f2(-mw * 0.5)} ${f2(mid)} ${f2(mw * 0.5)} ${f2(mid)} ${f2(mw)} 0`
          : `M${f2(-mw)} 0C${f2(-mw)} ${f2(mb * kb)} ${f2(mw)} ${f2(mb * kb)} ${f2(mw)} 0C${f2(mw)} ${f2(mt * kb)} ${f2(-mw)} ${f2(mt * kb)} ${f2(-mw)} 0Z`
  const open = who.mouth === 'line'
  const mouth = n('path', 'mouth', {
    d,
    transform: `translate(${f2(m.x + g('mx'))} ${f2(m.y + g('my'))}) rotate(${f2(g('mk'))})`,
    fill: open ? 'none' : INK.ink,
    stroke: INK.ink,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': f2(open ? sw : m.sw * st),
  })

  // cheeks
  const blush = clamp(g('blush'), 0, 1)
  const cheeks = sh.cheeks.map(([cx, cy], i) => {
    const key = `cheek${i}`
    const at = {
      opacity: f2(blush),
      transform: `translate(${f2(cx + (i === 0 ? -1 : 1) * spread * 0.6)} ${f2(cy - lower * 4)}) scale(${f2(0.6 + 0.4 * blush)}) translate(${-cx} ${-cy})`,
    }
    if (who.cheeks === 'dots') {
      const r = sh.cry * 0.9
      return n('g', key, { ...at, fill: deep }, [
        n('circle', `${key}.0`, { cx: f2(cx - sh.crx * 1.05), cy, r: f2(r) }),
        n('circle', `${key}.1`, { cx, cy: f2(cy + sh.cry * 0.5), r: f2(r) }),
        n('circle', `${key}.2`, { cx: f2(cx + sh.crx * 1.05), cy, r: f2(r) }),
      ])
    }
    if (who.cheeks === 'lines') {
      const h = sh.cry * 1.3
      return n(
        'g',
        key,
        {
          ...at,
          fill: 'none',
          stroke: deep,
          'stroke-linecap': 'round',
          'stroke-width': f2(sh.cry * 0.78),
        },
        [-1, 0, 1].map((j) => {
          const x0 = cx + j * sh.crx * 0.8
          return n('path', `${key}.${j + 1}`, {
            d: `M${f2(x0 + h * 0.5)} ${f2(cy - h)}L${f2(x0 - h * 0.5)} ${f2(cy + h)}`,
          })
        }),
      )
    }
    return n('ellipse', key, {
      cx,
      cy,
      rx: sh.crx,
      ry: sh.cry,
      fill: deep,
      ...at,
    })
  })

  // signature trait: each one keeps its v1.2 motion, measured from a seat on
  // the crown outline instead of a spot on its old face
  const hair = g('hair')
  const lag = pose.lag
  let traitT: string
  let shape: Node
  if (who.trait === 'square') {
    const s = seat(sh.crown, 22 + hair * 10, 0)
    traitT = `translate(${f2(s.x)} ${f2(s.y + lag)}) rotate(${f2(s.a + 22 + hair * 23)})`
    shape = n('rect', 'trait.shape', {
      x: -11,
      y: -11,
      width: 22,
      height: 22,
      fill: deep,
    })
  } else if (who.trait === 'fin') {
    const s = seat(sh.crown, -6, -164 * 22 * RAD)
    const r = s.a + (hair >= 0 ? hair * 20 : hair * 55) - lag * 0.8
    traitT = `translate(${f2(s.x)} ${f2(s.y + lag * 0.25)}) rotate(${f2(r)})`
    shape = n('path', 'trait.shape', {
      d: 'M0 0L0 -40A40 40 0 0 1 40 0Z',
      fill: deep,
    })
  } else if (who.trait === 'ring') {
    // worn at one o'clock; rides up when excited, slides when sleepy
    const b = 35 - hair * 14 - (hair < 0 ? hair * -21 : 0) + lag * 0.9
    const w = ringWalk(sh)
    const s = seat(sh.crown, 8, Math.max(w.min, w.rest + 158 * (b - 35) * RAD))
    traitT = `translate(${f2(s.x)} ${f2(s.y)}) scale(${f2(1 + Math.max(0, hair) * 0.1)})`
    shape = n('circle', 'trait.shape', {
      cx: 0,
      cy: 0,
      r: 12.5,
      fill: 'none',
      stroke: deep,
      'stroke-width': f2(7 * (pose.expression === 'angry' ? 1.25 : 1)),
    })
  } else if (who.trait === 'dot') {
    // rests on the top; lifts clear when perky, rolls over and down the
    // right slope when low
    const s = clamp(-hair, 0, 1.2)
    const th = Math.min(1, s / 0.35) * 61.05 * RAD
    const travel = (Math.max(0, s - 0.35) / 0.65) * 92
    const p = seat(sh.crown, 12.5, 26.1 * th + travel)
    let cy = p.y
    if (hair > 0) cy -= hair * 18
    cy += lag * (s > 0.35 ? 0.3 : 1)
    traitT = `translate(${f2(p.x)} ${f2(cy)}) scale(${f2(1 + Math.max(0, hair) * 0.1)})`
    shape = n('circle', 'trait.shape', { cx: 0, cy: 0, r: 12.5, fill: deep })
  } else {
    // peak: the mark's triangle worn on the crown; lifts when perky, keels
    // over sideways when low
    const s = seat(sh.crown, 4 + Math.max(0, hair) * 9, 0)
    const r = s.a + (hair < 0 ? -hair * 38 : 0) - lag * 0.5
    traitT = `translate(${f2(s.x)} ${f2(s.y + lag)}) rotate(${f2(r)}) scale(${f2(1 + Math.max(0, hair) * 0.1)})`
    shape = n('path', 'trait.shape', {
      d: 'M0 -27L13 -3L-13 -3Z',
      fill: deep,
      stroke: deep,
      'stroke-width': 6,
      'stroke-linejoin': 'round',
    })
  }
  const trait = n('g', 'trait', { transform: traitT }, [shape])

  // Wardrobe lives on the same body transform as the face. Glasses grow
  // around the eye sockets, never around the pupils, so gaze stays free.
  const wardrobe: Node[] = []
  // strokes follow the same ramp as the face, capped so small hats stay hats
  const w = (px: number) => f2(px * Math.min(st, 1.6))
  const line = {
    fill: 'none',
    stroke: INK.ink,
    'stroke-width': w(5.25),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }
  if (who.eyewear !== 'none') {
    const lx = sh.eyes[0][0] - spread
    const rr = sh.eyes[1][0] + spread
    const ey = sh.eyes[0][1]
    const gap = rr - lx
    const erx = Math.min(rx + 9, (gap - 15) / 2)
    const ery = ry + 9
    const glasses = who.eyewear === 'glasses'
    const lensX = glasses ? erx : Math.min(rx + 11, (gap - 12) / 2)
    const top = glasses ? ey - 4 : ey - ry - 2
    const frames: Node[] = [
      n('path', 'eyewear.bridge', {
        ...line,
        d: `M${f2(lx + lensX)} ${f2(top)}Q${f2((lx + rr) / 2)} ${f2(top - (glasses ? 13 : 0))} ${f2(rr - lensX)} ${f2(top)}`,
      }),
    ]
    for (const [i, cx] of [lx, rr].entries()) {
      const key = `eyewear.lens${i}`
      frames.push(
        n('path', `${key}.arm`, {
          ...line,
          d:
            i === 0
              ? `M${f2(cx - lensX - 9)} ${f2(top + 2)}L${f2(cx - lensX)} ${f2(top)}`
              : `M${f2(cx + lensX)} ${f2(top)}L${f2(cx + lensX + 9)} ${f2(top + 2)}`,
        }),
      )
      if (glasses) {
        frames.push(
          n('ellipse', key, {
            ...line,
            cx: f2(cx),
            cy: ey,
            rx: f2(erx),
            ry: f2(ery),
          }),
        )
        frames.push(
          n('path', `${key}.glint`, {
            ...line,
            stroke: INK.paper,
            'stroke-width': w(3),
            d: `M${f2(cx - erx * 0.65)} ${f2(ey - ery * 0.45)}Q${f2(cx - erx * 0.5)} ${f2(ey - ery * 0.8)} ${f2(cx - erx * 0.2)} ${f2(ey - ery * 0.86)}`,
          }),
        )
      } else {
        const h = ry * 2 + 9
        frames.push(
          n('path', key, {
            d: `M${f2(cx - lensX)} ${f2(top)}H${f2(cx + lensX)}V${f2(top + h * 0.55)}Q${f2(cx + lensX)} ${f2(top + h)} ${f2(cx)} ${f2(top + h)}Q${f2(cx - lensX)} ${f2(top + h)} ${f2(cx - lensX)} ${f2(top + h * 0.55)}Z`,
            fill: INK.ink,
            stroke: INK.ink,
            'stroke-width': w(3),
            'stroke-linejoin': 'round',
          }),
        )
        frames.push(
          n('path', `${key}.glint`, {
            ...line,
            stroke: INK.paper,
            'stroke-width': w(4),
            d: `M${f2(cx - lensX * 0.58)} ${f2(top + 19)}l8 -8m-1 15 6 -6`,
          }),
          n('circle', `${key}.pin`, {
            cx: f2(cx + lensX * 0.55),
            cy: f2(top + h - 9),
            r: 1.7,
            fill: INK.paper,
          }),
        )
      }
    }
    wardrobe.push(n('g', 'eyewear', {}, frames))
  }
  if (who.headwear !== 'none') {
    // Reserve the side opposite the crest. The seat stays fixed through
    // expressions, so a moving crest never makes a hat switch sides.
    const side = who.trait === 'ring' || who.trait === 'dot' ? -1 : 1
    const cap = who.headwear === 'cap'
    const sprout = who.headwear === 'sprout'
    // The sheet measures placement across the crown, not along its arc.
    // Solve that horizontal offset so low, round faces keep the brim above
    // their brows instead of walking the hat down the side of the body.
    const inset = sprout ? -6 : cap ? -8 : 0
    const offset = sprout ? 34 : 40
    let lo = 0
    let hi = 160
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2
      const p = seat(sh.crown, inset, side * mid)
      if (side * (p.x - 170) < offset) lo = mid
      else hi = mid
    }
    const anchor = seat(sh.crown, inset, (side * (lo + hi)) / 2)
    const angle = clamp(anchor.a, -40, 40)
    const parts: Node[] = []
    if (cap) {
      parts.push(
        n('path', 'headwear.crown', {
          ...line,
          fill: INK.paper,
          d: 'M-33 0C-35 -20 -20 -39 0 -39C20 -39 35 -20 33 0Z',
        }),
        n('path', 'headwear.seam', {
          ...line,
          'stroke-width': w(3.5),
          d: 'M-4 -38Q9 -24 8 -1',
        }),
        n('path', 'headwear.brim', {
          ...line,
          'stroke-width': w(7),
          d: side > 0 ? 'M-35 1Q8 4 52 3' : 'M-52 3Q-8 4 35 1',
        }),
        n('circle', 'headwear.button', {
          cx: 0,
          cy: -40,
          r: 3.5,
          fill: INK.ink,
        }),
      )
    } else if (sprout) {
      parts.push(
        // a body-colored halo keeps the ink stem off an ink ground
        n('path', 'headwear.halo', {
          ...line,
          stroke: fill,
          'stroke-width': w(11),
          d: `${STEM}${LEAF0}${LEAF1}`,
        }),
        n('path', 'headwear.stem', {
          ...line,
          'stroke-width': w(4.5),
          d: STEM,
        }),
        n('path', 'headwear.leaf0', {
          ...line,
          'stroke-width': w(4),
          fill: COLORS.mint.body,
          d: LEAF0,
        }),
        n('path', 'headwear.leaf1', {
          ...line,
          'stroke-width': w(4),
          fill: COLORS.mint.deep,
          d: LEAF1,
        }),
      )
    } else {
      parts.push(
        n('path', 'headwear.wings', {
          d: 'M-3 0C-13 -16 -28 -23 -29 -10C-31 2 -26 19 -16 13L-3 4L3 4L16 13C26 19 31 2 29 -10C28 -23 13 -16 3 0Z',
          fill: INK.ink,
          // the same halo, painted under the fill
          stroke: fill,
          'stroke-width': w(6),
          'stroke-linejoin': 'round',
          'paint-order': 'stroke',
        }),
        n('ellipse', 'headwear.knot', {
          cx: 0,
          cy: 1,
          rx: 6,
          ry: 8,
          fill: ACCESSORY_INK.knot,
        }),
      )
    }
    wardrobe.push(
      n(
        'g',
        'headwear',
        {
          transform: `translate(${f2(anchor.x)} ${f2(anchor.y)}) rotate(${f2(sprout ? angle * 0.5 : angle)})`,
        },
        parts,
      ),
    )
  }
  if (who.neckwear === 'tie') {
    // The knot follows the mouth's lowest edge, including its skew. The
    // floor clips the blade, just as it clips the creature itself.
    const skew = Math.abs(Math.sin(g('mk') * RAD)) * mw
    const bottom = Math.max(0, mt * kb, mb * kb) + skew + m.sw * st
    wardrobe.push(
      n(
        'g',
        'neckwear',
        {
          transform: `translate(${m.x} ${f2(m.y + g('my') + bottom + 8)})`,
          fill: INK.ink,
        },
        [
          n('path', 'neckwear.knot', {
            d: 'M-9 0Q-11 0 -9 4L-5 11Q0 15 5 11L9 4Q11 0 9 0Z',
          }),
          n('path', 'neckwear.blade', {
            d: 'M-4 15L-13 63Q-14 66 -11 69L0 79L11 69Q14 66 13 63L4 15Z',
          }),
        ],
      ),
    )
  }

  // the plates sit a hair out of register at large sizes
  const off = (dx: number, dy: number) =>
    riso ? `translate(${f2(dx * k * upp)} ${f2(dy * k * upp)})` : undefined
  const av = n(
    'g',
    'av',
    {
      transform: `translate(${f2(x)} ${f2(ty)}) rotate(${f2(rot)} 170 ${B}) translate(170 ${B}) scale(${sc(sx)} ${sc(sy)}) translate(-170 ${-B})`,
      filter: dim > 0.01 ? `url(#${id}-dim)` : undefined,
    },
    [
      n(
        'g',
        'plateA',
        {
          transform: off(-0.55, 0.45),
          filter: riso ? `url(#${id}-pA)` : undefined,
        },
        [bodyNode, ...cheeks, trait],
      ),
      n(
        'g',
        'plateB',
        {
          transform: off(0.6, -0.5),
          filter: riso ? `url(#${id}-pB)` : undefined,
        },
        [...eyes, ...brows, mouth, ...wardrobe],
      ),
    ],
  )

  // the thing in the corner: a dot lattice from the mark's vocabulary
  const scene: Node[] = []
  if (o.frame !== 'none') {
    const bg =
      o.frame === 'ink' ? INK.ink : o.frame === 'bone' ? INK.bone : INK.paper
    scene.push(n('rect', 'bg', { ...VBr, fill: bg }))
    const th = clamp(g('thing'), 0, 1)
    const dots: Node[] = []
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const q = j * 3 + i
        const kk = smooth(q / 12, q / 12 + 0.35, th)
        dots.push(
          n('circle', `lattice.${q}`, {
            cx: 312 + i * 18,
            cy: 2 + j * 18,
            r: f2(1.2 + 2.2 * kk),
            opacity: f3(kk * 0.55),
          }),
        )
      }
    scene.push(
      n('g', 'lattice', { fill: o.frame === 'ink' ? INK.bone : INK.ink }, dots),
    )
  }
  scene.push(av)
  if (grainy)
    scene.push(
      n('rect', 'grain', {
        ...VBr,
        filter: `url(#${id}-grain)`,
        opacity: o.frame === 'ink' ? 0.3 : 0.16,
        'pointer-events': 'none',
      }),
    )

  const root = n(
    'svg',
    'root',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: VB.join(' '),
      width: o.size,
      height: o.size,
      role: o.title === false ? undefined : 'img',
      'aria-label': o.title === false ? undefined : o.title,
      'aria-hidden': o.title === false ? 'true' : undefined,
    },
    [
      n('defs', 'defs', {}, defs),
      n('g', 'frame', { 'clip-path': `url(#${id}-f)` }, scene),
    ],
  )
  return o.live ? root : (prune(root) ?? root)
}
