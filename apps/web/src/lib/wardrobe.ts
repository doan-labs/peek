/* Showcase outfits are seeded independently from identity. They look random
 * but stay identical on the server, on hydration and on the next visit.
 * This is a caller choice: peek@1 itself still defaults to no accessories. */
import type { Axes } from '@doan-labs/peek'
import { fnv1a, tidy } from '@doan-labs/peek/identity'

export type Wardrobe = Pick<Axes, 'eyewear' | 'headwear' | 'neckwear'>
const PICKS = {
  eyewear: ['none', 'none', 'glasses', 'sunglasses'],
  headwear: ['none', 'none', 'bow', 'cap', 'sprout'],
  neckwear: ['none', 'none', 'none', 'tie'],
} as const

export function wardrobeFor(name: string): Wardrobe {
  const key = tidy(name)
  const pick = <K extends keyof Wardrobe>(slot: K): Wardrobe[K] => {
    const list = PICKS[slot]
    return list[fnv1a(`wardrobe:${slot}:${key}`) % list.length] as Wardrobe[K]
  }
  const outfit = {
    eyewear: pick('eyewear'),
    headwear: pick('headwear'),
    neckwear: pick('neckwear'),
  }
  // Every showcase face gets something, while most avoid a full costume.
  if (Object.values(outfit).every((item) => item === 'none')) {
    const hats = ['bow', 'cap', 'sprout'] as const
    outfit.headwear = hats[fnv1a(`wardrobe:extra:${key}`) % hats.length]!
  }
  return outfit
}

const worn = (name: string) =>
  Object.entries(wardrobeFor(name)).filter(([, value]) => value !== 'none')

/** Explicit props for the code printed next to a showcase face. */
export const wardrobeJsx = (name: string) =>
  worn(name)
    .map(([slot, value]) => `${slot}="${value}"`)
    .join(' ')

/** The same outfit as toSvg options, as printed code. */
export const wardrobeTs = (name: string) =>
  `{ ${worn(name)
    .map(([slot, value]) => `${slot}: '${value}'`)
    .join(', ')} }`
