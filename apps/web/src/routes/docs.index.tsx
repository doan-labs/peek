import { createFileRoute } from '@tanstack/react-router'
import { DocsArticle, docsHead } from '@/components/docs-page'
import { PAGES } from '@/lib/docs'

const page = PAGES[0]!

export const Route = createFileRoute('/docs/')({
  head: () => docsHead(page),
  component: () => <DocsArticle page={page} />,
})
