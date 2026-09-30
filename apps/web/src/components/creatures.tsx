/*
 * The row along the bottom edge: the teaser's cast, sitting on the floor of
 * the window. Each is a Rig from lib/rig.ts, mounted after hydration (the
 * server has nothing to draw: every one starts out of sight below the edge)
 * and stepped from one shared loop, never through React state.
 *
 * Life, beyond what a rig does alone:
 * - They peek in one by one, the middle one first, as in the teaser.
 * - Their eyes follow the pointer anywhere on the page. A curious one turns
 *   to the mark instead.
 * - Every few seconds each picks a new mood, on its own clock.
 * - Leave the pointer still for a while and they get bored, then sleepy.
 *   Move it and the sleepers wake up, one after another.
 * - Poke one and it jumps.
 *
 * The frame is transparent and only a body answers the pointer, so a poke
 * on the empty corner of one frame lands on the creature behind it.
 */
import * as stylex from '@stylexjs/stylex'
import { useReducedMotion } from 'motion/react'
import { type RefObject, useEffect, useRef } from 'react'
import { BEAT } from '@/lib/motion'
import { Rig, type ShapeKey, type State, VB } from '@/lib/rig'

type Cast = {
  shape: ShapeKey
  /** Frame width, in row units. */
  size: number
  /** Pulls the frame over its left neighbour, in row units. */
  overlap: number
  /** Order it peeks in, 0 first. */
  cue: number
  /** Its mood once it is up. */
  mood: State
  front?: boolean
}

/* Left to right, transcribed from the teaser's full-cast frame. */
const CAST: Cast[] = [
  { shape: 'semicircle', size: 1.5, overlap: 0, cue: 2, mood: 'happy' },
  {
    shape: 'semicircle',
    size: 0.78,
    overlap: 0.62,
    cue: 4,
    mood: 'sleepy',
    front: true,
  },
  { shape: 'circle', size: 1.3, overlap: 0.36, cue: 0, mood: 'curious' },
  {
    shape: 'diamond',
    size: 0.72,
    overlap: 0.3,
    cue: 5,
    mood: 'attentive',
    front: true,
  },
  { shape: 'diamond', size: 1.55, overlap: 0.46, cue: 1, mood: 'normal' },
  { shape: 'circle', size: 0.74, overlap: 0.24, cue: 3, mood: 'happy' },
]

/* The moods a creature wanders between, by weight. Angry and sad are left
 * out: nobody is told off on a coming soon page. */
const MOODS: [State, number][] = [
  ['normal', 3],
  ['happy', 2],
  ['curious', 1.6],
  ['attentive', 1.2],
  ['excited', 0.6],
  ['confused', 0.7],
]
const pick = (not: State): State => {
  const pool = MOODS.filter(([s]) => s !== not)
  let r = Math.random() * pool.reduce((n, [, w]) => n + w, 0)
  for (const [s, w] of pool) {
    r -= w
    if (r <= 0) return s
  }
  return 'normal'
}

/** Seconds of a still pointer before they lose interest, then drift off. */
const BORED = 9
const ASLEEP = 17

export function Creatures({ mark }: { mark: RefObject<HTMLElement | null> }) {
  const still = useReducedMotion() ?? false
  const hosts = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const rigs = CAST.map((c, i) => {
      const host = hosts.current[i]!
      const rig = new Rig(host, c.shape, still)
      rig.svg.setAttribute('width', '100%')
      rig.svg.setAttribute('height', '100%')
      rig.svg.style.pointerEvents = 'none'
      rig.body.style.pointerEvents = 'visiblePainted'
      rig.body.style.cursor = 'pointer'
      rig.body.addEventListener('pointerdown', () => {
        if (still) return
        rig.poke()
        mood[i] = clock + 4 + Math.random() * 4
      })
      rig.enter(BEAT.creatures + c.cue * 0.32, c.mood)
      return rig
    })

    // Where each frame sits, cached: read on resize, used on every pointer move.
    let rects: DOMRect[] = []
    const toFrame = (r: DOMRect, x: number, y: number): [number, number] => [
      VB[0] + ((x - r.left) / r.width) * VB[2],
      VB[1] + ((y - r.top) / r.height) * VB[3],
    ]
    const measure = () => {
      rects = hosts.current.map((h) => h!.getBoundingClientRect())
      const m = mark.current?.getBoundingClientRect()
      rigs.forEach((rig, i) => {
        const r = rects[i]!
        rig.resize(r.width)
        if (m)
          rig.thing = toFrame(r, m.left + m.width / 2, m.top + m.height / 2)
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.documentElement)

    let clock = 0
    let movedAt = 0
    let drowsy: 0 | 1 | 2 = 0
    // Each keeps its own mood clock, first change a while after it is up.
    const mood = CAST.map(
      (c) => BEAT.creatures + c.cue * 0.32 + 6 + Math.random() * 6,
    )

    const move = (e: PointerEvent) => {
      rigs.forEach((rig, i) => {
        rig.pointer = toFrame(rects[i]!, e.clientX, e.clientY)
      })
      if (drowsy) {
        // woken in a ripple from the nearest, not all at once
        rigs.forEach((rig, i) => {
          if (rig.state !== 'sleepy' && rig.state !== 'bored') return
          const r = rects[i]!
          const d = Math.abs(e.clientX - (r.left + r.width / 2))
          mood[i] = clock + 0.08 + d / 2400
          wake[i] = true
        })
        drowsy = 0
      }
      movedAt = clock
    }
    const wake = CAST.map(() => false)
    const leave = (e: PointerEvent) => {
      if (e.relatedTarget) return
      for (const rig of rigs) rig.pointer = null
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leave)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      clock += dt
      const idle = clock - movedAt
      if (clock > BEAT.creatures + 4) {
        if (drowsy < 1 && idle > BORED) drowsy = 1
        if (drowsy < 2 && idle > ASLEEP) drowsy = 2
      }
      rigs.forEach((rig, i) => {
        if (clock < mood[i]!) return
        const next: State = wake[i]
          ? 'attentive'
          : drowsy === 2
            ? 'sleepy'
            : drowsy === 1
              ? rig.state === 'sleepy'
                ? 'sleepy'
                : 'bored'
              : pick(rig.state)
        wake[i] = false
        if (next !== rig.state) rig.setState(next)
        // drowsy ones settle in, the rest keep changing their mind
        mood[i] =
          clock + (drowsy ? 2 + Math.random() * 3 : 5 + Math.random() * 7)
      })
      for (const rig of rigs) rig.update(dt)
      raf = requestAnimationFrame(frame)
    }
    if (!still) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerout', leave)
      for (const rig of rigs) rig.svg.remove()
    }
  }, [still])

  return (
    <div aria-hidden='true' {...stylex.props(styles.row)}>
      {CAST.map((c, i) => (
        <div
          key={`${c.shape}-${i}`}
          ref={(n) => {
            hosts.current[i] = n
          }}
          {...stylex.props(
            styles.frame(c.size, c.overlap),
            c.front && styles.front,
          )}
        />
      ))}
    </div>
  )
}

/* One row unit: wide screens are bounded by height so the cast never climbs
 * into the type; phones by width so all six still fit. */
const U = 'min(22vw, 19svh, 220px)'

const styles = stylex.create({
  row: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    pointerEvents: 'none',
    // lift the row a hair so a sink never shows a seam at the very edge
    marginBottom: '-1px',
  },
  frame: (size: number, overlap: number) => ({
    position: 'relative',
    flexShrink: 0,
    width: `calc(${U} * ${size})`,
    aspectRatio: '1',
    marginLeft: `calc(${U} * ${-overlap})`,
  }),
  front: { zIndex: 1 },
})
