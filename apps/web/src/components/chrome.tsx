/*
 * The four corner labels from the teaser, the page's file stamp. They fade in
 * first, top before bottom, and stay quiet after: the record dot breathes
 * and the clock counts, nothing else moves.
 *
 * The clock writes its own text node every frame; React renders it once.
 */
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useRef } from 'react'
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

  const corner = (i: number, place: stylex.StyleXStyles, body: ReactNode) => (
    <motion.span
      initial={{ opacity: 0, y: i < 2 ? -6 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        still
          ? NONE
          : { duration: 0.9, delay: BEAT.chrome + i * 0.07, ease: CURVE }
      }
      {...stylex.props(styles.corner, place)}
    >
      {body}
    </motion.span>
  )

  return (
    <div aria-hidden='true'>
      {corner(0, styles.tl, 'DOAN LABS')}
      {corner(
        1,
        styles.tr,
        <>
          <i {...stylex.props(styles.rec)} />
          FILE 07 / UNRELEASED
        </>,
      )}
      {corner(2, styles.bl, 'SYS/AVATAR')}
      {corner(3, styles.br, <span ref={clock}>T 00.0 S</span>)}
    </div>
  )
}

const breathe = stylex.keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.25 },
})

const INSET = 'clamp(16px, 3.3vw, 40px)'

const styles = stylex.create({
  corner: {
    position: 'fixed',
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
  tr: { top: INSET, right: INSET },
  // on a phone the cast runs the full width, so the bottom pair steps aside
  bl: {
    bottom: INSET,
    left: INSET,
    display: { default: null, '@media (max-width: 640px)': 'none' },
  },
  br: {
    bottom: INSET,
    right: INSET,
    display: { default: null, '@media (max-width: 640px)': 'none' },
  },
  rec: {
    display: 'block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: colors['--signal'],
    animationName: {
      default: null,
      '@media (prefers-reduced-motion: no-preference)': breathe,
    },
    animationDuration: '1.9s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
})
