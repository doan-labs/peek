/*
 * One reference section of /studio, the .sec of the v1.2 sheet: an ink rule,
 * a heading on the left, a note on the right, generous air below. Notes
 * here run to sentences, so they are set in the sans, not tracked caps.
 */
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { fonts, sheet } from '@/lib/tokens.stylex'

export function StudioSection({
  id,
  index,
  flush = false,
  title,
  note,
  children,
}: {
  id: string
  index: string
  /** No rule on top: the control bar above already draws one. */
  flush?: boolean
  title: string
  note: ReactNode
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={`${id}-h`}
      {...stylex.props(styles.sec, flush && styles.flush)}
    >
      <div {...stylex.props(styles.head)}>
        <h2 id={`${id}-h`} {...stylex.props(styles.h2)}>
          <span aria-hidden='true' {...stylex.props(styles.index)}>
            {index}
          </span>
          {title}
        </h2>
        <p {...stylex.props(styles.note)}>{note}</p>
      </div>
      {children}
    </section>
  )
}

const styles = stylex.create({
  sec: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--fg'],
    paddingBlock: '28px 72px',
    scrollMarginTop: '7rem',
  },
  flush: { borderTopWidth: 0, paddingTop: '36px' },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '12px 32px',
    marginBottom: '36px',
  },
  h2: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '14px',
    margin: 0,
    fontSize: 'clamp(28px, 3.4vw, 40px)',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
  },
  index: {
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    fontWeight: 400,
    letterSpacing: '0.06em',
    color: sheet['--quiet'],
    transform: 'translateY(-0.9em)',
  },
  note: {
    maxWidth: '44ch',
    fontSize: '13.5px',
    lineHeight: 1.5,
    color: sheet['--soft'],
    textWrap: 'pretty',
  },
})
