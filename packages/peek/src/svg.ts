/*
 * toSvg: a name in, a standalone SVG string out. Same input, same bytes, on
 * any machine. Shares its defaults with <Peek> through settle().
 */

import {
  type DrawOptions,
  draw,
  type Frame,
  type Gaze,
  type Node,
  type Pose,
  restPose,
} from './draw'
import { type Axes, fnv1a, type Identity, identify } from './identity'
import { ACCESSORIES, type AccessorySlot, type Expression } from './tables'

export type PeekOptions = Partial<Axes> & {
  /** px. Drives the stroke ramp (thicker below 96) and the riso print. */
  size?: number
  expression?: Expression
  /** Where the eyes look, x and y in -1..1. */
  gaze?: Gaze
  frame?: Frame
  /** false clips the frame to a circle. Default true. */
  square?: boolean
  /** Accessible name, default the name; false marks it decorative. */
  title?: string | false
  /** Riso plates and grain, visible from 120px up. Default off. */
  riso?: boolean
  /** Pin a style version. Default the latest. */
  version?: number
  /** Prefix for ids inside the SVG. Default derived from everything drawn,
   * so two different avatars inlined in one page never share defs. */
  id?: string
}

// an unknown item from untyped callers keeps what the name picked
const wear = <S extends AccessorySlot>(o: PeekOptions, base: Identity, s: S) =>
  (ACCESSORIES[s] as readonly string[]).includes(o[s] as string)
    ? (o[s] as Identity[S])
    : base[s]

/**
 * A name decides identity unless the caller overrides an axis: an explicit
 * face, color or part wins over the hash, and every other axis stays put.
 */
export function settle(
  name: string,
  o: PeekOptions,
  live = false,
): { who: Identity; pose: Pose; opts: DrawOptions } {
  const base = identify(name, { version: o.version })
  const who: Identity = {
    ...base,
    face: o.face ?? base.face,
    color: o.color ?? base.color,
    eyes: o.eyes ?? base.eyes,
    brows: o.brows ?? base.brows,
    mouth: o.mouth ?? base.mouth,
    cheeks: o.cheeks ?? base.cheeks,
    trait: o.trait ?? base.trait,
    eyewear: wear(o, base, 'eyewear'),
    headwear: wear(o, base, 'headwear'),
    neckwear: wear(o, base, 'neckwear'),
  }
  const pose = restPose(who, o.expression ?? 'normal', o.gaze)
  const look = {
    size: o.size ?? 64,
    frame: o.frame ?? 'ink',
    square: o.square ?? true,
    riso: o.riso ?? false,
    live,
  }
  // Keep the byte-level peek@1 contract for faces without accessories.
  const { eyewear, headwear, neckwear, ...legacy } = who
  const wardrobe =
    eyewear !== 'none' || headwear !== 'none' || neckwear !== 'none'
  const id =
    o.id ??
    `peek-${fnv1a(JSON.stringify([wardrobe ? who : legacy, pose, look])).toString(36)}`
  return { who, pose, opts: { ...look, id, title: o.title ?? name } }
}

// characters XML 1.0 cannot hold at all: C0 controls and lone surrogates
const ILLEGAL =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g

const esc = (s: string) =>
  s
    .replace(ILLEGAL, '\uFFFD')
    .replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
    )

export function serialize(node: Node): string {
  let a = ''
  for (const k in node.attrs) a += ` ${k}="${esc(node.attrs[k]!)}"`
  if (!node.children.length) return `<${node.tag}${a}/>`
  return `<${node.tag}${a}>${node.children.map(serialize).join('')}</${node.tag}>`
}

export function toSvg(name: string, props: PeekOptions = {}): string {
  const { who, pose, opts } = settle(name, props)
  return serialize(draw(who, pose, opts))
}
