/*
 * The hash machine: a name goes in, gets tidied, and every axis hashes its
 * own seed and picks from its list. The arithmetic is the library's own,
 * redone here in the open so each step can be shown: fnv1a and the seed
 * string are copied from packages/peek/src/identity.ts (not exported), and
 * every pick matches identify(). Tapping an option pins that axis, the way
 * a prop overrides it, and the count under the face is the product of the
 * list lengths.
 */
import {
  AXES,
  type Axes,
  type Axis,
  COLORS,
  LATEST,
  LISTS,
  Peek,
  tidy,
  VERSIONS,
} from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Figure, styles as kit, Micro, useAutoplay } from './kit'

/** FNV-1a over the UTF-8 bytes, as in identity.ts. */
export function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** The seed string identity.ts hashes for one axis. */
export const seedText = (key: string, axis: string, version = LATEST) =>
  `peek@${version}:${axis}:${key}`

export const hex = (h: number) =>
  `0x${h.toString(16).toUpperCase().padStart(8, '0')}`

/** One axis, worked: seed, hash, modulus and the pick. */
export function work(key: string, axis: Axis, version = LATEST) {
  const n = VERSIONS[version]![axis]
  const s = seedText(key, axis, version)
  const h = fnv1a(s)
  const i = h % n
  return { s, h, n, i, pick: (LISTS[axis] as readonly string[])[i]! }
}

/* ---------- tidy, character by character ---------- */

type Glyph = { from: string; to: string }
const SPACE = /\s/

/**
 * What tidy() does to each character: trimmed and collapsed spaces go
 * (`to` is empty), capitals drop. Falls back to the tidied string whole if
 * a character lowercases differently in context (a final sigma).
 */
function glyphs(raw: string): Glyph[] {
  const chars = [...raw.normalize('NFC')]
  const first = chars.findIndex((c) => !SPACE.test(c))
  let last = chars.length - 1
  while (last >= 0 && SPACE.test(chars[last]!)) last--
  const out = chars.map((c, i): Glyph => {
    if (first < 0 || i < first || i > last) return { from: c, to: '' }
    if (SPACE.test(c))
      return { from: c, to: SPACE.test(chars[i - 1]!) ? '' : ' ' }
    return { from: c, to: c.toLowerCase() }
  })
  if (out.map((g) => g.to).join('') === tidy(raw)) return out
  return [...tidy(raw)].map((c) => ({ from: c, to: c }))
}

function TidyStrip({ raw, done }: { raw: string; done: boolean }) {
  const reduce = useReducedMotion()
  const gs = glyphs(raw)
  const t = reduce ? NONE : LAND
  if (!gs.length)
    return <span {...stylex.props(styles.placeholder)}>type a name</span>
  return (
    <span {...stylex.props(styles.strip)}>
      {gs.map((g, i) => {
        const gone = done && !g.to
        const shown = done ? g.to || g.from : g.from
        const space = SPACE.test(shown)
        return (
          <motion.span
            key={i}
            initial={false}
            animate={{
              width: gone ? 0 : 'auto',
              opacity: gone ? 0 : 1,
            }}
            transition={done ? { ...t, delay: reduce ? 0 : i * 0.012 } : NONE}
            {...stylex.props(styles.glyphBox)}
          >
            <motion.span
              key={shown}
              initial={
                done && g.from !== g.to ? { y: '-70%', opacity: 0 } : false
              }
              animate={{ y: 0, opacity: 1 }}
              transition={t}
              {...stylex.props(
                styles.glyph,
                space && styles.space,
                !done && g.from !== g.to && styles.changing,
              )}
            >
              {space ? '·' : shown}
            </motion.span>
          </motion.span>
        )
      })}
    </span>
  )
}

/* ---------- one axis row ---------- */

const optionsOf = (a: Axis) =>
  (LISTS[a] as readonly string[]).slice(0, VERSIONS[LATEST]![a])

/** Every option of an axis, as buttons: the one in use wears the marker,
 * the hashed one keeps a dot while another is pinned. */
function Options({
  axis,
  at,
  hashed,
  name,
  onPick,
}: {
  axis: Axis
  at: number
  hashed: number
  name: string
  onPick: (o: string) => void
}) {
  const reduce = useReducedMotion()
  const group = useId()
  const icon = axis === 'color' || axis === 'face'
  return (
    <span {...stylex.props(styles.options)}>
      {optionsOf(axis).map((o, i) => {
        const on = i === at
        return (
          <motion.button
            key={o}
            type='button'
            title={o}
            aria-label={`${axis} ${o}`}
            aria-pressed={on}
            onClick={() => onPick(o)}
            whileTap={{ scale: reduce ? 1 : 0.9 }}
            {...stylex.props(
              styles.option,
              icon ? styles.optionIcon : styles.optionText,
              on && styles.optionOn,
            )}
          >
            {on ? (
              <motion.span
                layoutId={group}
                transition={reduce ? NONE : LAND}
                {...stylex.props(styles.marker, icon && styles.markerRing)}
              />
            ) : null}
            {i === hashed && !on ? (
              <span aria-hidden='true' {...stylex.props(styles.hashDot)} />
            ) : null}
            {axis === 'color' ? (
              <span
                aria-hidden='true'
                {...stylex.props(
                  styles.swatch,
                  styles.fill(COLORS[o as keyof typeof COLORS].body),
                )}
              />
            ) : axis === 'face' ? (
              <span aria-hidden='true' {...stylex.props(styles.mini)}>
                {/* the option is the silhouette, so the whole face, uncropped */}
                <Peek
                  name={name}
                  face={o as never}
                  size={20}
                  frame='none'
                  title={false}
                />
              </span>
            ) : (
              <span {...stylex.props(styles.optionLabel)}>{o}</span>
            )}
          </motion.button>
        )
      })}
    </span>
  )
}

/**
 * The hash, rolled as one piece when the name changed after a pause, swapped
 * in place while it is being typed, so a fast typist sees no churn.
 */
function Hex({ text, calm }: { text: string; calm: boolean }) {
  const reduce = useReducedMotion()
  const roll = calm && !reduce
  return (
    <span {...stylex.props(styles.hexBox)}>
      <AnimatePresence initial={false} mode='popLayout' custom={roll}>
        <motion.span
          key={text}
          custom={roll}
          variants={SLIDE}
          initial='enter'
          animate='show'
          exit='leave'
          transition={LAND}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
const SLIDE = {
  enter: (roll: boolean) =>
    roll ? { y: '100%', opacity: 0 } : { y: 0, opacity: 1 },
  show: { y: 0, opacity: 1 },
  leave: (roll: boolean) =>
    roll ? { y: '-100%', opacity: 0 } : { opacity: 0, transition: NONE },
}

function Row({
  axis,
  keyText,
  calm,
  pin,
  onPick,
}: {
  axis: Axis
  keyText: string
  calm: boolean
  pin?: string
  onPick: (o: string) => void
}) {
  const reduce = useReducedMotion()
  const w = work(keyText, axis)
  const pinned = pin !== undefined
  const at = pinned ? optionsOf(axis).indexOf(pin) : w.i
  return (
    <div {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.seed, pinned && styles.off)} title={w.s}>
        <span {...stylex.props(styles.quiet)}>peek@{LATEST}:</span>
        <span {...stylex.props(styles.axis)}>{axis}</span>
        <span {...stylex.props(styles.quiet)}>:</span>
        {keyText}
      </span>
      <span {...stylex.props(styles.hash, pinned && styles.off)}>
        <Hex text={hex(w.h)} calm={calm} />
      </span>
      <span {...stylex.props(styles.mod)}>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.span
            key={String(pinned)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={reduce ? NONE : LAND}
            {...stylex.props(pinned ? styles.badge : styles.modText)}
          >
            {pinned ? (
              'pinned'
            ) : (
              <>
                <span {...stylex.props(styles.quiet)}>%{w.n}=</span>
                {w.i}
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      <span {...stylex.props(styles.listCell)}>
        <Options
          axis={axis}
          at={at}
          hashed={w.i}
          name={keyText}
          onPick={onPick}
        />
      </span>
    </div>
  )
}

/* ---------- the machine ---------- */

const NAMES = ['Linh', '  THANH  ', 'alan  Turing ', 'Hedy Lamarr']
const TYPE = 0.08
const HOLD = 3.4
const SPANS = NAMES.map((n) => n.length * TYPE + HOLD)
const LOOP = SPANS.reduce((a, b) => a + b, 0)

/** The typed text `t` seconds into the autoplay loop. */
function typedAt(t: number) {
  let x = Math.max(0, t) % LOOP
  for (const [i, n] of NAMES.entries()) {
    const span = SPANS[i]!
    if (x < span) return n.slice(0, Math.floor(x / TYPE) + 1)
    x -= span
  }
  return NAMES[0]!
}

/** How many looks a version holds: the axes are independent, so the list
 * lengths multiply. */
const FACTORS = AXES.map((a) => optionsOf(a).length)
const TOTAL = FACTORS.reduce((a, b) => a * b, 1)

type Pins = Partial<Record<Axis, string>>

export function HashMachine() {
  const [name, setName] = useState(NAMES[0]!)
  const [pins, setPins] = useState<Pins>({})
  const [done, setDone] = useState(true)
  const reduce = useReducedMotion()
  const auto = useAutoplay<HTMLDivElement>((t) => setName(typedAt(t)))
  const prev = useRef(name)
  // a change that follows a pause rolls; one mid-typing just swaps
  const typed = useRef({ name, at: 0, calm: true })
  if (typed.current.name !== name) {
    const at = performance.now()
    typed.current = { name, at, calm: at - typed.current.at > 150 }
  }
  const calm = typed.current.calm

  // the tidy plays once the typing pauses
  useEffect(() => {
    if (prev.current === name) return
    prev.current = name
    setDone(false)
    const id = setTimeout(() => setDone(true), 650)
    return () => clearTimeout(id)
  }, [name])

  const key = tidy(name)
  /** Pin an axis; the option already in use, or the hashed one, lets go. */
  const pick = (a: Axis, o: string) => {
    auto.stop()
    setPins((cur) => {
      const out = { ...cur }
      if (cur[a] === o || (!cur[a] && work(key, a).pick === o)) delete out[a]
      else out[a] = o
      return out
    })
  }
  const props = pins as Partial<Axes>
  const attrs = AXES.filter((a) => pins[a])
    .map((a) => ` ${a}="${pins[a]}"`)
    .join('')
  const pinned = attrs !== ''

  return (
    <Figure>
      <div ref={auto.ref} {...stylex.props(styles.stage)}>
        <label {...stylex.props(styles.inputRow)}>
          <Micro>Name</Micro>
          <input
            value={name}
            spellCheck={false}
            autoComplete='off'
            aria-label='Name'
            onChange={(e) => {
              auto.stop()
              setName(e.target.value)
            }}
            onFocus={auto.stop}
            {...stylex.props(styles.input)}
          />
        </label>
        <div {...stylex.props(styles.tidyRow)}>
          <Micro>Tidy</Micro>
          <span {...stylex.props(styles.tidyBox)}>
            <TidyStrip raw={name} done={done} />
          </span>
          <span {...stylex.props(styles.tidyNote)}>
            NFC · trim · collapse · lowercase
          </span>
        </div>
        <div {...stylex.props(styles.table)}>
          <div {...stylex.props(styles.row, styles.headRow)}>
            <Micro>Seed</Micro>
            <Micro>fnv1a</Micro>
            <Micro>Index</Micro>
            <span {...stylex.props(styles.headList)}>
              <Micro>Pick · tap to pin</Micro>
            </span>
          </div>
          {AXES.map((a) => (
            <Row
              key={a}
              axis={a}
              keyText={key}
              calm={calm}
              pin={pins[a]}
              onPick={(o) => pick(a, o)}
            />
          ))}
        </div>
        <div {...stylex.props(styles.result)}>
          <motion.div
            key={key + attrs}
            initial={{ scale: 0.92, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? NONE : LAND}
            {...stylex.props(styles.big)}
          >
            <Peek name={key} {...props} size={112} frame='none' animate />
          </motion.div>
          <div {...stylex.props(styles.count)}>
            <span {...stylex.props(styles.factors)}>{FACTORS.join(' × ')}</span>
            <span {...stylex.props(styles.total)}>
              = {TOTAL.toLocaleString('en-US')}
            </span>
            <Micro>looks at peek@{LATEST}</Micro>
          </div>
        </div>
        <CodeBlock
          code={`<Peek name=${JSON.stringify(name)}${attrs} />`}
          live
          action={
            <button
              type='button'
              disabled={!pinned}
              onClick={() => setPins({})}
              {...stylex.props(kit.pill, styles.reset)}
            >
              Reset
            </button>
          }
        />
      </div>
    </Figure>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const MONO = { fontFamily: fonts['--mono'], fontSize: '12px' } as const

const styles = stylex.create({
  stage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: { default: '18px 18px 20px', [SMALL]: '14px 12px 16px' },
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '44px minmax(0, 1fr)',
    alignItems: 'center',
    gap: '10px',
  },
  input: {
    ...MONO,
    fontSize: '15px',
    height: '40px',
    paddingInline: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule-strong'],
      ':focus-visible': sheet['--fg'],
    },
    borderRadius: '10px',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    outline: 'none',
    whiteSpace: 'pre',
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  tidyRow: {
    display: 'grid',
    gridTemplateColumns: {
      default: '44px minmax(0, 1fr) auto',
      [SMALL]: '44px minmax(0, 1fr)',
    },
    alignItems: 'center',
    gap: '10px',
  },
  tidyBox: {
    minWidth: 0,
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    paddingInline: '12px',
    borderRadius: '10px',
    backgroundColor: sheet['--chip'],
    overflow: 'hidden',
  },
  tidyNote: {
    ...MONO,
    fontSize: '11px',
    color: sheet['--quiet'],
    display: { default: 'block', [SMALL]: 'none' },
  },
  strip: {
    ...MONO,
    fontSize: '15px',
    display: 'inline-flex',
    whiteSpace: 'pre',
    color: sheet['--fg'],
  },
  placeholder: { ...MONO, color: sheet['--quiet'] },
  glyphBox: { display: 'inline-flex', overflow: 'hidden' },
  glyph: { display: 'inline-block' },
  space: { color: sheet['--quiet'] },
  changing: { color: sheet['--code-key'] },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
  row: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) 92px 48px 236px',
      [SMALL]: 'minmax(0, 1fr) auto auto',
    },
    alignItems: 'center',
    columnGap: '12px',
    rowGap: '6px',
    paddingBlock: '7px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  headRow: { paddingBlock: '6px' },
  headList: { display: { default: 'block', [SMALL]: 'none' } },
  seed: {
    ...MONO,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre',
    color: sheet['--soft'],
  },
  quiet: { color: sheet['--quiet'] },
  axis: { color: sheet['--fg'], fontWeight: 600 },
  hexBox: { position: 'relative', display: 'inline-flex', overflow: 'hidden' },
  hash: { ...MONO, color: sheet['--code-fn'], whiteSpace: 'nowrap' },
  mod: { ...MONO, color: sheet['--fg'], whiteSpace: 'nowrap' },
  modText: { display: 'inline-block' },
  off: { opacity: 0.35, textDecorationLine: 'line-through' },
  badge: {
    display: 'inline-block',
    fontSize: '9.5px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--red'],
  },
  listCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    gridColumn: { default: 'auto', [SMALL]: '1 / -1' },
  },
  options: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
  option: {
    position: 'relative',
    padding: 0,
    borderWidth: 0,
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    cursor: 'pointer',
    outlineOffset: '1px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '26px',
    borderRadius: '999px',
    color: sheet['--quiet'],
  },
  optionText: { paddingInline: '7px' },
  optionIcon: { width: '26px' },
  optionOn: { color: sheet['--fg'] },
  hashDot: {
    position: 'absolute',
    bottom: '-2px',
    left: '50%',
    width: '4px',
    height: '4px',
    marginLeft: '-2px',
    borderRadius: '50%',
    backgroundColor: sheet['--quiet'],
  },
  optionLabel: { ...MONO, fontSize: '11.5px', position: 'relative', zIndex: 1 },
  marker: {
    zIndex: 0,
    position: 'absolute',
    inset: 0,
    borderRadius: '999px',
    backgroundColor: sheet['--chip'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule-strong'],
  },
  markerRing: {
    backgroundColor: 'transparent',
    borderWidth: '1.5px',
    borderColor: sheet['--fg'],
  },
  swatch: {
    position: 'relative',
    zIndex: 1,
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
  fill: (c: string) => ({ backgroundColor: c }),
  mini: { position: 'relative', zIndex: 1, display: 'inline-flex' },
  result: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    paddingTop: '4px',
  },
  big: {
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    width: '128px',
    height: '128px',
    borderRadius: '20px',
    backgroundImage: `radial-gradient(${sheet['--rule-strong']} 1px, transparent 1.2px)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '8px 8px',
  },
  count: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  factors: { ...MONO, fontSize: '13px', color: sheet['--soft'] },
  total: {
    ...MONO,
    fontSize: '22px',
    fontWeight: 600,
    color: sheet['--fg'],
  },
  reset: {
    height: '24px',
    paddingInline: '10px',
    fontSize: '12px',
    color: sheet['--soft'],
    opacity: { default: 1, ':disabled': 0.4 },
    cursor: { default: 'pointer', ':disabled': 'default' },
  },
})
