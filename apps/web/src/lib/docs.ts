/*
 * The docs, once. Every page renders from these blocks on /docs, and the
 * same blocks become Markdown for /llms.txt, /llms-full.txt and the prompt
 * a visitor copies. Option lists are read from the library, never typed.
 */
import {
  COLORS,
  EXPRESSIONS,
  FACES,
  LATEST,
  PARTS,
  type PeekProps,
} from '@doanlabs/peek'

export const SITE = 'https://peek.doan-labs.com'

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
  group: 'Get started' | 'Concepts' | 'Usage'
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
      { code: `<Peek name="Ada Lovelace" />`, lang: 'tsx' },
      { figure: 'intro-numbers' },
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
      `Status: coming soon. Not on npm yet. Current style version: \`peek@${LATEST}\`.`,
    ],
  },
  {
    slug: 'install',
    group: 'Get started',
    title: 'Installation',
    blurb: 'One package, no runtime dependencies.',
    task: 'Set up @doanlabs/peek in this project.',
    blocks: [
      '`@doanlabs/peek` is not published yet. Once it is:',
      { figure: 'install', md: '```bash\nnpm install @doanlabs/peek\n```' },
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
      'The name is tidied first (trimmed, spaces collapsed, lowercased), so `Ada` and ` ada ` are the same face. Each axis hashes on its own seed and picks from its list:',
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
        code: `<Peek name="Ada Lovelace" face="circle" color="mint" />`,
        lang: 'tsx',
      },
      { h: 'Read it' },
      {
        code: `import { identify } from '@doanlabs/peek'

identify('Ada Lovelace') // { face, color, eyes, brows, mouth, cheeks, trait, … }`,
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
        md: "```tsx\n<Peek name=\"Ada Lovelace\" expression={online ? 'happy' : 'sleepy'} animate />\n```",
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
import { Peek } from '@doanlabs/peek'

<Peek name="Ada Lovelace" />
<Peek name="Ada Lovelace" size={96} expression="happy" />
<Peek name="Ada Lovelace" animate gaze="pointer" />
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
          ['`className` `style`', 'on the `<svg>`', 'none'],
        ],
      },
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
        code: `import { toSvg } from '@doanlabs/peek'

const svg = toSvg('Ada Lovelace', { size: 96, frame: 'bone' })`,
        lang: 'ts',
      },
      'Same input, same bytes, on any machine. It takes the same options as `<Peek>`, minus `animate`, `className`, `style` and the pointer gaze.',
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

Use \`@doanlabs/peek\` by Doan Labs. The full docs are at ${SITE}/llms-full.txt.
Below is the page for this task.

${toMarkdown(p)}
`

const INTRO =
  '# Peek\n\n> A string in, a face out. Peek, from Doan Labs, turns a name into a deterministic SVG face, with expressions, gaze and animation on top. React component and plain SVG string.'

export const llmsTxt = () => `${INTRO}

## Docs

${PAGES.map((p) => `- [${p.title}](${pageUrl(p)}): ${p.blurb}`).join('\n')}

## Optional

- [Full docs](${SITE}/llms-full.txt): every page above in one file
`

export const llmsFull = () =>
  `${INTRO}\n\n${PAGES.map(toMarkdown).join('\n\n---\n\n')}\n`
