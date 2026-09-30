import * as stylex from '@stylexjs/stylex'
import { createFileRoute } from '@tanstack/react-router'
import { colors } from '@/lib/tokens.stylex'

const styles = stylex.create({
  main: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '100dvh',
    padding: '1.5rem',
  },
  lede: { color: colors['--ink-muted'] },
})

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main id='main' {...stylex.props(styles.main)}>
      <div>
        <h1>Peek</h1>
        <p {...stylex.props(styles.lede)}>Icons from a string.</p>
      </div>
    </main>
  )
}
