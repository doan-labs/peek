/*
 * ServeIt: the GET handler from the page, in a pretend browser window with
 * its network panel open. The first request for a URL goes to the handler
 * and comes back with the real string; the response says `immutable` for a
 * year, so asking again is answered from the disk cache. Cache keys are the
 * exact URL, the way HTTP keys them, so `Ada` and `ada` are two entries.
 */
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { FaceChip, Figure, useAutoplay } from './kit'
import { bytes, draw, Shown } from './svg'

const LOOP = ['Ada', 'Grace', 'Ada', 'Alan', 'Grace', 'Alan'] as const
const CHIPS = ['Ada', 'Grace', 'Alan'] as const
// seconds a pretend round trip takes
const TRIP = 0.9
const ROWS = 4

type Row = { id: number; name: string; from: 'pending' | 'network' | 'cache' }

const path = (name: string) => `/avatar?name=${encodeURIComponent(name)}`

// the frame at rest: two first visits, then Ada again from the cache
const REST: Row[] = [
  { id: 2, name: 'Ada', from: 'cache' },
  { id: 1, name: 'Grace', from: 'network' },
  { id: 0, name: 'Ada', from: 'network' },
]

export function ServeIt() {
  const reduce = useReducedMotion()
  const [draft, setDraft] = useState('Ada')
  const [shown, setShown] = useState('Ada')
  const [rows, setRows] = useState(REST)
  const cache = useRef(new Set([path('Ada'), path('Grace')]))
  const next = useRef(REST.length)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const turn = useRef(-1)
  useEffect(() => () => clearTimeout(timer.current), [])

  const send = (name: string, fresh = false) => {
    clearTimeout(timer.current)
    if (fresh) cache.current.clear()
    const url = path(name)
    const id = next.current++
    const hit = cache.current.has(url)
    setDraft(name)
    setRows((r) =>
      [
        { id, name, from: hit ? 'cache' : 'pending' } as Row,
        // a request still in flight when the next one goes is dropped
        ...(fresh ? [] : r.filter((x) => x.from !== 'pending')),
      ].slice(0, ROWS),
    )
    if (hit) {
      setShown(name)
      return
    }
    timer.current = setTimeout(
      () => {
        cache.current.add(url)
        setShown(name)
        setRows((r) =>
          r.map((x) => (x.id === id ? { ...x, from: 'network' } : x)),
        )
      },
      reduce ? 0 : TRIP * 1000,
    )
  }

  const auto = useAutoplay<HTMLDivElement>((t) => {
    const i = Math.floor(t / 2.4)
    if (i === turn.current) return
    turn.current = i
    // each loop starts from an empty cache, a fresh visitor
    send(LOOP[i % LOOP.length]!, i % LOOP.length === 0)
  })
  const touch = () => {
    auto.stop()
    turn.current = -1
  }

  const busy = rows[0]?.from === 'pending'

  return (
    <Figure caption='Both ends run in this tab. The handler and the string it returns are the real ones.'>
      <div ref={auto.ref}>
        <div {...stylex.props(s.chrome)}>
          <span aria-hidden='true' {...stylex.props(s.lights)}>
            <i {...stylex.props(s.light)} />
            <i {...stylex.props(s.light)} />
            <i {...stylex.props(s.light)} />
          </span>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              touch()
              send(draft)
            }}
            {...stylex.props(s.bar)}
          >
            <span {...stylex.props(s.prefix)}>/avatar?name=</span>
            <input
              value={draft}
              onChange={(e) => {
                touch()
                setDraft(e.target.value)
              }}
              onFocus={touch}
              aria-label='Name in the URL'
              spellCheck={false}
              enterKeyHint='go'
              {...stylex.props(s.input)}
            />
            <button type='submit' aria-label='Go' {...stylex.props(s.go)}>
              ↵
            </button>
          </form>
        </div>

        <div {...stylex.props(s.view)}>
          <motion.div
            initial={false}
            animate={{ opacity: busy ? 0.35 : 1 }}
            transition={reduce ? NONE : { duration: 0.2, ease: CURVE }}
          >
            <Shown svg={draw(shown)} size={88} />
          </motion.div>
          <div {...stylex.props(s.chips)}>
            {CHIPS.map((c) => (
              <motion.button
                key={c}
                type='button'
                aria-label={`Request ${c}`}
                whileTap={{ scale: reduce ? 1 : 0.92 }}
                onClick={() => {
                  touch()
                  send(c)
                }}
                {...stylex.props(s.chip)}
              >
                <FaceChip name={c} size={22} />
                {c}
              </motion.button>
            ))}
          </div>
        </div>

        <div {...stylex.props(s.panel)} role='log' aria-label='Network'>
          <div {...stylex.props(s.row, s.headRow)}>
            <span>Name</span>
            <span>Status</span>
            <span {...stylex.props(s.size)}>Size</span>
          </div>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.id}
                layout='position'
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={reduce ? NONE : LAND}
                {...stylex.props(s.row, r.from === 'cache' && s.rowHit)}
              >
                <span {...stylex.props(s.name)}>{path(r.name).slice(1)}</span>
                <span {...stylex.props(r.from === 'pending' && s.dim)}>
                  {r.from === 'pending' ? 'pending' : '200'}
                </span>
                <span {...stylex.props(s.size)}>
                  {r.from === 'pending' ? (
                    <span {...stylex.props(s.track)}>
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={
                          reduce ? NONE : { duration: TRIP, ease: CURVE }
                        }
                        {...stylex.props(s.fill)}
                      />
                    </span>
                  ) : r.from === 'cache' ? (
                    '(disk cache)'
                  ) : (
                    `${bytes(draw(r.name)).toLocaleString('en')} B`
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Figure>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const RULE = {
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

const s = stylex.create({
  chrome: {
    ...RULE,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderBottomWidth: '1px',
    backgroundColor: sheet['--wash'],
  },
  lights: { display: { default: 'flex', [SMALL]: 'none' }, gap: '6px' },
  light: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: sheet['--rule-strong'],
  },
  bar: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    height: '30px',
    paddingLeft: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: sheet['--rule'], ':focus-within': sheet['--fg'] },
    borderRadius: '999px',
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    backgroundColor: sheet['--page'],
  },
  prefix: { color: sheet['--quiet'], whiteSpace: 'nowrap' },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
    borderWidth: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: sheet['--fg'],
    backgroundColor: 'transparent',
    outline: 'none',
  },
  go: {
    width: '28px',
    height: '24px',
    marginRight: '2px',
    borderWidth: 0,
    borderRadius: '999px',
    color: sheet['--page'],
    backgroundColor: sheet['--fg'],
    cursor: 'pointer',
  },
  view: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px 16px 18px',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '30px',
    paddingLeft: '4px',
    paddingRight: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule'],
      [HOVER]: { default: null, ':hover': sheet['--rule-strong'] },
    },
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '13px',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    cursor: 'pointer',
  },
  panel: {
    ...RULE,
    borderTopWidth: '1px',
    minHeight: `${(ROWS + 1) * 29}px`,
    fontFamily: fonts['--mono'],
    fontSize: { default: '12px', [SMALL]: '11px' },
    backgroundColor: sheet['--code-bg'],
  },
  row: {
    ...RULE,
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) 72px 120px',
      [SMALL]: 'minmax(0, 1fr) 56px 96px',
    },
    alignItems: 'center',
    gap: '8px',
    height: '29px',
    paddingInline: '14px',
    borderBottomWidth: '1px',
    color: sheet['--fg'],
  },
  headRow: {
    fontSize: '10.5px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  rowHit: { color: sheet['--soft'] },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dim: { color: sheet['--quiet'] },
  size: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  track: {
    display: 'inline-block',
    position: 'relative',
    width: '64px',
    height: '3px',
    borderRadius: '2px',
    overflow: 'hidden',
    verticalAlign: 'middle',
    backgroundColor: sheet['--rule'],
  },
  fill: {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'left',
    backgroundColor: sheet['--fg'],
  },
})
