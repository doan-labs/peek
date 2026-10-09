/*
 * The docs, once. Every page renders from these blocks on /docs, and the
 * same blocks become Markdown for /llms.txt, /llms-full.txt and the prompt
 * a visitor copies. Option lists are read from the library, never typed.
 */
import {
  ACCESSORIES,
  COLORS,
  EXPRESSIONS,
  FACES,
  LATEST,
  PARTS,
  type PeekProps,
} from '@doan-labs/peek'

export const SITE = 'https://peek.doan-labs.com'
export const REPO = 'https://github.com/doan-labs/peek'

/** A string is a paragraph; `code` in backticks stays code. */
export type Block =
  | string
  | { h: string }
  | { code: string; lang: 'tsx' | 'ts' | 'bash'; title?: string }
  | { list: string[] }
  | { rows: string[][] }
  /** Live faces on the page; Markdown skips them. */
  | { faces: (PeekProps & { label?: string })[] }
  /** An interactive figure from components/figures. Markdown skips it, or
   * prints `md` when the figure carries content the text needs. */
  | { figure: FigureId; md?: string }

export type FigureId =
  | 'intro-numbers'
  | 'same-face'
  | 'install'
  | 'runs-where'
  | 'props-playground'
  | 'hydration'
  | 'same-bytes'
  | 'serve-it'
  | 'data-uri'
  | 'hash-machine'
  | 'versions'
  | 'expressions'
  | 'gaze-pad'
  | 'alive'

export type DocPage = {
  slug: string
  /** The sidebar heading it sits under. */
  group: 'Get started' | 'Concepts' | 'Usage' | 'Project'
  title: string
  blurb: string
  /** What the copied prompt asks an agent to do. */
  task: string
  /** A second line under the blurb. */
  lede?: string
  blocks: Block[]
}

const one = (list: readonly string[]) => list.map((v) => `\`${v}\``).join(' ')
const EXPR = Object.keys(EXPRESSIONS) as (keyof typeof EXPRESSIONS)[]

export const PAGES: DocPage[] = [
  {
    slug: '',
    group: 'Get started',
    title: 'Introduction',
    blurb: 'A string in, a face out.',
    task: 'Add Peek avatars to this app wherever a person or account is shown without a photo.',
    lede: 'Peek turns a name into a face. The same name gives the same face, on the server and in the browser, as plain SVG.',
    blocks: [
      { code: `<Peek name="Linh" />`, lang: 'tsx' },
      { figure: 'intro-numbers' },
      { h: 'Dress the face' },
      'Six accessories fit every shape: glasses, sunglasses, bow, cap, sprout and tie. Pick one per slot, or combine eyewear, headwear and neckwear. Accessories are identity overrides; changing an expression keeps the outfit.',
      {
        code: '<Peek name="Linh" eyewear="glasses" headwear="sprout" animate />',
        lang: 'tsx',
      },
      { h: 'Same name, same face' },
      'Nothing is stored and nothing is fetched. The face is worked out from the name every time, so the server and the browser draw the same one:',
      { figure: 'same-face' },
      {
        list: [
          'Deterministic: no storage, no network, no randomness.',
          'Pure SVG with no runtime dependencies.',
          `State on top: ${EXPR.length} expressions, gaze, and optional animation.`,
        ],
      },
      `Install with \`npm install @doan-labs/peek\`. Current style version: \`peek@${LATEST}\`.`,
    ],
  },
  {
    slug: 'install',
    group: 'Get started',
    title: 'Installation',
    blurb: 'One package, no runtime dependencies.',
    task: 'Set up @doan-labs/peek in this project.',
    blocks: [
      '`@doan-labs/peek` is one package. Add it with your package manager:',
      { figure: 'install', md: '```bash\nnpm install @doan-labs/peek\n```' },
      {
        list: [
          '`<Peek>` needs React 19.',
          '`toSvg` and `identify` need nothing: any JavaScript runtime.',
        ],
      },
      { figure: 'runs-where' },
    ],
  },
  {
    slug: 'identity',
    group: 'Concepts',
    title: 'Identity',
    blurb: 'What a face is. Hashed from the name.',
    task: 'Use Peek identity in this app: pick stable avatars per user and override axes where the design needs it.',
    blocks: [
      { h: 'Two layers' },
      {
        code: `style: peek (the currently implemented style)
├─ identity: face, color, anatomy
│  ├─ parts: eyes, brows, mouth, cheeks, trait
│  ├─ proportions: seeded persona
│  └─ accessories: eyewear, headwear, neckwear
└─ state: expression, gaze
   supplied by the caller or rig, never hashed`,
        lang: 'ts',
      },
      'The name is tidied first (trimmed, spaces collapsed, lowercased), so `Linh` and ` linh ` are the same face. Each axis hashes on its own seed and picks from its list:',
      {
        figure: 'hash-machine',
        md: table([
          ['Axis', 'Options'],
          ['`face`', one(Object.keys(FACES))],
          ['`color`', one(Object.keys(COLORS))],
          ...Object.entries(PARTS).map(([k, v]) => [`\`${k}\``, one(v)]),
        ]),
      },
      { h: 'Override an axis' },
      'Pass any axis and it wins. Every other axis stays as the name made it.',
      {
        code: `<Peek name="Linh" face="circle" color="mint" />`,
        lang: 'tsx',
      },
      { h: 'Accessories' },
      'Three independent slots dress the existing face: eyewear, headwear and neckwear. At `peek@1` each defaults to `none`, so existing avatars stay unchanged. Explicit accessories work with every expression, gaze, frame and the React animator. The three slots have 3 × 4 × 2 = 24 wardrobe combinations, including no accessories. They add combinations to an existing identity; they do not increase the number of outfits automatically selected by `peek@1`.',
      {
        rows: [
          ['Slot', 'Options'],
          ...Object.entries(ACCESSORIES).map(([k, v]) => [`\`${k}\``, one(v)]),
        ],
      },
      {
        code: `<Peek name="Linh" eyewear="glasses" headwear="bow" />
<Peek name="Linh" eyewear="sunglasses" headwear="sprout" />
toSvg('Linh', { headwear: 'cap', neckwear: 'tie' })`,
        lang: 'tsx',
      },
      {
        rows: [
          ['Accessory', 'Placement and behavior'],
          [
            'Glasses',
            'Transparent lenses around the eye sockets, with an arched bridge and paper glints. Gaze and blinking remain visible.',
          ],
          [
            'Sunglasses',
            'Opaque ink lenses with paper glints. Eyes still animate underneath; brows and mouth carry expression.',
          ],
          [
            'Bow',
            'Ink wings and one red knot, seated on the crown away from the trait.',
          ],
          [
            'Cap',
            'Paper crown, ink seam, brim and button. Follows the crown contour away from the trait.',
          ],
          [
            'Sprout',
            'Two mint leaves and an ink stem, planted into the crown away from the trait.',
          ],
          [
            'Tie',
            'An ink knot and blade below the mouth. The floor clips it, especially on low faces.',
          ],
        ],
      },
      'One accessory per slot. Glasses and sunglasses are alternatives, as are bow, cap and sprout. A cap and tie can be combined with either eyewear. Use `none` to clear a slot. Accessories share the body transform and its frame clip, including round and transparent frames; they participate in the same riso print as the face.',
      {
        faces: [
          {
            name: 'Linh',
            face: 'diamond',
            eyewear: 'glasses',
            label: 'Glasses',
          },
          {
            name: 'Linh',
            face: 'circle',
            eyewear: 'sunglasses',
            label: 'Sunglasses',
          },
          { name: 'Linh', face: 'triangle', headwear: 'bow', label: 'Bow' },
          { name: 'Linh', face: 'semicircle', headwear: 'cap', label: 'Cap' },
          { name: 'Linh', face: 'circle', headwear: 'sprout', label: 'Sprout' },
          { name: 'Linh', face: 'diamond', neckwear: 'tie', label: 'Tie' },
          {
            name: 'Linh',
            eyewear: 'glasses',
            headwear: 'bow',
            label: 'Glasses + bow',
          },
          {
            name: 'Linh',
            eyewear: 'sunglasses',
            headwear: 'sprout',
            label: 'Sunglasses + sprout',
          },
          {
            name: 'Linh',
            headwear: 'cap',
            neckwear: 'tie',
            label: 'Cap + tie',
          },
        ],
      },
      { h: 'Seed an outfit' },
      'The homepage examples pick varied accessories from a separate name seed, then pass them as explicit props. This is a caller choice. `identify(name)` at `peek@1` returns `none` for all three slots. Avoid `Math.random()` during rendering: the server and client could draw different outfits.',
      {
        code: `import { ACCESSORIES, Peek, type Axes } from '@doan-labs/peek'
import { fnv1a, tidy } from '@doan-labs/peek/identity'

type Wardrobe = Pick<Axes, 'eyewear' | 'headwear' | 'neckwear'>
function outfitFor(name: string): Wardrobe {
  const pick = <K extends keyof Wardrobe>(slot: K): Wardrobe[K] => {
    const list = ACCESSORIES[slot]
    const hash = fnv1a('wardrobe:' + slot + ':' + tidy(name))
    return list[hash % list.length] as Wardrobe[K]
  }
  return {
    eyewear: pick('eyewear'),
    headwear: pick('headwear'),
    neckwear: pick('neckwear'),
  }
}

<Peek name="Linh" {...outfitFor('Linh')} />`,
        lang: 'tsx',
      },
      'Keep this selection rule and its list order stable if users keep their outfits. Store explicit slot values when you want the same outfit after adding new choices. Changing an outfit leaves the face, color, parts and persona unchanged.',
      { h: 'Read it' },
      {
        code: `import { identify } from '@doan-labs/peek'

identify('Linh') // { face, color, eyes, brows, mouth, cheeks, trait, … }
identify('Linh').headwear // 'none' at peek@1`,
        lang: 'ts',
      },
      { h: 'Versions' },
      `Any change that would move an existing face ships as a new style version. Pass \`version={${LATEST}}\` to keep today's faces forever. Unpinned means latest.`,
      { figure: 'versions' },
    ],
  },
  {
    slug: 'state',
    group: 'Concepts',
    title: 'State',
    blurb: 'What a face does. Set by you, never hashed.',
    task: 'Make Peek avatars in this app react to state: expressions, gaze and animation.',
    blocks: [
      { h: 'Expression' },
      `One of: ${one(EXPR)}. Default \`normal\`.`,
      {
        figure: 'expressions',
        md: "```tsx\n<Peek name=\"Linh\" expression={online ? 'happy' : 'sleepy'} animate />\n```",
      },
      'Accessories stay fixed across expressions. Headwear rides with the body; eyewear fits the eye sockets as proportions change; the tie stays below the mouth. Blinking and gaze still run behind sunglasses. The demo keeps one outfit for all 11 expressions.',
      {
        code: `<Peek name="Linh" headwear="sprout" expression={online ? 'happy' : 'sleepy'} animate />`,
        lang: 'tsx',
      },
      { h: 'Gaze' },
      '`[x, y]` with each value in -1..1, where `[0, 0]` looks ahead. With `animate`, `gaze="pointer"` follows the pointer.',
      { figure: 'gaze-pad' },
      { h: 'Animate' },
      'Add `animate` and the face blinks, breathes and eases between expressions. Change `expression` or `gaze` and it tweens there. All faces on a page share one loop.',
      { figure: 'alive' },
    ],
  },
  {
    slug: 'react',
    group: 'Usage',
    title: 'React',
    blurb: 'The `<Peek>` component.',
    task: 'Render avatars in this React app with the Peek component.',
    blocks: [
      {
        figure: 'props-playground',
        md: `\`\`\`tsx
import { Peek } from '@doan-labs/peek'

<Peek name="Linh" />
<Peek name="Linh" size={96} expression="happy" />
<Peek name="Linh" eyewear="glasses" headwear="sprout" animate gaze="pointer" />
\`\`\``,
      },
      { h: 'Server and client' },
      'It renders the same markup on the server and the client, so it hydrates cleanly. With `animate`, the first paint is static and the face comes alive after mount.',
      { figure: 'hydration' },
      { h: 'Props' },
      {
        rows: [
          ['Prop', 'Type', 'Default'],
          ['`name`', '`string`', 'required'],
          ['`size`', '`number` (px)', '`64`'],
          ['`expression`', 'see State', '`normal`'],
          ['`gaze`', "`[x, y]` in -1..1, or `'pointer'`", 'none'],
          ['`animate`', '`boolean`', '`false`'],
          ['`frame`', '`ink` `bone` `paper` `none`', '`ink`'],
          ['`square`', '`boolean`, false clips to a circle', '`true`'],
          ['`title`', '`string`, or `false` to hide it', 'the name'],
          ['`riso`', '`boolean`, print grain from 120px', '`false`'],
          ['`version`', '`number`', `\`${LATEST}\``],
          ['`face` `color` `eyes` …', 'see Identity', 'hashed'],
          ['`eyewear`', one(ACCESSORIES.eyewear), '`none`'],
          ['`headwear`', one(ACCESSORIES.headwear), '`none`'],
          ['`neckwear`', one(ACCESSORIES.neckwear), '`none`'],
          ['`className` `style`', 'on the `<svg>`', 'none'],
        ],
      },
      'Pass the wardrobe as props or spread a stored outfit. Every omitted slot defaults to `none` at `peek@1`. Changing a slot updates the drawing and preserves the other identity axes. The interactive example prints the exact accessory props you selected.',
      '`gaze="pointer"` follows the pointer and needs `animate`. Animation stops under `prefers-reduced-motion`.',
    ],
  },
  {
    slug: 'svg',
    group: 'Usage',
    title: 'SVG string',
    blurb: '`toSvg` for servers and static files.',
    task: 'Generate Peek avatars as SVG strings on the server with toSvg.',
    blocks: [
      {
        code: `import { toSvg } from '@doan-labs/peek'

const svg = toSvg('Linh', {
  size: 96,
  frame: 'bone',
  eyewear: 'glasses',
  headwear: 'sprout',
  neckwear: 'tie',
})`,
        lang: 'ts',
      },
      'Same input, same bytes, on any machine. It takes the same options as `<Peek>`, minus `animate`, `className`, `style` and the pointer gaze.',
      'The same wardrobe values produce the same geometry in React and `toSvg`. SVG export captures a static expression and gaze; `animate` and pointer tracking are React behaviors and are not embedded in the exported file.',
      { figure: 'same-bytes' },
      { h: 'Serve it' },
      {
        code: `export function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? ''
  return new Response(toSvg(name), {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}`,
        lang: 'ts',
        title: 'avatar.ts',
      },
      { figure: 'serve-it' },
      'The output never changes for a pinned `version`, so it caches forever.',
      { h: 'Inline it' },
      {
        code: "const src = 'data:image/svg+xml,' + encodeURIComponent(svg)",
        lang: 'ts',
      },
      { figure: 'data-uri' },
    ],
  },
  {
    slug: 'changelog',
    group: 'Project',
    title: 'Changelog',
    blurb: 'What changed in each release of `@doan-labs/peek`.',
    task: 'Upgrade @doan-labs/peek in this project to the latest release.',
    blocks: [
      'A pinned `version` keeps every face the same across upgrades.',
      { h: '1.1.0 · October 9, 2026' },
      'Faces get dressed.',
      {
        faces: [
          { name: 'Linh', eyewear: 'glasses', label: 'glasses' },
          { name: 'Bao', eyewear: 'sunglasses', label: 'sunglasses' },
          { name: 'Mai', headwear: 'bow', label: 'bow' },
          { name: 'Khoa', headwear: 'cap', label: 'cap' },
          { name: 'An', headwear: 'sprout', label: 'sprout' },
          { name: 'Duc', neckwear: 'tie', label: 'tie' },
        ],
      },
      {
        list: [
          'Three slots: `eyewear`, `headwear`, `neckwear`. All default to `none`, so old faces stay put.',
          '`draw` and `settle` are exported.',
        ],
      },
      { h: '1.0.0 · October 5, 2026' },
      'Stable. Faces got feelings.',
      {
        faces: [
          { name: 'Linh', expression: 'happy', label: 'happy' },
          { name: 'Bao', expression: 'surprised', label: 'surprised' },
          { name: 'Mai', expression: 'sleepy', label: 'sleepy' },
          { name: 'Khoa', expression: 'angry', label: 'angry' },
        ],
      },
      {
        list: [
          '`<Peek>` for React 19 and `toSvg` for plain SVG, no runtime deps.',
          `${EXPR.length} expressions, style \`peek@${LATEST}\`, MIT.`,
        ],
      },
      { h: '0.1.0 · October 5, 2026' },
      'First npm publish, no license. Use 1.0.0.',
    ],
  },
]

export const pageUrl = (p: DocPage) =>
  `${SITE}/docs${p.slug ? `/${p.slug}` : ''}`

function table(rows: string[][]) {
  const [head = [], ...rest] = rows
  const row = (r: string[]) => `| ${r.join(' | ')} |`
  return [row(head), row(head.map(() => '---')), ...rest.map(row)].join('\n')
}

const md = (b: Block): string | null => {
  if (typeof b === 'string') return b
  if ('h' in b) return `## ${b.h}`
  if ('code' in b) return `\`\`\`${b.lang}\n${b.code}\n\`\`\``
  if ('list' in b) return b.list.map((i) => `- ${i}`).join('\n')
  if ('figure' in b) return b.md ?? null
  if ('rows' in b) return table(b.rows)
  return null
}

export const toMarkdown = (p: DocPage) =>
  [`# ${p.title}`, p.blurb, p.lede, ...p.blocks.map(md)]
    .filter(Boolean)
    .join('\n\n')

export const toPrompt = (p: DocPage) => `${p.task}

Use \`@doan-labs/peek\` by Doan Labs. The full docs are at ${SITE}/llms-full.txt.
Below is the page for this task.

${toMarkdown(p)}
`

const INTRO =
  '# Peek\n\n> A string in, a face out. Peek, from Doan Labs, turns a name into a deterministic SVG face, with expressions, gaze and animation on top. React component and plain SVG string. Six accessories in three independent wardrobe slots.'

export const llmsTxt = () => `${INTRO}

## Docs

${PAGES.map((p) => `- [${p.title}](${pageUrl(p)}): ${p.blurb}`).join('\n')}

## Optional

- [Full docs](${SITE}/llms-full.txt): every page above in one file
- [Source](${REPO}): the code, on GitHub
`

export const llmsFull = () =>
  `${INTRO}\n\n${PAGES.map(toMarkdown).join('\n\n---\n\n')}\n`
