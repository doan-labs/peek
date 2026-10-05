/*
 * The state page's figures: what a face does, as opposed to what it is.
 * Expressions: the 11 faces are the picker, the big one wears the pick and
 * the bars show which channels it moves. GazePad (bare, in the prose): a pad
 * steers the eyes, or "pointer" hands them the real cursor. Alive
 * (state-alive.tsx) puts the face with and without `animate` side by side.
 */
import {
  type Channel,
  EXPRESSIONS,
  type Expression,
  GROUPS,
  Peek,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { type KeyboardEvent, type PointerEvent, useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Figure, Micro, Segmented, Stage, useAutoplay } from './kit'

export { Alive } from './state-alive'

const EXPRS = Object.keys(EXPRESSIONS) as Expression[]

/** True when `e` sets `c` away from where `normal` rests it. */
const moves = (e: Expression, c: Channel) =>
  EXPRESSIONS[e][c] !== EXPRESSIONS.normal[c]

/** The 11 expressions: the faces themselves are the picker. */
export function Expressions() {
  const [expr, setExpr] = useState<Expression>('happy')
  const reduce = useReducedMotion()
  const auto = useAutoplay<HTMLDivElement>((t) => {
    setExpr(EXPRS[(Math.floor(t / 2.6) + 1) % EXPRS.length]!)
  })
  const pick = (e: Expression) => {
    auto.stop()
    setExpr(e)
  }
  return (
    <Figure>
      <div ref={auto.ref}>
        <Stage height={250}>
          <div {...stylex.props(s.split)}>
            <Peek
              name='Linh'
              expression={expr}
              animate
              size={160}
              frame='none'
              {...stylex.props(s.big)}
            />
            <div {...stylex.props(s.channels)}>
              <Micro>Channels it moves</Micro>
              {Object.entries(GROUPS).map(([g, chans]) => (
                <div key={g} {...stylex.props(s.group)}>
                  <span {...stylex.props(s.groupName)}>{g}</span>
                  <span {...stylex.props(s.cells)}>
                    {chans.map((c) => {
                      const on = moves(expr, c)
                      return (
                        <span key={c} title={c} {...stylex.props(s.cell)}>
                          <motion.span
                            initial={false}
                            animate={{
                              scaleY: on ? 1 : 0,
                              opacity: on ? 1 : 0,
                            }}
                            transition={reduce ? NONE : LAND}
                            {...stylex.props(s.fill)}
                          />
                        </span>
                      )
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Stage>
        <fieldset aria-label='Expression' {...stylex.props(s.picker)}>
          {EXPRS.map((e) => {
            const on = e === expr
            return (
              <button
                key={e}
                type='button'
                aria-pressed={on}
                onClick={() => pick(e)}
                {...stylex.props(s.pick)}
              >
                <motion.span
                  initial={false}
                  animate={{ scale: on ? 1.3 : 1, y: on ? -4 : 0 }}
                  whileHover={on ? undefined : { y: -3 }}
                  transition={reduce ? NONE : LAND}
                  {...stylex.props(s.pickFace)}
                >
                  <Peek
                    name='Linh'
                    expression={e}
                    size={52}
                    frame='none'
                    title={false}
                    {...stylex.props(s.pickSvg)}
                  />
                </motion.span>
                <span {...stylex.props(s.pickName, on && s.pickNameOn)}>
                  {e}
                </span>
              </button>
            )
          })}
        </fieldset>
      </div>
      <div {...stylex.props(s.code)}>
        <CodeBlock
          live
          code={`<Peek name="Linh" expression="${expr}" animate />`}
        />
      </div>
    </Figure>
  )
}

type Mode = 'fixed' | 'pointer'
const LOOKERS = ['Linh', 'Thanh', 'Alan Turing', 'Hedy Lamarr']
const SIZES = [116, 76, 76, 60]
const PAD = 180
const clamp = (v: number) => Math.max(-1, Math.min(1, v))
const r2 = (v: number) => Math.round(v * 100) / 100

/** A pad for gaze: drag the knob, or arrow keys, and the faces look there. */
export function GazePad() {
  const [g, setG] = useState<[number, number]>([0.42, -0.1])
  const [mode, setMode] = useState<Mode>('fixed')
  const [hot, setHot] = useState<number | null>(null)
  const reduce = useReducedMotion()
  const auto = useAutoplay<HTMLDivElement>((t) => {
    // a slow figure eight across the pad
    setG([r2(0.8 * Math.sin(t * 0.7)), r2(0.6 * Math.sin(t * 1.4))])
  })
  const set = (x: number, y: number) => {
    auto.stop()
    setMode('fixed')
    setG([r2(clamp(x)), r2(clamp(y))])
  }
  const at = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      ((e.clientY - r.top) / r.height) * 2 - 1,
    )
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.shiftKey ? 0.25 : 0.1
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-d, 0],
      ArrowRight: [d, 0],
      ArrowUp: [0, -d],
      ArrowDown: [0, d],
    }
    const by = step[e.key]
    if (e.key === 'Home') set(0, 0)
    else if (by) set(g[0] + by[0], g[1] + by[1])
    else return
    e.preventDefault()
  }
  const follow = mode === 'pointer'
  const code = follow
    ? '<Peek name="Linh" gaze="pointer" animate />'
    : `<Peek name="Linh" gaze={[${g[0]}, ${g[1]}]} animate />`
  return (
    <Figure bare>
      <div ref={auto.ref} {...stylex.props(s.gazeRow)}>
        <div {...stylex.props(s.padCol)}>
          <div
            role='slider'
            tabIndex={0}
            aria-label='Gaze'
            aria-valuemin={-1}
            aria-valuemax={1}
            aria-valuenow={g[0]}
            aria-valuetext={`x ${g[0]}, y ${g[1]}`}
            onKeyDown={key}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              at(e)
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e)
            }}
            {...stylex.props(s.pad)}
          >
            <span {...stylex.props(s.axis, s.axisX, follow && s.gone)} />
            <span {...stylex.props(s.axis, s.axisY, follow && s.gone)} />
            {follow ? (
              <span {...stylex.props(s.padNote)}>
                <Micro>Off the pad, anywhere</Micro>
              </span>
            ) : (
              <span {...stylex.props(s.knob, s.knobAt(g[0], g[1]))} />
            )}
          </div>
          <Segmented
            label='Gaze mode'
            options={['fixed', 'pointer'] as const}
            value={mode}
            onChange={(m) => {
              auto.stop()
              setHot(null)
              setMode(m)
            }}
            render={(m) => (
              <span {...stylex.props(s.mono)}>
                {m === 'fixed' ? '[x, y]' : '"pointer"'}
              </span>
            )}
          />
        </div>
        <div {...stylex.props(s.lookers)}>
          {LOOKERS.map((n, i) => {
            const happy = follow && hot === i
            return (
              <motion.div
                key={n}
                initial={false}
                animate={{ scale: happy ? 1.1 : 1, y: happy ? -4 : 0 }}
                transition={reduce ? NONE : LAND}
                onPointerEnter={() => follow && setHot(i)}
                onPointerDown={() => follow && setHot(i)}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') setHot(null)
                }}
                {...stylex.props(i === 3 && s.wide)}
              >
                <Peek
                  name={n}
                  gaze={follow ? 'pointer' : g}
                  expression={happy ? 'happy' : 'normal'}
                  animate
                  size={SIZES[i]}
                  frame='none'
                  {...stylex.props(s.looker(SIZES[i]!))}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
      <CodeBlock live code={code} />
    </Figure>
  )
}

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'

const s = stylex.create({
  split: {
    display: 'grid',
    gridTemplateColumns: { default: '1fr 220px', [SMALL]: '1fr' },
    alignItems: 'center',
    justifyItems: 'center',
    gap: { default: '32px', [SMALL]: '20px' },
    width: '100%',
    padding: '24px',
  },
  big: { width: '160px', height: '160px' },
  channels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    justifySelf: { default: 'stretch', [SMALL]: 'center' },
  },
  group: {
    display: 'grid',
    gridTemplateColumns: '56px 1fr',
    alignItems: 'center',
    gap: '10px',
  },
  groupName: {
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    color: sheet['--soft'],
  },
  cells: { display: 'flex', gap: '4px' },
  cell: {
    position: 'relative',
    width: '22px',
    height: '14px',
    borderRadius: '3px',
    overflow: 'hidden',
    backgroundColor: sheet['--wash'],
    boxShadow: `inset 0 0 0 1px ${sheet['--rule']}`,
  },
  fill: {
    position: 'absolute',
    inset: 0,
    backgroundColor: sheet['--fg'],
    transformOrigin: 'bottom',
  },
  picker: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(11, minmax(0, 1fr))',
      [SMALL]: 'repeat(6, minmax(0, 1fr))',
    },
    rowGap: '6px',
    margin: 0,
    minWidth: 0,
    padding: '16px 8px 10px',
    borderWidth: 0,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
    backgroundColor: sheet['--wash'],
  },
  pick: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: 0,
    paddingBlock: '4px',
    borderWidth: 0,
    borderRadius: '10px',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: {
      default: 'none',
      ':focus-visible': `inset 0 0 0 2px ${sheet['--rule-strong']}`,
    },
  },
  pickFace: { display: 'block', transformOrigin: '50% 100%' },
  pickSvg: { display: 'block', width: '52px', height: '52px' },
  pickName: {
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    color: {
      default: sheet['--quiet'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    transitionProperty: 'color',
    transitionDuration: '0.15s',
  },
  pickNameOn: { color: sheet['--red'], fontWeight: 600 },
  code: { padding: '0 14px 14px' },
  mono: { fontFamily: fonts['--mono'], fontSize: '12.5px' },
  gazeRow: {
    display: 'grid',
    gridTemplateColumns: { default: `${PAD}px 1fr`, [SMALL]: '1fr' },
    alignItems: 'center',
    justifyItems: 'center',
    gap: { default: '36px', [SMALL]: '24px' },
  },
  padCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  pad: {
    position: 'relative',
    width: `${PAD}px`,
    height: `${PAD}px`,
    borderRadius: '18px',
    backgroundColor: sheet['--wash'],
    backgroundImage: `radial-gradient(${sheet['--rule-strong']} 1px, transparent 1.2px)`,
    backgroundSize: '12px 12px',
    backgroundPosition: '6px 6px',
    cursor: 'crosshair',
    touchAction: 'none',
    outline: 'none',
    boxShadow: {
      default: `inset 0 0 0 1px ${sheet['--rule']}`,
      ':focus-visible': `inset 0 0 0 1px ${sheet['--fg']}, 0 0 0 3px ${sheet['--rule']}`,
    },
  },
  axis: { position: 'absolute', backgroundColor: sheet['--rule-strong'] },
  gone: { opacity: 0 },
  axisX: { left: 0, right: 0, top: '50%', height: '1px' },
  axisY: { top: 0, bottom: 0, left: '50%', width: '1px' },
  padNote: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    paddingInline: '28px',
    textAlign: 'center',
  },
  knob: {
    position: 'absolute',
    left: '-11px',
    top: '-11px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: sheet['--page'],
    backgroundColor: sheet['--red'],
    boxShadow: `0 0 0 1px ${sheet['--red']}`,
    pointerEvents: 'none',
  },
  knobAt: (x: number, y: number) => ({
    transform: `translate(${((x + 1) * PAD) / 2}px, ${((y + 1) * PAD) / 2}px)`,
  }),
  wide: { display: { default: 'block', [SMALL]: 'none' } },
  lookers: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: '14px',
  },
  looker: (px: number) => ({
    display: 'block',
    width: `${px}px`,
    height: `${px}px`,
  }),
})
