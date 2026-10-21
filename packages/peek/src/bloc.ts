/*
 * Bloc, from the Bloc sheet (direction A, palette P2): every face rebuilt
 * from a square, a circle and a bar. The same four silhouettes, the body cut
 * in two down the middle (strong on the left, light on the right), one ink
 * bar for both brows, and the trait as a block over the upper right outline.
 * No round corners, no gradients, no outlines.
 *
 * Expressions come from the same channels as peek, read as three moulds:
 * round eyes and a whole bar at rest, a level cut from below or above for
 * the smiling and the drowsy, a tilted cut and a bar broken in two for the
 * angry, the sad and the confused. The bar is always two halves, so it
 * breaks and mends continuously when animated.
 */

import {
  clamp,
  depth,
  f2,
  type Node,
  n,
  type Parts,
  seat,
  smooth,
} from './draw'
import { BLOC, COLORS, FACES, type Face, type FaceGeom, INK } from './tables'

const RAD = Math.PI / 180

/* Peek's silhouettes; the triangle's round joins are cut sharp and it grows
 * to the 300 box the circle and the diamond fill, its base unmoved. */
const TRI = [
  [170, 12.8],
  [320, 312.8],
  [20, 312.8],
] as const
const BODY: Record<Face, { body: FaceGeom['body']; crown: FaceGeom['crown'] }> =
  {
    diamond: FACES.diamond,
    semicircle: FACES.semicircle,
    circle: FACES.circle,
    triangle: {
      body: { d: `M${TRI.map((p) => p.join(' ')).join('L')}Z` },
      crown: { poly: TRI, r: 0 },
    },
  }

// Bloc's own ramps: lines thicken 2.6x below 30px, eyes and trait grow
const strokeFor = (px: number) =>
  px >= 96 ? 1 : px >= 56 ? 1.25 : px >= 40 ? 1.6 : px >= 30 ? 2 : 2.6
const boostFor = (px: number) => (px < 30 ? 1.25 : px < 56 ? 1.12 : 1)

/** A point turned by `deg` about the origin, y down. */
const turn = (x: number, y: number, deg: number) => {
  const c = Math.cos(deg * RAD)
  const s = Math.sin(deg * RAD)
  return [x * c - y * s, x * s + y * c] as const
}
const poly = (pts: readonly (readonly [number, number])[]) =>
  `M${pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join('L')}Z`

export function blocParts({ who, pose, o, defs, g }: Parts): [Node[], Node[]] {
  const sh: FaceGeom = FACES[who.face]
  const { body, crown } = BODY[who.face]
  const id = o.id
  const P = who.persona
  const spread = P.spread
  const st = strokeFor(o.size)
  const up = boostFor(o.size)
  const strong = BLOC[who.color]
  // the light half goes deep on light grounds, so the body never sinks in
  const light =
    o.frame === 'bone' || o.frame === 'paper'
      ? COLORS[who.color].deep
      : COLORS[who.color].body
  const lineW = sh.brow.w * st

  // the body: one block, its right half cut out in the light ink
  defs.push(
    n('clipPath', 'half', { id: `${id}-r` }, [
      n('rect', 'half.shape', { x: 170, y: -30, width: 200, height: 400 }),
    ]),
  )
  const block = (key: string, fill: string, clip?: string) =>
    'd' in body
      ? n('path', key, { d: body.d, fill, 'clip-path': clip })
      : n('circle', key, {
          cx: body.circle[0],
          cy: body.circle[1],
          r: body.circle[2],
          fill,
          'clip-path': clip,
        })

  // eyes: a paper disc with its pupil, a solid bead, or a rimmed ring
  const eyeS = g('eyeS')
  const r0 = Math.sqrt(sh.rx * sh.ry) * up
  const lid0 = g('lid')
  const lidAsym = g('lidAsym')
  const lower = clamp(g('lower'), 0, 1)
  const pupil = g('pupil')
  const gx = clamp(g('gx'), -1.1, 1.1)
  const gy = clamp(g('gy'), -1.1, 1.1)
  const tilt = g('lidTilt')
  const bead = who.eyes === 'bead'
  const eyes = sh.eyes.map(([ex, ey], i) => {
    const side = i === 0 ? -1 : 1
    const kk = `eye${i}`
    let lid = clamp(lid0 + (i === 0 ? lidAsym : -lidAsym * 0.3), 0, 1)
    lid = lid + (1 - lid) * pose.blink
    // peek rests its lid a tenth down; a Bloc eye rests whole
    const cut = clamp((lid - 0.1) / 0.9, 0, 1)
    const r = bead ? r0 * 0.7 * eyeS * (0.4 + 0.6 * pupil) : r0 * eyeS
    const [tx, ty] = bead
      ? [ex + side * spread + gx * 6, ey + gy * 6]
      : [ex + side * spread, ey]
    // the cuts: a straight lid from above, tilted, and a level one below
    const a = side * tilt
    const edge = -r - 1 + cut * (2 * r + 2)
    const floor = r + 1 - lower * r * 2.2
    const W = r + 2
    const lidAt = (x: number) =>
      x * Math.tan(a * RAD) + edge / Math.cos(a * RAD)
    const [t0, t1] = [lidAt(-W), lidAt(W)]
    defs.push(
      n('clipPath', `${kk}.clip`, { id: `${id}-e${i}` }, [
        n('path', `${kk}.clip.shape`, {
          d: poly([
            [-W, t0],
            [W, t1],
            [W, Math.max(floor, t1)],
            [-W, Math.max(floor, t0)],
          ]),
        }),
      ]),
    )
    const pr = sh.pr * pupil * up
    const px = gx * Math.max(0, r - pr) * 0.85
    const py = gy * Math.max(0, r - pr) * 0.75
    const rim = Math.min(r * 0.27 * Math.min(st, 1.6), r * 0.4)
    const inner: Node[] = bead
      ? [n('circle', `${kk}.bead`, { cx: 0, cy: 0, r: f2(r), fill: INK.ink })]
      : [
          n('circle', `${kk}.white`, {
            cx: 0,
            cy: 0,
            r: f2(r),
            fill: INK.paper,
          }),
          n('circle', `${kk}.pupil`, {
            cx: f2(px),
            cy: f2(py),
            r: f2(pr),
            fill: INK.ink,
          }),
        ]
    if (who.eyes === 'ring')
      inner.push(
        n('circle', `${kk}.rim`, {
          cx: 0,
          cy: 0,
          r: f2(r - rim / 2),
          fill: 'none',
          stroke: INK.ink,
          'stroke-width': f2(rim),
        }),
      )
    // closed: a bar where the eye was
    const co = smooth(0.86, 1, lid)
    const yy = Math.min(edge, r) - lineW / 2
    return n('g', kk, { transform: `translate(${f2(tx)} ${f2(ty)})` }, [
      n('g', `${kk}.inner`, { 'clip-path': `url(#${id}-e${i})` }, inner),
      n('path', `${kk}.closed`, {
        d: `M${f2(-r * 0.95)} ${f2(yy)}H${f2(r * 0.95)}`,
        transform: `rotate(${f2(a * 0.6)})`,
        stroke: INK.ink,
        'stroke-width': f2(lineW * 1.4),
        opacity: co > 0.01 ? f2(co) : 0,
      }),
    ])
  })

  // the bar: both brows in one, from one eye's outer edge to the other's.
  // The persona slants it; the expression's tilt breaks it into a V or a
  // caret; asymmetry lifts its right end. It never leaves the body.
  const bt = pose.browTilt
  const basym = g('browAsym')
  const th = lineW * 2 * g('browW')
  const hw =
    sh.eyes[1][0] - 170 + spread + Math.sqrt(sh.rx * sh.ry) * P.mul.eyeS * up
  const gap = smooth(0, 8, Math.abs(bt)) * th * 0.9
  const slant = P.add.browTilt * 0.3 - Math.atan((1.3 * basym) / (2 * hw)) / RAD
  const y0 = sh.brow.y + g('browY') - (eyeS - 1) * sh.ry * 0.9 - 0.35 * basym
  // `len` shortens the bar from its outer ends, 1 is full length
  const halves = (dy: number, len = 1) =>
    [-1, 1].map((s) => {
      const [ox, oy] = turn((s * gap) / 2, 0, slant)
      const x0 = 170 + ox
      const yy = y0 + dy + oy
      const ang = slant + s * bt
      const [ux, uy] = turn(s * (hw * len - gap / 2), 0, ang)
      const [nx, ny] = turn(0, th / 2, ang)
      return [
        [x0 - nx, yy - ny],
        [x0 + ux - nx, yy + uy - ny],
        [x0 + ux + nx, yy + uy + ny],
        [x0 + nx, yy + ny],
      ] as const
    })
  const inside = (dy: number, len = 1) =>
    halves(dy, len).every((q) =>
      q.every(([x, y]) => depth(crown, x, y) + 2 < 0),
    )
  // pushed down until it fits; if even that fails, it grows shorter
  let lo = 0
  let hi = 0
  if (!inside(0)) {
    hi = 60
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      if (inside(mid)) hi = mid
      else lo = mid
    }
  }
  let len = 1
  if (!inside(hi)) {
    let short = 0
    for (let k = 0; k < 12; k++) {
      const mid = (short + len) / 2
      if (inside(hi, mid)) short = mid
      else len = mid
    }
    len = short
  }
  const bars = halves(hi, len).map((q, i) =>
    n('path', `bar${i}`, { d: poly(q), fill: INK.ink }),
  )

  // mouth: poly a turned square, round a half disc, line a bar, box a
  // block. Diamonds and triangles get a bigger one, it vanished at 16px.
  const m = sh.mouth
  const big =
    (who.face === 'diamond' || who.face === 'triangle' ? 1.25 : 1) * up
  const mw = m.w * Math.max(0.05, g('mw')) * big
  const mt = g('mt') * m.d * big
  const mb = g('mb') * m.d * big
  const mid = (mt + mb) / 2
  const kb = 4 / 3
  let d: string
  if (who.mouth === 'poly') {
    const s = Math.max(mw * 0.9, (mb - mt) / 2)
    d = poly([
      [-s, mid],
      [0, mid - s],
      [s, mid],
      [0, mid + s],
    ])
  } else if (who.mouth === 'box') {
    const h = Math.max(mb - mt, lineW * 1.6) / 2
    const w = mw * 0.85
    d = poly([
      [-w, mid - h],
      [w, mid - h],
      [w, mid + h],
      [-w, mid + h],
    ])
  } else if (who.mouth === 'line') {
    const h = (lineW * 1.4) / 2
    const w = mw * 1.5
    const y = mid * 0.5
    d = poly([
      [-w, y - h],
      [w, y - h],
      [w, y + h],
      [-w, y + h],
    ])
  } else {
    d = `M${f2(-mw)} 0C${f2(-mw)} ${f2(mb * kb)} ${f2(mw)} ${f2(mb * kb)} ${f2(mw)} 0C${f2(mw)} ${f2(mt * kb)} ${f2(-mw)} ${f2(mt * kb)} ${f2(-mw)} 0Z`
  }
  const mouth = n('path', 'mouth', {
    d,
    transform: `translate(${f2(m.x + g('mx'))} ${f2(m.y + g('my'))}) rotate(${f2(g('mk'))})`,
    fill: INK.ink,
  })

  // the trait, as a block over the upper right outline. Perky lifts it
  // clear, low slides it down the side.
  const hair = g('hair')
  const s = seat(crown, Math.max(0, hair) * 8, 110 + Math.max(0, -hair) * 40)
  const shape =
    who.trait === 'square'
      ? n('rect', 'trait.shape', { x: -21, y: -21, width: 42, height: 42 })
      : who.trait === 'dot'
        ? n('circle', 'trait.shape', { cx: 0, cy: 0, r: 22 })
        : who.trait === 'ring'
          ? n('circle', 'trait.shape', {
              cx: 0,
              cy: 0,
              r: 17.5,
              fill: 'none',
              stroke: strong,
              'stroke-width': 13,
            })
          : who.trait === 'fin'
            ? n('path', 'trait.shape', { d: 'M-27 27V-27A54 54 0 0 1 27 27Z' })
            : // peak stands as a bar, upright and short of the brow bar's length
              n('rect', 'trait.shape', {
                x: -16,
                y: -30,
                width: 32,
                height: 60,
              })
  const trait = n(
    'g',
    'trait',
    {
      transform: `translate(${f2(s.x)} ${f2(s.y + pose.lag)}) scale(${f2(up)})`,
      fill: strong,
    },
    [shape],
  )

  return [
    [block('body', strong), block('body.light', light, `url(#${id}-r)`), trait],
    [...eyes, ...bars, mouth],
  ]
}
