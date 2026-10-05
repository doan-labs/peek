/*
 * The wall: a cast of names, each with the face its name makes, all in the
 * look the control bar sets. Pressing one opens its sheet: the face big,
 * what the name decided, and four ways to take it home.
 *
 * Every live face steps from the library's one shared loop and pauses when
 * it scrolls away, so the wall costs what is on screen.
 */
import { LATEST, Peek, toSvg } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { IdentityReadout } from '@/components/identity-readout'
import { LAND, NONE } from '@/lib/motion'
import {
  jsxFor,
  type Look,
  lookProps,
  NAMES,
  slug,
  svgOptions,
} from '@/lib/studio'
import { fonts, sheet } from '@/lib/tokens.stylex'

export function StudioWall({
  name,
  look,
  onOpen,
}: {
  name: string
  look: Look
  onOpen: (name: string) => void
}) {
  const cast = [name, ...NAMES.filter((n) => n !== name)]
  const min = Math.max(look.size + 20, 80)
  return (
    <ul {...stylex.props(styles.grid, styles.cols(`${min}px`))}>
      {cast.map((n, i) => (
        <li key={n} {...stylex.props(styles.cell)}>
          <button
            type='button'
            aria-label={`${n}: open details`}
            onClick={() => onOpen(n)}
            {...stylex.props(styles.tile)}
          >
            <Peek
              name={n}
              size={look.size}
              title={false}
              {...lookProps(look)}
            />
            {i === 0 ? (
              <i {...stylex.props(styles.dot, styles.corner)} />
            ) : null}
            <span {...stylex.props(styles.label)}>
              <span {...stylex.props(styles.text, i === 0 && styles.typed)}>
                {n}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ---------- the sheet ---------- */

const SHEET_SIZE = 360
const FILE_SIZE = 512

function save(blob: Blob, file: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** The SVG drawn onto a canvas at twice its size, out as a PNG. */
async function toPng(svg: string, px: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = px
    canvas.height = px
    canvas.getContext('2d')?.drawImage(img, 0, 0, px, px)
    return await new Promise<Blob>((ok, fail) =>
      canvas.toBlob(
        (b) => (b ? ok(b) : fail(new Error('no png'))),
        'image/png',
      ),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

type Action = 'jsx' | 'svg' | 'file' | 'png'
const LABEL: Record<Action, [idle: string, done: string]> = {
  jsx: ['Copy JSX', 'JSX copied'],
  svg: ['Copy SVG', 'SVG copied'],
  file: ['Download SVG', 'SVG saved'],
  png: ['Download PNG', 'PNG saved'],
}

export function StudioSheet({
  name,
  look,
  onClose,
}: {
  name: string | null
  look: Look
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const still = useReducedMotion() ?? false
  const [done, setDone] = useState<{ a: Action; ok: boolean } | null>(null)
  const timer = useRef(0)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (name && !d.open) d.showModal()
    if (!name && d.open) d.close()
    setDone(null)
  }, [name])
  useEffect(() => () => clearTimeout(timer.current), [])

  const run = async (a: Action) => {
    if (!name) return
    const svg = toSvg(name, svgOptions(look, FILE_SIZE))
    let ok = true
    try {
      if (a === 'jsx')
        await navigator.clipboard.writeText(jsxFor(name, look, 64))
      if (a === 'svg') await navigator.clipboard.writeText(svg)
      if (a === 'file')
        save(new Blob([svg], { type: 'image/svg+xml' }), `${slug(name)}.svg`)
      if (a === 'png')
        save(await toPng(svg, FILE_SIZE * 2), `${slug(name)}.png`)
    } catch {
      ok = false
    }
    setDone({ a, ok })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(null), 1800)
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the click is the backdrop; the keyboard closes the dialog with Esc
    <dialog
      ref={ref}
      data-sheet
      aria-label={name ? `${name}, details` : 'Details'}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      {...stylex.props(styles.dialog)}
    >
      {name ? (
        <motion.div
          key={name}
          initial={{ opacity: 0, transform: 'translateY(14px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={still ? NONE : LAND}
          {...stylex.props(styles.body)}
        >
          <div {...stylex.props(styles.bar)}>
            <span {...stylex.props(styles.micro)}>Peek · peek@{LATEST}</span>
            <button
              type='button'
              onClick={onClose}
              {...stylex.props(styles.close)}
            >
              Close <kbd {...stylex.props(styles.kbd)}>Esc</kbd>
            </button>
          </div>
          <div {...stylex.props(styles.split)}>
            <div {...stylex.props(styles.frame)}>
              <Peek
                name={name}
                size={SHEET_SIZE}
                {...lookProps(look)}
                {...stylex.props(styles.fill)}
              />
            </div>
            <div {...stylex.props(styles.side)}>
              <h3 {...stylex.props(styles.h3)}>{name}</h3>
              <IdentityReadout name={name} compact />
            </div>
            <div {...stylex.props(styles.take)}>
              <pre {...stylex.props(styles.code)}>
                <code>{jsxFor(name, look, 64)}</code>
              </pre>
              <div {...stylex.props(styles.actions)}>
                {(Object.keys(LABEL) as Action[]).map((a) => {
                  const hit = done?.a === a
                  return (
                    <button
                      key={a}
                      type='button'
                      onClick={() => run(a)}
                      {...stylex.props(styles.action, hit && styles.hit)}
                    >
                      {hit ? <i {...stylex.props(styles.dot)} /> : null}
                      {hit ? (done.ok ? LABEL[a][1] : 'Failed') : LABEL[a][0]}
                    </button>
                  )
                })}
              </div>
              <p role='status' {...stylex.props(styles.status)}>
                {done
                  ? done.ok
                    ? `${LABEL[done.a][1]}.`
                    : 'That did not work in this browser.'
                  : `Files are ${FILE_SIZE} px SVG and ${FILE_SIZE * 2} px PNG, in this look.`}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </dialog>
  )
}

const styles = stylex.create({
  // the box closes on all four sides and clips the cells' outer rules, so a
  // short last row reads as an empty cell, not a notch
  grid: {
    display: 'grid',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
  },
  cols: (min: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))`,
  }),
  cell: {
    display: 'flex',
    marginRight: '-1px',
    marginBottom: '-1px',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: sheet['--rule'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  tile: {
    position: 'relative',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    minWidth: 0,
    paddingBlock: '22px 14px',
    paddingInline: '10px',
    borderWidth: 0,
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    backgroundColor: {
      default: 'transparent',
      '@media (hover: hover)': { default: null, ':hover': sheet['--chip'] },
    },
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    touchAction: 'manipulation',
    outlineOffset: { default: null, ':focus-visible': '-2px' },
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '100%',
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  text: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // the marker sits on the tile's corner, clear of a name that wraps
  corner: { position: 'absolute', top: '10px', right: '10px' },
  // the typed name is the subject: it gets two lines before it is cut
  typed: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    textAlign: 'center',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: sheet['--red'],
    flexShrink: 0,
  },

  dialog: {
    width: {
      default: '100%',
      '@media (width >= 48rem)': 'min(960px, 100% - 64px)',
    },
    maxWidth: '100%',
    maxHeight: {
      default: '92dvh',
      '@media (width >= 48rem)': 'calc(100dvh - 64px)',
    },
    marginBlock: { default: 'auto 0', '@media (width >= 48rem)': 'auto' },
    marginInline: 'auto',
    padding: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    backgroundColor: sheet['--page'],
    color: sheet['--fg'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--fg'],
    '::backdrop': { backgroundColor: sheet['--scrim'] },
  },
  body: {
    paddingInline: 'clamp(16px, 3vw, 32px)',
    paddingBlock: '0 28px',
  },
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    paddingBlock: '14px',
    marginBottom: '20px',
    backgroundColor: sheet['--page'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule-strong'],
  },
  micro: {
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
  },
  close: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    color: {
      default: sheet['--quiet'],
      '@media (hover: hover)': { default: null, ':hover': sheet['--fg'] },
    },
  },
  kbd: {
    fontFamily: 'inherit',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule-strong'],
    borderRadius: '4px',
    paddingInline: '5px',
    color: sheet['--fg'],
  },
  // wide: the face and the ways to take it home on the left, what the name
  // decided on the right, so neither column runs out early
  split: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (width >= 48rem)': 'minmax(0, 360px) minmax(0, 1fr)',
    },
    gridTemplateAreas: {
      default: '"frame" "side" "take"',
      '@media (width >= 48rem)': '"frame side" "take side"',
    },
    gridTemplateRows: { default: null, '@media (width >= 48rem)': 'auto 1fr' },
    gap: 'clamp(20px, 3vw, 36px)',
    alignItems: 'start',
  },
  take: {
    gridArea: 'take',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    minWidth: 0,
  },
  frame: {
    gridArea: 'frame',
    width: { default: 'min(100%, 320px)', '@media (width >= 48rem)': '100%' },
    marginInline: { default: 'auto', '@media (width >= 48rem)': 0 },
    aspectRatio: '1',
    boxShadow: `0 0 0 1px ${sheet['--edge']}`,
  },
  fill: { width: '100%', height: '100%' },
  side: {
    gridArea: 'side',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    minWidth: 0,
  },
  h3: {
    margin: 0,
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    overflowWrap: 'anywhere',
  },
  code: {
    margin: 0,
    paddingBlock: '12px',
    paddingInline: '14px',
    backgroundColor: sheet['--chip'],
    fontFamily: fonts['--mono'],
    fontSize: '12px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
  },
  action: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    minHeight: '44px',
    paddingInline: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: sheet['--rule-strong'],
      '@media (hover: hover)': { default: null, ':hover': sheet['--fg'] },
    },
    borderRadius: '22px',
    backgroundColor: 'transparent',
    color: sheet['--fg'],
    fontFamily: fonts['--mono'],
    fontSize: '10.5px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
    touchAction: 'manipulation',
  },
  hit: { borderColor: sheet['--fg'] },
  status: {
    minHeight: '1.6em',
    fontFamily: fonts['--mono'],
    fontSize: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: sheet['--quiet'],
    lineHeight: 1.6,
  },
})
