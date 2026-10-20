/*
 * The variants page's figure: one name drawn three ways, side by side and
 * stepping through expressions together, so it reads as one face in three
 * drawings. Tap the stage for the next expression; pick another name below.
 */
import { EXPRESSIONS, type Expression, Peek, VARIANTS } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { fonts, sheet } from '@/lib/tokens.stylex'
import { Figure, Micro, Roll, Segmented, Stage, useAutoplay } from './kit'

const EXPRS = Object.keys(EXPRESSIONS) as Expression[]
const NAMES = ['Linh', 'Kwame', 'Thu Hà', 'Alan Turing'] as const
type Name = (typeof NAMES)[number]

export function VariantTrio() {
  const [name, setName] = useState<Name>('Linh')
  const [i, setI] = useState(1)
  const auto = useAutoplay<HTMLButtonElement>((t) => {
    setI(Math.floor(t / 2.4) + 1)
  })
  const expr = EXPRS[i % EXPRS.length]!
  return (
    <Figure>
      <Stage height={260}>
        <button
          ref={auto.ref}
          type='button'
          aria-label='Next expression'
          onClick={() => {
            auto.stop()
            setI((v) => v + 1)
          }}
          {...stylex.props(s.button)}
        >
          <span {...stylex.props(s.head)}>
            <span {...stylex.props(s.expr)}>
              expression=&quot;
              <Roll text={expr} />
              &quot;
            </span>
            <Micro>Tap for the next</Micro>
          </span>
          <span {...stylex.props(s.row)}>
            {VARIANTS.map((v) => (
              <span key={v} {...stylex.props(s.cell)}>
                <Peek
                  name={name}
                  variant={v}
                  expression={expr}
                  size={120}
                  title={false}
                  animate
                />
                <span {...stylex.props(s.tag)}>{v}</span>
              </span>
            ))}
          </span>
        </button>
      </Stage>
      <div {...stylex.props(s.foot)}>
        <Segmented
          label='Name'
          options={NAMES}
          value={name}
          onChange={setName}
        />
        <CodeBlock
          live
          code={VARIANTS.map(
            (v) =>
              `<Peek name="${name}"${v === 'peek' ? '' : ` variant="${v}"`} expression="${expr}" animate />`,
          ).join('\n')}
        />
      </div>
    </Figure>
  )
}

const s = stylex.create({
  button: {
    display: 'grid',
    placeItems: 'center',
    alignSelf: 'stretch',
    justifySelf: 'stretch',
    padding: '40px 16px 24px',
    borderWidth: 0,
    textAlign: 'inherit',
    color: 'inherit',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  head: {
    position: 'absolute',
    top: '14px',
    insetInline: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  expr: {
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    color: sheet['--fg'],
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '28px',
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  tag: {
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    color: sheet['--quiet'],
  },
  foot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
})
