/* The README banner: one face of every color in a row, all turned to the
 * one in the middle, which looks back at you. Run `bun scripts/banner.ts`. */
import { writeFile } from 'node:fs/promises'
import { toSvg } from '../src/svg'
import type { Expression } from '../src/tables'

const CAST: [string, Expression][] = [
  ['Iris', 'curious'],
  ['Noor', 'happy'],
  ['Finn', 'attentive'],
  ['Nia', 'excited'],
  ['Max', 'surprised'],
  ['Uma', 'confused'],
  ['Lan', 'sleepy'],
]
const SIZE = 160
const mid = (CAST.length - 1) / 2

const faces = CAST.map(([name, expression], i) => {
  const look = Math.max(-1, Math.min(1, (mid - i) / 1.5))
  const svg = toSvg(name, {
    size: SIZE,
    expression,
    gaze: [look, i === mid ? 0 : 0.15],
    riso: true,
  })
  return svg.replace('<svg ', `<svg x="${i * SIZE}" y="0" `)
})

const width = CAST.length * SIZE
await writeFile(
  new URL('../../../.github/banner.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${SIZE}" width="${width}" height="${SIZE}" role="img" aria-label="Seven Peek faces looking at the one in the middle"><clipPath id="banner"><rect width="${width}" height="${SIZE}" rx="16"/></clipPath><g clip-path="url(#banner)">${faces.join('')}</g></svg>\n`,
)
