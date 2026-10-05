/*
 * What a name decides, laid out as the instrument readout from the v1.2
 * sheet: the tidied key, its fingerprint, the style version, every axis
 * with its place in its list, and the persona the hash drew. Nothing here
 * is state; type the same name tomorrow and every line reads the same.
 */
import {
  AXES,
  COLORS,
  type Identity,
  identify,
  LISTS,
  VERSIONS,
} from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { fonts, sheet } from '@/lib/tokens.stylex'

const sign = (v: number) => (v < 0 ? '-' : '+') + Math.abs(v).toFixed(2)
const times = (v: number) => `×${v.toFixed(2)}`

/** The 13 persona numbers in their draw order, labelled. */
function persona(p: Identity['persona']): [string, string][] {
  return [
    ['spread', sign(p.spread)],
    ['blink', times(p.blink)],
    ...Object.entries(p.add).map(([k, v]): [string, string] => [k, sign(v)]),
    ...Object.entries(p.mul).map(([k, v]): [string, string] => [k, times(v)]),
  ]
}

const hex = (h: number) => `0x${h.toString(16).toUpperCase().padStart(8, '0')}`

export function IdentityReadout({
  name,
  compact = false,
}: {
  name: string
  compact?: boolean
}) {
  const who = identify(name)
  const lengths = VERSIONS[who.version]!
  return (
    <div {...stylex.props(styles.root)}>
      <dl {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.cell)}>
          <dt {...stylex.props(styles.k)}>Key</dt>
          <dd {...stylex.props(styles.v, styles.key)}>{who.key}</dd>
        </div>
        <div {...stylex.props(styles.cell)}>
          <dt {...stylex.props(styles.k)}>Hash</dt>
          <dd {...stylex.props(styles.v)}>{hex(who.hash)}</dd>
        </div>
        <div {...stylex.props(styles.cell)}>
          <dt {...stylex.props(styles.k)}>Style</dt>
          <dd {...stylex.props(styles.v)}>peek@{who.version}</dd>
        </div>
      </dl>
      <dl {...stylex.props(styles.axes, compact && styles.axesCompact)}>
        {AXES.map((axis) => {
          const value = who[axis]
          const at = (LISTS[axis] as readonly string[]).indexOf(value)
          return (
            <div key={axis} {...stylex.props(styles.axis)}>
              <dt {...stylex.props(styles.k)}>{axis}</dt>
              <dd {...stylex.props(styles.v, styles.pick)}>
                {axis === 'color' ? (
                  <span aria-hidden='true' {...stylex.props(styles.inks)}>
                    <i
                      {...stylex.props(
                        styles.ink,
                        styles.fill(COLORS[who.color].body),
                      )}
                    />
                    <i
                      {...stylex.props(
                        styles.ink,
                        styles.fill(COLORS[who.color].deep),
                      )}
                    />
                  </span>
                ) : null}
                {value}
                <span {...stylex.props(styles.of)}>
                  {at + 1}/{lengths[axis]}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
      <dl
        aria-label='Persona'
        {...stylex.props(styles.persona, compact && styles.personaCompact)}
      >
        {persona(who.persona).map(([k, v]) => (
          <div key={k} {...stylex.props(styles.num)}>
            <dt {...stylex.props(styles.k, styles.raw)}>{k}</dt>
            <dd {...stylex.props(styles.v)}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fonts['--mono'],
    fontVariantNumeric: 'tabular-nums',
    minWidth: 0,
  },
  head: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.7fr)',
    gap: '12px',
    margin: 0,
    paddingBlock: '12px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--fg'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
  },
  cell: { minWidth: 0 },
  k: {
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
    lineHeight: 1.6,
  },
  // persona keys are identifiers: eyeS is not eyes
  raw: { textTransform: 'none', letterSpacing: '0.02em' },
  v: {
    margin: 0,
    fontSize: '12px',
    letterSpacing: '0.02em',
    color: sheet['--fg'],
    lineHeight: 1.5,
  },
  key: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  axes: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(4, minmax(0, 1fr))',
    },
    gap: '0 12px',
    margin: 0,
    paddingBlock: '6px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
  },
  axesCompact: {
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(3, minmax(0, 1fr))',
    },
  },
  axis: { minWidth: 0, paddingBlock: '6px' },
  pick: { display: 'flex', alignItems: 'center', gap: '7px' },
  of: { color: sheet['--quiet'], fontSize: '10px' },
  inks: { display: 'inline-flex' },
  ink: {
    display: 'block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: `0 0 0 1px ${sheet['--rule']}`,
  },
  fill: (c: string) => ({ backgroundColor: c }),
  persona: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(3, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(5, minmax(0, 1fr))',
    },
    gap: '0 12px',
    margin: 0,
    paddingBlock: '6px',
  },
  personaCompact: {
    gridTemplateColumns: {
      default: 'repeat(3, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(4, minmax(0, 1fr))',
    },
  },
  num: { minWidth: 0, paddingBlock: '5px' },
})
