/*
 * The home page. The hero is the teaser's last frame made live: the mark,
 * one big line, the file stamp in the corners, and the cast peeking over the
 * bottom edge. Under the line, a name field that draws its face as you
 * type and saves it as an SVG file, the install line for each package
 * manager, and the docs under it. The rest of the page is
 * home-sections.tsx. The beats are one table, BEAT in lib/motion.ts.
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
import { Peek, toSvg } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Chrome } from '@/components/chrome'
import { Creatures, cheer } from '@/components/creatures'
import {
  DocsButton,
  HomeSections,
  InstallPill,
} from '@/components/home-sections'
import { PeekMark } from '@/components/peek-mark'
import { BEAT, CURVE, NONE } from '@/lib/motion'
import { playSound } from '@/lib/sound'
import { colors, fonts } from '@/lib/tokens.stylex'

const LINE = 'A name in, a face out'
const NAME = 'Thanh'

/** A name as a file name: lowercase letters and digits, dashes between. */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'peek'

export function HomePage() {
  const still = useReducedMotion() ?? false
  const mark = useRef<HTMLButtonElement>(null)
  const line = useRef<HTMLHeadingElement>(null)
  const [typed, setTyped] = useState('')
  const [saved, setSaved] = useState(false)
  const name = typed.trim() || NAME
  // a click for every action that has no cue of its own
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const action = event.target.closest('button, a[href], [role="button"]')
      if (!action || action.hasAttribute('data-sound-cue')) return
      if (action instanceof HTMLButtonElement && action.disabled) return
      playSound('click')
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [])
  // the face as a file: what toSvg gives for the name, the size of a
  // profile picture
  const save = () => {
    const url = URL.createObjectURL(
      new Blob([toSvg(name, { size: 512 })], { type: 'image/svg+xml' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(name)}.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    cheer()
    playSound('success')
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <main id='main' {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
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
                <span key={w} aria-hidden='true'>
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
                        animate={{
                          opacity: 1,
                          y: '0em',
                          filter: 'blur(0px)',
                        }}
                        transition={
                          still
                            ? NONE
                            : {
                                duration: 1.1,
                                delay: BEAT.word + (before + i + w * 2) * 0.03,
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              still ? NONE : { duration: 0.9, delay: BEAT.notify, ease: CURVE }
            }
            {...stylex.props(styles.try)}
          >
            <div {...stylex.props(styles.field)}>
              <label {...stylex.props(styles.label)}>
                <span {...stylex.props(styles.face)}>
                  <Peek
                    name={name}
                    size={44}
                    frame='none'
                    title={false}
                    expression={saved ? 'excited' : typed ? 'happy' : 'curious'}
                    gaze='pointer'
                    animate
                  />
                </span>
                <span {...stylex.props(styles.srOnly)}>Type a name</span>
                <input
                  type='text'
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder='Type a name'
                  maxLength={40}
                  spellCheck={false}
                  autoComplete='off'
                  {...stylex.props(styles.input)}
                />
              </label>
              <motion.button
                type='button'
                whileTap={{ scale: 0.94 }}
                onClick={save}
                aria-label={`Download ${name}'s face as SVG`}
                {...stylex.props(styles.save)}
              >
                <svg
                  viewBox='0 0 16 16'
                  aria-hidden='true'
                  {...stylex.props(styles.saveIcon)}
                >
                  <path d='M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10' />
                </svg>
                {saved ? 'Saved' : 'SVG'}
              </motion.button>
            </div>
            <div {...stylex.props(styles.actions)}>
              <InstallPill />
              <DocsButton />
            </div>
          </motion.div>
        </div>
        <Creatures mark={mark} line={line} />
      </section>
      <HomeSections />
      <div aria-hidden='true' {...stylex.props(styles.grain)} />
    </main>
  )
}

/* One static plate of noise over everything, standing in for the teaser's
 * riso print. Static, so it costs one paint. */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const GAP = 'clamp(24px, 5svh, 52px)'
const SIZE = 'clamp(38px, min(8svh, 7.6vw), 92px)'
const FOOT = 'min(36svh, 26vw)'
/* How far the mark drops to sit at the centre of the screen: half of what
 * the stack holds under it, the line and the foot. */
const DROP = `calc((${GAP} + ${SIZE} * 1.08 + ${FOOT}) / 2)`
/** How much bigger the mark is while it builds. */
const BIG = 0.9

const styles = stylex.create({
  main: {
    position: 'relative',
    color: colors['--bone'],
    fontFamily: fonts['--sans'],
    backgroundColor: colors['--ground'],
    overflowX: 'clip',
  },
  hero: {
    position: 'relative',
    minHeight: '100svh',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    // the teaser's vignette: a lamp over the middle, the corners in shadow,
    // and the floor fading into the ground so the sections meet it clean
    backgroundImage: `linear-gradient(transparent 70%, ${colors['--ground']}), radial-gradient(120% 90% at 50% 42%, rgb(30 28 26) 0%, rgb(18 17 16) 55%, rgb(10 9 9) 100%)`,
  },
  // over the cast, which is fixed to the window's floor
  stack: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingInline: '16px',
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
  // out of flow, under the line, so DROP still centres the mark
  try: {
    position: 'absolute',
    top: `calc(100% - ${FOOT})`,
    // centred without a transform: motion owns this one's transform
    left: 0,
    right: 0,
    marginInline: 'auto',
    width: 'min(560px, calc(100vw - 32px))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    paddingTop: 'clamp(18px, 3.4svh, 32px)',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: 'min(360px, 100%)',
    padding: '4px',
    paddingRight: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: colors['--faint'],
      ':focus-within': colors['--muted'],
    },
    borderRadius: '999px',
  },
  label: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'text',
  },
  face: { flexShrink: 0 },
  // the Copy chip's twin on the install line
  save: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    minWidth: '72px',
    justifyContent: 'center',
    paddingBlock: '7px',
    paddingInline: '10px',
    borderWidth: 0,
    borderRadius: '999px',
    backgroundColor: colors['--bone'],
    color: colors['--ground'],
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    outlineColor: {
      default: 'transparent',
      ':focus-visible': colors['--signal'],
    },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '3px',
  },
  saveIcon: {
    width: '12px',
    height: '12px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingBlock: '10px',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors['--bone'],
    fontFamily: fonts['--sans'],
    fontSize: '16px',
    outlineStyle: 'none',
    '::placeholder': { color: colors['--muted'] },
  },
  // the install line, and the docs under it
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  word: { display: 'inline-block', whiteSpace: 'nowrap' },
  letter: {
    display: 'inline-block',
    willChange: 'transform, filter, opacity',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
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
