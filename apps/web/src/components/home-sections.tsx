/*
 * The home page under the fold, on the same ink ground as the hero: a wall
 * of names, the three calls, the expressions on one face, the numbers and a
 * last call to install. Every value shown is read from the library or
 * computed by it, never typed.
 */
import {
  COLORS,
  EXPRESSIONS,
  FACES,
  identify,
  LATEST,
  Peek,
  toSvg,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useId, useState, useSyncExternalStore } from 'react'
import { type Lang, tokens } from '@/components/code-block'
import { cheer } from '@/components/creatures'
import { DoanMark } from '@/components/doan-mark'
import { line, MANAGERS, type Manager } from '@/components/figures/install'
import { PropsPlayground } from '@/components/figures/react'
import { ManagerLogo } from '@/components/manager-logo'
import { REPO } from '@/lib/docs'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { playSound } from '@/lib/sound'
import { COMBOS, EXPRESSION_LIST, NAMES } from '@/lib/studio'
import { inkSheet } from '@/lib/theme'
import { colors, fonts } from '@/lib/tokens.stylex'
import { wardrobeFor, wardrobeJsx, wardrobeTs } from '@/lib/wardrobe'

/* The package manager: one pick for every install line on the page. */
let picked: Manager = 'npm'
const watchers = new Set<() => void>()
const watch = (f: () => void) => {
  watchers.add(f)
  return () => {
    watchers.delete(f)
  }
}
const choose = (m: Manager) => {
  picked = m
  for (const f of watchers) f()
}

/** The install line, a tab per package manager. Click the line and it is
 * on the clipboard, and the cast cheers. */
export function InstallPill() {
  const pm = useSyncExternalStore(
    watch,
    () => picked,
    (): Manager => 'npm',
  )
  const [done, setDone] = useState(false)
  const still = useReducedMotion()
  const group = useId()
  const cmd = line(pm)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd)
      cheer()
      playSound('success')
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    } catch {
      // A denied clipboard write gets no success cue.
    }
  }
  return (
    <div {...stylex.props(styles.installBox)}>
      <fieldset aria-label='Package manager' {...stylex.props(styles.tabs)}>
        {MANAGERS.map((m) => (
          <button
            key={m}
            type='button'
            aria-pressed={m === pm}
            onClick={() => choose(m)}
            {...stylex.props(styles.tab, m === pm && styles.tabOn)}
          >
            {m === pm ? (
              <motion.span
                layoutId={group}
                transition={still ? NONE : LAND}
                {...stylex.props(styles.tabPill)}
              />
            ) : null}
            <span {...stylex.props(styles.tabText)}>
              <ManagerLogo pm={m} on={m === pm} />
              {m}
            </span>
          </button>
        ))}
      </fieldset>
      <motion.button
        type='button'
        whileTap={{ scale: 0.97 }}
        onClick={copy}
        data-sound-cue='success'
        aria-label={`Copy: ${cmd}`}
        {...stylex.props(styles.install)}
      >
        <span aria-hidden='true' {...stylex.props(styles.prompt)}>
          $
        </span>
        {/* the line rolls over to the next manager's */}
        <span aria-hidden='true' {...stylex.props(styles.cmdWindow)}>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.span
              key={pm}
              initial={{ y: '90%', opacity: 0, filter: 'blur(3px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-90%', opacity: 0, filter: 'blur(3px)' }}
              transition={still ? NONE : LAND}
              {...stylex.props(styles.cmd)}
            >
              {cmd}
            </motion.span>
          </AnimatePresence>
        </span>
        <span aria-hidden='true' {...stylex.props(styles.copied)}>
          {done ? 'Copied' : 'Copy'}
        </span>
      </motion.button>
    </div>
  )
}

/** The way in: the docs. */
export function DocsButton() {
  return (
    <Link to='/docs' {...stylex.props(styles.way, styles.wayStrong)}>
      Read the docs
      <span aria-hidden='true'>→</span>
    </Link>
  )
}

export function HomeSections() {
  return (
    <div {...stylex.props(styles.sections)}>
      <Wall />
      <Calls />
      <Moods />
      <Numbers />
      <Footer />
    </div>
  )
}

function Head({
  n,
  label,
  title,
  children,
}: {
  n: string
  label: string
  title: string
  children: ReactNode
}) {
  const still = useReducedMotion()
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={still ? NONE : { duration: 0.9, ease: CURVE }}
      {...stylex.props(styles.head)}
    >
      <p {...stylex.props(styles.micro)}>
        <span {...stylex.props(styles.dot)} />
        {n} · {label}
      </p>
      <h2 {...stylex.props(styles.h2)}>{title}</h2>
      <p {...stylex.props(styles.lede)}>{children}</p>
    </motion.header>
  )
}

/* ---------- 01 · The wall ---------- */

const WALL = NAMES.slice(0, 24)

function Wall() {
  const [on, setOn] = useState<number | null>(null)
  return (
    <section {...stylex.props(styles.section)}>
      <Head n='01' label='Same name, same face' title='Everyone gets a face'>
        Nothing is stored and nothing is fetched. Each face is worked out from
        the name, so it is the same one every time, everywhere. Outfits are
        props; this wall dresses each name the same way every visit.
      </Head>
      <ul {...stylex.props(styles.wall)}>
        {WALL.map((name, i) => (
          <li
            key={name}
            onPointerEnter={() => setOn(i)}
            onPointerLeave={() => setOn((v) => (v === i ? null : v))}
            {...stylex.props(styles.tile)}
          >
            <Peek
              name={name}
              {...wardrobeFor(name)}
              size={88}
              expression={on === i ? 'excited' : 'normal'}
              gaze='pointer'
              animate
            />
            <span {...stylex.props(styles.tileName)}>{name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- 02 · The three calls ---------- */

const SAMPLE = 'Linh'
const outfit = wardrobeFor(SAMPLE)
const outfitJsx = wardrobeJsx(SAMPLE)
const svg = toSvg(SAMPLE, outfit)
const who = identify(SAMPLE)

const CALLS: { title: string; note: string; code: string; lang: Lang }[] = [
  {
    title: 'React',
    note: 'A component. Server rendered, hydrates to the same face.',
    code: `<Peek name="${SAMPLE}" ${outfitJsx} animate />`,
    lang: 'tsx',
  },
  {
    title: 'Any runtime',
    note: 'A string of SVG. Node, Bun, Deno, the edge, the browser.',
    code: `toSvg('${SAMPLE}', ${wardrobeTs(SAMPLE)})\n// '${svg.slice(0, 28)}…'\n// ${svg.length.toLocaleString('en-US')} bytes, every time`,
    lang: 'ts',
  },
  {
    title: 'Just the identity',
    note: 'The axes the name picked, to use however you like.',
    code: `identify('${SAMPLE}')\n// face: '${who.face}'\n// color: '${who.color}'\n// eyes: '${who.eyes}'`,
    lang: 'ts',
  },
]

function Calls() {
  return (
    <section {...stylex.props(styles.section)}>
      <Head n='02' label='Three calls' title='A string in, a face out'>
        One package with no runtime dependencies. Render it in React, or get the
        SVG as text anywhere JavaScript runs.
      </Head>
      <div {...stylex.props(styles.calls)}>
        {CALLS.map((c) => (
          <article key={c.title} {...stylex.props(styles.call)}>
            <div {...stylex.props(styles.callTop)}>
              <h3 {...stylex.props(styles.h3)}>{c.title}</h3>
              <Peek
                name={SAMPLE}
                {...(c.title !== 'Just the identity' ? outfit : {})}
                size={40}
                frame='none'
                title={false}
                expression='happy'
              />
            </div>
            <p {...stylex.props(styles.callNote)}>{c.note}</p>
            <pre {...stylex.props(styles.code)}>
              <code>
                {c.code.split('\n').map((line, i) => (
                  <span key={i} {...stylex.props(styles.codeLine)}>
                    {tokens(line, c.lang).map((t, j) => (
                      <span key={j} {...stylex.props(styles[`k_${t.kind}`])}>
                        {t.text}
                      </span>
                    ))}
                  </span>
                ))}
              </code>
            </pre>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- 03 · The expressions ---------- */

function Moods() {
  return (
    <section {...stylex.props(styles.section)}>
      <Head
        n='03'
        label='State on top'
        title={`${EXPRESSION_LIST.length} expressions, one face`}
      >
        The name decides who it is. Expression, gaze and motion are yours to
        set. Add an outfit, then change its mood. The face stays itself.
      </Head>
      {/* the docs' playground, pinned to its dark scheme on the ink ground */}
      <div {...stylex.props(inkSheet)}>
        <PropsPlayground />
      </div>
    </section>
  )
}

/* ---------- 04 · The numbers ---------- */

const FACTS = [
  [Object.keys(FACES).length, 'faces'],
  [Object.keys(COLORS).length, 'inks'],
  [Object.keys(EXPRESSIONS).length, 'expressions'],
  [COMBOS.toLocaleString('en-US'), 'distinct faces'],
  [0, 'runtime dependencies'],
] as const

function Numbers() {
  return (
    <section aria-label='In numbers' {...stylex.props(styles.section)}>
      <dl {...stylex.props(styles.facts)}>
        {FACTS.map(([n, label]) => (
          <div key={label} {...stylex.props(styles.fact)}>
            <dt {...stylex.props(styles.factLabel)}>{label}</dt>
            <dd {...stylex.props(styles.factNum)}>{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------- The last call ---------- */

function Footer() {
  return (
    <footer {...stylex.props(styles.footer)}>
      <div {...stylex.props(styles.cta)}>
        <h2 {...stylex.props(styles.h2, styles.center)}>
          Give every name a face
        </h2>
        <div {...stylex.props(styles.waysRow)}>
          <InstallPill />
          <DocsButton />
        </div>
      </div>
      <div {...stylex.props(styles.base)}>
        <a
          href='https://doan-labs.com'
          target='_blank'
          rel='noopener'
          {...stylex.props(styles.baseLink, styles.maker)}
        >
          A product by
          <span {...stylex.props(styles.doan)}>
            <DoanMark size={14} />
            Doan Labs
          </span>
        </a>
        <nav aria-label='More' {...stylex.props(styles.baseNav)}>
          <Link to='/docs' {...stylex.props(styles.baseLink)}>
            Docs
          </Link>
          <a href='/llms.txt' {...stylex.props(styles.baseLink)}>
            llms.txt
          </a>
          <a
            href={REPO}
            target='_blank'
            rel='noopener'
            {...stylex.props(styles.baseLink)}
          >
            GitHub
          </a>
          <span {...stylex.props(styles.version)}>peek@{LATEST}</span>
        </nav>
      </div>
    </footer>
  )
}

const MICRO = {
  fontFamily: fonts['--mono'],
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.14em',
  lineHeight: 1,
  textTransform: 'uppercase',
} as const

const RULE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: colors['--faint'],
} as const

const RING = {
  outlineColor: {
    default: 'transparent',
    ':focus-visible': colors['--signal'],
  },
  outlineStyle: 'solid',
  outlineWidth: '2px',
  outlineOffset: '3px',
} as const

const styles = stylex.create({
  installBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  tabs: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    display: 'flex',
    gap: '2px',
  },
  tab: {
    ...MICRO,
    ...RING,
    position: 'relative',
    paddingBlock: '8px',
    paddingInline: '12px',
    borderWidth: 0,
    borderRadius: '999px',
    backgroundColor: 'transparent',
    color: { default: colors['--muted'], ':hover': colors['--bone'] },
    textTransform: 'none',
    cursor: 'pointer',
    transitionProperty: 'color',
    transitionDuration: '0.2s',
  },
  tabOn: { color: { default: colors['--bone'], ':hover': colors['--bone'] } },
  tabPill: {
    position: 'absolute',
    inset: 0,
    borderRadius: '999px',
    backgroundColor: `color-mix(in srgb, ${colors['--bone']} 11%, transparent)`,
  },
  tabText: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
  },
  // one line tall, as wide as the longest command, so the pill never
  // changes size as the line rolls over
  cmdWindow: {
    position: 'relative',
    display: 'inline-flex',
    minWidth: '26ch',
    overflow: 'clip',
    overflowClipMargin: '2px',
  },
  cmd: { display: 'inline-block' },
  install: {
    ...RING,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    paddingBlock: '12px',
    paddingInline: '18px 8px',
    ...RULE,
    borderRadius: '999px',
    backgroundColor: 'transparent',
    color: colors['--bone'],
    fontFamily: fonts['--mono'],
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    borderColor: { default: colors['--faint'], ':hover': colors['--muted'] },
  },
  prompt: { color: colors['--signal'] },
  copied: {
    ...MICRO,
    minWidth: '64px',
    paddingBlock: '7px',
    paddingInline: '10px',
    borderRadius: '999px',
    backgroundColor: colors['--bone'],
    color: colors['--ground'],
    textAlign: 'center',
  },
  way: {
    ...MICRO,
    ...RING,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    paddingBlock: '13px',
    paddingInline: '18px',
    borderRadius: '999px',
    color: { default: colors['--muted'], ':hover': colors['--bone'] },
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '0.2s',
  },
  wayStrong: {
    backgroundColor: colors['--bone'],
    color: { default: colors['--ground'], ':hover': colors['--ground'] },
  },
  // under the cast, which waits on the window's floor; a lamp over the
  // footer, where it stands again
  sections: {
    position: 'relative',
    color: colors['--bone'],
    fontFamily: fonts['--sans'],
    backgroundColor: colors['--ground'],
    backgroundImage: `radial-gradient(1100px 520px at 50% 100%, color-mix(in srgb, ${colors['--bone']} 6%, transparent), transparent)`,
  },
  section: {
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingInline: 'clamp(16px, 4vw, 40px)',
    paddingBlock: 'clamp(64px, 12vw, 140px) 0',
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    maxWidth: '640px',
    marginBottom: 'clamp(32px, 5vw, 56px)',
  },
  micro: {
    ...MICRO,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: colors['--muted'],
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: colors['--signal'],
  },
  h2: {
    margin: 0,
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: 600,
    letterSpacing: '-0.04em',
    lineHeight: 1.02,
  },
  center: { textAlign: 'center' },
  lede: {
    fontSize: '17px',
    lineHeight: 1.55,
    color: colors['--muted'],
    textWrap: 'pretty',
  },
  wall: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
    gap: '28px 12px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  tileName: { ...MICRO, color: colors['--muted'], textTransform: 'none' },
  calls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  call: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '22px',
    ...RULE,
    borderRadius: '18px',
  },
  callTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h3: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  callNote: { fontSize: '14px', lineHeight: 1.5, color: colors['--muted'] },
  code: {
    margin: 0,
    marginTop: 'auto',
    paddingTop: '14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors['--faint'],
    fontFamily: fonts['--mono'],
    fontSize: '13px',
    lineHeight: 1.7,
    overflowX: 'auto',
  },
  codeLine: { display: 'block', whiteSpace: 'pre' },
  k_key: { color: colors['--signal'] },
  k_str: { color: colors['--clay'] },
  k_tag: { color: colors['--lav'] },
  k_fn: { color: colors['--fog'] },
  k_num: { color: colors['--clay'] },
  k_prop: { color: colors['--bone'] },
  k_punct: { color: colors['--muted'] },
  k_com: { color: colors['--muted'] },
  k_plain: { color: colors['--bone'] },
  facts: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors['--faint'],
  },
  fact: {
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '10px',
    paddingBlock: '28px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors['--faint'],
  },
  factLabel: { ...MICRO, color: colors['--muted'] },
  factNum: {
    margin: 0,
    fontSize: 'clamp(36px, 5vw, 52px)',
    fontWeight: 600,
    letterSpacing: '-0.04em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  footer: {
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingInline: 'clamp(16px, 4vw, 40px)',
    paddingTop: 'clamp(80px, 14vw, 160px)',
    // the stage the cast stands on at the end: the row's tallest, from U in
    // creatures.tsx. Reduced motion keeps the cast on the hero.
    paddingBottom: {
      default: 'calc(min(18vw, 19svh, 220px) * 1.3)',
      '@media (prefers-reduced-motion: reduce)': 0,
    },
  },
  cta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '28px',
    paddingBottom: 'clamp(64px, 10vw, 120px)',
  },
  waysRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBlock: '28px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors['--faint'],
  },
  baseNav: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '20px',
  },
  baseLink: {
    ...MICRO,
    ...RING,
    color: { default: colors['--muted'], ':hover': colors['--bone'] },
    textDecoration: 'none',
    borderRadius: '4px',
  },
  maker: { display: 'inline-flex', alignItems: 'center', gap: '10px' },
  doan: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    color: colors['--bone'],
  },
  version: { ...MICRO, color: colors['--faint'] },
})
