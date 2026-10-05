/*
 * How to use it. The props table is keyed by PeekProps itself, so a prop
 * added to or dropped from the library breaks this file's types until the
 * table matches; the option lists are read from the library's own tables.
 * The install line leads the section.
 *
 * Below 40rem the table stacks: one block per prop, name and default on a
 * line, the type under them, then the note, so nothing scrolls sideways.
 */
import * as peek from '@doanlabs/peek'
import {
  COLORS,
  EXPRESSIONS,
  FACES,
  identify,
  LATEST,
  PARTS,
  type PeekProps,
} from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { StudioSection } from '@/components/studio-section'
import { FRAMES } from '@/lib/studio'
import { fonts, sheet } from '@/lib/tokens.stylex'

const one = (list: readonly unknown[]) =>
  list.map((v) => `'${String(v)}'`).join(' | ')

type Row = [type: string, initial: string, note: string]
const PROPS: Record<keyof PeekProps, Row> = {
  name: ['string', 'required', 'Decides the identity. Tidied first.'],
  size: ['number', '64', 'Pixels. Drives the stroke ramp and riso.'],
  expression: [one(Object.keys(EXPRESSIONS)), "'normal'", 'State.'],
  gaze: [
    "[x, y] | 'pointer'",
    'none',
    'x and y in -1..1. Pointer needs animate.',
  ],
  animate: ['boolean', 'false', 'Alive after mount. Off on reduced motion.'],
  frame: [one(FRAMES), "'ink'", 'The tile behind the face.'],
  square: ['boolean', 'true', 'false clips the tile to a circle.'],
  title: ['string | false', 'name', 'Accessible name. false hides it.'],
  riso: ['boolean', 'false', 'Print plates and grain, from 120 px.'],
  version: ['number', String(LATEST), 'Pins a style version.'],
  face: [one(Object.keys(FACES)), 'hashed', 'Overrides one axis.'],
  color: [one(Object.keys(COLORS)), 'hashed', 'Overrides one axis.'],
  eyes: [one(PARTS.eyes), 'hashed', 'Overrides one axis.'],
  brows: [one(PARTS.brows), 'hashed', 'Overrides one axis.'],
  mouth: [one(PARTS.mouth), 'hashed', 'Overrides one axis.'],
  cheeks: [one(PARTS.cheeks), 'hashed', 'Overrides one axis.'],
  trait: [one(PARTS.trait), 'hashed', 'Overrides one axis.'],
  className: ['string', 'none', 'On the svg.'],
  style: ['CSSProperties', 'none', 'On the svg.'],
}

const EXPORTS = Object.keys(peek).sort()

export function StudioUsage({
  name,
  index = '06',
}: {
  name: string
  index?: string
}) {
  const n = JSON.stringify(name)
  // the JS snippet quotes the way its import does
  const q = `'${name.replace(/[\\']/g, '\\$&')}'`
  const face = identify(name).face
  const react = `import { Peek } from '@doanlabs/peek'

<Peek name=${n} />
<Peek name=${n} size={96} expression="happy" />
<Peek name=${n} animate gaze="pointer" />`
  const svg = `import { identify, toSvg } from '@doanlabs/peek'

const svg = toSvg(${q}, {
  size: 96,
  frame: 'bone',
})
identify(${q}).face // '${face}'`

  return (
    <StudioSection
      id='usage'
      index={index}
      title='Usage'
      note='One component, one function. The same input draws the same SVG on the server and in the browser.'
    >
      <div {...stylex.props(styles.soon)}>
        <i {...stylex.props(styles.dot)} />
        <span>
          <b {...stylex.props(styles.soonHead)}>Install.</b>
          npm install @doanlabs/peek
        </span>
      </div>
      <div {...stylex.props(styles.snips)}>
        <figure {...stylex.props(styles.snip)}>
          <figcaption {...stylex.props(styles.label)}>React</figcaption>
          <pre {...stylex.props(styles.code)}>
            <code>{react}</code>
          </pre>
        </figure>
        <figure {...stylex.props(styles.snip)}>
          <figcaption {...stylex.props(styles.label)}>
            Any runtime · a string out
          </figcaption>
          <pre {...stylex.props(styles.code)}>
            <code>{svg}</code>
          </pre>
        </figure>
      </div>
      <div>
        <table {...stylex.props(styles.table)}>
          <caption {...stylex.props(styles.caption)}>
            &lt;Peek&gt; props
          </caption>
          <thead {...stylex.props(styles.thead)}>
            <tr>
              <th scope='col' {...stylex.props(styles.th)}>
                Prop
              </th>
              <th scope='col' {...stylex.props(styles.th)}>
                Type
              </th>
              <th scope='col' {...stylex.props(styles.th)}>
                Default
              </th>
              <th scope='col' {...stylex.props(styles.th, styles.wide)}>
                Note
              </th>
            </tr>
          </thead>
          <tbody {...stylex.props(styles.tbody)}>
            {(Object.keys(PROPS) as (keyof PeekProps)[]).map((k) => {
              const [type, initial, note] = PROPS[k]
              return (
                <tr key={k} {...stylex.props(styles.tr)}>
                  <th
                    scope='row'
                    {...stylex.props(styles.td, styles.prop, styles.at('prop'))}
                  >
                    {k}
                  </th>
                  <td
                    {...stylex.props(styles.td, styles.type, styles.at('type'))}
                  >
                    {type}
                  </td>
                  <td
                    {...stylex.props(
                      styles.td,
                      styles.mono,
                      styles.def,
                      styles.at('def'),
                    )}
                  >
                    {initial}
                  </td>
                  <td
                    {...stylex.props(
                      styles.td,
                      styles.note,
                      styles.wide,
                      styles.at('note'),
                    )}
                  >
                    {note}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p {...stylex.props(styles.exports)}>
        <b {...stylex.props(styles.soonHead)}>Exports</b>
        {EXPORTS.join(' · ')}
      </p>
    </StudioSection>
  )
}

const WIDE = '@media (width >= 40rem)'

const styles = stylex.create({
  soon: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '28px',
    fontSize: '15px',
    lineHeight: 1.5,
    color: sheet['--soft'],
  },
  soonHead: {
    display: 'block',
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--fg'],
    marginBottom: '4px',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: sheet['--red'],
    flexShrink: 0,
    transform: 'translateY(-1px)',
  },
  snips: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (width >= 64rem)': 'repeat(2, minmax(0, 1fr))',
    },
    gap: '20px',
    marginBottom: '40px',
  },
  snip: { display: 'flex', flexDirection: 'column', gap: '10px', margin: 0 },
  label: {
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  code: {
    flexGrow: 1,
    margin: 0,
    paddingBlock: '18px',
    paddingInline: '20px',
    backgroundColor: sheet['--chip'],
    fontFamily: fonts['--mono'],
    fontSize: '12.5px',
    lineHeight: 1.7,
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  table: {
    display: { default: 'block', [WIDE]: 'table' },
    width: '100%',
    borderCollapse: 'collapse',
    fontVariantNumeric: 'tabular-nums',
  },
  // stacked, a table-row-group or caption would shrink-wrap its rows
  tbody: { display: { default: 'block', [WIDE]: 'table-row-group' } },
  // stacked, the header row would label nothing
  thead: { display: { default: 'none', [WIDE]: 'table-header-group' } },
  tr: {
    display: { default: 'grid', [WIDE]: 'table-row' },
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gridTemplateAreas: '"prop def" "type type" "note note"',
    columnGap: '16px',
    paddingBlock: { default: '10px', [WIDE]: 0 },
    borderBottomWidth: { default: '1px', [WIDE]: 0 },
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  at: (area: string) => ({ gridArea: area }),
  // stacked, the default says what it is
  def: {
    textAlign: { default: 'right', [WIDE]: 'left' },
    '::before': {
      content: { default: '"default "', [WIDE]: '""' },
      color: sheet['--quiet'],
    },
  },
  caption: {
    display: { default: 'block', [WIDE]: 'table-caption' },
    captionSide: 'top',
    textAlign: 'left',
    paddingBottom: '12px',
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  th: {
    textAlign: 'left',
    paddingBlock: '10px',
    paddingInline: '0 20px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--fg'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  td: {
    display: { default: 'block', [WIDE]: 'table-cell' },
    textAlign: 'left',
    verticalAlign: 'top',
    paddingBlock: { default: '2px', [WIDE]: '10px' },
    paddingInline: { default: 0, [WIDE]: '0 20px' },
    borderBottomWidth: { default: 0, [WIDE]: '1px' },
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  prop: {
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  type: {
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    lineHeight: 1.55,
    color: sheet['--soft'],
    maxWidth: '42ch',
  },
  mono: {
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    whiteSpace: 'nowrap',
  },
  note: { fontSize: '13.5px', lineHeight: 1.45, color: sheet['--soft'] },
  wide: { minWidth: { default: 0, [WIDE]: '22ch' } },
  exports: {
    marginTop: '28px',
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    letterSpacing: '0.04em',
    lineHeight: 1.7,
    color: sheet['--soft'],
  },
})
