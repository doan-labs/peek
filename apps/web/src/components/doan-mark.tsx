/*
 * The Doan Labs mark, still: a half disc, a ring, a triangle and a square turned
 * on its corner, one to a cell on a 24 grid. Transcribed from
 * doan-labs.com's `public/favicon.svg`; change it there first. Drawn in
 * currentColor, so it takes the ink of whatever holds it.
 */
export function DoanMark({ size }: { size: number }) {
  return (
    <svg viewBox='0 0 24 24' width={size} height={size} aria-hidden='true'>
      <path d='M5.6 3.4A4.1 4.1 0 0 1 5.6 11.6Z' fill='currentColor' />
      <circle
        cx='16.5'
        cy='7.5'
        r='3.6'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
      />
      <polygon points='7.5,12.9 3.5,20.1 11.5,20.1' fill='currentColor' />
      <rect
        x='13.9'
        y='13.9'
        width='5.2'
        height='5.2'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        transform='rotate(45 16.5 16.5)'
      />
    </svg>
  )
}
