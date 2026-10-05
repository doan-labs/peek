/*
 * The row along the bottom edge: the teaser's cast, sitting on the floor of
 * the window. Each is a Rig from lib/rig.ts, mounted after hydration (the
 * server has nothing to draw: every one starts out of sight below the edge)
 * and stepped from one shared loop, never through React state.
 *
 * The row is fixed to the window's floor for the whole page, so the cast
 * goes with the reader:
 * - Scrolling squashes and stretches them, each wobbling at its own rate.
 * - As the hero goes they duck under the edge in a wave, the last first,
 *   scrubbed by the scroll: scroll back and they come up again.
 * - Under the sections they wait out of sight. Stop scrolling and two or
 *   three peek over the edge until the page moves again.
 * - On the footer they stand up again, the first first, and cheer once the
 *   page runs out.
 * Reduced motion leaves the row on the hero's floor, still.
 *
 * Life, beyond what a rig does alone:
 * - They peek in one by one, the middle one first, as in the teaser.
 * - Their eyes follow the pointer anywhere on the page. A curious one turns
 *   to the mark instead.
 * - Every few seconds each picks a new mood, on its own clock.
 * - Leave the pointer still for a while and they get bored, then sleepy.
 *   Move it and the sleepers wake up, one after another.
 * - Poke one and it jumps. Copy the install line or save a face and the
 *   whole row cheers.
 * - Easter eggs: type "peek", keep pressing the mark past a full turn
 *   (they rain down; any that hit the line roll off its end), leave the
 *   tab.
 *
 * The frame is transparent and only a body answers the pointer, so a poke
 * on the empty corner of one frame lands on the creature behind it.
 */
import * as stylex from '@stylexjs/stylex'
import { useReducedMotion } from 'motion/react'
import { type RefObject, useEffect, useRef } from 'react'
import { BEAT } from '@/lib/motion'
import { Rig, type ShapeKey, STATES, type State, VB } from '@/lib/rig'

/* The shower, for the rest of the page: `rain(n)` drops n at once. Set
 * while the cast is mounted. */
let shower: ((n: number) => void) | null = null
export const rain = (n: number) => shower?.(n)

/* A cheer for the rest of the page: `cheer()` jumps the row in a wave, the
 * way the footer's end does. Set while the cast is mounted. */
let hooray: (() => void) | null = null
export const cheer = () => hooray?.()

/* Rigs that live elsewhere on the page but step on this loop. `ride`
 * returns the way off. */
const riders = new Set<Rig>()
export function ride(rig: Rig) {
  riders.add(rig)
  return () => riders.delete(rig)
}

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
  /* Peek v1.2's new face, not in the teaser: it peeks in last. */
  { shape: 'triangle', size: 1.2, overlap: 0.18, cue: 6, mood: 'excited' },
]

/* The moods a creature wanders between, by weight. Angry and sad are left
 * out: nobody is told off on the home page. */
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

/** The tallest frame's height while it waits under the sections, px, so a
 * peek reads the same size on any screen. */
const DOCK_PX = 160
/** Altitude of a peek: eyes and brows over the edge, the rest below. */
const PEEK = -0.74
/** Seconds of a still page before a few peek in. */
const LULL = 1.1
/** The moods a peeker comes up in. */
const PEEKS: State[] = ['attentive', 'happy', 'curious', 'excited', 'normal']
/** The duck under the edge: quick, with one small bounce coming up. */
const SINK = { w: 9, z: 0.62 }
/** px/s of scroll for the most squash, and how much that is. */
const JELLY = 5000
const SQUASH = 0.14

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const ease = (v: number) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

/* The shower from the mark: sizes and shapes taken in turn, so only where
 * one falls is left to chance. Capped, since every rig steps every frame. */
const DROP_PX = [84, 64, 104, 72]
const DROP_SHAPES: ShapeKey[] = ['circle', 'diamond', 'semicircle', 'triangle']
const MAX_DROPS = 24
/** px/s², a quick fall. */
const GRAVITY = 2600
/** px/s, how fast a landed one rolls along the line, low and high. */
const ROLL = [140, 300] as const
/** The line's box top sits above its letters; land on the letters. */
const CAP = 0.14

type Drop = {
  rig: Rig
  host: HTMLDivElement
  px: number
  x: number
  y: number
  vx: number
  vy: number
  /** Degrees, from rolling. */
  spin: number
  /** Whether it is still over the line; once off, only the page's bottom. */
  shelf: boolean
}

export function Creatures({
  mark,
  line,
}: {
  mark: RefObject<HTMLElement | null>
  line: RefObject<HTMLElement | null>
}) {
  const still = useReducedMotion() ?? false
  const hosts = useRef<(HTMLDivElement | null)[]>([])
  const rain = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)

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

    // Where each frame sits, cached: read on resize and scroll, used on every
    // pointer move. The page's sizes change only on resize.
    let rects: DOMRect[] = []
    let heroH = 1
    let rowH = 1
    let maxY = 1
    const toFrame = (r: DOMRect, x: number, y: number): [number, number] => [
      VB[0] + ((x - r.left) / r.width) * VB[2],
      VB[1] + ((y - r.top) / r.height) * VB[3],
    ]
    const measure = () => {
      rects = hosts.current.map((h) => h!.getBoundingClientRect())
      const m = mark.current?.getBoundingClientRect()
      if (!m) return
      rigs.forEach((rig, i) => {
        rig.thing = toFrame(
          rects[i]!,
          m.left + m.width / 2,
          m.top + m.height / 2,
        )
      })
    }
    const fit = () => {
      const r = row.current!
      heroH = r.parentElement!.offsetHeight
      rowH = r.offsetHeight
      maxY = document.documentElement.scrollHeight - window.innerHeight
      measure()
      rigs.forEach((rig, i) => {
        rig.resize(hosts.current[i]!.offsetWidth)
      })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(document.documentElement)

    let clock = 0
    let movedAt = 0
    let drowsy: 0 | 1 | 2 = 0
    // Each keeps its own mood clock, first change a while after it is up,
    // and a cue that names its next mood instead of leaving it to chance.
    const mood = CAST.map(
      (c) => BEAT.creatures + c.cue * 0.32 + 6 + Math.random() * 6,
    )
    const cue: (State | null)[] = CAST.map(() => null)

    // Any sign of life: the drowsy wake in a ripple from x, not all at once.
    const stir = (x: number) => {
      if (drowsy) {
        rigs.forEach((rig, i) => {
          if (rig.state !== 'sleepy' && rig.state !== 'bored') return
          const r = rects[i]!
          const d = Math.abs(x - (r.left + r.width / 2))
          mood[i] = clock + 0.08 + d / 2400
          cue[i] = 'attentive'
        })
        drowsy = 0
      }
      movedAt = clock
    }
    const move = (e: PointerEvent) => {
      rigs.forEach((rig, i) => {
        rig.pointer = toFrame(rects[i]!, e.clientX, e.clientY)
      })
      stir(e.clientX)
    }

    // The scroll, read once a frame. Each body keeps two springs of its own:
    // how far it is sunk under the edge, and its jelly.
    let lastY = window.scrollY
    let speed = 0
    let scrolledAt = 0
    let scale = 1
    let stale = false
    let dealt = false
    let cheered = false
    let shout = false
    const bodies = CAST.map((c) => ({
      sink: 0,
      sinkV: 0,
      jelly: 0,
      jellyV: 0,
      // the big ones wobble slower
      jellyW: 15 / Math.sqrt(c.size),
      // when it comes up to peek; never, while it stays down
      peek: Number.POSITIVE_INFINITY,
    }))
    const scroll = (dt: number) => {
      const y = window.scrollY
      const moved = y !== lastY
      speed +=
        ((y - lastY) / Math.max(dt, 0.001) - speed) * Math.min(1, dt * 12)
      lastY = y
      if (moved || stale) measure()
      stale = false
      if (moved) {
        stir(window.innerWidth / 2)
        scrolledAt = clock
        dealt = false
        for (const b of bodies) b.peek = Number.POSITIVE_INFINITY
      }

      // 1 while the cast stands, on the hero or on the footer; 0 between.
      // Down before the sections' type reaches the floor.
      const end = clamp01(1 - (maxY - y) / (rowH * 1.4))
      const up = Math.max(
        1 - clamp01(y / Math.min(heroH * 0.5, rowH * 1.2)),
        end,
      )
      const dock = Math.min(1, DOCK_PX / rowH)
      const s = dock + (1 - dock) * ease(up / 0.4)
      if (s !== scale) {
        scale = s
        row.current!.style.transform = s === 1 ? '' : `scale(${s.toFixed(4)})`
        stale = true
      }

      // a still page under the sections brings two or three up to peek
      if (up === 0 && !dealt && clock - scrolledAt > LULL) {
        dealt = true
        const n = Math.random() < 0.35 ? 3 : 2
        for (let k = 0; k < n; k++) {
          const i = Math.floor(Math.random() * bodies.length)
          const b = bodies[i]!
          if (b.peek !== Number.POSITIVE_INFINITY) continue
          b.peek = clock + k * 0.45
          mood[i] = b.peek
          cue[i] = PEEKS[Math.floor(Math.random() * PEEKS.length)]!
        }
      }
      // the page runs out: a cheer, in the order they stood up
      if (end > 0.95 && !cheered) {
        cheered = true
        rigs.forEach((_, i) => {
          mood[i] = clock + 0.1 + i * 0.08
          cue[i] = 'excited'
        })
      } else if (end < 0.3) cheered = false
      if (shout) {
        shout = false
        stir(window.innerWidth / 2)
        rigs.forEach((_, i) => {
          mood[i] = clock + 0.05 + i * 0.07
          cue[i] = 'excited'
        })
      }

      const squash = Math.max(-SQUASH, Math.min(SQUASH, -speed / JELLY))
      for (let i = 0; i < rigs.length; i++) {
        const rig = rigs[i]!
        const b = bodies[i]!
        // the wave: the last ducks first and stands up last
        const stand = ease((up - (i / (rigs.length - 1)) * 0.5) / 0.5)
        // a peeker sits at PEEK whatever its mood would do with its height
        const low =
          clock >= b.peek ? PEEK - STATES[rig.state].alt : rig.hide - 0.6
        const { w, z } = SINK
        b.sinkV +=
          (w * w * (low * (1 - stand) - b.sink) - 2 * z * w * b.sinkV) * dt
        b.sink += b.sinkV * dt
        rig.depth = b.sink
        const j = b.jellyW
        b.jellyV += (j * j * (squash - b.jelly) - 0.6 * j * b.jellyV) * dt
        b.jelly += b.jellyV * dt
        rig.squash = b.jelly
      }
    }
    const leave = (e: PointerEvent) => {
      if (e.relatedTarget) return
      for (const rig of rigs) rig.pointer = null
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leave)

    // Type "peek" and they duck under the edge and peek in again.
    let typed = ''
    const key = (e: KeyboardEvent) => {
      if (still || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1)
        return
      typed = (typed + e.key.toLowerCase()).slice(-4)
      if (typed !== 'peek') return
      typed = ''
      rigs.forEach((rig, i) => {
        const at = 0.9 + CAST[i]!.cue * 0.2
        const drowsing = rig.state === 'sleepy' || rig.state === 'bored'
        rig.duck(at, drowsing ? 'attentive' : rig.state)
        mood[i] = clock + at + 5
      })
      drowsy = 0
      movedAt = clock
    }
    window.addEventListener('keydown', key)

    // Keep pressing the mark past a full turn and more of them fall in from
    // the top, a few a press, anywhere across the page. One over the line
    // lands on the letters, bounces, rolls to its end and drops off; the
    // rest fall straight past it and off the bottom.
    const drops: Drop[] = []
    let dropped = 0
    let presses: number[] = []
    const spin = () => {
      if (still) return
      presses = [...presses.filter((t) => clock - t < 2.4), clock]
      if (presses.length > 4) pour(3)
    }
    // stacked above the top, so a big pour arrives as a stream
    const pour = (n: number) => {
      if (still || !line.current) return
      for (let k = 0; k < n && drops.length < MAX_DROPS; k++, dropped++) {
        const px = DROP_PX[dropped % DROP_PX.length]!
        const host = document.createElement('div')
        host.className = stylex.props(styles.drop).className ?? ''
        host.style.width = host.style.height = `${px}px`
        rain.current!.append(host)
        const rig = new Rig(
          host,
          DROP_SHAPES[dropped % DROP_SHAPES.length]!,
          false,
        )
        rig.svg.setAttribute('width', '100%')
        rig.svg.setAttribute('height', '100%')
        rig.resize(px)
        rig.setState('surprised')
        const d: Drop = {
          rig,
          host,
          px,
          x: Math.random() * (window.innerWidth - px),
          y: -px * (1 + k * 0.9),
          vx: 0,
          vy: 0,
          spin: 0,
          shelf: true,
        }
        place(d)
        drops.push(d)
      }
    }
    const place = (d: Drop) => {
      d.host.style.transform = `translate(${d.x}px, ${d.y}px) rotate(${d.spin}deg)`
    }
    const fall = (dt: number) => {
      const l = line.current?.getBoundingClientRect()
      for (let j = drops.length - 1; j >= 0; j--) {
        const d = drops[j]!
        d.rig.update(dt)
        if (d.y > window.innerHeight) {
          d.host.remove()
          drops.splice(j, 1)
          continue
        }
        // off the end once its middle passes the last letter
        const mid = d.x + d.px / 2
        if (d.shelf && l && (mid < l.left || mid > l.right)) {
          d.shelf = false
          d.rig.setState('surprised')
        }
        d.vy += GRAVITY * dt
        d.x += d.vx * dt
        d.y += d.vy * dt
        // rolling without slipping: the turn is the distance over the radius
        d.spin += ((d.vx * dt) / (d.px / 2)) * (180 / Math.PI)
        const floor = l ? l.top + l.height * CAP - d.px : 0
        if (d.shelf && l && d.y >= floor) {
          d.y = floor
          if (d.vy > 500) {
            if (d.vy > 900) d.rig.poke()
            d.vy *= -0.32
          } else {
            d.vy = 0
            // set rolling the first time it settles, towards the nearer end
            if (!d.vx) {
              const dir = mid < l.left + l.width / 2 ? -1 : 1
              d.vx = dir * (ROLL[0] + Math.random() * (ROLL[1] - ROLL[0]))
              d.rig.setState('excited')
            }
          }
        }
        place(d)
      }
    }
    const button = mark.current
    button?.addEventListener('click', spin)
    shower = pour
    hooray = () => {
      shout = true
    }

    // Leave the tab and it falls asleep; come back and they all jump.
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const title = document.title
    // A new face on each return; it keeps that one while you are away.
    let face = DROP_SHAPES[Math.floor(Math.random() * DROP_SHAPES.length)]
    const seen = () => {
      if (document.hidden) {
        document.title = 'Peek · come back'
        if (icon) icon.href = `/favicon-${face}-asleep.svg`
        return
      }
      document.title = title
      face = DROP_SHAPES[Math.floor(Math.random() * DROP_SHAPES.length)]
      if (icon) icon.href = `/favicon-${face}.svg`
      if (still) return
      rigs.forEach((rig, i) => {
        rig.poke('attentive')
        mood[i] = clock + 3 + Math.random() * 3
      })
      drowsy = 0
      movedAt = clock
    }
    document.addEventListener('visibilitychange', seen)
    if (icon) icon.href = `/favicon-${face}.svg`

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
      scroll(dt)
      rigs.forEach((rig, i) => {
        if (clock < mood[i]!) return
        const cued = cue[i]
        const next: State =
          cued ??
          (drowsy === 2
            ? 'sleepy'
            : drowsy === 1
              ? rig.state === 'sleepy'
                ? 'sleepy'
                : 'bored'
              : pick(rig.state))
        cue[i] = null
        // a cue plays again even on one already in that mood
        rig.setState(next, { restart: !!cued })
        // drowsy ones settle in, the rest keep changing their mind
        mood[i] =
          clock + (drowsy ? 2 + Math.random() * 3 : 5 + Math.random() * 7)
      })
      for (const rig of rigs) rig.update(dt)
      for (const rig of riders) rig.update(dt)
      fall(dt)
      raf = requestAnimationFrame(frame)
    }
    if (!still) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerout', leave)
      window.removeEventListener('keydown', key)
      button?.removeEventListener('click', spin)
      shower = null
      hooray = null
      document.removeEventListener('visibilitychange', seen)
      document.title = title
      if (icon) icon.href = '/favicon-semicircle.svg'
      for (const rig of rigs) rig.svg.remove()
      for (const d of drops) d.host.remove()
    }
  }, [still])

  return (
    <>
      <div ref={rain} aria-hidden='true' {...stylex.props(styles.rain)} />
      <div ref={row} aria-hidden='true' {...stylex.props(styles.row)}>
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
    </>
  )
}

/* One row unit: wide screens are bounded by height so the cast never climbs
 * into the type; phones by width so all seven still fit. */
const U = 'min(18vw, 19svh, 220px)'

const styles = stylex.create({
  // the window's floor, over the sections and under the hero's type;
  // reduced motion leaves it on the hero's floor, since it never ducks
  row: {
    position: {
      default: 'fixed',
      '@media (prefers-reduced-motion: reduce)': 'absolute',
    },
    zIndex: 1,
    transformOrigin: '50% 100%',
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
  // over the type and the cast, under the grain
  rain: {
    position: 'fixed',
    inset: 0,
    zIndex: 2,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  drop: { position: 'absolute', top: 0, left: 0 },
})
