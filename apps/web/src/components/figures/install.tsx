/*
 * The Installation page's figures. Install: a terminal, a tab per package
 * manager, the command typing itself out, and a face peeking over the top
 * that cheers when the line is copied. RunsWhere: no box, a face hopping
 * along a line of runtimes, each stop's name drawn as its own face.
 */
import { Peek } from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { ManagerLogo } from '@/components/manager-logo'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { colors, fonts, sheet } from '@/lib/tokens.stylex'
import { FaceChip, Figure, useAutoplay } from './kit'

export const MANAGERS = ['npm', 'bun', 'pnpm', 'yarn'] as const
export type Manager = (typeof MANAGERS)[number]
const VERB: Record<Manager, string> = {
  npm: 'install',
  bun: 'add',
  pnpm: 'add',
  yarn: 'add',
}
export const line = (pm: Manager) => `${pm} ${VERB[pm]} @doanlabs/peek`
const KEY = 0.035

/* ---------- Install ---------- */

export function Install() {
  const [pm, setPm] = useState<Manager>('npm')
  const cmd = line(pm)
  // the whole line on the first paint; a switch types the new one out
  const [shown, setShown] = useState(cmd.length)
  const [cheer, setCheer] = useState(0)
  const reduce = useReducedMotion()
  const group = useId()
  const first = useRef(true)
  const play = useAutoplay<HTMLDivElement>((t) => {
    setPm(MANAGERS[Math.floor(t / 2.6) % MANAGERS.length]!)
  })
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const full = line(pm).length
    if (reduce) return setShown(full)
    let n = 0
    setShown(0)
    const t = setInterval(() => {
      n += 1
      setShown(n)
      if (n >= full) clearInterval(t)
    }, KEY * 1000)
    return () => clearInterval(t)
  }, [pm, reduce])
  useEffect(() => {
    if (!cheer) return
    const t = setTimeout(() => setCheer(0), 1600)
    return () => clearTimeout(t)
  }, [cheer])
  const happy = cheer > 0
  const pick = (v: Manager) => {
    play.stop()
    setPm(v)
  }
  const copy = () => {
    play.stop()
    navigator.clipboard?.writeText(cmd).catch(() => {})
    setCheer((n) => n + 1)
  }
  const typed = cmd.slice(0, shown)
  const [head, ...rest] = typed.split(' ')
  return (
    <Figure bare>
      <div ref={play.ref} {...stylex.props(styles.well)}>
        <motion.span
          aria-hidden='true'
          initial={false}
          animate={{ y: happy ? -18 : 0, rotate: happy ? -8 : 0 }}
          transition={reduce ? NONE : LAND}
          {...stylex.props(styles.peeker)}
        >
          <span {...stylex.props(styles.rise)}>
            <Peek
              name='Peek'
              size={56}
              frame='none'
              title={false}
              gaze={happy ? [0, 0] : 'pointer'}
              expression={happy ? 'excited' : 'curious'}
              animate
            />
          </span>
        </motion.span>
        <div {...stylex.props(styles.term)}>
          <div {...stylex.props(styles.bar)}>
            <span aria-hidden='true' {...stylex.props(styles.lights)}>
              <i {...stylex.props(styles.light)} />
              <i {...stylex.props(styles.light)} />
              <i {...stylex.props(styles.light)} />
            </span>
            <fieldset
              aria-label='Package manager'
              {...stylex.props(styles.tabs)}
            >
              {MANAGERS.map((m) => (
                <button
                  key={m}
                  type='button'
                  aria-pressed={m === pm}
                  onClick={() => pick(m)}
                  {...stylex.props(styles.tab, m === pm && styles.tabOn)}
                >
                  <ManagerLogo pm={m} on={m === pm} />
                  {m}
                  {m === pm ? (
                    <motion.span
                      layoutId={group}
                      transition={reduce ? NONE : LAND}
                      {...stylex.props(styles.underline)}
                    />
                  ) : null}
                </button>
              ))}
            </fieldset>
            <motion.button
              type='button'
              whileTap={{ scale: 0.94 }}
              onClick={copy}
              {...stylex.props(styles.copy)}
            >
              {happy ? 'Copied' : 'Copy'}
            </motion.button>
          </div>
          <pre {...stylex.props(styles.body)}>
            <span aria-hidden='true' {...stylex.props(styles.prompt)}>
              ${' '}
            </span>
            <span {...stylex.props(styles.hidden)}>{cmd}</span>
            <span aria-hidden='true'>
              <span {...stylex.props(styles.cmd)}>{head}</span>
              {rest.length ? ` ${rest.join(' ')}` : ''}
              <span {...stylex.props(styles.caret)} />
            </span>
            {'\n'}
            <span {...stylex.props(styles.comment)}>
              {happy ? '# copied' : '# no runtime dependencies'}
            </span>
          </pre>
        </div>
      </div>
    </Figure>
  )
}

/* ---------- RunsWhere ---------- */

const RUNTIMES = ['Node', 'Bun', 'Deno', 'Edge', 'Browser'] as const
const at = (i: number) => `${(i / (RUNTIMES.length - 1)) * 100}%`

/** toSvg and identify are plain JavaScript: same name, same face, anywhere. */
export function RunsWhere() {
  const [here, setHere] = useState(0)
  const reduce = useReducedMotion()
  const play = useAutoplay<HTMLDivElement>((t) =>
    setHere(Math.floor(t / 1.2) % RUNTIMES.length),
  )
  return (
    <Figure bare>
      <div ref={play.ref} {...stylex.props(styles.runs)}>
        <div {...stylex.props(styles.track)}>
          <motion.span
            aria-hidden='true'
            initial={false}
            animate={{ left: at(here) }}
            transition={reduce ? NONE : LAND}
            {...stylex.props(styles.hopper)}
          >
            <motion.span
              key={here}
              initial={false}
              animate={{ y: [0, -14, 0] }}
              transition={reduce ? NONE : { duration: 0.5, ease: CURVE }}
              {...stylex.props(styles.hopFace)}
            >
              <FaceChip
                name={RUNTIMES[here]!}
                size={40}
                expression='happy'
                animate
              />
            </motion.span>
          </motion.span>
          {RUNTIMES.map((r, i) => (
            <span
              key={r}
              aria-hidden='true'
              {...stylex.props(styles.stop, i === here && styles.stopOn)}
              style={{ left: at(i) }}
            />
          ))}
        </div>
        <fieldset aria-label='Runtime' {...stylex.props(styles.stops)}>
          {RUNTIMES.map((r, i) => (
            <button
              key={r}
              type='button'
              aria-pressed={i === here}
              onClick={() => {
                play.stop()
                setHere(i)
              }}
              {...stylex.props(styles.where, i === here && styles.whereOn)}
              style={{ left: at(i) }}
            >
              {r}
            </button>
          ))}
        </fieldset>
        <code {...stylex.props(styles.call)}>
          toSvg('{RUNTIMES[here]}'){' '}
          <span {...stylex.props(styles.same)}>same bytes</span>
        </code>
      </div>
    </Figure>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const STILL = '@media (prefers-reduced-motion: reduce)'

const rise = stylex.keyframes({
  '0%, 100%': { transform: 'translateY(6px)' },
  '50%': { transform: 'translateY(0)' },
})
const blink = stylex.keyframes({
  '0%, 49%': { opacity: 1 },
  '50%, 100%': { opacity: 0 },
})

const styles = stylex.create({
  well: { position: 'relative', paddingTop: '44px' },
  peeker: {
    position: 'absolute',
    // the face sits behind the terminal, eyes above its top edge
    top: '-22px',
    right: { default: '40px', [SMALL]: '20px' },
    display: 'inline-flex',
  },
  rise: {
    display: 'inline-flex',
    animationName: { default: rise, [STILL]: 'none' },
    animationDuration: '3.4s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  // a terminal stays dark in both schemes
  term: {
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
    borderRadius: '14px',
    color: colors['--bone'],
    backgroundColor: colors['--ground'],
    boxShadow: `0 0 0 1px ${sheet['--rule-strong']}`,
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingInline: '14px',
    height: '40px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors['--faint'],
  },
  lights: {
    display: { default: 'inline-flex', [SMALL]: 'none' },
    gap: '6px',
  },
  light: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: colors['--faint'],
  },
  tabs: {
    display: 'inline-flex',
    gap: '2px',
    flex: 1,
    minWidth: 0,
    height: '100%',
    margin: 0,
    padding: 0,
    borderWidth: 0,
  },
  tab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
    paddingInline: '10px',
    borderWidth: 0,
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    color: {
      default: colors['--muted'],
      [HOVER]: { default: null, ':hover': colors['--bone'] },
    },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: {
      default: null,
      ':focus-visible': `inset 0 0 0 1px ${colors['--muted']}`,
    },
    transitionProperty: 'color',
    transitionDuration: '0.15s',
  },
  tabOn: { color: colors['--bone'] },
  underline: {
    position: 'absolute',
    left: '8px',
    right: '8px',
    bottom: '-1px',
    height: '2px',
    borderRadius: '2px',
    backgroundColor: colors['--signal'],
  },
  copy: {
    height: '26px',
    paddingInline: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors['--faint'],
    borderRadius: '999px',
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    color: colors['--bone'],
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': colors['--faint'] },
    },
    cursor: 'pointer',
    outline: 'none',
    boxShadow: {
      default: null,
      ':focus-visible': `0 0 0 2px ${colors['--muted']}`,
    },
    transitionProperty: 'background-color',
    transitionDuration: '0.15s',
  },
  body: {
    margin: 0,
    padding: '18px 18px 20px',
    fontFamily: fonts['--mono'],
    fontSize: { default: '14px', [SMALL]: '12.5px' },
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  prompt: { color: colors['--signal'] },
  cmd: { color: colors['--fog'] },
  caret: {
    display: 'inline-block',
    width: '0.6em',
    height: '1.15em',
    marginLeft: '2px',
    verticalAlign: 'text-bottom',
    backgroundColor: colors['--bone'],
    animationName: { default: blink, [STILL]: 'none' },
    animationDuration: '1.1s',
    animationTimingFunction: 'steps(1)',
    animationIterationCount: 'infinite',
  },
  comment: { color: colors['--muted'] },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  runs: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    paddingInline: { default: '36px', [SMALL]: '28px' },
  },
  track: {
    position: 'relative',
    alignSelf: 'stretch',
    height: '64px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'dashed',
    borderBottomColor: sheet['--rule-strong'],
  },
  hopper: {
    position: 'absolute',
    bottom: '6px',
    display: 'inline-flex',
    marginLeft: '-20px',
  },
  hopFace: { display: 'inline-flex' },
  stop: {
    position: 'absolute',
    bottom: '-4px',
    width: '7px',
    height: '7px',
    marginLeft: '-3.5px',
    borderRadius: '50%',
    backgroundColor: sheet['--rule-strong'],
    transitionProperty: 'background-color',
    transitionDuration: '0.2s',
  },
  stopOn: { backgroundColor: sheet['--red'] },
  stops: {
    position: 'relative',
    alignSelf: 'stretch',
    height: '28px',
    margin: 0,
    padding: 0,
    borderWidth: 0,
  },
  where: {
    position: 'absolute',
    top: '4px',
    transform: 'translateX(-50%)',
    paddingBlock: '2px',
    paddingInline: '4px',
    borderWidth: 0,
    borderRadius: '6px',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    letterSpacing: '0.04em',
    color: {
      default: sheet['--quiet'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: {
      default: null,
      ':focus-visible': `0 0 0 1px ${sheet['--fg']}`,
    },
    transitionProperty: 'color',
    transitionDuration: '0.15s',
  },
  whereOn: { color: sheet['--fg'] },
  call: {
    marginTop: '6px',
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    color: sheet['--fg'],
  },
  same: { marginLeft: '8px', color: sheet['--quiet'] },
})
