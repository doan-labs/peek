/* The README images, drawn by Peek itself. Run `bun scripts/banner.ts`.
 * banner.svg: one face of every color, all turned to the one in the middle.
 * expressions.svg: one name through every expression.
 * names.svg: a name under each face, to show the name is the face. */
import { writeFile } from 'node:fs/promises'
import { type PeekOptions, toSvg } from '../src/svg'
import { EXPRESSIONS, type Expression, INK } from '../src/tables'

type Tile = { name: string; opts: PeekOptions; label?: string }

const LABEL = 32

function sheet(
  file: string,
  alt: string,
  tiles: Tile[],
  cols: number,
  size: number,
) {
  const labelled = tiles.some((t) => t.label)
  const rowH = size + (labelled ? LABEL : 0)
  const rows = Math.ceil(tiles.length / cols)
  const w = cols * size
  const h = rows * rowH
  const at = (i: number) => [(i % cols) * size, Math.floor(i / cols) * rowH]
  const faces = tiles.map(({ name, opts }, i) => {
    const [x, y] = at(i)
    return toSvg(name, { size, riso: true, ...opts }).replace(
      '<svg ',
      `<svg x="${x}" y="${y}" `,
    )
  })
  // labels sit in their own group: fill set on a parent leaks into faces
  const labels = tiles.map(({ label }, i) => {
    const [x = 0, y = 0] = at(i)
    return label
      ? `<text x="${x + size / 2}" y="${y + size + 21}">${label}</text>`
      : ''
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${alt}"><clipPath id="sheet"><rect width="${w}" height="${h}" rx="16"/></clipPath><g clip-path="url(#sheet)"><rect width="${w}" height="${h}" fill="${INK.ink}"/>${faces.join('')}<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" letter-spacing="1" fill="${INK.bone}" fill-opacity="0.6" text-anchor="middle">${labels.join('')}</g></g></svg>\n`
  return writeFile(new URL(`../../../.github/${file}`, import.meta.url), svg)
}

const CAST: [string, Expression][] = [
  ['Iris', 'curious'],
  ['Noor', 'happy'],
  ['Finn', 'attentive'],
  ['Nia', 'excited'],
  ['Max', 'surprised'],
  ['Uma', 'confused'],
  ['Lan', 'sleepy'],
]
const mid = (CAST.length - 1) / 2
await sheet(
  'banner.svg',
  'Seven Peek faces looking at the one in the middle',
  CAST.map(([name, expression], i) => ({
    name,
    opts: {
      expression,
      gaze: [Math.max(-1, Math.min(1, (mid - i) / 1.5)), i === mid ? 0 : 0.15],
    },
  })),
  CAST.length,
  160,
)

const EXPR = Object.keys(EXPRESSIONS) as Expression[]
await sheet(
  'expressions.svg',
  `One Peek face in ${EXPR.length} expressions`,
  EXPR.map((expression) => ({
    name: 'Nia',
    opts: { expression },
    label: expression.toUpperCase(),
  })),
  6,
  140,
)

const NAMES = [
  'Ada',
  'Bao',
  'Cy',
  'Dev',
  'Hana',
  'Kai',
  'Linh',
  'Mai',
  'Oz',
  'Quinn',
  'Thanh',
  'Zoe',
]
await sheet(
  'names.svg',
  'Twelve names, twelve Peek faces',
  NAMES.map((name) => ({ name, opts: {}, label: name.toUpperCase() })),
  6,
  140,
)
