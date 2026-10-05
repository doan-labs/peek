/*
 * /studio, the Peek studio. The v1.2 sheet's craft on a white page with
 * a dark twin: thin ink rules, mono micro labels, one signal dot spent on
 * selection, and the frame as the product.
 *
 * Two pieces of state run the page. The name decides identity; the look
 * (the control bar) is the state every avatar wears. Everything below the
 * hero reads a deferred copy of the name, so typing stays instant while
 * the faces below catch up.
 */
import { COLORS, EXPRESSIONS, FACES, identify, Peek } from '@doanlabs/peek'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useDeferredValue, useRef, useState } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { IdentityReadout } from '@/components/identity-readout'
import { StudioControls } from '@/components/studio-controls'
import {
  StudioAnatomy,
  StudioExpressions,
  StudioRamp,
} from '@/components/studio-reference'
import { StudioSection } from '@/components/studio-section'
import { StudioUsage } from '@/components/studio-usage'
import { StudioSheet, StudioWall } from '@/components/studio-wall'
import { COMBOS, DEFAULT_NAME, LOOK, type Look, lookProps } from '@/lib/studio'
import { fonts, sheet } from '@/lib/tokens.stylex'

const FACTS = [
  [Object.keys(FACES).length, 'faces'],
  [Object.keys(COLORS).length, 'inks'],
  [Object.keys(EXPRESSIONS).length, 'expressions'],
  [COMBOS.toLocaleString('en-US'), 'discrete faces'],
] as const

export function StudioPage() {
  const [typed, setTyped] = useState('')
  const [look, setLook] = useState<Look>(LOOK)
  const [open, setOpen] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Look>) => setLook((l) => ({ ...l, ...patch }))

  const name = typed.trim() || DEFAULT_NAME
  const later = useDeferredValue(name)
  const who = identify(name)

  return (
    <div data-sheet data-studio {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.wrap)}>
        <header {...stylex.props(styles.top)}>
          <Link to='/' {...stylex.props(styles.brand)}>
            <BrandMark />
            Peek
            <span {...stylex.props(styles.by)}>· Doan Labs</span>
          </Link>
          <p {...stylex.props(styles.status)}>
            <i {...stylex.props(styles.dot)} />
            Coming soon · not published · peek@{who.version}
          </p>
        </header>

        <main>
          <section aria-label='Your face' {...stylex.props(styles.hero)}>
            <h1 {...stylex.props(styles.srOnly)}>Peek studio</h1>
            <div {...stylex.props(styles.nameArea)}>
              <label htmlFor='studio-name' {...stylex.props(styles.micro)}>
                <span>
                  <span aria-hidden='true'>01 · </span>Type a name
                </span>
                <span aria-hidden='true'>Same name, same face</span>
              </label>
              <div {...stylex.props(styles.namebox)}>
                <input
                  ref={input}
                  id='studio-name'
                  type='text'
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={DEFAULT_NAME}
                  maxLength={40}
                  autoComplete='off'
                  autoCapitalize='words'
                  spellCheck={false}
                  aria-describedby='studio-name-hint'
                  {...stylex.props(styles.input)}
                />
                {typed ? (
                  <button
                    type='button'
                    onClick={() => {
                      setTyped('')
                      input.current?.focus()
                    }}
                    {...stylex.props(styles.clear)}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <p id='studio-name-hint' {...stylex.props(styles.tagline)}>
                A string in, a face out. Type the same name tomorrow, on any
                machine, and the same face looks back.
              </p>
            </div>

            <div {...stylex.props(styles.stage)}>
              <div {...stylex.props(styles.frame)}>
                <Peek
                  name={name}
                  size={480}
                  {...lookProps(look)}
                  {...stylex.props(styles.fill)}
                />
              </div>
              <div {...stylex.props(styles.line)}>
                <b {...stylex.props(styles.lineHead)}>
                  <i {...stylex.props(styles.dot)} />
                  {who.face} · {look.expression}
                </b>
                <span>
                  {look.frame} · {look.square ? 'square' : 'round'}
                  {look.animate ? ' · live' : ' · still'}
                </span>
              </div>
            </div>

            <div {...stylex.props(styles.info)}>
              <dl {...stylex.props(styles.facts)}>
                {FACTS.map(([n, label]) => (
                  <div key={label} {...stylex.props(styles.fact)}>
                    <dt {...stylex.props(styles.factLabel)}>{label}</dt>
                    <dd {...stylex.props(styles.factNum)}>{n}</dd>
                  </div>
                ))}
              </dl>
              <IdentityReadout name={name} />
              <p {...stylex.props(styles.formula)}>
                seed(axis) = fnv1a("peek@{who.version}:" + axis + ":{who.key}")
                <br />
                pick = list[seed % list.length], one seed per axis
              </p>
            </div>
          </section>

          <StudioControls look={look} set={set} />

          <StudioSection
            id='wall'
            index='02'
            flush
            title='The wall'
            note={`${name} and a cast of names, all in the look above. Press a face for its sheet: copy the JSX or the SVG, or download it.`}
          >
            <StudioWall name={later} look={look} onOpen={setOpen} />
          </StudioSection>

          <StudioAnatomy name={later} look={look} />
          <StudioExpressions name={later} look={look} set={set} />
          <StudioRamp name={later} look={look} />
          <StudioUsage name={later} />
        </main>

        <footer {...stylex.props(styles.foot)}>
          <span>Peek · peek@{who.version} · same name, same face</span>
          <span>© 2026 Doan Labs</span>
        </footer>
      </div>
      <StudioSheet name={open} look={look} onClose={() => setOpen(null)} />
    </div>
  )
}

const PAD = 'clamp(16px, 4.4vw, 64px)'
const MICRO = {
  fontFamily: fonts['--mono'],
  fontSize: '10.5px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as const

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    backgroundColor: sheet['--page'],
    color: sheet['--fg'],
    fontFamily: fonts['--sans'],
    overflowX: 'clip',
  },
  wrap: {
    maxWidth: '1440px',
    marginInline: 'auto',
    paddingInline: PAD,
    paddingBottom: '40px',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px 16px',
    minHeight: '76px',
    paddingBlock: '14px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--fg'],
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    color: 'inherit',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  by: {
    ...MICRO,
    fontWeight: 400,
    fontSize: '11px',
    color: sheet['--quiet'],
    marginLeft: '-4px',
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
  status: {
    ...MICRO,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '11px',
    color: sheet['--quiet'],
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: sheet['--red'],
    flexShrink: 0,
  },

  hero: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (width >= 64rem)': 'minmax(0, 1fr) clamp(360px, 40vw, 560px)',
    },
    gridTemplateAreas: {
      default: '"name" "stage" "info"',
      '@media (width >= 64rem)': '"name stage" "info stage"',
    },
    gridTemplateRows: { default: null, '@media (width >= 64rem)': 'auto 1fr' },
    gap: { default: '28px', '@media (width >= 64rem)': '36px 64px' },
    paddingBlock: {
      default: '28px 44px',
      '@media (width >= 64rem)': '44px 64px',
    },
  },
  nameArea: { gridArea: 'name', minWidth: 0 },
  micro: {
    ...MICRO,
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
    color: sheet['--quiet'],
  },
  namebox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    paddingBottom: '8px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    // focus: the rule turns signal and doubles, 2px of red under the name
    borderBottomColor: {
      default: sheet['--fg'],
      ':focus-within': sheet['--red'],
    },
    boxShadow: {
      default: '0 1px 0 transparent',
      ':focus-within': `0 1px 0 ${sheet['--red']}`,
    },
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '150ms',
  },
  input: {
    flexGrow: 1,
    minWidth: 0,
    width: '100%',
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: sheet['--fg'],
    fontFamily: fonts['--sans'],
    fontSize: 'clamp(40px, 6.6vw, 88px)',
    fontWeight: 600,
    letterSpacing: '-0.045em',
    lineHeight: 1.05,
    outlineStyle: 'none',
    '::placeholder': { color: sheet['--quiet'], opacity: 1 },
  },
  clear: {
    ...MICRO,
    flexShrink: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: {
      default: sheet['--quiet'],
      '@media (hover: hover)': { default: null, ':hover': sheet['--fg'] },
    },
  },
  tagline: {
    marginTop: '18px',
    maxWidth: '44ch',
    fontSize: 'clamp(18px, 1.9vw, 22px)',
    lineHeight: 1.35,
    letterSpacing: '-0.015em',
    fontWeight: 500,
    color: sheet['--soft'],
    textWrap: 'pretty',
  },
  stage: {
    gridArea: 'stage',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minWidth: 0,
  },
  frame: {
    width: '100%',
    aspectRatio: '1',
    boxShadow: `0 0 0 1px ${sheet['--edge']}`,
  },
  fill: { width: '100%', height: '100%' },
  line: {
    ...MICRO,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px 20px',
    paddingBottom: '12px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
    color: sheet['--quiet'],
  },
  lineHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 700,
    color: sheet['--fg'],
  },
  info: {
    gridArea: 'info',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    minWidth: 0,
    alignSelf: 'end',
  },
  facts: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (width >= 40rem)': 'repeat(4, auto)',
    },
    justifyContent: 'start',
    gap: '14px 40px',
    margin: 0,
  },
  // the number reads first; the label stays first for a screen reader
  fact: { display: 'flex', flexDirection: 'column-reverse' },
  factLabel: {
    ...MICRO,
    fontSize: '10px',
    color: sheet['--quiet'],
  },
  factNum: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  formula: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.03em',
    lineHeight: 1.7,
    color: sheet['--quiet'],
    overflowWrap: 'anywhere',
  },

  foot: {
    ...MICRO,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    paddingTop: '18px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--fg'],
    color: sheet['--quiet'],
  },
})
