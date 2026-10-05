/*
 * A name in, an identity out. Every axis hashes on its own seed, so changing
 * one list never moves another axis:
 *
 *   seed(axis) = fnv1a(`peek@${version}:${axis}:${tidy(name)}`)
 *
 * The persona (continuous proportions and habits) is transcribed from
 * faceFor() in the v1.2 page: same ranges, same draw order.
 */

import {
  type Axis,
  type Brows,
  type Cheeks,
  COLORS,
  type Color,
  type Eyes,
  FACES,
  type Face,
  LATEST,
  type Mouth,
  PARTS,
  type Trait,
  VERSIONS,
} from './tables'

export const STYLE = 'peek'

export const tidy = (s: string) =>
  s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()

/** FNV-1a over the UTF-8 bytes. */
export function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Persona = {
  /** Eye gap offset, in frame units, per side. */
  spread: number
  /** Blink interval factor (animation only). */
  blink: number
  add: {
    browY: number
    browTilt: number
    browArch: number
    rot: number
    hair: number
    gx: number
    my: number
  }
  mul: { eyeS: number; pupil: number; browW: number; mw: number }
}

/** The axes a caller may override. Everything a face is. */
export type Axes = {
  face: Face
  color: Color
  eyes: Eyes
  brows: Brows
  mouth: Mouth
  cheeks: Cheeks
  trait: Trait
}

export type Identity = Axes & {
  /** The tidied name. */
  key: string
  /** fnv1a of the tidied name, version-free: a fingerprint for display. */
  hash: number
  version: number
  persona: Persona
}

/** What each axis picks from, in list order. Append-only. */
export const LISTS: { readonly [A in Axis]: readonly Axes[A][] } = {
  face: Object.keys(FACES) as Face[],
  color: Object.keys(COLORS) as Color[],
  ...PARTS,
}
/** The axes in readout order. */
export const AXES = Object.keys(LISTS) as Axis[]

export function seed(name: string, axis: string, version = LATEST) {
  return fnv1a(`${STYLE}@${version}:${axis}:${tidy(name)}`)
}

export function identify(
  name: string,
  { version = LATEST }: { version?: number } = {},
): Identity {
  const lengths = VERSIONS[version]
  if (!lengths) throw new Error(`peek@${version} does not exist`)
  const pick = <A extends Axis>(axis: A) =>
    LISTS[axis][seed(name, axis, version) % lengths[axis]] as Identity[A]

  const rnd = mulberry32(seed(name, 'persona', version))
  const r = (a: number, b: number) =>
    Math.round((a + rnd() * (b - a)) * 100) / 100
  // object literal order is the draw order: never reorder these lines
  const persona: Persona = {
    spread: r(-7, 7),
    blink: r(0.75, 1.4),
    add: {
      browY: r(-4, 4),
      browTilt: r(-5, 5),
      browArch: r(-0.2, 0.3),
      rot: r(-3, 3),
      hair: r(-0.2, 0.35),
      gx: r(-0.12, 0.12),
      my: r(-2, 3),
    },
    mul: {
      eyeS: r(0.92, 1.08),
      pupil: r(0.9, 1.12),
      browW: r(0.85, 1.2),
      mw: r(0.85, 1.18),
    },
  }
  const key = tidy(name)
  return {
    key,
    hash: fnv1a(key),
    version,
    face: pick('face'),
    color: pick('color'),
    eyes: pick('eyes'),
    brows: pick('brows'),
    mouth: pick('mouth'),
    cheeks: pick('cheeks'),
    trait: pick('trait'),
    persona,
  }
}
