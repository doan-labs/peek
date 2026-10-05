/*
 * What `animate` adds: the same face without and with it, split down the
 * middle and stepping through expressions together. The whole stage is the
 * control: tap it for the next one. Under the animate side, a row of faces
 * on the same shared loop.
 */
import { type Expression, Peek } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion } from 'motion/react'
import { useState } from 'react'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Micro, Roll, useAutoplay } from './kit'

const CYCLE: Expression[] = [
  'normal',
  'happy',
  'curious',
  'surprised',
  'sleepy',
]
const NAME = 'Linh'
const ROW = ['Thanh', 'Alan', 'Katherine', 'Linus', 'Margaret', 'Dennis']

export function Alive() {
  const [i, setI] = useState(1)
  const auto = useAutoplay<HTMLButtonElement>((t) => {
    setI(Math.floor(t / 2.8) + 1)
  })
  const expr = CYCLE[i % CYCLE.length]!
  return (
    <figure {...stylex.props(s.figure)}>
      <motion.button
        ref={auto.ref}
        type='button'
        aria-label='Next expression'
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          auto.stop()
          setI((v) => v + 1)
        }}
        {...stylex.props(s.stage)}
      >
        <span {...stylex.props(s.head)}>
          <span {...stylex.props(s.expr)}>
            expression=&quot;
            <Roll text={expr} />
            &quot;
          </span>
          <Micro>Tap for the next</Micro>
        </span>
        <span {...stylex.props(s.halves)}>
          {(['static', 'animate'] as const).map((k) => {
            const live = k === 'animate'
            return (
              <span key={k} {...stylex.props(s.half, live && s.halfLive)}>
                <span {...stylex.props(s.tag, live && s.tagOn)}>
                  {live ? '<Peek animate />' : '<Peek />'}
                </span>
                <Peek
                  name={NAME}
                  expression={expr}
                  animate={live}
                  size={128}
                  frame='none'
                  {...stylex.props(s.big)}
                />
                {live ? (
                  <span {...stylex.props(s.row)}>
                    {ROW.map((n) => (
                      <Peek
                        key={n}
                        name={n}
                        expression={expr}
                        animate
                        size={30}
                        frame='none'
                        title={false}
                        {...stylex.props(s.tiny)}
                      />
                    ))}
                  </span>
                ) : (
                  <span {...stylex.props(s.note)}>snaps, holds still</span>
                )}
              </span>
            )
          })}
        </span>
      </motion.button>
    </figure>
  )
}

const SMALL = '@media (width < 40rem)'

const s = stylex.create({
  figure: { marginTop: '28px', marginBottom: '8px', marginInline: 0 },
  stage: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: 0,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule'],
      '@media (hover: hover)': {
        default: null,
        ':hover': sheet['--rule-strong'],
      },
    },
    borderRadius: '16px',
    overflow: 'hidden',
    fontFamily: 'inherit',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    cursor: 'pointer',
    outline: 'none',
    boxShadow: {
      default: 'none',
      ':focus-visible': `0 0 0 3px ${sheet['--rule']}`,
    },
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  expr: {
    display: 'inline-flex',
    fontFamily: fonts['--mono'],
    fontSize: '13px',
    color: sheet['--code-str'],
  },
  halves: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
  },
  half: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: { default: '20px 16px 18px', [SMALL]: '16px 8px 14px' },
  },
  halfLive: {
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: sheet['--rule'],
    backgroundImage: `radial-gradient(${sheet['--rule-strong']} 1px, transparent 1.2px)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '8px 8px',
  },
  big: {
    width: { default: '128px', [SMALL]: '104px' },
    height: { default: '128px', [SMALL]: '104px' },
  },
  tag: {
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    whiteSpace: 'nowrap',
    paddingInline: '8px',
    paddingBlock: '3px',
    borderRadius: '999px',
    color: sheet['--soft'],
    backgroundColor: sheet['--chip'],
  },
  tagOn: { color: sheet['--fg'] },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '2px',
    minHeight: '30px',
  },
  tiny: { width: '30px', height: '30px' },
  note: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '30px',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    color: sheet['--quiet'],
  },
})
