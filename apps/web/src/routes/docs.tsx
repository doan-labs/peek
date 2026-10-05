import { createFileRoute } from '@tanstack/react-router'
import { DocsLayout } from '@/components/docs-page'

export const Route = createFileRoute('/docs')({
  head: () => ({
    links: [{ rel: 'alternate', type: 'text/plain', href: '/llms.txt' }],
  }),
  component: DocsLayout,
})
