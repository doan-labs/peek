/*
 * The React page's figures. The playground lives here; the hydration
 * figure has its own file.
 *
 * The playground is every prop of <Peek>, live, with the JSX for exactly
 * the props that differ from the defaults written underneath. Touch a
 * control and the face glances at it for a beat.
 */
import {
  EXPRESSIONS,
  type Expression,
  type Frame,
  type Gaze,
  Peek,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { FaceChip, Figure, Micro, Roll, Segmented, Stage } from './kit'
import { Range, Toggle } from './react-controls'

export { Hydration } from './react-hydration'

const NAMES = [
  'Linh',
  'Thanh',
  'Alan Turing',
  'Hedy Lamarr',
  'Katherine Johnson',
  'Margaret Hamilton',
  'Radia Perlman',
  'Claude Shannon',
]
const EXPR = Object.keys(EXPRESSIONS) as Expression[]
const FRAMES = ['ink', 'bone', 'paper', 'none'] as const satisfies Frame[]
const GAZES = {
  none: undefined,
  pointer: 'pointer',
  '[-1, 0]': [-1, 0],
  '[1, -1]': [1, -1],
} as const satisfies Record<string, Gaze | 'pointer' | undefined>
type GazeKey = keyof typeof GAZES
const GAZE_LABEL: Partial<Record<GazeKey, string>> = {
  '[-1, 0]': '←',
  '[1, -1]': '↗',
}
const GAZE_NAME: Partial<Record<GazeKey, string>> = {
  '[-1, 0]': 'Look left, [-1, 0]',
  '[1, -1]': 'Look up and right, [1, -1]',
}
const GAZE_KEYS = Object.keys(GAZES) as GazeKey[]
// the riso print starts to show here (svg.ts, PeekOptions.riso)
const RISO_FROM = 120

type Props = {
  name: string
  size: number
  expression: Expression
  frame: Frame
  square: boolean
  riso: boolean
  animate: boolean
  gaze: GazeKey
}

const DEFAULTS: Props = {
  name: 'Linh',
  size: 96,
  expression: 'normal',
  frame: 'ink',
  square: true,
  riso: false,
  animate: false,
  gaze: 'none',
}

/** The JSX for these props, one per line, defaults left out. */
function jsx(p: Props) {
  const name = /["\\]/.test(p.name)
    ? `{${JSON.stringify(p.name)}}`
    : `"${p.name}"`
  const lines = [`  name=${name}`]
  if (p.size !== 64) lines.push(`  size={${p.size}}`)
  if (p.expression !== 'normal') lines.push(`  expression="${p.expression}"`)
  if (p.frame !== 'ink') lines.push(`  frame="${p.frame}"`)
  if (!p.square) lines.push('  square={false}')
  if (p.riso) lines.push('  riso')
  if (p.animate) lines.push('  animate')
  if (p.gaze === 'pointer') lines.push('  gaze="pointer"')
  else if (p.gaze !== 'none') lines.push(`  gaze={${p.gaze}}`)
  return `import { Peek } from '@doan-labs/peek'\n\n<Peek\n${lines.join('\n')}\n/>`
}

export function PropsPlayground() {
  const [p, setP] = useState(DEFAULTS)
  const set = (patch: Partial<Props>) => setP((o) => ({ ...o, ...patch }))
  const reduce = useReducedMotion()

  // the glance: eyes on whatever control was just touched, then back
  const face = useRef<HTMLDivElement>(null)
  const [glance, setGlance] = useState<Gaze | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const look = (e: SyntheticEvent) => {
    const f = face.current?.getBoundingClientRect()
    const c = (e.target as Element).getBoundingClientRect?.()
    if (!f || !c) return
    const dx = c.left + c.width / 2 - (f.left + f.width / 2)
    const dy = c.top + c.height / 2 - (f.top + f.height / 2)
    const m = Math.max(Math.abs(dx), Math.abs(dy), 1)
    const to: Gaze = [
      Math.round((dx / m) * 20) / 20,
      Math.round((dy / m) * 20) / 20,
    ]
    setGlance((g) => (g && g[0] === to[0] && g[1] === to[1] ? g : to))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setGlance(null), 1100)
  }

  const gaze = glance ?? GAZES[p.gaze]
  const faint = p.riso && p.size < RISO_FROM

  return (
    <Figure>
      <div {...stylex.props(s.grid)}>
        <Stage height={300}>
          <div
            ref={face}
            {...stylex.props(
              s.face,
              p.frame !== 'none' && s.edge,
              !p.square && s.round,
            )}
          >
            <Peek
              name={p.name}
              size={p.size}
              expression={p.expression}
              frame={p.frame}
              square={p.square}
              riso={p.riso}
              animate={p.animate}
              gaze={gaze}
            />
          </div>
        </Stage>
        <div
          {...stylex.props(s.panel)}
          onPointerDownCapture={look}
          onFocusCapture={look}
          onInputCapture={look}
        >
          <Row label='name'>
            <input
              value={p.name}
              spellCheck={false}
              aria-label='Name'
              placeholder='Any string'
              onChange={(e) => set({ name: e.target.value })}
              {...stylex.props(s.input)}
            />
            <motion.button
              type='button'
              aria-label='Another name'
              title='Another name'
              whileTap={{ scale: reduce ? 1 : 0.9, rotate: reduce ? 0 : 90 }}
              onClick={() => {
                const rest = NAMES.filter((n) => n !== p.name)
                set({ name: rest[Math.floor(Math.random() * rest.length)] })
              }}
              {...stylex.props(s.icon)}
            >
              <Dice />
            </motion.button>
          </Row>
          <Row label='size' value={<Roll text={`${p.size}px`} />}>
            <Range
              label='Size'
              min={24}
              max={240}
              step={4}
              value={p.size}
              onChange={(size) => set({ size })}
            />
          </Row>
          <Row label='expression' value={p.expression}>
            <fieldset aria-label='Expression' {...stylex.props(s.faces)}>
              {EXPR.map((x) => (
                <motion.button
                  key={x}
                  type='button'
                  title={x}
                  aria-label={x}
                  aria-pressed={x === p.expression}
                  whileHover={{ y: reduce ? 0 : -2 }}
                  whileTap={{ scale: reduce ? 1 : 0.9 }}
                  transition={reduce ? NONE : LAND}
                  onClick={() => set({ expression: x })}
                  {...stylex.props(s.chip, x === p.expression && s.chipOn)}
                >
                  <FaceChip name={p.name} size={26} expression={x} />
                </motion.button>
              ))}
            </fieldset>
          </Row>
          <Row label='frame'>
            <Segmented
              label='Frame'
              options={FRAMES}
              value={p.frame}
              onChange={(frame) => set({ frame })}
            />
          </Row>
          <Row label='gaze'>
            <Segmented
              label='Gaze'
              options={GAZE_KEYS}
              value={p.gaze}
              render={(g) => GAZE_LABEL[g] ?? g}
              name={(g) => GAZE_NAME[g] ?? g}
              // pointer only moves the eyes on a live face
              onChange={(g) =>
                set(g === 'pointer' ? { gaze: g, animate: true } : { gaze: g })
              }
            />
          </Row>
          <div {...stylex.props(s.toggles)}>
            <Toggle
              label='square'
              on={p.square}
              onChange={(square) => set({ square })}
            />
            <Toggle
              label='animate'
              on={p.animate}
              onChange={(animate) =>
                set(
                  !animate && p.gaze === 'pointer'
                    ? { animate, gaze: 'none' }
                    : { animate },
                )
              }
            />
            <Toggle
              label='riso'
              on={p.riso}
              onChange={(riso) => set({ riso })}
            />
          </div>
          {faint ? (
            <button
              type='button'
              onClick={() => set({ size: 160 })}
              {...stylex.props(s.hint)}
            >
              Riso shows from {RISO_FROM}px. Try 160px
            </button>
          ) : null}
        </div>
      </div>
      <div {...stylex.props(s.code)}>
        <CodeBlock code={jsx(p)} lang='tsx' live />
      </div>
    </Figure>
  )
}

function Row({
  label,
  value,
  children,
}: {
  label: string
  value?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div {...stylex.props(s.row)}>
      <div {...stylex.props(s.rowHead)}>
        <Micro>{label}</Micro>
        {value ? <span {...stylex.props(s.value)}>{value}</span> : null}
      </div>
      <div {...stylex.props(s.rowBody)}>{children}</div>
    </div>
  )
}

const Dice = () => (
  <svg
    aria-hidden='true'
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='3' y='3' width='18' height='18' rx='4' />
    <circle cx='8.5' cy='8.5' r='1' fill='currentColor' />
    <circle cx='15.5' cy='15.5' r='1' fill='currentColor' />
    <circle cx='12' cy='12' r='1' fill='currentColor' />
  </svg>
)

const SMALL = '@media (width < 40rem)'
const HOVER = '@media (hover: hover)'
const LINE = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: sheet['--rule'],
} as const

const s = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: { default: 'minmax(0, 1fr) 300px', [SMALL]: '1fr' },
  },
  face: { display: 'inline-flex' },
  // an ink frame on a dark page needs its rim
  edge: { boxShadow: `0 0 0 1px ${sheet['--edge']}` },
  round: { borderRadius: '50%' },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minWidth: 0,
    padding: '16px',
    borderWidth: 0,
    borderLeftWidth: { default: '1px', [SMALL]: 0 },
    borderTopWidth: { default: 0, [SMALL]: '1px' },
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
    backgroundColor: sheet['--wash'],
  },
  row: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  rowHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '8px',
  },
  value: {
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    color: sheet['--fg'],
  },
  rowBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    minHeight: '32px',
  },
  input: {
    ...LINE,
    flexGrow: 1,
    minWidth: 0,
    height: '32px',
    paddingInline: '12px',
    borderRadius: '999px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: sheet['--fg'],
    backgroundColor: sheet['--page'],
    outline: 'none',
    borderColor: {
      default: sheet['--rule'],
      ':focus-visible': sheet['--fg'],
    },
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
  },
  icon: {
    ...LINE,
    display: 'inline-grid',
    placeItems: 'center',
    flexShrink: 0,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: sheet['--page'],
    cursor: 'pointer',
  },
  faces: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
    gap: '4px',
    flexGrow: 1,
    margin: 0,
    padding: 0,
    borderWidth: 0,
  },
  chip: {
    display: 'grid',
    placeItems: 'center',
    height: '34px',
    padding: 0,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--rule-strong'] },
    },
    borderRadius: '10px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  chipOn: {
    borderColor: { default: sheet['--fg'], [HOVER]: sheet['--fg'] },
    backgroundColor: sheet['--page'],
  },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  hint: {
    alignSelf: 'flex-start',
    padding: 0,
    borderWidth: 0,
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    color: sheet['--quiet'],
    textDecoration: 'underline',
    textDecorationColor: sheet['--rule-strong'],
    textUnderlineOffset: '3px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  code: {
    paddingInline: '14px',
    paddingBottom: '14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
})
