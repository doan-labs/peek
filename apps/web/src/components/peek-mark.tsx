/*
 * The mark, the way the teaser builds it. Four pieces land one by one in
 * their creature inks, laid out as the Doan mark (D O over A N). The ring
 * opens a pair of eyes, then the grid takes a quarter turn while each piece
 * turns back the other way, so nothing ends up tilted, and every ink settles
 * to bone. The result reads A D over N O: the same four shapes, one of them
 * looking back.
 *
 * Nesting is turn > counter > land > shape, so the quarter turn, the
 * counter turn and the landing each own one transform. Both turns share one
 * spring and stay in lockstep, which is what keeps the pieces upright on the
 * way round.
 *
 * Pressing the mark turns it another quarter. The eyes blink on their own
 * and follow the pointer; React hears neither.
 */
import * as stylex from '@stylexjs/stylex'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react'
import { INKS } from '@/lib/inks'
import { BEAT, CURVE, LAND, NONE, TURN } from '@/lib/motion'
import { colors } from '@/lib/tokens.stylex'

/* What a piece's paint does: arrive in its creature ink and settle to bone
 * as the turn starts, so the colour leaves with the motion, not after it. */
type Paint = (prop: 'fill' | 'stroke', ink: string) => object

type Piece = { key: string; draw: (paint: Paint) => ReactNode }

/* Geometry from the studio's brand tile, 400 units square. */
const PIECES: Piece[] = [
  {
    key: 'd',
    draw: (paint) => (
      <motion.path
        d='M120 95A50 50 0 0 1 120 195Z'
        {...paint('fill', INKS.fog)}
      />
    ),
  },
  {
    key: 'o',
    draw: (paint) => (
      <motion.circle
        cx='243'
        cy='140'
        r='36'
        fill='none'
        strokeWidth='18'
        {...paint('stroke', INKS.clay)}
      />
    ),
  },
  {
    key: 'a',
    draw: (paint) => (
      <motion.path d='M145 214L196 302L94 302Z' {...paint('fill', INKS.bone)} />
    ),
  },
  {
    key: 'n',
    draw: (paint) => (
      <motion.path
        d='M257 194L315 252L257 310L199 252ZM257 226L231 252L257 278L283 252Z'
        fillRule='evenodd'
        {...paint('fill', INKS.lav)}
      />
    ),
  },
]

/** How far a pupil travels inside its white, in mark units. */
const LOOK = 3.2

export function PeekMark({ ref }: { ref?: Ref<HTMLButtonElement> }) {
  const still = useReducedMotion() ?? false
  const [turns, setTurns] = useState(1)
  const t = (delay: number, spring: object = LAND) =>
    still ? NONE : { ...spring, delay }
  const paint: Paint = (prop, ink) => ({
    initial: { [prop]: ink },
    animate: { [prop]: INKS.bone },
    transition: still
      ? NONE
      : { duration: 0.9, delay: BEAT.turn + 0.08, ease: CURVE },
  })

  return (
    <button
      ref={ref}
      type='button'
      aria-label='Turn the mark'
      onClick={() => setTurns((n) => n + 1)}
      {...stylex.props(styles.button)}
    >
      <svg
        viewBox='74 72 260 260'
        aria-hidden='true'
        {...stylex.props(styles.svg)}
      >
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 90 * turns }}
          transition={turns === 1 ? t(BEAT.turn, TURN) : still ? NONE : TURN}
        >
          {PIECES.map((p, i) => (
            <motion.g
              key={p.key}
              initial={{ rotate: 0 }}
              animate={{ rotate: -90 * turns }}
              transition={
                turns === 1 ? t(BEAT.turn, TURN) : still ? NONE : TURN
              }
            >
              <motion.g
                initial={{ opacity: 0, scale: 0.35, y: 22 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={t(BEAT.pieces + i * 0.11)}
              >
                {p.draw(paint)}
                {p.key === 'o' && <Eyes still={still} />}
              </motion.g>
            </motion.g>
          ))}
        </motion.g>
      </svg>
    </button>
  )
}

/*
 * Two eyes in the ring. They open once, blink every few seconds (now and
 * then twice), and follow the pointer on a soft spring. The pointer is read
 * from window, so they watch it across the whole page.
 */
function Eyes({ still }: { still: boolean }) {
  const lids = useRef<SVGGElement>(null)
  const gx = useMotionValue(0)
  const gy = useMotionValue(0)
  const x = useSpring(gx, { stiffness: 160, damping: 18, mass: 0.6 })
  const y = useSpring(gy, { stiffness: 160, damping: 18, mass: 0.6 })

  useEffect(() => {
    const g = lids.current
    if (!g || still) return
    let timer = 0
    const blink = () => {
      const twice = Math.random() < 0.22
      animate(
        g,
        { scaleY: twice ? [1, 0.08, 1, 0.08, 1] : [1, 0.08, 1] },
        { duration: twice ? 0.38 : 0.17, ease: 'easeInOut' },
      )
      timer = window.setTimeout(blink, 2600 + Math.random() * 3400)
    }
    timer = window.setTimeout(blink, (BEAT.word + 1.4) * 1000)

    const look = (e: PointerEvent) => {
      const r = g.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      // near the mark the eyes turn less, so they never cross
      const k = Math.min(1, d / 220)
      gx.set((dx / d) * LOOK * k)
      gy.set((dy / d) * LOOK * k)
    }
    const away = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        gx.set(0)
        gy.set(0)
      }
    }
    window.addEventListener('pointermove', look, { passive: true })
    document.addEventListener('pointerout', away)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', look)
      document.removeEventListener('pointerout', away)
    }
  }, [still])

  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={
        still
          ? NONE
          : {
              scaleY: {
                type: 'spring',
                stiffness: 380,
                damping: 20,
                delay: BEAT.eyes,
              },
              opacity: { duration: 0.12, delay: BEAT.eyes },
            }
      }
      {...stylex.props(styles.center)}
    >
      <g ref={lids} {...stylex.props(styles.center)}>
        <ellipse cx='231' cy='140' rx='8' ry='9.6' fill={INKS.paper} />
        <ellipse cx='255' cy='140' rx='8' ry='9.6' fill={INKS.paper} />
        <motion.g style={{ x, y }}>
          <circle cx='231' cy='140' r='4.4' fill={INKS.ink} />
          <circle cx='255' cy='140' r='4.4' fill={INKS.ink} />
        </motion.g>
      </g>
    </motion.g>
  )
}

const styles = stylex.create({
  button: {
    display: 'block',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    borderRadius: '8px',
    outlineColor: {
      default: 'transparent',
      ':focus-visible': colors['--signal'],
    },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '10px',
    WebkitTapHighlightColor: 'transparent',
  },
  svg: {
    width: 'min(26svh, 40vw, 232px)',
    height: 'auto',
    overflow: 'visible',
  },
  center: {
    transformBox: 'fill-box',
    transformOrigin: 'center',
  },
})
