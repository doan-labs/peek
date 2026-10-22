/*
 * /api-service: the hosted Peek API for teams. The library stays free under
 * MIT; this page pitches a hosted endpoint, lists the params it takes and
 * asks teams to get in touch. There is no endpoint yet, so the URL is an
 * example and every plan starts with an email, not a checkout.
 *
 * The params are the options `toSvg` takes, read from the library tables,
 * never typed. The example faces are the library's own <Peek>, with no
 * wardrobe added, so each one is what its URL would return.
 */
import {
  ACCESSORIES,
  Peek as Base,
  COLORS,
  EXPRESSIONS,
  FACES,
  type Frame,
  LATEST,
  PARTS,
  type PeekOptions,
  VARIANTS,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { CodeBlock } from '@/components/code-block'
import { SheetPage } from '@/components/sheet-page'
import { REPO } from '@/lib/docs'
import { fonts, sheet } from '@/lib/tokens.stylex'

const ENDPOINT = 'https://api.peek.doan-labs.com/YOUR-ID'
const MAIL = 'mailto:hi@doan-labs.com?subject=Peek%20API%20access'
// the one list the library keeps as a type only
const FRAMES = ['ink', 'bone', 'paper', 'none'] as const satisfies Frame[]

const one = (list: readonly (string | number)[]) =>
  list.map((v) => `\`${v}\``).join(' ')
const keys = (o: object) => one(Object.keys(o))

const PARAMS: [name: string, values: string, fallback: string][] = [
  ['name', 'Any text. The same name returns the same face.', 'required'],
  ['size', 'Pixels.', '`64`'],
  ['variant', one(VARIANTS), '`peek`'],
  ['expression', keys(EXPRESSIONS), '`normal`'],
  ['frame', one(FRAMES), '`ink`'],
  ['square', '`true` `false`. False clips to a circle.', '`true`'],
  ['riso', '`true` `false`. Plates and grain, from 120px up.', '`false`'],
  ['version', 'A style version number.', `\`${LATEST}\`, the latest`],
  ['face', keys(FACES), 'from the name'],
  ['color', keys(COLORS), 'from the name'],
  ...Object.entries(PARTS).map(([part, list]): [string, string, string] => [
    part,
    one(list),
    'from the name',
  ]),
  ...Object.entries(ACCESSORIES).map(
    ([slot, list]): [string, string, string] => [slot, one(list), '`none`'],
  ),
  ['gazeX', 'A number from `-1` to `1`. Where the eyes look.', '`0`'],
  ['gazeY', 'A number from `-1` to `1`.', '`0`'],
]

const EXAMPLES: (PeekOptions & { name: string })[] = [
  { name: 'Linh', variant: 'haze', expression: 'happy' },
  { name: 'Kwame', variant: 'peek', expression: 'curious' },
  { name: 'Sofia', variant: 'bloc', expression: 'excited' },
  { name: 'Mateo', frame: 'none', square: false },
]

const query = ({ name, ...rest }: PeekOptions & { name: string }) =>
  new URLSearchParams({
    name,
    ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, `${v}`])),
  }).toString()

const mail = (plan: string) =>
  `mailto:hi@doan-labs.com?subject=${encodeURIComponent(`Peek API ${plan}`)}`

const SHARED = [
  'Your own endpoint, CORS-locked to your domains',
  'Early access to new variants and styles',
  'Email support from the people who build Peek',
  'A style of your own: tell us what you want, privately',
]

// no checkout yet: every plan starts with an email
const PLANS = [
  {
    name: 'Team',
    price: '$3.99',
    per: '/ month',
    alt: 'Or $39.99 a year, two months free.',
    perks: ['500,000 requests a month', ...SHARED],
    cta: 'Get access',
    mail: mail('Team'),
    strong: true,
  },
  {
    name: 'Unlimited',
    price: 'Contact us',
    per: '',
    alt: 'For more than 500,000 requests a month.',
    perks: ['Unlimited requests', ...SHARED],
    cta: 'Contact us',
    mail: mail('Unlimited'),
    strong: false,
  },
]

const URL_EXAMPLE = `${ENDPOINT}?name=Linh&size=96&variant=haze&expression=happy`

export function ApiServicePage() {
  return (
    <SheetPage>
      <article>
        <h1 {...stylex.props(styles.h1)}>Peek API</h1>
        <p {...stylex.props(styles.lede)}>
          Need avatars at scale without running anything yourself? Request a
          face by URL and get SVG back. The same name always returns the same
          face.
        </p>
        <div {...stylex.props(styles.actions)}>
          <a href={MAIL} {...stylex.props(styles.cta)}>
            Contact us
          </a>
          <a href='#pricing' {...stylex.props(styles.ghost)}>
            Pricing
          </a>
        </div>

        <H2 id='how-it-works'>How it works</H2>
        <p {...stylex.props(styles.p)}>
          You get your own endpoint, locked to your domains with CORS. Tell us a
          production domain and a development domain when you join.
        </p>
        <p {...stylex.props(styles.p)}>
          Put the URL in an <Code>img</Code> tag. Change the look with query
          params. Responses are cached, and a pinned{' '}
          <Link
            to='/docs/$slug'
            params={{ slug: 'identity' }}
            {...stylex.props(styles.a)}
          >
            <Code>version</Code>
          </Link>{' '}
          never changes.
        </p>
        <p {...stylex.props(styles.p)}>
          The API runs on{' '}
          <a
            href='https://cloud.google.com'
            target='_blank'
            rel='noopener'
            {...stylex.props(styles.a)}
          >
            Google Cloud
          </a>
          .
        </p>

        <H2 id='example'>Example</H2>
        <p {...stylex.props(styles.p)}>
          Example. Your endpoint is set up when you join.
        </p>
        <div {...stylex.props(styles.block)}>
          <CodeBlock
            title='HTML'
            code={`<img src="${URL_EXAMPLE}" alt="Linh" />`}
          />
        </div>
        <ul {...stylex.props(styles.faces)}>
          {EXAMPLES.map((e) => (
            <li key={e.name} {...stylex.props(styles.face)}>
              <Base {...e} size={96} {...stylex.props(styles.fill)} />
              <code {...stylex.props(styles.faceUrl)}>?{query(e)}</code>
            </li>
          ))}
        </ul>

        <H2 id='params'>Params</H2>
        <p {...stylex.props(styles.p)}>
          The same options as{' '}
          <Link
            to='/docs/$slug'
            params={{ slug: 'svg' }}
            {...stylex.props(styles.a)}
          >
            <Code>toSvg</Code>
          </Link>{' '}
          in the library. Leave one out and the name decides it.
        </p>
        <div {...stylex.props(styles.tableBox)}>
          <table {...stylex.props(styles.table)}>
            <thead>
              <tr>
                {['Param', 'Values', 'Default'].map((c) => (
                  <th key={c} {...stylex.props(styles.th)}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARAMS.map(([name, values, fallback]) => (
                <tr key={name}>
                  <td {...stylex.props(styles.td)}>
                    <Code>{name}</Code>
                  </td>
                  <td {...stylex.props(styles.td)}>
                    <Inline text={values} />
                  </td>
                  <td {...stylex.props(styles.td, styles.quiet)}>
                    <Inline text={fallback} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id='pricing'>Pricing</H2>
        <div {...stylex.props(styles.plans)}>
          {PLANS.map((p) => (
            <div key={p.name} {...stylex.props(styles.card)}>
              <p {...stylex.props(styles.plan)}>{p.name}</p>
              <p {...stylex.props(styles.price)}>
                {p.price}
                {p.per ? (
                  <span {...stylex.props(styles.per)}> {p.per}</span>
                ) : null}
              </p>
              <p {...stylex.props(styles.note)}>{p.alt}</p>
              <ul {...stylex.props(styles.ul)}>
                {p.perks.map((t) => (
                  <li key={t} {...stylex.props(styles.li)}>
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href={p.mail}
                {...stylex.props(
                  styles.cardCta,
                  p.strong ? styles.cta : styles.ghost,
                )}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
        <p {...stylex.props(styles.p, styles.quiet)}>
          Early access. We will reply within one working day. The{' '}
          <Link to='/docs' {...stylex.props(styles.a)}>
            open source library
          </Link>{' '}
          stays free under{' '}
          <a
            href={`${REPO}/blob/main/LICENSE`}
            target='_blank'
            rel='noopener'
            {...stylex.props(styles.a)}
          >
            MIT
          </a>
          . See the{' '}
          <Link to='/terms' {...stylex.props(styles.a)}>
            terms
          </Link>
          .
        </p>

        <H2 id='contact'>Contact</H2>
        <p {...stylex.props(styles.p)}>
          Questions, or ready to join? Write to{' '}
          <a href={MAIL} {...stylex.props(styles.a)}>
            hi@doan-labs.com
          </a>
          .
        </p>
      </article>
    </SheetPage>
  )
}

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} {...stylex.props(styles.h2)}>
      {children}
    </h2>
  )
}

function Code({ children }: { children: string }) {
  return <code {...stylex.props(styles.code)}>{children}</code>
}

/** Backticks become code, the rest is text. */
function Inline({ text }: { text: string }) {
  return text.split('`').map((s, i) => (i % 2 ? <Code key={i}>{s}</Code> : s))
}

const HOVER = '@media (hover: hover)'
const LINE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

const styles = stylex.create({
  h1: {
    fontSize: 'clamp(30px, 4vw, 38px)',
    fontWeight: 500,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
  },
  lede: {
    marginTop: '12px',
    maxWidth: '600px',
    fontSize: '18px',
    lineHeight: 1.55,
    color: sheet['--soft'],
    textWrap: 'pretty',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '28px',
  },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '42px',
    paddingInline: '18px',
    borderRadius: '999px',
    fontSize: '16px',
    fontWeight: 500,
    textDecoration: 'none',
    color: sheet['--page'],
    backgroundColor: sheet['--fg'],
    transitionProperty: 'opacity',
    transitionDuration: '0.15s',
    opacity: { default: 1, [HOVER]: { default: null, ':hover': 0.86 } },
  },
  ghost: {
    ...LINE,
    display: 'inline-flex',
    alignItems: 'center',
    height: '42px',
    paddingInline: '18px',
    borderRadius: '999px',
    fontSize: '16px',
    fontWeight: 500,
    textDecoration: 'none',
    color: sheet['--fg'],
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    transitionProperty: 'background-color',
    transitionDuration: '0.15s',
  },
  h2: {
    scrollMarginTop: '24px',
    marginTop: '64px',
    marginBottom: 0,
    fontSize: '22px',
    fontWeight: 500,
    letterSpacing: '-0.015em',
  },
  p: { marginTop: '16px', fontSize: '16px', lineHeight: 1.75 },
  quiet: { color: sheet['--quiet'] },
  a: {
    color: 'inherit',
    textDecorationColor: sheet['--rule-strong'],
    textUnderlineOffset: '3px',
    transitionProperty: 'text-decoration-color',
    transitionDuration: '0.15s',
    ':hover': { textDecorationColor: sheet['--fg'] },
  },
  code: {
    fontFamily: fonts['--mono'],
    fontSize: '0.84em',
    padding: '2px 6px',
    borderRadius: '6px',
    backgroundColor: sheet['--chip'],
  },
  block: { marginTop: '20px' },
  faces: {
    ...LINE,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '24px 12px',
    marginTop: '20px',
    marginBottom: 0,
    padding: '24px',
    borderRadius: '16px',
    listStyle: 'none',
  },
  face: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },
  fill: { width: '96px', height: '96px' },
  faceUrl: {
    maxWidth: '100%',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    lineHeight: 1.5,
    textAlign: 'center',
    overflowWrap: 'anywhere',
    color: sheet['--quiet'],
  },
  tableBox: { marginTop: '20px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '15px' },
  th: {
    textAlign: 'left',
    padding: '10px 16px 10px 10px',
    fontSize: '14px',
    fontWeight: 500,
    color: sheet['--quiet'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
  },
  td: {
    padding: '11px 16px 11px 10px',
    verticalAlign: 'top',
    lineHeight: 1.7,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  plans: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  card: {
    ...LINE,
    display: 'flex',
    flexDirection: 'column',
    padding: '28px',
    borderRadius: '18px',
  },
  plan: { fontSize: '15px', fontWeight: 500, color: sheet['--soft'] },
  price: {
    marginTop: '8px',
    fontSize: '40px',
    fontWeight: 500,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  per: { fontSize: '17px', letterSpacing: 0, color: sheet['--quiet'] },
  ul: { marginTop: '20px', marginBottom: '24px', paddingLeft: '20px' },
  li: { fontSize: '16px', lineHeight: 1.75, paddingLeft: '4px' },
  // the buttons line up along the bottom, whatever each list holds
  cardCta: { justifyContent: 'center', marginTop: 'auto' },
  note: {
    marginTop: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
    color: sheet['--quiet'],
  },
})
