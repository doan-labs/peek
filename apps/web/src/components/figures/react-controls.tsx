/*
 * The React page's two extra controls, in the kit's voice: a slider with a
 * filled track and a switch whose knob lands on a spring.
 */
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'

export function Range({
  value,
  min,
  max,
  step = 1,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  label: string
  onChange: (v: number) => void
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`
  return (
    <input
      type='range'
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      {...stylex.props(s.range, s.fill(fill))}
    />
  )
}

export function Toggle({
  on,
  label,
  onChange,
}: {
  on: boolean
  label: string
  onChange: (v: boolean) => void
}) {
  const reduce = useReducedMotion()
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      onClick={() => onChange(!on)}
      {...stylex.props(s.toggle, on && s.toggleOn)}
    >
      <span aria-hidden='true' {...stylex.props(s.track, on && s.trackOn)}>
        <motion.span
          initial={false}
          animate={{ x: on ? 12 : 0 }}
          transition={reduce ? NONE : LAND}
          {...stylex.props(s.knob)}
        />
      </span>
      {label}
    </button>
  )
}

const HOVER = '@media (hover: hover)'
const THUMB = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: sheet['--fg'],
  backgroundColor: sheet['--page'],
  boxShadow: `0 1px 3px ${sheet['--rule-strong']}`,
  cursor: 'grab',
} as const

const s = stylex.create({
  range: {
    appearance: 'none',
    flexGrow: 1,
    minWidth: '80px',
    height: '4px',
    margin: 0,
    borderRadius: '999px',
    cursor: 'pointer',
    outlineOffset: '6px',
    '::-webkit-slider-thumb': { appearance: 'none', ...THUMB },
    '::-moz-range-thumb': THUMB,
  },
  fill: (at: string) => ({
    backgroundImage: `linear-gradient(to right, ${sheet['--fg']} ${at}, ${sheet['--rule-strong']} ${at})`,
  }),
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '30px',
    paddingInline: '8px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
    borderRadius: '999px',
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: sheet['--page'],
    cursor: 'pointer',
    transitionProperty: 'color, border-color',
    transitionDuration: '0.15s',
  },
  toggleOn: { color: sheet['--fg'], borderColor: sheet['--rule-strong'] },
  track: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '26px',
    height: '14px',
    paddingInline: '2px',
    borderRadius: '999px',
    backgroundColor: sheet['--rule-strong'],
    transitionProperty: 'background-color',
    transitionDuration: '0.2s',
  },
  trackOn: { backgroundColor: sheet['--fg'] },
  knob: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: sheet['--page'],
  },
})
