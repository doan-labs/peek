/*
 * Server and client as a filmstrip of three frames: the HTML the server
 * wrote, the client drawing the same bytes, the face coming alive after
 * mount. At rest every frame is shown; in view it replays the order, and a
 * frame is a button that jumps to it.
 *
 * The hashes are real: the server one is the string rendered into the
 * HTML, the client one is computed again in an effect in the browser.
 */
import { Peek, toSvg } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Figure, Micro, useAutoplay } from './kit'

const NAME = 'Linh'
const SIZE = 84
// seconds each frame takes the stage, and the whole loop
const AT = [0, 1.6, 3.2] as const
const LOOP = 6.4

/** fnv1a over UTF-8, as in packages/peek/src/identity.ts (not exported). */
function fnv1a(str: string) {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function Hydration() {
  const reduce = useReducedMotion()
  const markup = toSvg(NAME)
  const [server] = useState(() => fnv1a(markup))
  const [client, setClient] = useState<string | null>(null)
  useEffect(() => setClient(fnv1a(toSvg(NAME))), [])

  // the frame reached; at rest, the last one, so the whole story shows
  const [step, setStep] = useState(2)
  const auto = useAutoplay<HTMLDivElement>((t) => {
    const x = t % LOOP
    setStep(x < AT[1] ? 0 : x < AT[2] ? 1 : 2)
  })
  const go = (i: number) => {
    auto.stop()
    setStep(i)
  }

  const bytes = new TextEncoder().encode(markup).length
  const same = client !== null && client === server
  const frames = [
    {
      label: 'HTML',
      face: (
        <img
          src={`data:image/svg+xml,${encodeURIComponent(markup)}`}
          alt=''
          width={SIZE}
          height={SIZE}
          {...stylex.props(s.img)}
        />
      ),
      line: `server · ${bytes.toLocaleString('en')} bytes`,
    },
    {
      label: 'Hydrate',
      face: (
        <Peek name={NAME} size={SIZE} title={false} {...stylex.props(s.img)} />
      ),
      line: client
        ? same
          ? `#${client} = #${server}`
          : 'markup differs'
        : `#${server}`,
    },
    {
      label: 'Mount',
      face: (
        <Peek
          name={NAME}
          size={SIZE}
          animate={step === 2}
          title={false}
          {...stylex.props(s.img)}
        />
      ),
      line: reduce
        ? 'animate · still, reduced motion'
        : 'animate · blinks, breathes',
    },
  ]

  return (
    <Figure bare>
      <div ref={auto.ref} {...stylex.props(s.strip)}>
        {frames.map((f, i) => {
          const on = i <= step
          return (
            <div key={f.label} {...stylex.props(s.cell)}>
              {i > 0 ? (
                <span aria-hidden='true' {...stylex.props(s.wire)}>
                  <motion.span
                    initial={false}
                    animate={{ scaleX: on ? 1 : 0 }}
                    transition={reduce ? NONE : { duration: 0.5, ease: CURVE }}
                    {...stylex.props(s.wireFill)}
                  />
                </span>
              ) : null}
              <motion.button
                type='button'
                aria-pressed={i === step}
                aria-label={`${i + 1}, ${f.label}`}
                onClick={() => go(i)}
                initial={false}
                animate={{ opacity: on ? 1 : 0.35, y: i === step ? -2 : 0 }}
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                transition={reduce ? NONE : LAND}
                {...stylex.props(s.frame, i === step && s.frameOn)}
              >
                <span {...stylex.props(s.face)}>
                  {f.face}
                  <AnimatePresence>
                    {i === 1 && same && on ? (
                      <motion.span
                        key='tick'
                        aria-hidden='true'
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={reduce ? NONE : LAND}
                        {...stylex.props(s.tick)}
                      >
                        <Tick />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span {...stylex.props(s.head)}>
                  <span {...stylex.props(s.num, i === step && s.numOn)}>
                    0{i + 1}
                  </span>
                  <Micro>{f.label}</Micro>
                </span>
                <span {...stylex.props(s.line)}>{f.line}</span>
              </motion.button>
            </div>
          )
        })}
      </div>
    </Figure>
  )
}

const Tick = () => (
  <svg
    aria-hidden='true'
    width='12'
    height='12'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='3'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M20 6 9 17l-5-5' />
  </svg>
)

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'

const s = stylex.create({
  strip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
  cell: { position: 'relative', display: 'flex', minWidth: 0 },
  wire: {
    position: 'absolute',
    top: { default: '62px', [SMALL]: '50px' },
    left: { default: '-28px', [SMALL]: '-14px' },
    width: { default: '56px', [SMALL]: '28px' },
    height: '1px',
    backgroundColor: sheet['--rule'],
  },
  wireFill: {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'left',
    backgroundColor: sheet['--fg'],
  },
  frame: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    marginInline: { default: '14px', [SMALL]: '4px' },
    padding: { default: '18px 10px 14px', [SMALL]: '12px 4px 10px' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--rule'] },
    },
    borderRadius: '14px',
    fontFamily: 'inherit',
    color: sheet['--fg'],
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '0.2s',
  },
  frameOn: {
    borderColor: {
      default: sheet['--rule-strong'],
      [HOVER]: sheet['--rule-strong'],
    },
    backgroundColor: sheet['--wash'],
  },
  face: {
    position: 'relative',
    display: 'inline-flex',
    width: { default: `${SIZE}px`, [SMALL]: '64px' },
    height: { default: `${SIZE}px`, [SMALL]: '64px' },
  },
  img: { display: 'block', width: '100%', height: '100%' },
  tick: {
    position: 'absolute',
    right: '-6px',
    top: '-6px',
    display: 'grid',
    placeItems: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    color: sheet['--page'],
    backgroundColor: sheet['--fg'],
  },
  head: { display: 'inline-flex', alignItems: 'baseline', gap: '6px' },
  num: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    color: sheet['--quiet'],
  },
  numOn: { color: sheet['--red'] },
  line: {
    fontFamily: fonts['--mono'],
    fontSize: { default: '11.5px', [SMALL]: '10px' },
    lineHeight: 1.45,
    color: sheet['--soft'],
    textAlign: 'center',
    overflowWrap: 'anywhere',
  },
})
