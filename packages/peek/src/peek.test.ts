import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { render as svelteRender } from 'svelte/server'
import { createSSRApp, h } from 'vue'
import { renderToString as vueRender } from 'vue/server-renderer'
import { depth, draw, type Node, restPose } from './draw'
import { fnv1a, identify, seed, tidy } from './identity'
import { Peek, type PeekProps } from './peek'
import SveltePeek from './peek.svelte'
import { type PeekOptions, settle, toSvg } from './svg'
import {
  ACCESSORIES,
  type AccessorySlot,
  COLORS,
  EXPRESSIONS,
  type Expression,
  FACES,
  type Face,
  PARTS,
  VARIANTS,
} from './tables'
import { Peek as VuePeek } from './vue'

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

describe('variants', () => {
  const SHEET = [
    'Linh',
    'Thanh',
    'Minh Anh',
    'Kwame',
    'Trợ lý',
    'Lan',
    'Sofia',
    'Viết code',
    'Bạn học',
    'Thu Hà',
    'Nam',
    'Diego',
  ]

  test('a variant changes how a face is drawn, never who it is', () => {
    for (const name of SHEET)
      for (const variant of VARIANTS)
        expect(settle(name, { variant }).who).toEqual(settle(name, {}).who)
    // peek is the default, and an unknown variant draws peek
    expect(toSvg('Linh', { variant: 'peek' })).toBe(toSvg('Linh'))
    expect(toSvg('Linh', { variant: 'mist' } as never)).toBe(toSvg('Linh'))
    const id = (s: string) => s.match(/clipPath id="([^"]+)"/)![1]
    const ids = new Set(
      VARIANTS.map((variant) => id(toSvg('Ada', { variant }))),
    )
    expect(ids.size).toBe(VARIANTS.length)
  })

  test('haze tints each sheet name with the neighbor the sheet shows', () => {
    const tint = (name: string) =>
      toSvg(name, { variant: 'haze' }).match(
        /-ht"[^>]*><stop offset="0" stop-color="(#\w+)"/,
      )![1]
    expect(SHEET.map(tint)).toEqual([
      '#C8B1F5',
      '#85D3DC',
      '#A3DAB5',
      '#C8B1F5',
      '#E1CC7A',
      '#9EC3F2',
      '#C8B1F5',
      '#E1CC7A',
      '#F0A9C4',
      '#E1CC7A',
      '#F0A9C4',
      '#F0A9C4',
    ])
  })

  test('every variant x face x part x expression draws a clean, stable live tree', () => {
    const bad = /NaN|undefined|Infinity/
    for (const variant of ['haze', 'bloc'] as const)
      for (const face of Object.keys(FACES) as Face[])
        for (const part of Object.keys(PARTS) as (keyof typeof PARTS)[])
          for (const type of PARTS[part]) {
            const o = { variant, face, [part]: type, riso: true, size: 300 }
            const { who, opts } = settle('Ada', o, true)
            const ref = [
              ...flat(draw(who, restPose(who, 'normal'), opts)).keys(),
            ]
            for (const expression of Object.keys(EXPRESSIONS) as Expression[]) {
              expect(bad.test(toSvg('Ada', { ...o, expression }))).toBe(false)
              const tree = draw(who, restPose(who, expression, [-1, 1]), opts)
              expect(bad.test(JSON.stringify(tree))).toBe(false)
              expect([...flat(tree).keys()]).toEqual(ref)
            }
          }
  })

  test("bloc's bar never leaves the body, even raised on the widest persona", () => {
    const find = (node: Node, key: string): Node | undefined =>
      node.key === key
        ? node
        : node.children.map((c) => find(c, key)).find(Boolean)
    for (const face of Object.keys(FACES) as Face[])
      for (const size of [16, 300])
        for (const expression of Object.keys(EXPRESSIONS) as Expression[]) {
          const { who, opts } = settle('x', { face, variant: 'bloc', size })
          const p = who.persona
          // past the persona's own ranges, as a spring overshoot can go
          who.persona = {
            ...p,
            spread: 10,
            add: { ...p.add, browY: -10, browTilt: -15 },
            mul: { ...p.mul, eyeS: 1.2, browW: 1.5 },
          }
          const tree = draw(who, restPose(who, expression), opts)
          // the triangle is cut sharp for bloc, so test against its own outline
          const crown =
            face === 'triangle'
              ? {
                  poly: [
                    [170, 12.8],
                    [320, 312.8],
                    [20, 312.8],
                  ] as const,
                  r: 0,
                }
              : FACES[face].crown
          for (const key of ['bar0', 'bar1'])
            for (const [x, y] of find(tree, key)!
              .attrs.d!.slice(1, -1)
              .split('L')
              .map((p) => p.split(' ').map(Number)))
              expect(depth(crown, x!, y!)).toBeLessThan(0)
        }
  })

  test('variants are deterministic in frames and React SSR', () => {
    for (const variant of ['haze', 'bloc'] as const)
      for (const frame of ['ink', 'bone', 'paper', 'none'] as const) {
        const o = { variant, frame, expression: 'happy', riso: true } as const
        expect(toSvg('Linh', o)).toBe(toSvg('Linh', o))
        const el = createElement(Peek, { name: 'Linh', ...o, animate: true })
        expect(renderToString(el)).toBe(renderToString(el))
      }
  })

  // the variants' stability contract: a change here has to be on purpose
  test('golden svg per variant', () => {
    const sums = Object.fromEntries(
      (['haze', 'bloc'] as const).map((variant) => {
        let all = ''
        for (const name of SHEET)
          for (const expression of Object.keys(EXPRESSIONS) as Expression[])
            for (const size of [24, 300])
              all += toSvg(name, { variant, expression, size })
        return [variant, fnv1a(all).toString(36)]
      }),
    )
    expect(sums).toMatchInlineSnapshot(`
      {
        "bloc": "je3kdc",
        "haze": "ib4gkm",
      }
    `)
  })
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

describe('vue and svelte', () => {
  // Each framework mints its own id prefix and SSR punctuation; past that,
  // every component must write the bytes React writes.
  const norm = (html: string) => {
    const id = /id="([^"]+)-[^"-]+"/.exec(html)?.[1] ?? ''
    return html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replaceAll(id, 'ID')
      .replaceAll(' aria-label>', ' aria-label="">') // Vue drops ="" off ''
      .replace(/<(\w+)([^<>]*?)\/>/g, '<$1$2></$1>')
  }
  const CASES = [
    {},
    { expression: 'happy', size: 96 },
    { animate: true, gaze: [0.5, -0.5] },
    { animate: true, gaze: 'pointer', expression: 'sleepy' },
    { frame: 'none', square: false, title: false, riso: true, size: 200 },
    { face: 'circle', color: 'mint', version: 1, eyewear: 'glasses' },
    { headwear: 'cap', neckwear: 'tie', eyewear: 'sunglasses', animate: true },
    { variant: 'haze', expression: 'angry', headwear: 'bow' },
    { variant: 'bloc', animate: true, gaze: [-0.4, 0.3], eyewear: 'glasses' },
  ] as const

  test('render the same SVG as React and toSvg', async () => {
    for (const name of NAMES)
      for (const o of CASES) {
        const props = { name, ...o } as Omit<PeekProps, 'style'>
        const react = norm(renderToString(createElement(Peek, props)))
        const vue = norm(
          await vueRender(createSSRApp({ render: () => h(VuePeek, props) })),
        )
        const svelte = norm(svelteRender(SveltePeek, { props }).body)
        expect(vue).toBe(react)
        expect(svelte).toBe(react)
        if (!('animate' in o))
          expect(norm(toSvg(name, props as PeekOptions))).toBe(react)
      }
  })

  test('class and style land on the svg', async () => {
    const vue = await vueRender(
      createSSRApp({
        render: () => h(VuePeek, { name: 'Ada', class: 'a', style: 'top:0' }),
      }),
    )
    const svelte = svelteRender(SveltePeek, {
      props: { name: 'Ada', class: 'a', style: 'top:0' },
    }).body
    for (const html of [vue, svelte]) {
      expect(html).toMatch(/^(<!--[\s\S]*?-->)*<svg [^>]*class="a"/)
      expect(html).toMatch(/<svg [^>]*style="top:\s?0;?"/)
    }
  })
})
