import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { depth, draw, type Node, restPose } from './draw'
import { fnv1a, identify, seed, tidy } from './identity'
import { Peek } from './peek'
import { settle, toSvg } from './svg'
import {
  ACCESSORIES,
  type AccessorySlot,
  COLORS,
  EXPRESSIONS,
  type Expression,
  FACES,
  type Face,
  PARTS,
} from './tables'

const NAMES = [
  'Ada Lovelace',
  '  Ada  Lovelace ',
  'ADA LOVELACE',
  'Đoàn',
  'Doa\u0300n', // decomposed: NFC folds it into the line above
  '東京',
  'Zoë 🙂',
  '',
  'x',
]

/** Every node, flattened to key -> serialized attrs. */
const flat = (node: Node, out = new Map<string, string>()) => {
  out.set(node.key, JSON.stringify(node.attrs))
  for (const c of node.children) flat(c, out)
  return out
}

describe('determinism', () => {
  test('toSvg is byte-identical across calls', () => {
    for (const name of NAMES)
      for (const expression of Object.keys(EXPRESSIONS) as Expression[]) {
        const a = toSvg(name, { expression, riso: true, size: 480 })
        expect(toSvg(name, { expression, riso: true, size: 480 })).toBe(a)
        expect(a.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
          true,
        )
      }
  })

  test('tidy folds case, spacing and normalization', () => {
    expect(tidy('  Ada  Lovelace ')).toBe('ada lovelace')
    expect(identify('  Ada  Lovelace')).toEqual(identify('ada lovelace'))
    expect(identify('Doa\u0300n')).toEqual(identify('Do\u00e0n'))
    expect(toSvg('  Ada\tLovelace', { title: false })).toBe(
      toSvg('ada lovelace', { title: false }),
    )
  })

  test('renderToString of <Peek> is stable', () => {
    const el = createElement(Peek, { name: 'Ada', expression: 'happy' })
    const a = renderToString(el)
    expect(renderToString(el)).toBe(a)
    expect(a).toContain('aria-label="Ada"')
    const live = createElement(Peek, { name: 'Ada', animate: true })
    expect(renderToString(live)).toBe(renderToString(live))
  })
})

describe('axes', () => {
  test('every axis has its own seed', () => {
    const axes = ['face', 'color', ...Object.keys(PARTS), 'persona']
    const seeds = new Set(axes.map((a) => seed('ada lovelace', a)))
    expect(seeds.size).toBe(axes.length)
  })

  test('overriding one axis changes only that axis', () => {
    const name = 'Grace Hopper'
    const base = identify(name)
    const before = flat(draw(...args(name, { expression: 'happy' })))
    const prefix = {
      eyes: 'eye',
      brows: 'brow',
      mouth: 'mouth',
      cheeks: 'cheek',
      trait: 'trait',
    }
    for (const part of Object.keys(PARTS) as (keyof typeof PARTS)[]) {
      const other = PARTS[part].find((t) => t !== base[part])!
      const after = flat(
        draw(...args(name, { [part]: other, expression: 'happy' })),
      )
      const changed = [...new Set([...before.keys(), ...after.keys()])].filter(
        (k) => before.get(k) !== after.get(k),
      )
      expect(changed.length).toBeGreaterThan(0)
      for (const k of changed) expect(k.startsWith(prefix[part])).toBe(true)
    }
    const recolored = settle(name, { color: 'aqua' }).who
    expect({ ...recolored, color: base.color }).toEqual(base)
  })

  // the stability contract: these must never change at peek@1
  test('golden identities at peek@1', () => {
    const pick = (n: string) => {
      const { face, color, eyes, brows, mouth, cheeks, trait, persona, hash } =
        identify(n, { version: 1 })
      return { hash, face, color, eyes, brows, mouth, cheeks, trait, persona }
    }
    expect(
      ['Ada Lovelace', 'Linh', 'Đoàn', '東京', 'Doan Labs'].map(pick),
    ).toMatchInlineSnapshot(`
      [
        {
          "brows": "bar",
          "cheeks": "oval",
          "color": "lavender",
          "eyes": "oval",
          "face": "semicircle",
          "hash": 2551461758,
          "mouth": "round",
          "persona": {
            "add": {
              "browArch": -0.15,
              "browTilt": 0.52,
              "browY": -1,
              "gx": -0.04,
              "hair": -0.11,
              "my": -0.55,
              "rot": 1.71,
            },
            "blink": 1.02,
            "mul": {
              "browW": 0.96,
              "eyeS": 0.98,
              "mw": 1.06,
              "pupil": 1.07,
            },
            "spread": -2.89,
          },
          "trait": "dot",
        },
        {
          "brows": "dash",
          "cheeks": "dots",
          "color": "rose",
          "eyes": "ring",
          "face": "triangle",
          "hash": 182124976,
          "mouth": "box",
          "persona": {
            "add": {
              "browArch": 0.06,
              "browTilt": -0.32,
              "browY": -1.84,
              "gx": -0.03,
              "hair": 0.02,
              "my": -0.29,
              "rot": 1.37,
            },
            "blink": 1.22,
            "mul": {
              "browW": 1.08,
              "eyeS": 1.07,
              "mw": 0.86,
              "pupil": 0.98,
            },
            "spread": 6.86,
          },
          "trait": "ring",
        },
        {
          "brows": "bar",
          "cheeks": "lines",
          "color": "aqua",
          "eyes": "bead",
          "face": "semicircle",
          "hash": 4054591250,
          "mouth": "round",
          "persona": {
            "add": {
              "browArch": -0.03,
              "browTilt": -1.43,
              "browY": -3.51,
              "gx": -0.01,
              "hair": 0.22,
              "my": -0.77,
              "rot": 2.58,
            },
            "blink": 1.32,
            "mul": {
              "browW": 1.08,
              "eyeS": 0.97,
              "mw": 1.12,
              "pupil": 1,
            },
            "spread": -3.37,
          },
          "trait": "peak",
        },
        {
          "brows": "arch",
          "cheeks": "dots",
          "color": "lavender",
          "eyes": "ring",
          "face": "diamond",
          "hash": 1759422319,
          "mouth": "poly",
          "persona": {
            "add": {
              "browArch": -0.14,
              "browTilt": -0.11,
              "browY": -1.17,
              "gx": 0.1,
              "hair": 0.13,
              "my": 0.86,
              "rot": 2.81,
            },
            "blink": 0.94,
            "mul": {
              "browW": 1.06,
              "eyeS": 1.02,
              "mw": 1.05,
              "pupil": 1.02,
            },
            "spread": 4,
          },
          "trait": "ring",
        },
        {
          "brows": "arch",
          "cheeks": "dots",
          "color": "clay",
          "eyes": "bead",
          "face": "diamond",
          "hash": 2812769953,
          "mouth": "poly",
          "persona": {
            "add": {
              "browArch": 0.28,
              "browTilt": 0.64,
              "browY": 0.55,
              "gx": 0.06,
              "hair": 0.15,
              "my": -1.36,
              "rot": 0.3,
            },
            "blink": 0.79,
            "mul": {
              "browW": 1.13,
              "eyeS": 0.96,
              "mw": 0.93,
              "pupil": 0.93,
            },
            "spread": -3.91,
          },
          "trait": "peak",
        },
      ]
    `)
  })
})

// draw.ts reads no version, so this is what holds a stored peek@1 face
// still: any draw change has to re-snapshot here, on purpose
test('golden svg at peek@1', () => {
  const sums = Object.fromEntries(
    ['Ada Lovelace', 'Linh', 'Đoàn', '東京'].map((name) => {
      let all = ''
      for (const expression of Object.keys(EXPRESSIONS) as Expression[])
        for (const size of [48, 300])
          all += toSvg(name, { expression, size, version: 1 })
      return [name, fnv1a(all).toString(36)]
    }),
  )
  expect(sums).toMatchInlineSnapshot(`
    {
      "Ada Lovelace": "iy6qf3",
      "Linh": "l6lya4",
      "Đoàn": "1qvkegk",
      "東京": "c3eobf",
    }
  `)
})

test('svg stays well formed', () => {
  // XML 1.0 has no place for C0 controls or lone surrogates
  const svg = toSvg('a\u0000b\uD800<"&', { size: 128 })
  expect(svg).toContain('aria-label="a\uFFFDb\uFFFD&lt;&quot;&amp;"')
  expect(svg.includes('\u0000') || svg.includes('\uD800')).toBe(false)
})

test('different avatars never share ids', () => {
  const id = (s: string) => s.match(/clipPath id="([^"]+)"/)![1]
  const a = toSvg('Ada')
  expect(id(toSvg('ADA '))).toBe(id(a))
  expect(id(toSvg('Ada', { square: false }))).not.toBe(id(a))
  expect(id(toSvg('Ada', { expression: 'happy' }))).not.toBe(id(a))
  expect(id(toSvg('Ada', { face: 'circle' }))).not.toBe(
    id(toSvg('Ada', { face: 'triangle' })),
  )
})

test('every face x part x expression draws clean', () => {
  const bad = /NaN|undefined|Infinity/
  for (const face of Object.keys(FACES) as (keyof typeof FACES)[])
    for (const part of Object.keys(PARTS) as (keyof typeof PARTS)[])
      for (const type of PARTS[part])
        for (const expression of Object.keys(EXPRESSIONS) as Expression[]) {
          const o = { face, [part]: type, expression, riso: true, size: 300 }
          const svg = toSvg('Ada', o)
          expect(bad.test(svg)).toBe(false)
          const { who, pose, opts } = settle('Ada', o, true)
          expect(bad.test(JSON.stringify(draw(who, pose, opts)))).toBe(false)
        }
  expect(Object.keys(COLORS).length).toBe(7)
})

test('brows never leave the face, even raised on the widest persona', () => {
  const find = (node: Node, key: string): Node | undefined =>
    node.key === key
      ? node
      : node.children.map((c) => find(c, key)).find(Boolean)
  for (const face of Object.keys(FACES) as (keyof typeof FACES)[])
    for (const brows of PARTS.brows)
      for (const expression of Object.keys(EXPRESSIONS) as Expression[]) {
        const { who, opts } = settle('x', { face, brows })
        const p = who.persona
        who.persona = {
          ...p,
          spread: 7,
          add: { ...p.add, browY: -4, browTilt: -5, browArch: 0.3 },
          mul: { ...p.mul, eyeS: 1.08, browW: 1.2 },
        }
        const tree = draw(who, restPose(who, expression), opts)
        for (const key of ['brow0', 'brow1']) {
          const { transform, d } = find(tree, key)!.attrs
          const [x, y, a] = transform!
            .match(/translate\((\S+) (\S+)\) rotate\((\S+)\)/)!
            .slice(1)
            .map(Number) as [number, number, number]
          const w = -Number(d!.match(/^M(\S+?) /)![1])
          const r = (a * Math.PI) / 180
          for (const s of [-1, 1])
            expect(
              depth(
                FACES[face].crown,
                x + s * w * Math.cos(r),
                y + s * w * Math.sin(r),
              ),
            ).toBeLessThan(0)
        }
      }
})

test('a live tree keeps its structure across poses', () => {
  const { who, opts } = settle('Linh', {}, true)
  const keys = (e: Expression) => [
    ...flat(draw(who, restPose(who, e), opts)).keys(),
  ]
  const ref = keys('normal')
  for (const e of Object.keys(EXPRESSIONS) as Expression[])
    expect(keys(e)).toEqual(ref)
})

function args(name: string, o: object) {
  // a fixed id: the default one changes with every axis on purpose
  const { who, pose, opts } = settle(name, { id: 'p', ...o })
  return [who, pose, opts] as const
}

describe('accessories', () => {
  test('wardrobe slots default to none at peek@1 and override independently', () => {
    const base = identify('Linh', { version: 1 })
    expect([base.eyewear, base.headwear, base.neckwear]).toEqual([
      'none',
      'none',
      'none',
    ])
    for (const [slot, list] of Object.entries(ACCESSORIES)) {
      for (const item of list) {
        const dressed = settle('Linh', { [slot]: item, version: 1 }).who
        expect({ ...dressed, [slot]: base[slot as AccessorySlot] }).toEqual(
          base,
        )
      }
    }
    expect(toSvg('Linh')).toBe(
      toSvg('Linh', { eyewear: 'none', headwear: 'none', neckwear: 'none' }),
    )
    expect(toSvg('Linh')).toBe(
      toSvg('Linh', { eyewear: 'glass', headwear: 'hat' } as never),
    )
    expect(toSvg('Linh', { eyewear: 'glasses' })).not.toBe(
      toSvg('Linh', { eyewear: 'sunglasses' }),
    )
  })

  test('every wardrobe combination fits a finite, stable live tree on every face and trait', () => {
    const keys = (node: Node): string[] => [
      node.key,
      ...node.children.flatMap(keys),
    ]
    for (const face of Object.keys(FACES) as Face[]) {
      for (const trait of PARTS.trait) {
        for (const eyewear of ACCESSORIES.eyewear) {
          for (const headwear of ACCESSORIES.headwear) {
            for (const neckwear of ACCESSORIES.neckwear) {
              const { who, opts } = settle(
                'Linh',
                { face, trait, eyewear, headwear, neckwear },
                true,
              )
              const reference = keys(draw(who, restPose(who, 'normal'), opts))
              for (const expression of Object.keys(
                EXPRESSIONS,
              ) as Expression[]) {
                const tree = draw(who, restPose(who, expression, [-1, 1]), opts)
                expect(keys(tree)).toEqual(reference)
                expect(
                  /NaN|Infinity|undefined/.test(JSON.stringify(tree)),
                ).toBe(false)
              }
            }
          }
        }
      }
    }
  })

  test('accessories are deterministic with frames, riso, gaze and React SSR', () => {
    for (const frame of ['ink', 'bone', 'paper', 'none'] as const) {
      for (const square of [true, false]) {
        for (const eyes of PARTS.eyes) {
          const o = {
            frame,
            square,
            eyes,
            eyewear: 'glasses',
            headwear: 'sprout',
            neckwear: 'tie',
            expression: 'surprised',
            gaze: [1, -1],
            riso: true,
            size: 300,
          } as const
          const svg = toSvg('Linh', o)
          expect(toSvg('Linh', o)).toBe(svg)
          expect(svg).toContain('M-4 15L-13 63')
          const el = createElement(Peek, { name: 'Linh', ...o, animate: true })
          const react = renderToString(el)
          expect(renderToString(el)).toBe(react)
          expect(react).toContain('M-4 15L-13 63')
          expect(react).toContain('aria-label="Linh"')
        }
      }
    }
  })
})
