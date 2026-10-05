/*
 * Short, playful sounds for deliberate actions. Music is only a tiny
 * two-note flourish on opt-in and success, never a background track.
 */
let enabled = false
let context: AudioContext | null = null
let last = Number.NEGATIVE_INFINITY
let generation = 0
const listeners = new Set<() => void>()
const active = new Set<OscillatorNode>()

export const soundEnabled = () => enabled
export const soundServerSnapshot = () => false
export function watchSound(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const publish = () => {
  for (const listener of listeners) listener()
}

export function setSound(on: boolean) {
  const ticket = ++generation
  enabled = on
  publish()
  if (!on) {
    for (const oscillator of active) oscillator.stop()
    active.clear()
    void context?.suspend().catch(() => {})
    return
  }
  try {
    context ??= new AudioContext()
    // Resume inside the opt-in gesture, then give one tiny musical hello.
    void context
      .resume()
      .then(() => {
        if (ticket === generation && enabled) playSound('hello')
      })
      .catch(() => {
        if (ticket === generation) setSound(false)
      })
  } catch {
    setSound(false)
  }
}

type Cue = 'click' | 'turn' | 'poke' | 'success' | 'change' | 'hello'
const CUES = {
  click: { notes: [620], duration: 0.065, level: 0.045, wave: 'triangle' },
  turn: { notes: [185], duration: 0.21, level: 0.065, wave: 'sine' },
  poke: { notes: [390], duration: 0.13, level: 0.06, wave: 'sine' },
  change: { notes: [740], duration: 0.085, level: 0.04, wave: 'triangle' },
  success: {
    notes: [659.25, 987.77],
    duration: 0.13,
    level: 0.045,
    wave: 'sine',
  },
  hello: { notes: [523.25, 783.99], duration: 0.11, level: 0.04, wave: 'sine' },
} satisfies Record<
  Cue,
  {
    notes: number[]
    duration: number
    level: number
    wave: OscillatorType
  }
>

export function playSound(cue: Cue, voice = 0) {
  const ctx = context
  if (!enabled || !ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  // Explicit action cues run before the delegated button click. This also
  // keeps rapid tapping from stacking a loud pile of sounds.
  if (now - last < 0.07 || active.size >= 6) return
  last = now
  const { notes, duration, level, wave } = CUES[cue]
  notes.forEach((note, i) => {
    const frequency = note * (cue === 'poke' ? 2 ** ((voice % 4) / 8) : 1)
    const start = now + i * 0.075
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = wave
    oscillator.frequency.setValueAtTime(
      frequency * (cue === 'poke' ? 2 : 1),
      start,
    )
    if (cue === 'turn') {
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.9,
        start + 0.035,
      )
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.7,
        start + 0.12,
      )
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency,
        start + duration,
      )
    } else {
      oscillator.frequency.exponentialRampToValueAtTime(frequency, start + 0.04)
    }
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(level, start + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    active.add(oscillator)
    oscillator.stop(start + duration + 0.02)
    oscillator.onended = () => {
      active.delete(oscillator)
      oscillator.disconnect()
      gain.disconnect()
    }
  })
}
