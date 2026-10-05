/*
 * The Introduction's figures. IntroNumbers: the library's counts, each over
 * a drawing made of the faces it counts. SameFace: one name, drawn twice,
 * as a server would and as the browser does, and the bytes agree.
 *
 * Every number is read from @doanlabs/peek, never typed.
 */
import {
  COLORS,
  type Color,
  EXPRESSIONS,
  type Expression,
  FACES,
  type Face,
  LATEST,
  Peek,
  toSvg,
  VERSIONS,
} from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Controls, FaceChip, Figure, Micro, Stage, useAutoplay } from './kit'

const FACE_LIST = Object.keys(FACES) as Face[]
const COLOR_LIST = Object.keys(COLORS) as Color[]
const EXPR_LIST = Object.keys(EXPRESSIONS) as Expression[]
const LOOKS = Object.values(VERSIONS[LATEST]!).reduce((a, b) => a * b, 1)
const fmt = (n: number) => n.toLocaleString('en-US')

/* ---------- IntroNumbers ---------- */

/*
 * Four numbers in the prose, each over a drawing of what it counts. The
 * numbers are the final values from the first paint: no counter waits for
 * a scroll. Two of the drawings play while on screen.
 */
export function IntroNumbers() {
  const cells: [number, string, ReactNode][] = [
    [FACE_LIST.length, 'faces', <Shapes key='f' />],
    [COLOR_LIST.length, 'colors', <Inks key='c' />],
    [EXPR_LIST.length, 'expressions', <Moods key='e' />],
    [LOOKS, `looks at peek@${LATEST}`, <Looks key='l' />],
  ]
  return (
    <Figure bare>
      <dl {...stylex.props(styles.row)}>
        {cells.map(([n, label, art]) => (
          <div key={label} {...stylex.props(styles.cell)}>
            <div {...stylex.props(styles.art)}>{art}</div>
            <dd {...stylex.props(styles.value)}>{fmt(n)}</dd>
            <dt {...stylex.props(styles.label)}>{label}</dt>
          </div>
        ))}
      </dl>
    </Figure>
  )
}

const tiny = { frame: 'none', title: false } as const

/** The four face shapes, one name. */
function Shapes() {
  return (
    <span {...stylex.props(styles.faces)}>
      {FACE_LIST.map((f) => (
        <Peek
          key={f}
          name='Linh'
          face={f}
          color='lavender'
          size={30}
          {...tiny}
        />
      ))}
    </span>
  )
}

/** The seven inks, a row of the same face. */
function Inks() {
  return (
    <span {...stylex.props(styles.faces, styles.tight)}>
      {COLOR_LIST.map((c) => (
        <FaceChip key={c} name='Linh' face='circle' color={c} size={18} />
      ))}
    </span>
  )
}

/** One face running through every expression, a pip for each. */
function Moods() {
  const [at, setAt] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const live = useInView(ref, { amount: 0.5 })
  const still = useReducedMotion()
  useEffect(() => {
    if (!live || still) return
    const t = setInterval(() => setAt((a) => (a + 1) % EXPR_LIST.length), 1100)
    return () => clearInterval(t)
  }, [live, still])
  return (
    <span ref={ref} {...stylex.props(styles.moods)}>
      <FaceChip
        name='Linh'
        face='semicircle'
        size={40}
        expression={EXPR_LIST[at]}
        animate
      />
      <span {...stylex.props(styles.pips)}>
        {EXPR_LIST.map((e, i) => (
          <button
            key={e}
            type='button'
            aria-label={e}
            title={e}
            onClick={() => setAt(i)}
            {...stylex.props(styles.pip, i === at && styles.pipOn)}
          />
        ))}
      </span>
    </span>
  )
}

const NAMES = ['Linh', 'Thanh', 'Alan', 'Linus', 'Hedy', 'Edsger', 'Barbara']

/** A slot machine of names: each reel lands on a new face in turn. */
function Looks() {
  const [turn, setTurn] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const live = useInView(ref, { amount: 0.5 })
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!live || reduce) return
    const t = setInterval(() => setTurn((n) => n + 1), 900)
    return () => clearInterval(t)
  }, [live, reduce])
  return (
    <span ref={ref} {...stylex.props(styles.faces)}>
      {[0, 1, 2].map((r) => {
        // reel r advances every third turn, staggered
        const spin = Math.floor((turn + 2 - r) / 3)
        const name = NAMES[(r * 2 + spin) % NAMES.length]!
        return (
          <span key={r} {...stylex.props(styles.reel)}>
            <motion.span
              key={name}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={reduce || spin === 0 ? NONE : LAND}
              {...stylex.props(styles.reelFace)}
            >
              <FaceChip name={name} size={30} />
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

/* ---------- SameFace ---------- */

/** FNV-1a over UTF-8, as in packages/peek/src/identity.ts (not exported). */
function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

const TYPED = ['Linh', 'Thanh', 'Alan Turing', 'Hedy Lamarr']
const KEY = 0.09
const HOLD = 2.2

/** The name the autoplay has typed `t` seconds in: a letter at a time. */
function typed(t: number) {
  const spans = TYPED.map((n) => n.length * KEY + HOLD)
  const total = spans.reduce((a, b) => a + b, 0)
  let x = t % total
  for (const [i, n] of TYPED.entries()) {
    if (x < spans[i]!) return n.slice(0, Math.min(n.length, Math.ceil(x / KEY)))
    x -= spans[i]!
  }
  return TYPED[0]!
}

export function SameFace() {
  const [name, setName] = useState(TYPED[0]!)
  const [settled, setSettled] = useState(true)
  const play = useAutoplay<HTMLDivElement>((t) => {
    // start on a full name, then type the rest
    setName(typed(t + TYPED[0]!.length * KEY))
  })
  useEffect(() => {
    setSettled(false)
    const t = setTimeout(() => setSettled(true), 700)
    return () => clearTimeout(t)
  }, [name])
  const svg = toSvg(name)
  const bytes = new TextEncoder().encode(svg).length
  const hash = fnv1a(svg).toString(16).padStart(8, '0')
  return (
    <Figure>
      <div ref={play.ref}>
        <Stage height={240}>
          <div {...stylex.props(styles.panes)}>
            <Pane
              where='Server'
              how='toSvg()'
              name={name}
              look={settled ? [0, 0] : [0.8, 0.1]}
              settled={settled}
              bytes={bytes}
              hash={hash}
            />
            <Match name={name} settled={settled} />
            <Pane
              where='Browser'
              how='<Peek>'
              name={name}
              look={settled ? [0, 0] : [-0.8, 0.1]}
              settled={settled}
              bytes={bytes}
              hash={hash}
            />
          </div>
        </Stage>
        <Controls>
          <label {...stylex.props(styles.field)}>
            <span {...stylex.props(styles.hidden)}>Name</span>
            <input
              value={name}
              placeholder='Type a name'
              spellCheck={false}
              autoComplete='off'
              maxLength={40}
              onFocus={play.stop}
              onChange={(e) => {
                play.stop()
                setName(e.target.value)
              }}
              {...stylex.props(styles.input)}
            />
          </label>
          <Micro>{play.on ? 'typing' : 'your turn'}</Micro>
        </Controls>
      </div>
    </Figure>
  )
}

function Pane({
  where,
  how,
  name,
  look,
  settled,
  bytes,
  hash,
}: {
  where: string
  how: string
  name: string
  look: [number, number]
  settled: boolean
  bytes: number
  hash: string
}) {
  return (
    <div {...stylex.props(styles.pane)}>
      <Micro>{where}</Micro>
      <div {...stylex.props(styles.paneFace)}>
        <Peek
          name={name || ' '}
          size={96}
          gaze={look}
          expression={settled ? 'happy' : 'curious'}
          animate
          title={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <code {...stylex.props(styles.how)}>{how}</code>
      <span {...stylex.props(styles.sum)}>
        {fmt(bytes)} B · {hash}
      </span>
    </div>
  )
}

/** The equals sign between the panes: it re-checks on every keystroke. */
function Match({ name, settled }: { name: string; settled: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div {...stylex.props(styles.match)} aria-live='polite'>
      <motion.span
        key={name}
        initial={{ scale: 0.6, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? NONE : LAND}
        {...stylex.props(styles.eq, settled && styles.eqOn)}
      >
        =
      </motion.span>
      <span {...stylex.props(styles.hidden)}>
        {settled ? 'Server and browser match' : ''}
      </span>
    </div>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const LINE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

const styles = stylex.create({
  row: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(4, minmax(0, 1fr))',
      [SMALL]: 'repeat(2, minmax(0, 1fr))',
    },
    rowGap: '24px',
    margin: 0,
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
    paddingInline: '16px',
    // a hairline between numbers, none before the first of a row
    borderLeftWidth: {
      default: '1px',
      ':first-child': 0,
      [SMALL]: { default: '1px', ':nth-child(odd)': 0 },
    },
    borderLeftStyle: 'solid',
    borderLeftColor: sheet['--rule'],
    paddingLeft: {
      default: '16px',
      ':first-child': 0,
      [SMALL]: { default: '16px', ':nth-child(odd)': 0 },
    },
  },
  art: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '52px',
    marginBottom: '8px',
  },
  value: {
    margin: 0,
    fontSize: { default: '34px', [SMALL]: '28px' },
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    color: sheet['--fg'],
  },
  label: { fontSize: '13.5px', lineHeight: 1.35, color: sheet['--soft'] },
  faces: { display: 'flex', alignItems: 'flex-end', gap: '2px' },
  tight: { gap: 0 },
  moods: { display: 'flex', alignItems: 'flex-end', gap: '10px' },
  pips: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 8px)',
    gap: '3px',
    paddingBottom: '4px',
  },
  pip: {
    width: '8px',
    height: '8px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '50%',
    backgroundColor: {
      default: sheet['--rule-strong'],
      [HOVER]: { default: null, ':hover': sheet['--soft'] },
    },
    cursor: 'pointer',
    transitionProperty: 'background-color, transform',
    transitionDuration: '0.2s',
  },
  pipOn: { backgroundColor: sheet['--red'], transform: 'scale(1.25)' },
  reel: {
    display: 'inline-flex',
    width: '30px',
    height: '30px',
    overflow: 'hidden',
  },
  reelFace: { display: 'inline-flex' },
  panes: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: { default: '24px', [SMALL]: '8px' },
    width: '100%',
    maxWidth: '480px',
    padding: '20px 16px',
  },
  pane: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  paneFace: {
    width: { default: '112px', [SMALL]: '88px' },
    height: { default: '112px', [SMALL]: '88px' },
    borderRadius: '22px',
    overflow: 'hidden',
    // the ink frame meets a dark page: a hairline keeps its edge
    boxShadow: `0 0 0 1px ${sheet['--edge']}`,
  },
  how: {
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    color: sheet['--fg'],
  },
  sum: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    color: sheet['--quiet'],
    whiteSpace: 'nowrap',
  },
  match: { display: 'grid', placeItems: 'center' },
  eq: {
    ...LINE,
    display: 'grid',
    placeItems: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontFamily: fonts['--mono'],
    fontSize: '18px',
    color: sheet['--quiet'],
    backgroundColor: sheet['--page'],
    transitionProperty: 'color, border-color',
    transitionDuration: '0.2s',
  },
  eqOn: { color: sheet['--red'], borderColor: sheet['--red'] },
  field: { flex: '1 1 160px', minWidth: 0 },
  input: {
    ...LINE,
    width: '100%',
    height: '32px',
    paddingInline: '14px',
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    outline: 'none',
    borderColor: {
      default: sheet['--rule'],
      ':focus-visible': sheet['--fg'],
    },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
})
