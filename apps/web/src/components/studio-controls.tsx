/*
 * The sticky control bar: the state every avatar on the page wears. One
 * signal dot per group leads the chosen pill, as in the v1.2 sheet, and
 * springs between pills when it changes.
 *
 * Two rows at every width: the expression, then frame, tile, size and life.
 * A row that does not fit scrolls sideways inside itself, fading at its
 * right edge, so the page never does and no group hides behind another.
 *
 * Style is a label, not a control: there is one style. The layer is built
 * to grow; the bar does not pretend it has.
 */
import { LATEST } from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { LAND, NONE } from '@/lib/motion'
import { EXPRESSION_LIST, FRAMES, type Look, SIZES } from '@/lib/studio'
import { fonts, sheet } from '@/lib/tokens.stylex'

type PillsProps<T> = {
  id: string
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  show?: (v: T) => string
}

function Pills<T extends string | number | boolean>({
  id,
  label,
  options,
  value,
  onChange,
  show = String,
}: PillsProps<T>) {
  const still = useReducedMotion() ?? false
  return (
    <fieldset {...stylex.props(styles.group)}>
      <legend {...stylex.props(styles.legend)}>{label}</legend>
      <div {...stylex.props(styles.pills)}>
        {options.map((o) => {
          const on = o === value
          return (
            <button
              key={String(o)}
              type='button'
              aria-pressed={on}
              onClick={() => onChange(o)}
              {...stylex.props(styles.pill, on && styles.on)}
            >
              {on ? (
                <motion.i
                  layoutId={`${id}-dot`}
                  transition={still ? NONE : LAND}
                  {...stylex.props(styles.dot)}
                />
              ) : null}
              {show(o)}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Toggle({
  label,
  on,
  disabled = false,
  onChange,
}: {
  label: string
  on: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      {...stylex.props(styles.pill, on && !disabled && styles.on)}
    >
      <i
        {...stylex.props(styles.dot, (!on || disabled) && styles.dotOff)}
        aria-hidden='true'
      />
      {label}
    </button>
  )
}

export function StudioControls({
  look,
  set,
}: {
  look: Look
  set: (patch: Partial<Look>) => void
}) {
  return (
    <section aria-label='Controls' {...stylex.props(styles.bar)}>
      <div {...stylex.props(styles.inner)}>
        <div {...stylex.props(styles.row)}>
          <p {...stylex.props(styles.group, styles.legend)}>
            Style
            <span {...stylex.props(styles.fixed)}>peek@{LATEST}</span>
          </p>
          <Pills
            id='expression'
            label='Expression'
            options={EXPRESSION_LIST}
            value={look.expression}
            onChange={(expression) => set({ expression })}
          />
        </div>
        <div {...stylex.props(styles.row)}>
          <Pills
            id='frame'
            label='Frame'
            options={FRAMES}
            value={look.frame}
            onChange={(frame) => set({ frame })}
          />
          <Pills
            id='tile'
            label='Tile'
            options={[true, false]}
            value={look.square}
            show={(v) => (v ? 'square' : 'round')}
            onChange={(square) => set({ square })}
          />
          <Pills
            id='size'
            label='Size'
            options={SIZES}
            value={look.size as (typeof SIZES)[number]}
            onChange={(size) => set({ size })}
          />
          <fieldset {...stylex.props(styles.group)}>
            <legend {...stylex.props(styles.legend)}>Life</legend>
            <div {...stylex.props(styles.pills)}>
              <Toggle
                label='animate'
                on={look.animate}
                onChange={(animate) => set({ animate })}
              />
              <Toggle
                label='follow pointer'
                on={look.follow}
                disabled={!look.animate}
                onChange={(follow) => set({ follow })}
              />
              <Toggle
                label='riso'
                on={look.riso}
                onChange={(riso) => set({ riso })}
              />
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  )
}

const styles = stylex.create({
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    backgroundColor: sheet['--page'],
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--fg'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
    marginInline: 'calc(-1 * clamp(16px, 4.4vw, 64px))',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    paddingBlock: '6px',
  },
  // the block padding leaves room for the focus ring a scroller would clip;
  // the fade sits on the inline padding until a row overflows
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    paddingInline: 'clamp(16px, 4.4vw, 64px)',
    paddingBlock: '6px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    overscrollBehaviorX: 'contain',
    maskImage:
      'linear-gradient(to right, black calc(100% - 32px), transparent)',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    minWidth: 0,
    flexShrink: 0,
  },
  legend: {
    float: 'left',
    margin: 0,
    padding: 0,
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--fg'],
    whiteSpace: 'nowrap',
  },
  pills: { display: 'flex', gap: '6px', flexWrap: 'nowrap' },
  pill: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    paddingBlock: '6px',
    paddingInline: '11px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule-strong'],
      '@media (hover: hover)': {
        default: null,
        ':hover:not(:disabled)': sheet['--fg'],
      },
    },
    backgroundColor: 'transparent',
    color: {
      default: sheet['--quiet'],
      '@media (hover: hover)': {
        default: null,
        ':hover:not(:disabled)': sheet['--fg'],
      },
    },
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.05em',
    lineHeight: 1.2,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    opacity: { default: 1, ':disabled': 0.45 },
    transitionProperty: 'border-color, color',
    transitionDuration: '150ms',
    touchAction: 'manipulation',
  },
  on: { borderColor: sheet['--fg'], color: sheet['--fg'] },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: sheet['--red'],
    flexShrink: 0,
  },
  fixed: { fontWeight: 400, color: sheet['--quiet'] },
  dotOff: {
    backgroundColor: 'transparent',
    boxShadow: `inset 0 0 0 1px ${sheet['--quiet']}`,
  },
})
