import * as stylex from '@stylexjs/stylex'
import { sheet } from '@/lib/tokens.stylex'

/* The brand tile from the v1.2 sheet: the Doan Labs mark knocked out of an
 * ink square, the diamond with its eye. */
export function BrandMark() {
  return (
    <svg
      viewBox='0 0 400 400'
      aria-hidden='true'
      {...stylex.props(styles.mark)}
    >
      <rect width='400' height='400' {...stylex.props(styles.markTile)} />
      <g {...stylex.props(styles.markInk)}>
        <path d='M120 95A50 50 0 0 1 120 195Z' />
        <circle
          cx='243'
          cy='140'
          r='36'
          fill='none'
          strokeWidth='18'
          {...stylex.props(styles.markRing)}
        />
        <path d='M145 214L196 302L94 302Z' />
        <path
          d='M257 194L315 252L257 310L199 252ZM257 226L231 252L257 278L283 252Z'
          fillRule='evenodd'
        />
      </g>
    </svg>
  )
}

const styles = stylex.create({
  mark: { width: '30px', height: '30px', flexShrink: 0 },
  markTile: { fill: sheet['--fg'] },
  markInk: { fill: sheet['--page'] },
  markRing: { fill: 'none', stroke: sheet['--page'] },
})
