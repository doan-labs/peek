/*
 * The package managers' logos, one glyph each on a 32 unit square. Paths
 * from Material Icon Theme (MIT, Material Extensions). They draw in the
 * text colour; `on` paints the mark in the manager's own colour. Faces and
 * cut-outs are holes, so the ground shows through.
 */
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import type { Manager } from '@/components/figures/install'
import { brands } from '@/lib/tokens.stylex'

const BUN_EYES =
  'M8 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM20 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z'

/* The part that takes the colour, and anything drawn under it in the text
 * colour. */
const GLYPHS: Record<Manager, { mark: string; rest?: string }> = {
  npm: { mark: 'M4 4v24h24V4Zm20 20h-4V12h-4v12H8V8h16Z' },
  bun: {
    mark: `M30 17.045a9.8 9.8 0 0 0-.32-2.306l-.004.034a11.2 11.2 0 0 0-5.762-6.786c-3.495-1.89-5.243-3.326-6.8-3.811h.003c-1.95-.695-3.949.82-5.825 1.927-4.52 2.481-9.573 5.45-9.28 11.417.008-.029.017-.052.026-.08a9.97 9.97 0 0 0 3.934 7.257l-.01-.006C13.747 31.473 30.05 27.292 30 17.045ZM19.855 20.236A.8.8 0 0 0 19.26 20h-6.514a.8.8 0 0 0-.596.236.51.51 0 0 0-.137.463 4.37 4.37 0 0 0 1.641 2.339 4.2 4.2 0 0 0 2.349.926 4.2 4.2 0 0 0 2.343-.926 4.37 4.37 0 0 0 1.642-2.339.5.5 0 0 0-.132-.463Z${BUN_EYES}`,
  },
  pnpm: {
    mark: 'M2 2h8v8H2zm10 0h8v8h-8zm10 0h8v8h-8zm0 10h8v8h-8z',
    rest: 'M2 22h8v8H2zm10 0h8v8h-8zm10 0h8v8h-8zM12 12h8v8h-8z',
  },
  yarn: {
    mark: 'M27.575 23.967a9.9 9.9 0 0 0-3.751 1.726 22.6 22.6 0 0 1-5.537 2.504 1.55 1.55 0 0 1-.931.52 59 59 0 0 1-6.11.548c-1.102.008-1.777-.282-1.965-.735a1.49 1.49 0 0 1 .82-1.965 3.6 3.6 0 0 1-.486-.359c-.163-.162-.334-.487-.385-.367-.213.52-.324 1.794-.897 2.366-.786.795-2.273.53-3.153.069-.965-.513.069-1.718.069-1.718a.69.69 0 0 1-.94-.324 4.6 4.6 0 0 1-.632-2.794 5.2 5.2 0 0 1 1.674-2.76 8.84 8.84 0 0 1 .624-4.17 9.9 9.9 0 0 1 3-3.469S7.136 11.015 7.82 9.177c.444-1.196.623-1.187.769-1.239a3.44 3.44 0 0 0 1.375-.811 4.99 4.99 0 0 1 4.178-1.607s1.094-3.357 2.12-2.7a17.4 17.4 0 0 1 1.452 2.735s1.213-.71 1.35-.445a10.74 10.74 0 0 1 .495 5.81 13.3 13.3 0 0 1-2.46 5.127c-.129.214 1.47.889 2.477 3.683.932 2.554.103 4.699.248 4.938.026.043.034.06.034.06s1.068.085 3.213-1.24a8.05 8.05 0 0 1 4.05-1.52 1.026 1.026 0 0 1 .453 2Z',
  },
}

export function ManagerLogo({
  pm,
  on = false,
}: {
  pm: Manager
  on?: boolean
}): ReactNode {
  const g = GLYPHS[pm]
  return (
    <svg viewBox='0 0 32 32' aria-hidden='true' {...stylex.props(styles.logo)}>
      {g.rest ? <path d={g.rest} {...stylex.props(styles.rest)} /> : null}
      <path
        d={g.mark}
        fillRule='evenodd'
        {...stylex.props(styles.mark, on && styles[pm])}
      />
    </svg>
  )
}

const styles = stylex.create({
  logo: { width: '14px', height: '14px', flexShrink: 0 },
  mark: {
    fill: 'currentColor',
    transitionProperty: 'fill',
    transitionDuration: '0.2s',
  },
  rest: { fill: 'currentColor', fillOpacity: 0.45 },
  npm: { fill: brands['--npm'] },
  bun: { fill: brands['--bun'] },
  pnpm: { fill: brands['--pnpm'] },
  yarn: { fill: brands['--yarn'] },
})
