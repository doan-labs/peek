/*
 * The reference strips: what the hash picks from, what a face can do, and
 * how it holds up small. Anatomy draws the current name once per option,
 * overriding one axis at a time, so every tile is still that name's face;
 * the one the name picked carries the signal dot.
 */
import {
  AXES,
  type Axes,
  type Axis,
  COLORS,
  identify,
  LATEST,
  LISTS,
  Peek,
  VERSIONS,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { StudioSection } from '@/components/studio-section'
import { COMBOS, EXPRESSION_LIST, type Look, lookProps } from '@/lib/studio'
import { fonts, sheet } from '@/lib/tokens.stylex'

const NOTES: Record<Axis, string> = {
  face: 'The silhouette. Carries every anchor the parts sit on.',
  color: 'A body ink and its deep partner at the same hue.',
  eyes: 'Paper and ink, read by the lids, gaze and shine.',
  brows: 'Height, tilt, arch and weight move with the state.',
  mouth: 'Width, curve and skew move with the state. Shown happy.',
  cheeks: 'Deep ink, and only there when the face warms up. Shown happy.',
  trait: 'Rides the crown outline, lifts and sinks with the mood.',
}

const lengths = VERSIONS[LATEST]!

export function StudioAnatomy({ name, look }: { name: string; look: Look }) {
  const who = identify(name)
  const props = lookProps(look)
  return (
    <StudioSection
      id='anatomy'
      index='03'
      title='Anatomy'
      note={
        <>
          Every axis hashes on its own seed. The dot marks what {name} drew; the
          rest is what the same name looks like with one axis overridden.
        </>
      }
    >
      <p {...stylex.props(styles.count)}>
        <span {...stylex.props(styles.sum)}>
          {AXES.map((a) => lengths[a]).join(' × ')} =
        </span>
        <b {...stylex.props(styles.total)}>{COMBOS.toLocaleString('en-US')}</b>
        <span {...stylex.props(styles.sum)}>
          discrete faces in peek@{LATEST}, before the 13 persona numbers
        </span>
      </p>
      <div {...stylex.props(styles.rows)}>
        {AXES.map((axis) => (
          <div key={axis} {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowHead)}>
              <h3 {...stylex.props(styles.h3)}>
                {axis}
                <span aria-hidden='true' {...stylex.props(styles.n)}>
                  {lengths[axis]}
                </span>
              </h3>
              <p {...stylex.props(styles.rowNote)}>{NOTES[axis]}</p>
            </div>
            <ul {...stylex.props(styles.tiles)}>
              {LISTS[axis].map((opt) => {
                const picked = who[axis] === opt
                const ink =
                  axis === 'color' ? COLORS[opt as Axes['color']] : null
                return (
                  <li key={opt} {...stylex.props(styles.tile)}>
                    <div
                      {...stylex.props(styles.thumb, picked && styles.picked)}
                    >
                      <Peek
                        name={name}
                        size={96}
                        title={`${name}, ${axis} ${opt}`}
                        {...props}
                        {...((axis === 'cheeks' || axis === 'mouth') && {
                          expression: 'happy',
                        })}
                        {...{ [axis]: opt }}
                        {...stylex.props(styles.fill)}
                      />
                    </div>
                    <span {...stylex.props(styles.cap)}>
                      <b {...stylex.props(styles.capName)}>
                        {opt}
                        {picked ? (
                          <span {...stylex.props(styles.srOnly)}>
                            , picked by {name}
                          </span>
                        ) : null}
                      </b>
                      {ink ? (
                        <>
                          <span>{ink.body}</span>
                          <span>{ink.deep}</span>
                        </>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </StudioSection>
  )
}

export function StudioExpressions({
  name,
  look,
  set,
}: {
  name: string
  look: Look
  set: (patch: Partial<Look>) => void
}) {
  return (
    <StudioSection
      id='expressions'
      index='04'
      title='Expressions'
      note='State, never hashed. Eleven moods, one vocabulary for every style. Press one to put the whole page in it.'
    >
      <div {...stylex.props(styles.moods)}>
        {EXPRESSION_LIST.map((e) => {
          const on = look.expression === e
          return (
            <button
              key={e}
              type='button'
              aria-pressed={on}
              onClick={() => set({ expression: e })}
              {...stylex.props(styles.mood)}
            >
              <span {...stylex.props(styles.thumb, on && styles.picked)}>
                <Peek
                  name={name}
                  size={128}
                  title={false}
                  {...lookProps(look)}
                  expression={e}
                  {...stylex.props(styles.fill)}
                />
              </span>
              <span
                {...stylex.props(
                  styles.capName,
                  styles.moodName,
                  on && styles.moodOn,
                )}
              >
                {e}
              </span>
            </button>
          )
        })}
      </div>
    </StudioSection>
  )
}

/* The stroke ramp, as strokeFor() in packages/peek/src/draw.ts draws it:
 * one size from each step. */
const RAMP = [
  [24, '×2.4'],
  [32, '×2.0'],
  [48, '×1.6'],
  [64, '×1.25'],
  [128, '×1.0'],
] as const

export function StudioRamp({ name, look }: { name: string; look: Look }) {
  return (
    <StudioSection
      id='sizes'
      index='05'
      title='Size ramp'
      note='The same face at five sizes, drawn at its real pixel size. Strokes thicken below 96 px so a 24 px face still reads. Riso shows from 120 px.'
    >
      <div {...stylex.props(styles.ramp)}>
        {RAMP.map(([px, stroke]) => (
          <figure key={px} {...stylex.props(styles.step)}>
            <Peek
              name={name}
              size={px}
              title={`${name} at ${px} px`}
              {...lookProps(look)}
            />
            <figcaption {...stylex.props(styles.cap, styles.center)}>
              <b {...stylex.props(styles.capName)}>{px} px</b>
              <span>stroke {stroke}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </StudioSection>
  )
}

const styles = stylex.create({
  count: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '6px 14px',
    marginBottom: '28px',
  },
  sum: {
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
    fontVariantNumeric: 'tabular-nums',
  },
  total: {
    fontSize: 'clamp(28px, 3.4vw, 40px)',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
  rows: { display: 'flex', flexDirection: 'column' },
  row: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (width >= 64rem)': '220px minmax(0, 1fr)',
    },
    gap: '14px 40px',
    paddingBlock: '22px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule-strong'],
  },
  rowHead: { display: 'flex', flexDirection: 'column', gap: '6px' },
  h3: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    margin: 0,
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  n: { fontWeight: 400, color: sheet['--quiet'] },
  rowNote: {
    fontSize: '13.5px',
    lineHeight: 1.5,
    color: sheet['--soft'],
    maxWidth: '36ch',
  },
  tiles: {
    display: 'grid',
    gridTemplateColumns: {
      // four splits the four-option axes evenly; seven fits the longest list
      default: 'repeat(4, minmax(0, 1fr))',
      '@media (width >= 48rem)': 'repeat(7, minmax(0, 1fr))',
    },
    gap: '18px 14px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  tile: { display: 'flex', flexDirection: 'column', gap: '9px', minWidth: 0 },
  thumb: {
    position: 'relative',
    display: 'block',
    width: '100%',
    aspectRatio: '1',
    outlineWidth: '1px',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: '3px',
    boxShadow: `0 0 0 1px ${sheet['--edge']}`,
    transitionProperty: 'outline-color',
    transitionDuration: '150ms',
  },
  // the pick: signal outline and a dot on the corner, as in the v1.2 sheet
  picked: {
    outlineWidth: '2px',
    outlineColor: sheet['--red'],
    '::after': {
      content: '""',
      position: 'absolute',
      top: '-7px',
      right: '-7px',
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      backgroundColor: sheet['--red'],
      boxShadow: `0 0 0 2px ${sheet['--page']}`,
    },
  },
  fill: { width: '100%', height: '100%' },
  cap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    letterSpacing: '0.04em',
    lineHeight: 1.45,
    color: sheet['--quiet'],
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
  },
  capName: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--fg'],
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
  moods: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(3, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(4, minmax(0, 1fr))',
      '@media (width >= 64rem)': 'repeat(6, minmax(0, 1fr))',
    },
    gap: '28px 16px',
  },
  mood: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
    minWidth: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    touchAction: 'manipulation',
    outlineOffset: { default: null, ':focus-visible': '6px' },
  },
  moodName: { color: sheet['--quiet'] },
  moodOn: { color: sheet['--fg'] },
  ramp: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 'clamp(18px, 4vw, 48px)',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    margin: 0,
  },
  center: { alignItems: 'center' },
})
