/*
 * The docs' code block. A header with the language (or a file name) and a
 * copy button, numbered lines, and a hand-rolled tokenizer: keywords,
 * strings, tags, calls, numbers, props and punctuation are all the snippets
 * use, and it keeps a highlighter off the page.
 *
 * Two Peek touches. Every name a snippet hands to Peek (`name="Ada"`,
 * `toSvg('Ada')`, `identify('Ada')`) wears that face beside the string, so
 * the code shows what it draws. And copying pops a small face out of the
 * button, happy for a beat.
 *
 * Live snippets (a figure's code, rewritten as the reader plays) flash each
 * line that just changed. Copy always takes the plain text.
 */
import { AXES, type PeekProps } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { FaceChip } from '@/components/figures/kit'
import { Peek } from '@/components/peek'
import { CURVE, LAND, NONE } from '@/lib/motion'
import { fonts, sheet } from '@/lib/tokens.stylex'

export type Lang = 'tsx' | 'ts' | 'bash'
type Kind =
  | 'key'
  | 'str'
  | 'num'
  | 'tag'
  | 'fn'
  | 'prop'
  | 'punct'
  | 'com'
  | 'plain'

const KEYWORDS = new Set([
  'const',
  'let',
  'if',
  'else',
  'return',
  'import',
  'from',
  'export',
  'function',
  'await',
  'async',
  'type',
  'new',
  'default',
  'true',
  'false',
  'null',
  'undefined',
  'as',
  'of',
  'for',
])
const SHELL = new Set(['npm', 'bun', 'pnpm', 'yarn', 'npx', 'bunx'])

// comments and strings first, so their insides are never split; the last
// alternative catches anything else, or matchAll would drop it
const TOKEN =
  /(\/\/.*|#.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$-]*)|([{}()[\],;:.=<>!&|+\-*/?]+)|(\s+)|[\s\S]/g

type Token = { kind: Kind; text: string; name?: string }

/** A string a snippet hands to Peek as the name, unquoted, or undefined. */
function nameIn(before: string, text: string) {
  if (!/(?:\bname=\{?|\b(?:toSvg|identify)\()\s*$/.test(before)) return
  return text.slice(1, -1)
}

type Axes = Partial<PeekProps>

/** The axis props a snippet sets (`face="circle"`), so its inline faces
 * wear them too. One set per snippet: they all describe one Peek. */
function axesIn(code: string): Axes {
  const out: Record<string, string> = {}
  for (const [, k, v] of code.matchAll(/\b(\w+)=["']([\w-]+)["']/g))
    if (k && v && (AXES as string[]).includes(k)) out[k] = v
  return out as Axes
}

export function tokens(line: string, lang: Lang): Token[] {
  const out: Token[] = []
  for (const m of line.matchAll(TOKEN)) {
    const [text, com, str, tag, num, word, punct] = m
    const before = line.slice(0, m.index)
    const after = line.slice(m.index + text.length)
    let kind: Kind = 'plain'
    let name: string | undefined
    if (com && (lang !== 'bash' || com.startsWith('#'))) kind = 'com'
    else if (str) {
      kind = 'str'
      name = nameIn(before, str)
    } else if (tag && lang === 'tsx') kind = 'tag'
    else if (num) kind = 'num'
    else if (word) {
      if (lang === 'bash')
        kind = SHELL.has(word) && !before.trim() ? 'fn' : 'plain'
      else if (KEYWORDS.has(word)) kind = 'key'
      else if (after.startsWith('(')) kind = 'fn'
      else if (lang === 'tsx' && after.startsWith('=') && /\s$/.test(before))
        kind = 'prop'
      else if (/\.\s*$/.test(before) || /^\s*\??:/.test(after)) kind = 'prop'
    } else if (punct && lang !== 'bash') kind = 'punct'
    out.push({ kind, text, name })
  }
  return out
}

function Line({ code, lang, axes }: { code: string; lang: Lang; axes: Axes }) {
  let at = 0
  return (
    <>
      {tokens(code, lang).map((t) => {
        const key = at
        at += t.text.length
        return (
          <Fragment key={key}>
            {t.kind === 'plain' ? (
              t.text
            ) : (
              <span {...stylex.props(styles[t.kind])}>{t.text}</span>
            )}
            {t.name?.trim() ? <NameFace name={t.name} axes={axes} /> : null}
          </Fragment>
        )
      })}
    </>
  )
}

/** The face a name in the code draws, set in the line like a glyph. */
function NameFace({ name, axes }: { name: string; axes: Axes }) {
  return (
    <span {...stylex.props(styles.nameFace)}>
      {/* it draws exactly the line it sits in, outfit and all */}
      <FaceChip
        eyewear='none'
        headwear='none'
        neckwear='none'
        {...axes}
        name={name}
      />
    </span>
  )
}

const LABEL: Record<Lang, string> = {
  tsx: 'TSX',
  ts: 'TypeScript',
  bash: 'Terminal',
}

export function CodeBlock({
  code,
  lang = 'tsx',
  title,
  live = false,
  action,
}: {
  code: string
  lang?: Lang
  /** A file name in the header, in place of the language. */
  title?: string
  /** Flash lines that change between renders. */
  live?: boolean
  /** A control beside copy, such as a figure's Run. */
  action?: ReactNode
}) {
  const lines = code.split('\n')
  const fresh = useFresh(lines, live)
  const many = lines.length > 1
  const axes = axesIn(code)
  return (
    <div {...stylex.props(styles.box)}>
      <div {...stylex.props(styles.head)}>
        <span {...stylex.props(styles.label)}>
          <span aria-hidden='true' {...stylex.props(styles.dot)} />
          {title ?? LABEL[lang]}
        </span>
        <span {...stylex.props(styles.actions)}>
          {action}
          <CopyCode text={code} face={firstName(code, lang)} />
        </span>
      </div>
      <pre data-lenis-prevent {...stylex.props(styles.pre)}>
        <code {...stylex.props(styles.code)}>
          {lines.map((line, i) => (
            <span
              // a changed line remounts, so its flash plays once
              key={fresh.has(i) ? `${i}:${line}` : i}
              {...stylex.props(styles.line, fresh.has(i) && styles.flash)}
            >
              {many ? (
                <span aria-hidden='true' {...stylex.props(styles.gutter)}>
                  {i + 1}
                </span>
              ) : lang === 'bash' ? (
                <span aria-hidden='true' {...stylex.props(styles.prompt)}>
                  $
                </span>
              ) : null}
              <span {...stylex.props(styles.text)}>
                <Line code={line} lang={lang} axes={axes} />
                {'\n'}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/** Indexes of lines that differ from the last render, when live. */
function useFresh(lines: string[], live: boolean) {
  const prev = useRef<string[] | null>(null)
  const fresh = new Set<number>()
  if (live && prev.current)
    lines.forEach((l, i) => {
      if (prev.current?.[i] !== l) fresh.add(i)
    })
  useEffect(() => {
    prev.current = lines
  })
  return fresh
}

const firstName = (code: string, lang: Lang) => {
  for (const line of code.split('\n'))
    for (const t of tokens(line, lang)) if (t.name?.trim()) return t.name
  return 'Peek'
}

/** Copy, with a face that pops out of the button for a beat. */
function CopyCode({ text, face }: { text: string; face: string }) {
  const [done, setDone] = useState(false)
  const reduce = useReducedMotion()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const swap = reduce ? NONE : { duration: 0.18, ease: CURVE }
  return (
    <motion.button
      type='button'
      tabIndex={0}
      aria-label={done ? 'Copied' : 'Copy code'}
      title={done ? 'Copied' : 'Copy code'}
      whileTap={{ scale: reduce ? 1 : 0.94 }}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setDone(false), 1600)
      }}
      {...stylex.props(styles.copy)}
    >
      <AnimatePresence>
        {done ? (
          <motion.span
            key='face'
            aria-hidden='true'
            initial={{ opacity: 0, x: 0, scale: 0.4, rotate: -14 }}
            animate={{ opacity: 1, x: -30, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -40, scale: 0.8 }}
            transition={reduce ? NONE : LAND}
            {...stylex.props(styles.pop)}
          >
            <Peek
              name={face}
              size={24}
              frame='none'
              title={false}
              expression='happy'
              animate
            />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={String(done)}
          initial={{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(2px)' }}
          animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
          exit={{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(2px)' }}
          transition={swap}
          {...stylex.props(styles.icon)}
        >
          {done ? <Check /> : <CopyIcon />}
        </motion.span>
      </AnimatePresence>
      <span aria-live='polite' {...stylex.props(styles.copyText)}>
        {done ? 'Copied' : 'Copy'}
      </span>
    </motion.button>
  )
}

const ICON = {
  width: 13,
  height: 13,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const CopyIcon = () => (
  <svg aria-hidden='true' {...ICON}>
    <rect x='9' y='9' width='12' height='12' rx='2' />
    <path d='M5 15V5a2 2 0 0 1 2-2h10' />
  </svg>
)
const Check = () => (
  <svg aria-hidden='true' {...ICON}>
    <path d='M20 6 9 17l-5-5' />
  </svg>
)

const HOVER = '@media (hover: hover)'

const flash = stylex.keyframes({
  from: { backgroundColor: sheet['--code-flash'] },
  to: { backgroundColor: 'transparent' },
})

const styles = stylex.create({
  box: {
    marginTop: '24px',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: sheet['--rule'],
    borderRadius: '12px',
    backgroundColor: sheet['--code-bg'],
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    height: '38px',
    paddingInline: '14px 6px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: fonts['--mono'],
    fontSize: '11.5px',
    letterSpacing: '0.02em',
    color: sheet['--quiet'],
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: sheet['--rule-strong'],
  },
  actions: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  pre: {
    margin: 0,
    padding: '14px 0',
    overflowX: 'auto',
    fontFamily: fonts['--mono'],
    fontSize: '13.5px',
    lineHeight: 1.75,
    scrollbarWidth: 'thin',
  },
  code: { display: 'block', minWidth: 'max-content', fontFamily: 'inherit' },
  line: { display: 'flex', paddingInline: '16px 24px' },
  flash: {
    animationName: flash,
    animationDuration: '1.2s',
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  gutter: {
    flexShrink: 0,
    width: '2ch',
    marginRight: '18px',
    textAlign: 'right',
    color: sheet['--code-punct'],
    opacity: 0.6,
    userSelect: 'none',
  },
  prompt: {
    flexShrink: 0,
    marginRight: '12px',
    color: sheet['--code-punct'],
    userSelect: 'none',
  },
  text: { whiteSpace: 'pre', color: sheet['--code-prop'] },
  key: { color: sheet['--code-key'] },
  str: { color: sheet['--code-str'] },
  num: { color: sheet['--code-num'] },
  tag: { color: sheet['--code-tag'] },
  fn: { color: sheet['--code-fn'] },
  prop: { color: sheet['--code-prop'] },
  punct: { color: sheet['--code-punct'] },
  com: { color: sheet['--code-com'], fontStyle: 'italic' },
  nameFace: {
    display: 'inline-flex',
    marginInline: '6px 2px',
    verticalAlign: '-5px',
  },
  copy: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '28px',
    paddingInline: '10px',
    borderWidth: 0,
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '12.5px',
    fontWeight: 500,
    color: {
      default: sheet['--quiet'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    cursor: 'pointer',
    transitionProperty: 'color, background-color',
    transitionDuration: '0.15s',
  },
  icon: { display: 'inline-flex' },
  copyText: { minWidth: '44px', textAlign: 'left' },
  pop: {
    position: 'absolute',
    left: '0px',
    top: '2px',
    pointerEvents: 'none',
    display: 'inline-flex',
  },
})
