/*
 * The React page's figures. The playground lives here; the hydration
 * figure has its own file.
 *
 * The playground is every prop of <Peek>, live, with the code for exactly
 * the props that differ from the defaults written underneath, in React, Vue
 * or Svelte. Touch a
 * control and the face glances at it for a beat.
 */
import {
  ACCESSORIES,
  EXPRESSIONS,
  type Expression,
  type Eyewear,
  type Frame,
  type Gaze,
  type Headwear,
  type Neckwear,
  Peek,
  toSvg,
  VARIANTS,
  type Variant,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { type Framework, FrameworkLogo } from '@/components/framework-logo'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { wardrobeFor } from '@/lib/wardrobe'
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
  variant: Variant
  eyewear: Eyewear
  headwear: Headwear
  neckwear: Neckwear
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
  variant: 'peek',
  ...wardrobeFor('Linh'),
  size: 96,
  expression: 'normal',
  frame: 'ink',
  square: true,
  riso: false,
  animate: false,
  gaze: 'none',
}

const FILE: Record<Framework, string> = {
  react: 'App.tsx',
  vue: 'App.vue',
  svelte: 'App.svelte',
}
const FRAMEWORK_NAME: Record<Framework, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
}

/** The code for these props in one framework, one prop per line, defaults
 * left out. JSX and Svelte bind as `{x}`, Vue as `:prop="x"`. */
function source(p: Props, fw: Framework) {
  const bind = (k: string, v: string) =>
    fw === 'vue' ? `:${k}="${v}"` : `${k}={${v}}`
  const name = !/["\\]/.test(p.name)
    ? `name="${p.name}"`
    : fw === 'vue'
      ? `name="${p.name.replaceAll('"', '&quot;')}"`
      : bind('name', JSON.stringify(p.name))
  const props = [name]
  if (p.variant !== 'peek') props.push(`variant="${p.variant}"`)
  for (const slot of ['eyewear', 'headwear', 'neckwear'] as const)
    if (p[slot] !== 'none') props.push(`${slot}="${p[slot]}"`)
  if (p.size !== 64) props.push(bind('size', String(p.size)))
  if (p.expression !== 'normal') props.push(`expression="${p.expression}"`)
  if (p.frame !== 'ink') props.push(`frame="${p.frame}"`)
  if (!p.square) props.push(bind('square', 'false'))
  if (p.riso) props.push('riso')
  if (p.animate) props.push('animate')
  if (p.gaze === 'pointer') props.push('gaze="pointer"')
  else if (p.gaze !== 'none') props.push(bind('gaze', p.gaze))
  const pad = fw === 'vue' ? '    ' : '  '
  const tag = `<Peek\n${props.map((l) => pad + l).join('\n')}\n${pad.slice(2)}/>`
  if (fw === 'vue')
    return `<script setup>\nimport { Peek } from '@doan-labs/peek/vue'\n</script>\n\n<template>\n  ${tag}\n</template>`
  if (fw === 'svelte')
    return `<script>\n  import { Peek } from '@doan-labs/peek/svelte'\n</script>\n\n${tag}`
  return `import { Peek } from '@doan-labs/peek'\n\n${tag}`
}

export function PropsPlayground() {
  const [p, setP] = useState(DEFAULTS)
  const [fw, setFw] = useState<Framework>('react')
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

  // the face as a file, exactly as set: toSvg is <Peek> without the motion
  const [saved, setSaved] = useState(false)
  const download = () => {
    const fixed = GAZES[p.gaze]
    const svg = toSvg(p.name, {
      variant: p.variant,
      eyewear: p.eyewear,
      headwear: p.headwear,
      neckwear: p.neckwear,
      size: p.size,
      expression: p.expression,
      frame: p.frame,
      square: p.square,
      riso: p.riso,
      gaze: typeof fixed === 'object' ? fixed : undefined,
    })
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${
      p.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'peek'
    }.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
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
              variant={p.variant}
              eyewear={p.eyewear}
              headwear={p.headwear}
              neckwear={p.neckwear}
              size={p.size}
              expression={p.expression}
              frame={p.frame}
              square={p.square}
              riso={p.riso}
              animate={p.animate}
              gaze={gaze}
            />
          </div>
          <motion.button
            type='button'
            whileTap={{ scale: reduce ? 1 : 0.94 }}
            onClick={download}
            aria-label={`Download ${p.name || 'this'} face as SVG`}
            {...stylex.props(s.download)}
          >
            <svg
              viewBox='0 0 16 16'
              aria-hidden='true'
              {...stylex.props(s.downloadIcon)}
            >
              <path d='M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10' />
            </svg>
            {saved ? 'Saved' : 'SVG'}
          </motion.button>
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
          <Row label='variant'>
            <Segmented
              label='Variant'
              options={VARIANTS}
              value={p.variant}
              onChange={(variant) => set({ variant })}
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
                  <FaceChip
                    name={p.name}
                    size={32}
                    round={false}
                    full
                    expression={x}
                    variant={p.variant}
                    eyewear={p.eyewear}
                    headwear={p.headwear}
                    neckwear={p.neckwear}
                  />
                </motion.button>
              ))}
            </fieldset>
          </Row>
          <Row label='eyewear'>
            <Segmented
              label='Eyewear'
              options={ACCESSORIES.eyewear}
              value={p.eyewear}
              onChange={(eyewear) => set({ eyewear })}
            />
          </Row>
          <Row label='headwear'>
            <Segmented
              label='Headwear'
              options={ACCESSORIES.headwear}
              value={p.headwear}
              onChange={(headwear) => set({ headwear })}
            />
          </Row>
          <Row label='neckwear'>
            <Segmented
              label='Neckwear'
              options={ACCESSORIES.neckwear}
              value={p.neckwear}
              onChange={(neckwear) => set({ neckwear })}
            />
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
        <CodeBlock
          code={source(p, fw)}
          lang='tsx'
          title={FILE[fw]}
          live
          action={
            <fieldset aria-label='Framework' {...stylex.props(s.fws)}>
              {(Object.keys(FILE) as Framework[]).map((f) => (
                <button
                  key={f}
                  type='button'
                  aria-pressed={f === fw}
                  onClick={() => setFw(f)}
                  {...stylex.props(s.fw, f === fw && s.fwOn)}
                >
                  <FrameworkLogo fw={f} />
                  <span {...stylex.props(s.fwName)}>{FRAMEWORK_NAME[f]}</span>
                </button>
              ))}
            </fieldset>
          }
        />
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
  // in the stage's corner, clear of the face at every size
  download: {
    ...LINE,
    position: 'absolute',
    top: '14px',
    right: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '76px',
    justifyContent: 'center',
    paddingBlock: '8px',
    paddingInline: '12px',
    borderRadius: '999px',
    backgroundColor: sheet['--page'],
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  downloadIcon: {
    width: '12px',
    height: '12px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
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
  // the framework switch, in the code block's header beside copy
  fws: {
    display: 'inline-flex',
    gap: '2px',
    margin: 0,
    marginRight: '8px',
    padding: 0,
    borderWidth: 0,
  },
  fw: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    paddingBlock: '5px',
    paddingInline: '9px',
    borderWidth: 0,
    borderRadius: '999px',
    backgroundColor: 'transparent',
    color: { default: sheet['--quiet'], ':hover': sheet['--fg'] },
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    cursor: 'pointer',
    transitionProperty: 'color, background-color',
    transitionDuration: '0.2s',
    outlineColor: { default: 'transparent', ':focus-visible': sheet['--red'] },
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  // a phone keeps the logos and the copy button on one line
  fwName: {
    position: { default: 'static', '@media (max-width: 520px)': 'absolute' },
    width: { default: 'auto', '@media (max-width: 520px)': '1px' },
    height: { default: 'auto', '@media (max-width: 520px)': '1px' },
    overflow: { default: 'visible', '@media (max-width: 520px)': 'hidden' },
    clipPath: { default: 'none', '@media (max-width: 520px)': 'inset(50%)' },
  },
  fwOn: {
    backgroundColor: sheet['--chip'],
    color: { default: sheet['--fg'], ':hover': sheet['--fg'] },
  },
  code: {
    paddingInline: '14px',
    paddingBottom: '14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
})
