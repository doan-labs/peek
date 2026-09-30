/*
 * The coming soon page, which is the teaser's last frame made live: the mark,
 * one big line, the file stamp in the corners, and the cast peeking over the
 * bottom edge. The beats are one table, BEAT in lib/motion.ts.
 *
 * The mark builds big in the middle of the screen, then shrinks and rises
 * to its place above the line. One progress value, --p, drives both: 1 is
 * big and centred, 0 is at rest. Its pose is plain CSS, so the server
 * renders the same first frame the client hydrates.
 *
 * The line rises a letter at a time out of a blur, the way the teaser's
 * title settles. Letters sit inside a span per word, so a phone breaks the
 * line between words and never inside one.
 */
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { Chrome } from '@/components/chrome'
import { Creatures } from '@/components/creatures'
import { PeekMark } from '@/components/peek-mark'
import { BEAT, CURVE, NONE } from '@/lib/motion'
import { colors, fonts } from '@/lib/tokens.stylex'

const LINE = 'Coming soon'

export function HomePage() {
  const still = useReducedMotion() ?? false
  const mark = useRef<HTMLButtonElement>(null)
  const line = useRef<HTMLHeadingElement>(null)

  return (
    <main id='main' {...stylex.props(styles.main)}>
      <Chrome />
      <div {...stylex.props(styles.stack)}>
        <motion.div
          initial={{ '--p': 1 }}
          animate={{ '--p': 0 }}
          transition={
            still ? NONE : { duration: 1.1, delay: BEAT.rise, ease: CURVE }
          }
          {...stylex.props(styles.mark)}
        >
          <PeekMark ref={mark} />
        </motion.div>
        <h1 ref={line} aria-label={LINE} {...stylex.props(styles.line)}>
          {LINE.split(' ').map((word, w, words) => {
            const before = words.slice(0, w).join('').length
            return (
              <span key={word} aria-hidden='true'>
                {w > 0 && ' '}
                <span {...stylex.props(styles.word)}>
                  {[...word].map((ch, i) => (
                    <motion.span
                      key={`${ch}-${i}`}
                      initial={{
                        opacity: 0,
                        y: '0.42em',
                        filter: 'blur(12px)',
                      }}
                      animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
                      transition={
                        still
                          ? NONE
                          : {
                              duration: 1.1,
                              delay: BEAT.word + (before + i + w * 2) * 0.045,
                              ease: CURVE,
                            }
                      }
                      {...stylex.props(styles.letter)}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
              </span>
            )
          })}
        </h1>
      </div>
      <Creatures mark={mark} line={line} />
      <div aria-hidden='true' {...stylex.props(styles.grain)} />
    </main>
  )
}

/* One static plate of noise over everything, standing in for the teaser's
 * riso print. Static, so it costs one paint. */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const GAP = 'clamp(28px, 6svh, 60px)'
const SIZE = 'clamp(44px, min(10svh, 11.5vw), 104px)'
const FOOT = 'min(20svh, 16vw)'
/* How far the mark drops to sit at the centre of the screen: half of what
 * the stack holds under it, the line and the foot. */
const DROP = `calc((${GAP} + ${SIZE} * 1.08 + ${FOOT}) / 2)`
/** How much bigger the mark is while it builds. */
const BIG = 0.9

const styles = stylex.create({
  main: {
    position: 'relative',
    minHeight: '100svh',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    color: colors['--bone'],
    fontFamily: fonts['--sans'],
    // the teaser's vignette: a lamp over the middle, the corners in shadow
    backgroundColor: colors['--ground'],
    backgroundImage:
      'radial-gradient(120% 90% at 50% 42%, rgb(30 28 26) 0%, rgb(18 17 16) 55%, rgb(10 9 9) 100%)',
  },
  stack: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // sits above centre, clear of the cast along the bottom
    paddingBottom: FOOT,
  },
  mark: {
    transform: `translateY(calc(${DROP} * var(--p))) scale(calc(1 + ${BIG} * var(--p)))`,
  },
  line: {
    marginTop: GAP,
    fontSize: SIZE,
    fontWeight: 600,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    textAlign: 'center',
    // room for the blur to spill without clipping
    paddingBottom: '0.08em',
  },
  word: { display: 'inline-block', whiteSpace: 'nowrap' },
  letter: {
    display: 'inline-block',
    willChange: 'transform, filter, opacity',
  },
  grain: {
    position: 'fixed',
    inset: 0,
    zIndex: 3,
    pointerEvents: 'none',
    backgroundImage: NOISE,
    opacity: 0.07,
    mixBlendMode: 'overlay',
  },
})
