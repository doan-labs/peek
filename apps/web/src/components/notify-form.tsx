/*
 * One field under the line: leave an email, hear when Peek ships. Posts to
 * the Worker in apps/web/worker.ts, which `bun run dev` runs locally in
 * Miniflare (vite.config.ts).
 *
 * Focus the field and a creature peeks over its top edge, eyes on the
 * caret from the first frame. It ducks when you leave, watches the button
 * while a send thinks, jumps for joy when you are on the list (and the
 * cast pours in from the top), and is sad when a send fails. It steps on
 * the cast's loop.
 */
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type FocusEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { rain, ride } from '@/components/creatures'
import { BEAT, CURVE, LAND, NONE } from '@/lib/motion'
import { Rig, VB } from '@/lib/rig'
import { colors, fonts } from '@/lib/tokens.stylex'

/** One offscreen canvas to measure typed text with, made on first focus. */
let pen: CanvasRenderingContext2D | null = null

const FAIL = 'That did not go through. Try again.'
const DONE = 'You are on the list.'
const AGAIN = 'You are already on the list.'
/** How long the button takes to swell across the pill, in seconds. */
const SWELL = 0.35
/* The words droop in, one after another, as the creature's frown lands:
 * the mouth's delay in the rig's sad CHOREO, in seconds. */
const FROWN = 0.38
/** The least a send takes, in ms, so the dots get a moment to think. */
const WAIT = 1400
/** On the list: as many of the cast as the shower holds, from the top. */
const MAX = 24

type State = 'idle' | 'sending' | 'done' | 'error'

export function NotifyForm() {
  const still = useReducedMotion() ?? false
  const [state, setState] = useState<State>('idle')
  const perch = useRef<HTMLDivElement>(null)
  const rig = useRef<Rig>(null)
  const done = useRef(false)
  const busy = state === 'sending'
  // a 200 is an address the list already had
  const [line, setLine] = useState(DONE)

  useEffect(() => {
    const host = perch.current!
    const r = new Rig(host, 'circle', still)
    r.svg.setAttribute('width', '100%')
    r.svg.setAttribute('height', '100%')
    r.away(true)
    // reduced motion: no rise, it is just there or not
    if (still) host.style.visibility = 'hidden'
    rig.current = r
    const off = ride(r)
    return () => {
      off()
      r.svg.remove()
    }
  }, [still])

  const show = (up: boolean) => {
    if (still && perch.current)
      perch.current.style.visibility = up ? 'visible' : 'hidden'
  }

  /* Eyes on the caret, in frame units. An email field hides its selection,
   * so the caret is taken to sit at the end of what is typed. */
  const look = (input: HTMLInputElement) => {
    const r = rig.current
    const host = perch.current
    if (!r || !host) return
    const css = getComputedStyle(input)
    pen ??= document.createElement('canvas').getContext('2d')
    if (!pen) return
    pen.font = css.font
    const box = input.getBoundingClientRect()
    const pad = Number.parseFloat(css.paddingLeft)
    const x = Math.min(
      box.left + pad + pen.measureText(input.value).width - input.scrollLeft,
      box.right - pad,
    )
    const h = host.getBoundingClientRect()
    r.gaze = [
      VB[0] + ((x - h.left) / h.width) * VB[2],
      VB[1] + ((box.top + box.height / 2 - h.top) / h.height) * VB[3],
    ]
  }

  const focus = (e: FocusEvent<HTMLFormElement>) => {
    const r = rig.current
    if (!r || done.current) return
    if (e.target instanceof HTMLInputElement) look(e.target)
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return
    show(true)
    r.duck(0, 'curious')
  }

  const blur = (e: FocusEvent<HTMLFormElement>) => {
    if (done.current) return
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return
    show(false)
    rig.current?.away()
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    const email = new FormData(e.currentTarget).get('email')
    setState('sending')
    // it watches the button while it thinks
    const r = rig.current
    const host = perch.current
    const btn = e.currentTarget.querySelector('button')
    if (r && host && btn) {
      const h = host.getBoundingClientRect()
      const b = btn.getBoundingClientRect()
      r.gaze = [
        VB[0] + ((b.left + b.width / 2 - h.left) / h.width) * VB[2],
        VB[1] + ((b.top + b.height / 2 - h.top) / h.height) * VB[3],
      ]
    }
    const [res] = await Promise.all([
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => null),
      new Promise((wait) => setTimeout(wait, WAIT)),
    ])
    done.current = !!res?.ok
    // done looking at the field: its own face takes the eyes back
    if (rig.current) rig.current.gaze = null
    if (res?.ok) {
      rig.current?.poke('happy')
      rain(MAX)
    } else rig.current?.setState('sad')
    setLine(res?.status === 200 ? AGAIN : DONE)
    setState(res?.ok ? 'done' : 'error')
  }

  return (
    <motion.form
      onSubmit={send}
      onFocus={focus}
      onBlur={blur}
      onInput={(e) => {
        if (e.target instanceof HTMLInputElement) look(e.target)
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        still ? NONE : { duration: 0.9, delay: BEAT.notify, ease: CURVE }
      }
      {...stylex.props(styles.form)}
    >
      <div ref={perch} aria-hidden='true' {...stylex.props(styles.perch)} />
      <div {...stylex.props(styles.row)}>
        <label htmlFor='notify-email' {...stylex.props(styles.srOnly)}>
          Email
        </label>
        <motion.input
          id='notify-email'
          name='email'
          type='email'
          required
          autoComplete='email'
          placeholder='you@example.com'
          // readOnly, not disabled, while it sends: a disabled field drops
          // its focus and the creature would duck mid send
          readOnly={busy}
          disabled={state === 'done'}
          animate={
            state === 'done'
              ? { opacity: 0, filter: 'blur(6px)' }
              : { opacity: 1, filter: 'blur(0px)' }
          }
          transition={still ? NONE : { duration: 0.4, ease: CURVE }}
          {...stylex.props(styles.input)}
        />
        {/* On the list, the button swells to fill the pill, then melts
         * into the words. Its radius goes through `style` so the layout
         * animation keeps it round while it stretches. */}
        <motion.button
          type='submit'
          aria-busy={busy}
          disabled={state === 'done'}
          layout
          style={{ borderRadius: 999 }}
          animate={{ opacity: state === 'done' ? 0 : 1 }}
          transition={
            still
              ? NONE
              : {
                  layout: LAND,
                  opacity: { duration: 0.5, delay: SWELL, ease: CURVE },
                }
          }
          {...stylex.props(styles.button, state === 'done' && styles.fill)}
        >
          <motion.span
            animate={
              busy || state === 'done'
                ? { opacity: 0, filter: 'blur(4px)' }
                : { opacity: 1, filter: 'blur(0px)' }
            }
            transition={still ? NONE : { duration: 0.35, ease: CURVE }}
          >
            Notify me
          </motion.span>
          <AnimatePresence>
            {busy && (
              <motion.span
                aria-hidden='true'
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={still ? NONE : { duration: 0.3, ease: CURVE }}
                {...stylex.props(styles.dots)}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={
                      still
                        ? NONE
                        : {
                            duration: 0.7,
                            delay: i * 0.12,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: CURVE,
                          }
                    }
                    {...stylex.props(styles.dot)}
                  />
                ))}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        {state === 'done' && (
          <p role='status' {...stylex.props(styles.note, styles.done)}>
            <span {...stylex.props(styles.srOnly)}>{line}</span>
            <span aria-hidden='true'>
              {[...line].map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  initial={{ opacity: 0, y: '0.6em', filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
                  transition={
                    still
                      ? NONE
                      : { duration: 0.8, delay: SWELL + i * 0.025, ease: CURVE }
                  }
                  {...stylex.props(styles.word)}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          </p>
        )}
      </div>
      <p role='status' {...stylex.props(styles.note)}>
        {state === 'error' &&
          FAIL.split(' ').map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: '-0.5em', filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
              transition={
                still
                  ? NONE
                  : { duration: 1, delay: FROWN + i * 0.07, ease: CURVE }
              }
              {...stylex.props(styles.word)}
            >
              {i > 0 && ' '}
              {word}
            </motion.span>
          ))}
      </p>
    </motion.form>
  )
}

const styles = stylex.create({
  form: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: 'min(340px, calc(100vw - 32px))',
  },
  // sits on the pill's top edge, so the frame's floor is the border
  perch: {
    position: 'absolute',
    bottom: 'calc(100% - 1px)',
    left: '26px',
    width: '58px',
    aspectRatio: '1',
    pointerEvents: 'none',
  },
  row: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: colors['--faint'],
      ':focus-within': colors['--muted'],
    },
    borderRadius: '999px',
    padding: '4px',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingInline: '14px',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors['--bone'],
    fontFamily: fonts['--sans'],
    fontSize: '15px',
    outlineStyle: 'none',
    '::placeholder': { color: colors['--faint'] },
  },
  button: {
    flexShrink: 0,
    paddingBlock: '10px',
    paddingInline: '16px',
    borderWidth: 0,
    backgroundColor: colors['--bone'],
    color: colors['--ground'],
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    position: 'relative',
    cursor: 'pointer',
    outlineColor: {
      default: 'transparent',
      ':focus-visible': colors['--signal'],
    },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '3px',
  },
  note: {
    minHeight: '1em',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    letterSpacing: '0.14em',
    lineHeight: 1,
    color: colors['--muted'],
    textTransform: 'uppercase',
  },
  dots: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: colors['--ground'],
  },
  word: { display: 'inline-block', whiteSpace: 'pre' },
  // over the whole pill, where the button swelled to
  fill: { position: 'absolute', inset: '4px' },
  done: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
})
