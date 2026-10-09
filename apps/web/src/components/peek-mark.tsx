/*
 * The mark, the way the teaser builds it. Four pieces land one by one in
 * their creature inks, scattered O N over D A. The ring opens a pair of
 * eyes, then the grid takes a quarter turn while each piece turns back the
 * other way, so nothing ends up tilted, and every ink settles to bone. The
 * result reads D O over A N: the Doan Labs mark at rest, one shape looking back.
 *
 * Then it lives. Each piece breathes on its own clock and leans a little
 * towards the pointer. The other three keep their eyes shut, so at rest it
 * is still the mark with one shape looking back, but every few seconds one
 * or two open theirs for a look and shut them again. Point at the mark and
 * all four wake; press it and it turns another quarter while each piece
 * hops.
 *
 * Nesting is turn > counter > land > lean > hop > breath > shape, so each
 * motion owns one transform. Both turns share one spring and stay in
 * lockstep, which is what keeps the pieces upright on the way round.
 *
 * Eyes blink on their own and follow the pointer; React hears neither.
 */
import * as stylex from '@stylexjs/stylex'
import {
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react'
import { INKS } from '@/lib/inks'
import { BEAT, CURVE, HOP, LAND, NONE, TURN } from '@/lib/motion'
import { playSound } from '@/lib/sound'
import { colors } from '@/lib/tokens.stylex'

/* What a piece's paint does: arrive in its creature ink and settle to bone
 * as the turn starts, so the colour leaves with the motion, not after it. */
type Paint = (prop: 'fill' | 'stroke', ink: string) => object

/* A pair of eyes, in mark units: centred on x, y, each gap off the middle.
 * With a pupil they are whites in a hole; without, ink drawn on the piece. */
type Look = {
  x: number
  y: number
  gap: number
  rx: number
  ry: number
  pupil: number
}

type Piece = { key: string; eyes: Look; draw: (paint: Paint) => ReactNode }

/* Geometry from the studio's brand tile, 400 units square. */
const PIECES: Piece[] = [
  {
    key: 'd',
    eyes: { x: 147, y: 258, gap: 10, rx: 5, ry: 6.2, pupil: 0 },
    draw: (paint) => (
      <motion.path
        d='M123 218A50 50 0 0 1 123 318Z'
        {...paint('fill', INKS.fog)}
      />
    ),
  },
  {
    key: 'o',
    eyes: { x: 148, y: 156, gap: 12, rx: 8, ry: 9.6, pupil: 4.4 },
    draw: (paint) => (
      <motion.circle
        cx='148'
        cy='156'
        r='36'
        fill='none'
        strokeWidth='18'
        {...paint('stroke', INKS.clay)}
      />
    ),
  },
  {
    key: 'a',
    eyes: { x: 260, y: 288, gap: 10, rx: 5, ry: 6.2, pupil: 0 },
    draw: (paint) => (
      <motion.path
        d='M260 224L311 312L209 312Z'
        {...paint('fill', INKS.bone)}
      />
    ),
  },
  {
    key: 'n',
    eyes: { x: 260, y: 156, gap: 10, rx: 6.2, ry: 7.4, pupil: 3.4 },
    draw: (paint) => (
      <motion.path
        d='M260 98L318 156L260 214L202 156ZM260 130L234 156L260 182L286 156Z'
        fillRule='evenodd'
        {...paint('fill', INKS.lav)}
      />
    ),
  },
]

/** The pieces that sleep at rest. */
const SLEEPERS = ['d', 'a', 'n']
/** How far a pupil travels inside a white the ring's size, in mark units. */
const LOOK = 3.2
/** How far ink eyes travel over their piece. */
const SLIDE = 2.2
/** How far a piece leans towards the pointer. */
const LEAN = 2.6
const GAZE = { stiffness: 160, damping: 18, mass: 0.6 }

export function PeekMark({
  ref,
  compact = false,
}: {
  ref?: Ref<HTMLButtonElement>
  compact?: boolean
}) {
  const still = useReducedMotion() ?? false
  const [turns, setTurns] = useState(1)
  // the sleepers open their eyes for the pointer, a press, or a look of
  // their own
  const [near, setNear] = useState(false)
  const [jolt, setJolt] = useState(0)
  const [peeks, setPeeks] = useState<string[]>([])
  const t = (delay: number, spring: object = LAND) =>
    still ? NONE : { ...spring, delay }
  const paint: Paint = (prop, ink) => ({
    initial: { [prop]: ink },
    animate: { [prop]: INKS.bone },
    transition: still
      ? NONE
      : { duration: 0.9, delay: BEAT.turn + 0.08, ease: CURVE },
  })

  useEffect(() => {
    if (still) return
    let timer = 0
    const look = () => {
      const who = SLEEPERS.filter(() => Math.random() < 0.4)
      setPeeks(
        who.length
          ? who
          : [SLEEPERS[Math.floor(Math.random() * SLEEPERS.length)]!],
      )
      timer = window.setTimeout(
        () => {
          setPeeks([])
          timer = window.setTimeout(look, 2800 + Math.random() * 4200)
        },
        1200 + Math.random() * 1400,
      )
    }
    timer = window.setTimeout(look, (BEAT.word + 3) * 1000)
    return () => window.clearTimeout(timer)
  }, [still])

  useEffect(() => {
    if (!jolt) return
    const timer = window.setTimeout(() => setJolt(0), 1800)
    return () => window.clearTimeout(timer)
  }, [jolt])

  return (
    <button
      ref={ref}
      type='button'
      aria-label='Turn the mark'
      onClick={() => {
        playSound('turn')
        setTurns((n) => n + 1)
        setJolt((n) => n + 1)
      }}
      onPointerEnter={() => setNear(true)}
      onPointerLeave={() => setNear(false)}
      {...stylex.props(styles.button)}
    >
      <svg
        viewBox='74 72 260 260'
        aria-hidden='true'
        {...stylex.props(styles.svg, compact && styles.compact)}
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
                <Part
                  piece={p}
                  i={i}
                  open={
                    p.key === 'o' || near || jolt > 0 || peeks.includes(p.key)
                  }
                  hop={turns - 1}
                  still={still}
                  paint={paint}
                />
              </motion.g>
            </motion.g>
          ))}
        </motion.g>
      </svg>
    </button>
  )
}

/*
 * One piece alive: it watches the pointer from wherever it sits, leaning
 * that way while its eyes turn, breathes, and hops each time `hop` counts
 * up. The pointer is read from window, so it watches across the whole page.
 */
function Part({
  piece,
  i,
  open,
  hop,
  still,
  paint,
}: {
  piece: Piece
  i: number
  open: boolean
  hop: number
  still: boolean
  paint: Paint
}) {
  const self = useRef<SVGGElement>(null)
  const gx = useMotionValue(0)
  const gy = useMotionValue(0)
  const x = useSpring(gx, GAZE)
  const y = useSpring(gy, GAZE)
  const lx = useTransform(x, (v) => v * LEAN)
  const ly = useTransform(y, (v) => v * LEAN)
  const hy = useMotionValue(0)
  const hsx = useMotionValue(1)
  const hsy = useMotionValue(1)

  useEffect(() => {
    const g = self.current
    if (!g || still) return
    const look = (e: PointerEvent) => {
      const r = g.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      // near the piece the eyes turn less, so they never cross
      const k = Math.min(1, d / 220)
      gx.set((dx / d) * k)
      gy.set((dy / d) * k)
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
      window.removeEventListener('pointermove', look)
      document.removeEventListener('pointerout', away)
    }
  }, [still])

  useEffect(() => {
    if (!hop || still) return
    const at = { ...HOP, delay: i * 0.05 }
    const runs = [
      animate(hy, [0, -18, 0, 0], at),
      animate(hsx, [1, 0.94, 1.1, 1], at),
      animate(hsy, [1, 1.08, 0.88, 1], at),
    ]
    return () => {
      for (const r of runs) r.stop()
    }
  }, [hop, still])

  return (
    <motion.g ref={self} style={{ x: lx, y: ly }}>
      <motion.g style={{ y: hy, scaleX: hsx, scaleY: hsy, originY: 1 }}>
        <g
          {...stylex.props(styles.breath)}
          style={{
            animationDuration: `${3.4 + i * 0.45}s`,
            animationDelay: `${-i * 1.3}s`,
          }}
        >
          {piece.draw(paint)}
          <Eyes
            look={piece.eyes}
            open={open}
            delay={piece.key === 'o' ? BEAT.eyes : i * 0.05}
            gx={x}
            gy={y}
            still={still}
          />
        </g>
      </motion.g>
    </motion.g>
  )
}

/*
 * A pair of eyes. They open (the ring's once, as the mark builds; the rest
 * whenever `open` says), blink every few seconds, now and then twice, and
 * look where the piece's gaze springs point.
 */
function Eyes({
  look: e,
  open,
  delay,
  gx,
  gy,
  still,
}: {
  look: Look
  open: boolean
  delay: number
  gx: MotionValue<number>
  gy: MotionValue<number>
  still: boolean
}) {
  const lids = useRef<SVGGElement>(null)
  const travel = e.pupil ? LOOK * (e.rx / 8) : SLIDE
  const px = useTransform(gx, (v) => v * travel)
  const py = useTransform(gy, (v) => v * travel)

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
    return () => window.clearTimeout(timer)
  }, [still])

  const left = e.x - e.gap
  const right = e.x + e.gap
  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={open ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
      transition={
        still
          ? NONE
          : open
            ? {
                scaleY: { type: 'spring', stiffness: 380, damping: 20, delay },
                opacity: { duration: 0.12, delay },
              }
            : { duration: 0.14, ease: CURVE }
      }
      {...stylex.props(styles.center)}
    >
      <g ref={lids} {...stylex.props(styles.center)}>
        {e.pupil ? (
          <>
            <ellipse cx={left} cy={e.y} rx={e.rx} ry={e.ry} fill={INKS.paper} />
            <ellipse
              cx={right}
              cy={e.y}
              rx={e.rx}
              ry={e.ry}
              fill={INKS.paper}
            />
            <motion.g style={{ x: px, y: py }}>
              <circle cx={left} cy={e.y} r={e.pupil} fill={INKS.ink} />
              <circle cx={right} cy={e.y} r={e.pupil} fill={INKS.ink} />
            </motion.g>
          </>
        ) : (
          <motion.g style={{ x: px, y: py }}>
            <ellipse cx={left} cy={e.y} rx={e.rx} ry={e.ry} fill={INKS.ink} />
            <ellipse cx={right} cy={e.y} rx={e.rx} ry={e.ry} fill={INKS.ink} />
            <circle cx={left + 1.6} cy={e.y - 2.3} r='1.5' fill={INKS.paper} />
            <circle cx={right + 1.6} cy={e.y - 2.3} r='1.5' fill={INKS.paper} />
          </motion.g>
        )}
      </g>
    </motion.g>
  )
}

/* A slow breath, squatting into the floor and rising off it. */
const breathe = stylex.keyframes({
  from: { transform: 'scale(1, 1)' },
  '50%': { transform: 'scale(0.986, 1.03)' },
  to: { transform: 'scale(1, 1)' },
})

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
  compact: { width: '32px', height: '32px', flexShrink: 0 },
  center: {
    transformBox: 'fill-box',
    transformOrigin: 'center',
  },
  breath: {
    transformBox: 'fill-box',
    transformOrigin: '50% 100%',
    animationName: {
      default: breathe,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
})
