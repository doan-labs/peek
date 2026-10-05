/*
 * The `svg` page's figures, each its own form. SameBytes is the call
 * itself, typed into, run twice and compared slice by slice; ServeIt
 * (svg-serve.tsx) is a browser window with its network panel; DataUri is
 * the <img> tag, folded until the reader opens it. Every number on them is measured from
 * the string toSvg just returned.
 */
import { toSvg } from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import {
  FaceChip,
  Figure,
  keyed,
  styles as kit,
  Micro,
  Roll,
  Segmented,
  useAutoplay,
} from './kit'

export { ServeIt } from './svg-serve'

/** The call the page's first snippet makes. */
export const draw = (name: string) => toSvg(name, { size: 96, frame: 'bone' })

export const uri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`

export const bytes = (s: string) => new TextEncoder().encode(s).length

/** FNV-1a over the UTF-8 bytes, as identity.ts has it (not exported there). */
function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

const NAMES = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Hedy Lamarr']
const CELLS = 18

/** A face drawn from a string, through <img>, so it is the bytes rendered. */
export function Shown({ svg, size }: { svg: string; size: number }) {
  const reduce = useReducedMotion()
  return (
    <span {...stylex.props(styles.shown, styles.square(size))}>
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.img
          key={svg}
          src={uri(svg)}
          alt=''
          width={size}
          height={size}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={reduce ? NONE : LAND}
          {...stylex.props(styles.img)}
        />
      </AnimatePresence>
    </span>
  )
}

/** The two strings in CELLS slices, each slice compared, sweeping down. */
function Compare({ a, b }: { a: string; b: string }) {
  const reduce = useReducedMotion()
  const n = Math.ceil(Math.max(a.length, b.length) / CELLS)
  return (
    <div {...stylex.props(styles.compare)} aria-hidden='true'>
      <div key={fnv1a(a)} {...stylex.props(styles.cells)}>
        {Array.from({ length: CELLS }, (_, i) => {
          const eq = a.slice(i * n, i * n + n) === b.slice(i * n, i * n + n)
          return (
            <motion.span
              key={i}
              initial={{ scaleX: 0, opacity: 0.3 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={
                reduce
                  ? NONE
                  : { duration: 0.32, delay: i * 0.025, ease: CURVE }
              }
              {...stylex.props(styles.cell, !eq && styles.cellOff)}
            />
          )
        })}
      </div>
      <span {...stylex.props(styles.verdict)}>{a === b ? '=' : '≠'}</span>
    </div>
  )
}

function Run({ label, svg }: { label: string; svg: string }) {
  return (
    <div {...stylex.props(styles.run)}>
      <Shown svg={svg} size={96} />
      <span {...stylex.props(styles.hash)}>
        #<Roll text={fnv1a(svg)} />
      </span>
      <Micro>{label}</Micro>
    </div>
  )
}

export function SameBytes() {
  const [name, setName] = useState(NAMES[0]!)
  const auto = useAutoplay<HTMLDivElement>((t) => {
    const full = NAMES[Math.floor(t / 3.2) % NAMES.length]!
    const k = keyed(t % 3.2, [
      [0, 0],
      [1.3, 1],
      [3.2, 1],
    ])
    setName(full.slice(0, Math.max(1, Math.ceil(k * full.length))))
  })
  const a = draw(name)
  const b = draw(name)

  return (
    <Figure bare>
      <div ref={auto.ref} {...stylex.props(styles.same)}>
        <label {...stylex.props(styles.call)}>
          <span {...stylex.props(styles.fn)}>toSvg</span>
          <span {...stylex.props(styles.punct)}>(&apos;</span>
          <input
            value={name}
            onChange={(e) => {
              auto.stop()
              setName(e.target.value)
            }}
            onFocus={auto.stop}
            aria-label='Name'
            spellCheck={false}
            {...stylex.props(styles.field, styles.chars(name.length))}
          />
          <span {...stylex.props(styles.punct)}>&apos;)</span>
        </label>
        <div {...stylex.props(styles.pair)}>
          <Run label='Run 1' svg={a} />
          <Compare a={a} b={b} />
          <Run label='Run 2' svg={b} />
        </div>
      </div>
    </Figure>
  )
}

const CHIPS = ['Ada', 'Grace', 'Alan'] as const

export function DataUri() {
  const reduce = useReducedMotion()
  const [name, setName] = useState<(typeof CHIPS)[number]>('Ada')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const auto = useAutoplay<HTMLDivElement>((t) => {
    setName(CHIPS[Math.floor(t / 2.4) % CHIPS.length]!)
  })
  const svg = draw(name)
  const src = uri(svg)
  const head = src.slice(0, 40)
  const tail = src.slice(-18)
  const middle = src.slice(head.length, -tail.length)
  const copy = () => {
    navigator.clipboard?.writeText(src)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1400)
  }

  return (
    <Figure bare>
      <div ref={auto.ref} {...stylex.props(styles.inline)}>
        <div {...stylex.props(styles.tagLine, open && styles.tagOpen)}>
          <span {...stylex.props(styles.punct)}>{'<img src="'}</span>
          <span {...stylex.props(styles.str)}>{head}</span>
          {open ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduce ? NONE : { duration: 0.3, ease: CURVE }}
              {...stylex.props(styles.str)}
            >
              {middle}
            </motion.span>
          ) : (
            <button
              type='button'
              aria-label='Show the whole URI'
              onClick={() => {
                auto.stop()
                setOpen(true)
              }}
              {...stylex.props(styles.gap)}
            >
              … <Roll text={middle.length.toLocaleString('en')} /> more …
            </button>
          )}
          <span {...stylex.props(styles.str)}>{tail}</span>
          <span {...stylex.props(styles.punct)}>{'" />'}</span>
        </div>
        <span {...stylex.props(styles.arrow)} aria-hidden='true'>
          →
        </span>
        <Shown svg={svg} size={88} />
      </div>
      <div {...stylex.props(styles.under)}>
        <Segmented
          label='Name'
          options={CHIPS}
          value={name}
          onChange={(v) => {
            auto.stop()
            setName(v)
          }}
          render={(v) => (
            <>
              <FaceChip name={v} size={18} />
              {v}
            </>
          )}
        />
        {open ? (
          <button
            type='button'
            onClick={() => setOpen(false)}
            {...stylex.props(styles.text)}
          >
            Fold
          </button>
        ) : null}
        <motion.button
          type='button'
          whileTap={{ scale: reduce ? 1 : 0.96 }}
          onClick={copy}
          {...stylex.props(kit.pill, styles.copy)}
        >
          {copied ? 'Copied' : 'Copy URI'}
        </motion.button>
      </div>
    </Figure>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'

export const styles = stylex.create({
  shown: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  square: (px: number) => ({ width: `${px}px`, height: `${px}px` }),
  img: { display: 'block', borderRadius: '10px' },
  same: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '22px',
    paddingBlock: '8px',
  },
  call: {
    display: 'inline-flex',
    alignItems: 'baseline',
    maxWidth: '100%',
    paddingBlock: '8px',
    paddingInline: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule'],
      ':focus-within': sheet['--fg'],
    },
    borderRadius: '999px',
    fontFamily: fonts['--mono'],
    fontSize: '15px',
    backgroundColor: sheet['--code-bg'],
    cursor: 'text',
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  fn: { color: sheet['--code-fn'] },
  field: {
    minWidth: '1ch',
    maxWidth: '100%',
    padding: 0,
    borderWidth: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: sheet['--code-str'],
    backgroundColor: 'transparent',
    outline: 'none',
  },
  chars: (n: number) => ({ width: `${Math.max(n, 1)}ch` }),
  pair: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: { default: '28px', [SMALL]: '12px' },
  },
  run: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  hash: {
    display: 'inline-flex',
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    color: sheet['--fg'],
  },
  compare: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '14px',
  },
  cells: { display: 'flex', flexDirection: 'column', gap: '4px' },
  cell: {
    display: 'block',
    width: { default: '56px', [SMALL]: '36px' },
    height: '2px',
    borderRadius: '1px',
    backgroundColor: sheet['--rule-strong'],
  },
  cellOff: { backgroundColor: sheet['--red'] },
  verdict: {
    fontFamily: fonts['--mono'],
    fontSize: '18px',
    fontWeight: 500,
    color: sheet['--fg'],
  },
  inline: {
    display: 'flex',
    flexDirection: { default: 'row', [SMALL]: 'column' },
    alignItems: 'center',
    gap: { default: '18px', [SMALL]: '12px' },
    maxWidth: '100%',
  },
  tagLine: {
    minWidth: 0,
    padding: '10px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
    borderRadius: '10px',
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    lineHeight: 1.6,
    color: sheet['--code-prop'],
    backgroundColor: sheet['--code-bg'],
    overflowWrap: 'anywhere',
  },
  tagOpen: { maxHeight: '180px', overflowY: 'auto', scrollbarWidth: 'thin' },
  punct: { color: sheet['--code-tag'] },
  str: { color: sheet['--code-str'] },
  gap: {
    display: 'inline-flex',
    gap: '0.6ch',
    marginInline: '4px',
    paddingBlock: 0,
    paddingInline: '8px',
    borderWidth: 0,
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    whiteSpace: 'nowrap',
    color: {
      default: sheet['--quiet'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: sheet['--chip'],
    cursor: 'pointer',
  },
  arrow: {
    color: sheet['--quiet'],
    transform: { default: 'none', [SMALL]: 'rotate(90deg)' },
  },
  under: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    marginTop: '16px',
  },
  text: {
    padding: 0,
    borderWidth: 0,
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    color: sheet['--quiet'],
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  copy: { marginLeft: 'auto' },
})
