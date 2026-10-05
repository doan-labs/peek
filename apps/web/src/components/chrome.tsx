/*
 * Two corner labels from the teaser, the page's file stamp. The clock fades
 * in first; the maker's lockup waits for the line. Then both stay quiet:
 * the clock counts, nothing else moves. The top left one is the maker's
 * lockup and a link; the clock is decoration.
 *
 * The clock writes its own text node every frame; React renders it once.
 */
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { DoanMark } from '@/components/doan-mark'
import { BEAT, CURVE, NONE } from '@/lib/motion'
import { colors, fonts } from '@/lib/tokens.stylex'

export function Chrome() {
  const still = useReducedMotion() ?? false
  const clock = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = clock.current
    if (!el) return
    const t0 = performance.now()
    let raf = 0
    let shown = ''
    const tick = (now: number) => {
      const s = ((now - t0) / 1000).toFixed(1).padStart(4, '0')
      if (s !== shown) {
        shown = s
        el.textContent = `T ${s} S`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rise = (i: number, at: number) => ({
    initial: { opacity: 0, y: i === 0 ? -6 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: still ? NONE : { duration: 0.9, delay: at, ease: CURVE },
  })
  const corner = (i: number, place: stylex.StyleXStyles, body: ReactNode) => (
    <motion.span
      aria-hidden='true'
      {...rise(i, BEAT.chrome)}
      {...stylex.props(styles.corner, place)}
    >
      {body}
    </motion.span>
  )

  return (
    <>
      <motion.a
        href='https://doan-labs.com'
        target='_blank'
        rel='noopener'
        {...rise(0, BEAT.maker)}
        {...stylex.props(styles.corner, styles.tl, styles.maker)}
      >
        A product by
        <span {...stylex.props(styles.doan)}>
          <DoanMark size={14} />
          Doan Labs
        </span>
      </motion.a>
      {corner(1, styles.br, <span ref={clock}>T 00.0 S</span>)}
    </>
  )
}

const INSET = 'clamp(16px, 3.3vw, 40px)'

const styles = stylex.create({
  // pinned to the hero, so they scroll away with it
  corner: {
    position: 'absolute',
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    lineHeight: 1,
    color: colors['--muted'],
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  tl: { top: INSET, left: INSET },
  maker: {
    gap: '10px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    userSelect: null,
    borderRadius: '4px',
    outlineColor: {
      default: 'transparent',
      ':focus-visible': colors['--signal'],
    },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '6px',
  },
  // DOAN LABS is the name that shows; the mark sits on it, in bone
  doan: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    color: colors['--bone'],
  },
  // on a phone the cast runs the full width, so the clock steps aside
  br: {
    bottom: INSET,
    right: INSET,
    display: { default: null, '@media (max-width: 640px)': 'none' },
  },
})
