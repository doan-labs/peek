/*
 * /docs: a full-height sidebar and one page at a time, rendered from
 * lib/docs.ts. Every page carries a ready prompt for an agent and its own
 * Markdown, the same text /llms-full.txt serves.
 *
 * Motion stays small: the active pill slides between links, a page eases in
 * on navigation (never on first paint, so the prerendered HTML shows), and
 * copy buttons swap their icon in place.
 */
import { Peek } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ComponentProps, useState } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { CodeBlock } from '@/components/code-block'
import { FIGURES } from '@/components/figures'
import { FaceChip } from '@/components/figures/kit'
import {
  type Block,
  type DocPage,
  PAGES,
  pageUrl,
  REPO,
  toMarkdown,
  toPrompt,
} from '@/lib/docs'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'

export const docsHead = (p: DocPage) => {
  const title = `Peek · ${p.title}`
  const description = `${p.blurb.replaceAll('`', '')} Peek docs, from Doan Labs.`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: pageUrl(p) },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: pageUrl(p) }],
  }
}

const pathOf = (p: DocPage) => `/docs${p.slug ? `/${p.slug}` : ''}`
const GROUPS = [...new Set(PAGES.map((p) => p.group))]

function DocLink({
  page,
  ...rest
}: { page: DocPage } & Omit<ComponentProps<'a'>, 'href' | 'ref'>) {
  return page.slug ? (
    <Link to='/docs/$slug' params={{ slug: page.slug }} {...rest} />
  ) : (
    <Link to='/docs' {...rest} />
  )
}

export function DocsLayout() {
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, '') })
  const reduce = useReducedMotion()
  return (
    <div data-sheet {...stylex.props(styles.page)}>
      <aside {...stylex.props(styles.side)}>
        <Link to='/' {...stylex.props(styles.brand)}>
          <BrandMark />
          Peek
        </Link>
        <nav aria-label='Docs' {...stylex.props(styles.nav)}>
          {GROUPS.map((group) => (
            <div key={group} {...stylex.props(styles.group)}>
              <p {...stylex.props(styles.groupHead)}>{group}</p>
              <ul {...stylex.props(styles.navList)}>
                {PAGES.filter((p) => p.group === group).map((p) => {
                  const on = path === pathOf(p)
                  return (
                    <li key={p.slug} {...stylex.props(styles.navItem)}>
                      {on ? (
                        <motion.span
                          layoutId='docs-nav'
                          transition={reduce ? NONE : LAND}
                          {...stylex.props(styles.pill)}
                        >
                          <span {...stylex.props(styles.pillFace)}>
                            <Peek
                              name={p.title}
                              size={26}
                              frame='none'
                              title={false}
                              expression='happy'
                            />
                          </span>
                        </motion.span>
                      ) : null}
                      <DocLink
                        page={p}
                        aria-current={on ? 'page' : undefined}
                        {...stylex.props(styles.navLink, on && styles.navOn)}
                      >
                        {p.title}
                      </DocLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <div {...stylex.props(styles.group)}>
            <p {...stylex.props(styles.groupHead)}>For agents</p>
            <ul {...stylex.props(styles.navList)}>
              {['/llms.txt', '/llms-full.txt'].map((href) => (
                <li key={href} {...stylex.props(styles.navItem)}>
                  <a href={href} {...stylex.props(styles.navLink)}>
                    {href.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div {...stylex.props(styles.group)}>
            <p {...stylex.props(styles.groupHead)}>Source</p>
            <ul {...stylex.props(styles.navList)}>
              <li {...stylex.props(styles.navItem)}>
                <a
                  href={REPO}
                  target='_blank'
                  rel='noopener'
                  {...stylex.props(styles.navLink)}
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
      <main {...stylex.props(styles.main)}>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={path}
            initial={{ opacity: 0, transform: 'translateY(8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={reduce ? NONE : { duration: 0.4, ease: CURVE }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export function DocsArticle({ page }: { page: DocPage }) {
  const i = PAGES.indexOf(page)
  const prev = PAGES[i - 1]
  const next = PAGES[i + 1]
  return (
    <article {...stylex.props(styles.article)}>
      {page.lede ? (
        <Hero page={page} />
      ) : (
        <>
          <h1 {...stylex.props(styles.h1)}>{page.title}</h1>
          <p {...stylex.props(styles.blurb)}>
            <Inline text={page.blurb} />
          </p>
          <div {...stylex.props(styles.actions)}>
            <Copy text={toPrompt(page)} strong>
              Copy prompt
            </Copy>
            <Copy text={toMarkdown(page)}>Copy Markdown</Copy>
          </div>
        </>
      )}
      {page.blocks.map((b, i) =>
        // the hero shows the first snippet live, with the typed name
        page.lede && i === 0 && typeof b === 'object' && 'code' in b ? null : (
          <BlockView key={i} block={b} />
        ),
      )}
      <nav aria-label='Pages' {...stylex.props(styles.pager)}>
        {prev ? <PagerCard page={prev} back /> : <span />}
        {next ? <PagerCard page={next} /> : null}
      </nav>
    </article>
  )
}

/** A neighbouring page. Its face looks the way the link goes on hover. */
function PagerCard({ page, back = false }: { page: DocPage; back?: boolean }) {
  const [hover, setHover] = useState(false)
  const look = back ? -1 : 1
  return (
    <DocLink
      page={page}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      {...stylex.props(
        styles.pagerLink,
        back ? null : styles.pagerNext,
        stylex.defaultMarker(),
      )}
    >
      <span {...stylex.props(styles.pagerFace)}>
        <Peek
          name={page.title}
          size={44}
          frame='none'
          title={false}
          animate
          expression={hover ? 'curious' : 'normal'}
          gaze={hover ? [look, 0.1] : [look * 0.35, 0]}
        />
      </span>
      <span {...stylex.props(styles.pagerText)}>
        <span {...stylex.props(styles.pagerDir)}>
          {back ? <Chevron left /> : null}
          {back ? 'Previous' : 'Next'}
          {back ? null : <Chevron />}
        </span>
        <span {...stylex.props(styles.pagerTitle)}>{page.title}</span>
      </span>
    </DocLink>
  )
}

const CAST = ['Linh', 'Thanh', 'Kwame', 'Sofia', 'Mateo']

/** The intro: a headline, two ways in, and a name to try. */
function Hero({ page }: { page: DocPage }) {
  const [name, setName] = useState(CAST[0]!)
  const [install] = PAGES.filter((p) => p.slug === 'install')
  return (
    <>
      <h1 {...stylex.props(styles.heroH)}>
        {page.blurb}
        <span {...stylex.props(styles.heroLede)}> {page.lede}</span>
      </h1>
      <div {...stylex.props(styles.actions, styles.heroActions)}>
        {install ? (
          <DocLink page={install} {...stylex.props(styles.cta)}>
            Get started
          </DocLink>
        ) : null}
        <Copy text={toPrompt(page)} big>
          Copy prompt
        </Copy>
      </div>
      <div {...stylex.props(styles.demo)}>
        <div {...stylex.props(styles.demoStage)}>
          <Peek
            name={name || ' '}
            size={160}
            frame='none'
            animate
            gaze='pointer'
            {...stylex.props(styles.demoFace)}
          />
        </div>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.hidden)}>A name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Type a name'
            spellCheck={false}
            {...stylex.props(styles.input)}
          />
        </label>
      </div>
      <div {...stylex.props(styles.chips)}>
        {CAST.map((n) => (
          <motion.button
            key={n}
            type='button'
            whileTap={{ scale: 0.96 }}
            onClick={() => setName(n)}
            aria-pressed={n === name}
            {...stylex.props(styles.chip, n === name && styles.chipOn)}
          >
            <FaceChip name={n} />
            {n}
          </motion.button>
        ))}
      </div>
      <CodeBlock code={`<Peek name=${JSON.stringify(name)} />`} />
    </>
  )
}

function BlockView({ block: b }: { block: Block }) {
  if (typeof b === 'string')
    return (
      <p {...stylex.props(styles.p)}>
        <Inline text={b} />
      </p>
    )
  if ('h' in b) {
    const id = b.h.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return (
      <h2 id={id} {...stylex.props(styles.h2)}>
        <a
          href={`#${id}`}
          {...stylex.props(styles.anchor, stylex.defaultMarker())}
        >
          {b.h}
          <span aria-hidden='true' {...stylex.props(styles.hash)}>
            #
          </span>
        </a>
      </h2>
    )
  }
  if ('code' in b)
    return <CodeBlock code={b.code} lang={b.lang} title={b.title} />
  if ('figure' in b) {
    const Fig = FIGURES[b.figure]
    return <Fig />
  }
  if ('list' in b)
    return (
      <ul {...stylex.props(styles.ul)}>
        {b.list.map((t) => (
          <li key={t} {...stylex.props(styles.li)}>
            <Inline text={t} />
          </li>
        ))}
      </ul>
    )
  if ('rows' in b) {
    const [head = [], ...rows] = b.rows
    return (
      <div {...stylex.props(styles.tableBox)}>
        <table {...stylex.props(styles.table)}>
          <thead>
            <tr>
              {head.map((c) => (
                <th key={c} {...stylex.props(styles.th)}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} {...stylex.props(styles.tr)}>
                {r.map((c, i) => (
                  <td key={i} {...stylex.props(styles.td)}>
                    <Inline text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <ul {...stylex.props(styles.faces)}>
      {b.faces.map(({ label, ...props }) => (
        <li key={label ?? props.name} {...stylex.props(styles.face)}>
          <Peek
            size={96}
            frame='none'
            {...props}
            {...stylex.props(styles.fill)}
          />
          {label ? (
            <span {...stylex.props(styles.faceLabel)}>{label}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

/** Backticks become code, everything else stays text. */
function Inline({ text }: { text: string }) {
  return text.split('`').map((s, i) =>
    i % 2 ? (
      <code key={i} {...stylex.props(styles.code)}>
        {s}
      </code>
    ) : (
      s
    ),
  )
}

function Copy({
  text,
  children,
  strong = false,
  big = false,
  icon = false,
}: {
  text: string
  children: string
  strong?: boolean
  big?: boolean
  icon?: boolean
}) {
  const [done, setDone] = useState(false)
  const reduce = useReducedMotion()
  const swap = reduce ? NONE : { duration: 0.18, ease: CURVE }
  return (
    <motion.button
      type='button'
      aria-label={icon ? children : undefined}
      whileTap={{ scale: 0.96 }}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1600)
      }}
      {...stylex.props(
        styles.button,
        strong && styles.strong,
        big && styles.big,
        icon && styles.iconButton,
      )}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={String(done)}
          initial={{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(2px)' }}
          animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
          exit={{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(2px)' }}
          transition={swap}
          {...stylex.props(styles.swap)}
        >
          {done ? <Check /> : <CopyIcon />}
        </motion.span>
      </AnimatePresence>
      {icon ? null : (
        <span aria-live='polite'>{done ? 'Copied' : children}</span>
      )}
    </motion.button>
  )
}

const ICON = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const CopyIcon = () => (
  <svg aria-hidden='true' {...ICON}>
    <rect x='9' y='9' width='12' height='12' rx='2' />
    <path d='M5 15V5a2 2 0 0 1 2-2h10' />
  </svg>
)
const Check = () => (
  <svg aria-hidden='true' {...ICON}>
    <path d='M20 6 9 17l-5-5' />
  </svg>
)
const Chevron = ({ left = false }: { left?: boolean }) => (
  <svg
    aria-hidden='true'
    {...ICON}
    {...stylex.props(styles.chevron, left && styles.chevronLeft)}
  >
    <path d={left ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
)

const WIDE = '@media (width >= 56rem)'
const HOVER = '@media (hover: hover)'
const LINE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

const styles = stylex.create({
  page: {
    display: 'grid',
    gridTemplateColumns: { default: 'minmax(0, 1fr)', [WIDE]: '256px 1fr' },
    minHeight: '100vh',
    backgroundColor: sheet['--page'],
    color: sheet['--fg'],
    fontFamily: fonts['--sans'],
  },
  side: {
    position: { default: 'sticky', [WIDE]: 'sticky' },
    top: 0,
    zIndex: 1,
    height: { default: 'auto', [WIDE]: '100vh' },
    overflowY: { default: 'visible', [WIDE]: 'auto' },
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '8px', [WIDE]: '40px' },
    padding: { default: '14px 16px 8px', [WIDE]: '32px 16px' },
    backgroundColor: sheet['--page'],
    borderRightWidth: { default: 0, [WIDE]: '1px' },
    borderRightStyle: 'dashed',
    borderRightColor: sheet['--rule-strong'],
    borderBottomWidth: { default: '1px', [WIDE]: 0 },
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    paddingInline: '8px',
    color: 'inherit',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: 500,
    letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    flexDirection: { default: 'row', [WIDE]: 'column' },
    gap: { default: '0', [WIDE]: '28px' },
    overflowX: { default: 'auto', [WIDE]: 'visible' },
    marginInline: { default: '-16px', [WIDE]: 0 },
    paddingInline: { default: '8px', [WIDE]: 0 },
    scrollbarWidth: 'none',
  },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  groupHead: {
    display: { default: 'none', [WIDE]: 'block' },
    paddingInline: '8px',
    fontSize: '14px',
    color: sheet['--quiet'],
  },
  navList: {
    display: 'flex',
    flexDirection: { default: 'row', [WIDE]: 'column' },
    gap: '2px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  navItem: { position: 'relative' },
  pill: {
    position: 'absolute',
    inset: 0,
    borderRadius: '8px',
    backgroundColor: sheet['--chip'],
  },
  navLink: {
    position: 'relative',
    display: 'block',
    padding: '6px 8px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    fontSize: '15px',
    textDecoration: 'none',
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    transitionProperty: 'color, background-color',
    transitionDuration: '0.15s',
  },
  navOn: {
    color: sheet['--fg'],
    fontWeight: 500,
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': 'transparent' },
    },
  },
  main: {
    minWidth: 0,
    padding: { default: '40px 20px 80px', [WIDE]: '112px 48px 120px' },
  },
  article: { maxWidth: '720px', marginInline: 'auto' },
  h1: {
    fontSize: '30px',
    fontWeight: 500,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  blurb: {
    marginTop: '8px',
    fontSize: '17px',
    lineHeight: 1.5,
    color: sheet['--soft'],
  },
  heroH: {
    fontSize: 'clamp(28px, 4vw, 34px)',
    fontWeight: 500,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  heroLede: { display: 'block', marginTop: '6px', color: sheet['--quiet'] },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '20px',
  },
  heroActions: { marginTop: '28px', gap: '12px' },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
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
  button: {
    ...LINE,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '34px',
    paddingInline: '12px',
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    color: sheet['--fg'],
    backgroundColor: {
      default: sheet['--page'],
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    cursor: 'pointer',
    transitionProperty: 'background-color, opacity',
    transitionDuration: '0.15s',
  },
  strong: {
    color: sheet['--page'],
    borderColor: sheet['--fg'],
    backgroundColor: sheet['--fg'],
    opacity: { default: 1, [HOVER]: { default: null, ':hover': 0.86 } },
  },
  big: { height: '42px', paddingInline: '18px', fontSize: '16px' },
  iconButton: {
    width: '30px',
    height: '30px',
    padding: 0,
    justifyContent: 'center',
    borderRadius: '8px',
  },
  swap: { display: 'inline-flex' },
  demo: {
    ...LINE,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '40px',
    padding: '32px 24px 24px',
    borderRadius: '16px',
  },
  demoStage: { display: 'grid', placeItems: 'center', height: '180px' },
  demoFace: { width: '160px', height: '160px' },
  field: { width: '100%', maxWidth: '520px', marginTop: '20px' },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
  },
  input: {
    ...LINE,
    width: '100%',
    height: '52px',
    paddingInline: '20px',
    borderRadius: '16px',
    fontFamily: 'inherit',
    fontSize: '17px',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
    outline: 'none',
    borderColor: {
      default: sheet['--rule'],
      ':focus-visible': sheet['--rule-strong'],
    },
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '20px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '32px',
    paddingInline: '8px 12px',
    borderWidth: 0,
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: {
      default: sheet['--quiet'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transitionProperty: 'color, background-color',
    transitionDuration: '0.15s',
  },
  chipOn: { color: sheet['--fg'], backgroundColor: sheet['--chip'] },
  p: { marginTop: '18px', fontSize: '16px', lineHeight: 1.75 },
  h2: {
    scrollMarginTop: '24px',
    marginTop: '56px',
    marginBottom: 0,
    fontSize: '22px',
    fontWeight: 500,
    letterSpacing: '-0.015em',
  },
  ul: { marginTop: '18px', marginBottom: 0, paddingLeft: '20px' },
  li: { fontSize: '16px', lineHeight: 1.75, paddingLeft: '4px' },
  code: {
    fontFamily: fonts['--mono'],
    fontSize: '0.84em',
    padding: '2px 6px',
    borderRadius: '6px',
    backgroundColor: sheet['--chip'],
  },
  tr: {
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    transitionProperty: 'background-color',
    transitionDuration: '0.12s',
  },
  tableBox: { marginTop: '24px', overflowX: 'auto' },
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
    lineHeight: 1.6,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  faces: {
    ...LINE,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: '20px 12px',
    marginTop: '28px',
    padding: '24px',
    borderRadius: '16px',
    listStyle: 'none',
  },
  face: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  faceLabel: { fontSize: '13px', color: sheet['--quiet'] },
  fill: { width: '100%', maxWidth: '96px', height: 'auto', aspectRatio: '1' },
  pager: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '80px',
  },
  pagerLink: {
    ...LINE,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    padding: '10px 16px 10px 10px',
    borderRadius: '14px',
    textDecoration: 'none',
    color: sheet['--fg'],
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    borderColor: {
      default: sheet['--rule'],
      [HOVER]: { default: null, ':hover': sheet['--rule-strong'] },
    },
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.15s',
  },
  pagerNext: {
    gridColumn: 2,
    flexDirection: 'row-reverse',
    padding: '10px 10px 10px 16px',
    textAlign: 'right',
  },
  pagerFace: {
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    width: '48px',
    height: '48px',
    overflow: 'hidden',
    borderRadius: '10px',
    backgroundColor: sheet['--chip'],
  },
  pagerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  pagerDir: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: sheet['--quiet'],
  },
  pagerTitle: {
    fontSize: '16px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pillFace: {
    position: 'absolute',
    right: '6px',
    bottom: 0,
    display: { default: 'none', [WIDE]: 'flex' },
    width: '26px',
    height: '26px',
    overflow: 'hidden',
  },
  anchor: { color: 'inherit', textDecoration: 'none' },
  hash: {
    marginLeft: '8px',
    color: sheet['--quiet'],
    opacity: {
      default: 0,
      [stylex.when.ancestor(':hover')]: 1,
      [stylex.when.ancestor(':focus-visible')]: 1,
    },
    transitionProperty: 'opacity',
    transitionDuration: '0.15s',
  },
  chevron: {
    transitionProperty: 'transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transform: {
      default: null,
      [stylex.when.ancestor(':hover')]: 'translateX(2px)',
    },
  },
  chevronLeft: {
    transform: {
      default: null,
      [stylex.when.ancestor(':hover')]: 'translateX(-2px)',
    },
  },
})
