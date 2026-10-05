/*
 * The identity page's versions figure. The hash machine lives in its own
 * file, identity-hash.tsx.
 */
import { FACES, LATEST, Peek, tidy, VERSIONS } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { fnv1a, work } from './identity-hash'
import { Figure, Micro, useAutoplay } from './kit'

export { HashMachine } from './identity-hash'

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'

/* ---------- versions ---------- */

const PEOPLE = ['Linh', 'Thanh', 'Alan Turing']
const FACE_LIST = Object.keys(FACES)
const NOW = VERSIONS[LATEST]!.face

export function Versions() {
  const [who, setWho] = useState(PEOPLE[0]!)
  const [grown, setGrown] = useState(false)
  const reduce = useReducedMotion()
  const auto = useAutoplay<HTMLDivElement>((t) => {
    const beat = Math.floor(Math.max(0, t) / 2.6)
    setGrown(beat % 2 === 1)
    setWho(PEOPLE[Math.floor(beat / 2) % PEOPLE.length]!)
  })
  const key = tidy(who)
  const pinned = work(key, 'face')
  // a next version that does not exist: its seed and modulus, sketched
  const ghostI =
    fnv1a(`peek@${LATEST + 1}:face:${key}`) % (FACE_LIST.length + 1)
  const t = reduce ? NONE : LAND
  const next = () => {
    auto.stop()
    setWho(PEOPLE[(PEOPLE.indexOf(who) + 1) % PEOPLE.length]!)
  }

  return (
    <Figure
      caption={`Lists only grow at the end, and a version caps how far into each it reads, so a peek@${LATEST} face keeps its picks forever.`}
    >
      <div ref={auto.ref} {...stylex.props(styles.vStage)}>
        <motion.button
          type='button'
          onClick={next}
          aria-label={`${who}, next name`}
          whileTap={{ scale: reduce ? 1 : 0.97 }}
          {...stylex.props(styles.card)}
        >
          <span {...stylex.props(styles.tag)}>peek@{LATEST}</span>
          <motion.span
            key={who}
            initial={{ scale: 0.9, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={t}
            {...stylex.props(styles.cardFace)}
          >
            <Peek name={who} version={LATEST} size={88} frame='none' />
          </motion.span>
          <span {...stylex.props(styles.cardName)}>{who}</span>
          <code {...stylex.props(styles.mono)}>version={`{${LATEST}}`}</code>
          <span {...stylex.props(styles.tap)}>tap for another name</span>
        </motion.button>
        <div {...stylex.props(styles.listCol)}>
          <Micro>face list, append-only</Micro>
          <div {...stylex.props(styles.cells)}>
            {FACE_LIST.map((f, i) => (
              <span
                key={f}
                {...stylex.props(styles.cell, i === pinned.i && styles.cellOn)}
              >
                {/* the option is the silhouette, so the whole face, uncropped */}
                <Peek
                  name={who}
                  face={f as never}
                  size={30}
                  frame='none'
                  title={false}
                />
                <span {...stylex.props(styles.cellLabel)}>{i}</span>
              </span>
            ))}
            <motion.button
              type='button'
              aria-pressed={grown}
              aria-label='Append a face to the list'
              onClick={() => {
                auto.stop()
                setGrown(!grown)
              }}
              whileTap={{ scale: reduce ? 1 : 0.94 }}
              {...stylex.props(styles.cell, styles.cellNew)}
            >
              <AnimatePresence initial={false} mode='popLayout'>
                <motion.span
                  key={String(grown)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={t}
                  {...stylex.props(styles.q)}
                >
                  {grown ? '?' : '+'}
                </motion.span>
              </AnimatePresence>
              <span {...stylex.props(styles.cellLabel)}>
                {grown ? FACE_LIST.length : 'grow'}
              </span>
            </motion.button>
          </div>
          <div {...stylex.props(styles.lines)}>
            <code {...stylex.props(styles.mono)}>
              peek@{LATEST} · %{NOW} = {pinned.i} →{' '}
              <b {...stylex.props(styles.strong)}>{pinned.pick}</b>
            </code>
            <AnimatePresence initial={false}>
              {grown ? (
                <motion.code
                  key='ghost'
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={t}
                  {...stylex.props(styles.mono, styles.ghostLine)}
                >
                  <span {...stylex.props(styles.hypo)}>hypothetical</span>
                  peek@{LATEST + 1} · %{FACE_LIST.length + 1} = {ghostI} →{' '}
                  {FACE_LIST[ghostI] ?? 'the new face'}
                </motion.code>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Figure>
  )
}

const styles = stylex.create({
  vStage: {
    display: 'flex',
    flexDirection: { default: 'row', [SMALL]: 'column' },
    alignItems: { default: 'center', [SMALL]: 'stretch' },
    gap: '22px',
    padding: { default: '22px 20px', [SMALL]: '16px 12px' },
    backgroundImage: `radial-gradient(${sheet['--rule-strong']} 1px, transparent 1.2px)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '8px 8px',
  },
  card: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: { default: '168px', [SMALL]: 'auto' },
    padding: '22px 14px 14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule-strong'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    borderRadius: '14px',
    backgroundColor: sheet['--page'],
    fontFamily: 'inherit',
    cursor: 'pointer',
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  tag: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    paddingInline: '7px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    color: sheet['--page'],
    backgroundColor: sheet['--fg'],
  },
  cardFace: { display: 'inline-flex' },
  tap: { fontSize: '11px', color: sheet['--quiet'] },
  cardName: { fontSize: '14px', fontWeight: 500, color: sheet['--fg'] },
  mono: {
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    color: sheet['--soft'],
  },
  strong: { fontWeight: 600, color: sheet['--fg'] },
  listCol: {
    minWidth: 0,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cells: { display: 'flex', alignItems: 'stretch' },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    width: '54px',
    paddingBlock: '8px 4px',
    marginRight: '4px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
    borderRadius: '10px',
    backgroundColor: sheet['--page'],
    transitionProperty: 'border-color',
    transitionDuration: '0.2s',
  },
  cellOn: { borderColor: sheet['--fg'] },
  cellNew: {
    borderStyle: 'dashed',
    borderColor: {
      default: sheet['--rule-strong'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  q: {
    display: 'grid',
    placeItems: 'center',
    height: '30px',
    fontFamily: fonts['--mono'],
    fontSize: '16px',
    color: sheet['--quiet'],
  },
  cellLabel: {
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    color: sheet['--quiet'],
  },
  lines: { display: 'flex', flexDirection: 'column', gap: '6px' },
  ghostLine: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  hypo: {
    paddingInline: '6px',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: sheet['--rule-strong'],
    borderRadius: '999px',
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
})
