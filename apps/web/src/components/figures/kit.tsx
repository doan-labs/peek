/*
 * The frame every docs figure shares: a card with a stage, a control row
 * under it and a row of readouts. Figures play themselves while on screen
 * (useAutoplay) until the reader touches them, then hand over for good.
 *
 * Ported from Duo's blog figures, retuned to the sheet: thin rules, mono
 * micro labels, signal red spent on selection only.
 */
import { identify, type PeekProps } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { Peek } from '@/components/peek'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { wardrobeFor } from '@/lib/wardrobe'

/**
 * A figure plays itself while it is on screen, until the reader touches it:
 * `on` is true in view, with motion allowed, before `stop` is called. `t`
 * hands the frame callback seconds since it started playing.
 */
export function useAutoplay<T extends Element>(frame: (t: number) => void) {
  const ref = useRef<T>(null)
  const seen = useInView(ref, { amount: 0.5 })
  const still = useReducedMotion()
  const [touched, setTouched] = useState(false)
  const on = seen && !still && !touched
  const cb = useRef(frame)
  cb.current = frame
  useEffect(() => {
    if (!on) return
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      // a frame's timestamp can predate `start` by a hair
      cb.current(Math.max(0, now - start) / 1000)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [on])
  return {
    ref,
    on,
    stop: () => setTouched(true),
    play: () => setTouched(false),
  }
}

/** The value `t` seconds into a loop of `[second, value]` keys, eased between them. */
export function keyed(t: number, keys: readonly (readonly [number, number])[]) {
  const end = keys[keys.length - 1]?.[0] ?? 1
  const x = t % end
  for (let i = 1; i < keys.length; i++) {
    const [t0, v0] = keys[i - 1]!
    const [t1, v1] = keys[i]!
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0 || 1)
      return v0 + (v1 - v0) * (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2)
    }
  }
  return keys[keys.length - 1]?.[1] ?? 0
}

/**
 * A readout that rolls: each changed character slides out and its successor
 * in, up when the number grew, down when it shrank, like an odometer.
 */
export function Roll({ text }: { text: string }) {
  const still = useReducedMotion()
  const last = useRef({ text, n: 0, dir: 1 })
  const n = Number.parseFloat(text.replace(/[^\d.-]/g, ''))
  if (text !== last.current.text)
    last.current = { text, n, dir: n >= last.current.n ? 1 : -1 }
  const dir = last.current.dir
  if (still) return <>{text}</>
  const chars = [...text.replace(/ /g, ' ')]
  return (
    <span {...stylex.props(styles.rollRow)}>
      {chars.map((ch, i) => (
        // keyed from the right, so a new leading digit leaves the rest alone
        <span key={chars.length - i} {...stylex.props(styles.rollSlot)}>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.span
              key={ch}
              initial={{ y: `${dir * 100}%`, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: `${dir * -100}%`, opacity: 0 }}
              transition={LAND}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

/** The card. `caption` sits under it in the quiet tone. `bare` drops the
 * card so the figure sits in the prose. */
export function Figure({
  children,
  caption,
  bare = false,
}: {
  children: ReactNode
  caption?: ReactNode
  bare?: boolean
}) {
  return (
    <figure {...stylex.props(styles.figure)}>
      <div {...stylex.props(!bare && styles.card)}>{children}</div>
      {caption ? (
        <figcaption {...stylex.props(styles.caption)}>{caption}</figcaption>
      ) : null}
    </figure>
  )
}

/** The drawing area: centred, a dotted ground like the studio sheet. */
export function Stage({
  children,
  height = 260,
  plain = false,
}: {
  children: ReactNode
  height?: number
  plain?: boolean
}) {
  return (
    <div
      {...stylex.props(styles.stage, !plain && styles.dots, styles.h(height))}
    >
      {children}
    </div>
  )
}

/** The row under the stage. */
export function Controls({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.controls)}>{children}</div>
}

/** The play / pause pill an autoplaying figure carries. */
export function PlayButton({
  on,
  onClick,
  label = 'Play',
}: {
  on: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <motion.button
      type='button'
      tabIndex={0}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={on}
      {...stylex.props(styles.pill, styles.pillStrong)}
    >
      {on ? 'Pause' : label}
    </motion.button>
  )
}

/**
 * Pick one of a few: the selection is a sliding pill (a shared layoutId),
 * the way the docs sidebar marks the current page.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  render,
  name,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  label: string
  render?: (v: T, on: boolean) => ReactNode
  /** An accessible name per option, when `render` draws a glyph. */
  name?: (v: T) => string
}) {
  const reduce = useReducedMotion()
  const group = useId()
  return (
    <fieldset aria-label={label} {...stylex.props(styles.seg)}>
      {options.map((o) => {
        const on = o === value
        return (
          <button
            key={o}
            type='button'
            aria-pressed={on}
            aria-label={name?.(o)}
            onClick={() => onChange(o)}
            {...stylex.props(styles.segItem, on && styles.segOn)}
          >
            {on ? (
              <motion.span
                layoutId={group}
                transition={reduce ? NONE : LAND}
                {...stylex.props(styles.segPill)}
              />
            ) : null}
            <span {...stylex.props(styles.segText)}>
              {render ? render(o, on) : o}
            </span>
          </button>
        )
      })}
    </fieldset>
  )
}

/**
 * A face in a small round (or square) chip. A Peek stands on the floor of
 * its frame, so at chip size its face would sit at the bottom edge: the svg
 * is drawn ~1.9x the chip and offset so the face fills it. The crop hides
 * the silhouette, so where the face shape is the point, use a whole <Peek>.
 */
export function FaceChip({
  size = 20,
  round = true,
  full = false,
  ...peek
}: Omit<PeekProps, 'size' | 'frame'> & {
  size?: number
  round?: boolean
  full?: boolean
}) {
  // a hat on a tall face sits above the usual crop: zoom out to keep it
  const hat =
    (peek.headwear ?? wardrobeFor(peek.name).headwear) !== 'none' &&
    (peek.face ?? identify(peek.name).face) !== 'semicircle'
  const big = full ? size : Math.round(size * (hat ? 1.5 : 1.9))
  return (
    <span
      aria-hidden={peek.title === undefined || peek.title === false}
      {...stylex.props(styles.chipBox, styles.chipSize(size, round))}
    >
      <Peek
        {...peek}
        title={peek.title ?? false}
        size={big}
        frame='none'
        {...stylex.props(
          styles.chipSvg(big, size, hat ? 0.32 : 0.85),
          full && styles.fullSvg,
        )}
      />
    </span>
  )
}

/** A row of label / value readouts under a figure. */
export function Stats({ children }: { children: ReactNode }) {
  return <dl {...stylex.props(styles.stats)}>{children}</dl>
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div {...stylex.props(styles.stat)}>
      <dt {...stylex.props(styles.statLabel)}>{label}</dt>
      <dd {...stylex.props(styles.statValue)}>{value}</dd>
    </div>
  )
}

/** A mono micro label, the studio sheet's voice. */
export function Micro({ children }: { children: ReactNode }) {
  return <span {...stylex.props(styles.micro)}>{children}</span>
}

/** Fades and lifts a piece in the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(10px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, amount: 0.4 }}
      transition={reduce ? NONE : { duration: 0.6, delay, ease: CURVE }}
    >
      {children}
    </motion.div>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const LINE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

export const styles = stylex.create({
  figure: { marginTop: '28px', marginBottom: '8px', marginInline: 0 },
  card: {
    ...LINE,
    overflow: 'hidden',
    borderRadius: '16px',
    backgroundColor: sheet['--page'],
  },
  caption: {
    marginTop: '10px',
    fontSize: '14px',
    lineHeight: 1.55,
    color: sheet['--quiet'],
    textAlign: 'center',
  },
  stage: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
  },
  dots: {
    backgroundImage: `radial-gradient(${sheet['--rule-strong']} 1px, transparent 1.2px)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '8px 8px',
  },
  h: (px: number) => ({ minHeight: `${px}px` }),
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
    backgroundColor: sheet['--wash'],
  },
  pill: {
    ...LINE,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexShrink: 0,
    minWidth: '72px',
    height: '32px',
    paddingInline: '14px',
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    cursor: 'pointer',
  },
  pillStrong: {
    color: sheet['--page'],
    borderColor: sheet['--fg'],
    backgroundColor: sheet['--fg'],
    opacity: { default: 1, [HOVER]: { default: null, ':hover': 0.86 } },
    transitionProperty: 'opacity',
    transitionDuration: '0.15s',
  },
  seg: {
    ...LINE,
    margin: 0,
    minWidth: 0,
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: '2px',
    padding: '3px',
    borderRadius: '999px',
    backgroundColor: sheet['--page'],
  },
  segItem: {
    position: 'relative',
    height: '28px',
    paddingInline: '12px',
    borderWidth: 0,
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transitionProperty: 'color',
    transitionDuration: '0.15s',
  },
  segOn: { color: sheet['--fg'], fontWeight: 500 },
  segPill: {
    position: 'absolute',
    inset: 0,
    borderRadius: '999px',
    backgroundColor: sheet['--chip'],
  },
  segText: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  stats: {
    display: 'grid',
    // one equal column per stat; on a phone as many as fit
    gridAutoFlow: { default: 'column', [SMALL]: 'row' },
    gridAutoColumns: 'minmax(0, 1fr)',
    gridTemplateColumns: {
      default: null,
      [SMALL]: 'repeat(auto-fit, minmax(104px, 1fr))',
    },
    margin: 0,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
  stat: {
    minWidth: 0,
    padding: '10px 14px',
    borderRightWidth: { default: '1px', ':last-child': 0 },
    borderRightStyle: 'solid',
    borderRightColor: sheet['--rule'],
  },
  statLabel: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  statValue: {
    margin: 0,
    marginTop: '4px',
    fontFamily: fonts['--mono'],
    fontSize: '14px',
    fontWeight: 500,
    color: sheet['--fg'],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  micro: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  chipBox: {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: sheet['--chip'],
    boxShadow: `0 0 0 1px ${sheet['--rule']}`,
  },
  chipSize: (px: number, round: boolean) => ({
    width: `${px}px`,
    height: `${px}px`,
    borderRadius: round ? '50%' : `${Math.round(px * 0.28)}px`,
  }),
  chipSvg: (big: number, px: number, lift: number) => ({
    position: 'absolute',
    left: `${-(big - px) / 2}px`,
    top: `${-px * lift}px`,
    width: `${big}px`,
    height: `${big}px`,
  }),
  fullSvg: { top: 0 },
  rollRow: { display: 'inline-flex', fontVariantNumeric: 'tabular-nums' },
  rollSlot: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
})
