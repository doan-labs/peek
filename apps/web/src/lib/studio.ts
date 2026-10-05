/*
 * What /studio shares between its parts: the look every avatar on the page
 * wears (set from the control bar), the cast on the wall, and the snippet
 * a visitor copies. Identity always comes from the name; the look is state.
 */
import {
  EXPRESSIONS,
  type Expression,
  type Frame,
  LATEST,
  type PeekOptions,
  VERSIONS,
} from '@doanlabs/peek'

export type Look = {
  expression: Expression
  frame: Frame
  square: boolean
  /** The wall's tile size in px. Big views pick their own. */
  size: number
  animate: boolean
  follow: boolean
  riso: boolean
}

export const LOOK: Look = {
  expression: 'normal',
  frame: 'ink',
  square: true,
  size: 64,
  animate: true,
  follow: true,
  riso: false,
}

/** Distinct faces peek@LATEST can draw, from the version's own table. */
export const COMBOS = Object.values(VERSIONS[LATEST]!).reduce(
  (n, len) => n * len,
  1,
)

export const EXPRESSION_LIST = Object.keys(EXPRESSIONS) as Expression[]

export const SIZES = [40, 64, 96, 128] as const
export const FRAMES: readonly Frame[] = ['ink', 'bone', 'paper', 'none']

/** Shown, and drawn, while the name field is empty. */
export const DEFAULT_NAME = 'Ada Lovelace'

/* 43 names: with a typed name that is not one of them, 44 tiles, which
 * never leaves one alone on the last row at any column count the wall can
 * take */
export const NAMES = [
  'Linh',
  'Kwame',
  'Sofia',
  'Hiroshi',
  'Amara',
  'Mateo',
  'Priya',
  'Oskar',
  'Nia',
  'Thanh',
  'Yara',
  'Lucas',
  'Mei',
  'Tariq',
  'Freya',
  'Diego',
  'Aiko',
  'Olu',
  'Inès',
  'Rafael',
  'Saoirse',
  'Arjun',
  'Zainab',
  'Emil',
  'Leilani',
  'Chen Wei',
  'Fatima',
  'Noor',
  'Kai',
  'Elif',
  'Bảo',
  'Anya',
  'Tomás',
  'Ifeoma',
  'Mira',
  'Sven',
  'Lior',
  'Paloma',
  'Hana',
  'Dmitri',
  'Ana Lúcia',
  'Rangi',
  'Selin',
] as const

/** The props a Peek gets from the look, minus size and name. */
export const lookProps = (look: Look) => ({
  expression: look.expression,
  frame: look.frame,
  square: look.square,
  riso: look.riso,
  animate: look.animate,
  gaze: look.follow ? ('pointer' as const) : undefined,
})

/** The same look as toSvg options, for the copy and download actions. */
export const svgOptions = (look: Look, size: number): PeekOptions => ({
  expression: look.expression,
  frame: look.frame,
  square: look.square,
  riso: look.riso,
  size,
})

const q = (s: string) => JSON.stringify(s)

/** The JSX for one avatar in this look: only what differs from a default. */
export function jsxFor(name: string, look: Look, size: number) {
  const a = [`name=${q(name)}`]
  if (size !== 64) a.push(`size={${size}}`)
  if (look.expression !== 'normal') a.push(`expression=${q(look.expression)}`)
  if (look.frame !== 'ink') a.push(`frame=${q(look.frame)}`)
  if (!look.square) a.push('square={false}')
  if (look.riso) a.push('riso')
  if (look.animate) a.push('animate')
  if (look.animate && look.follow) a.push('gaze="pointer"')
  return `<Peek ${a.join(' ')} />`
}

/** A file-safe name for downloads. */
export const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'peek'
