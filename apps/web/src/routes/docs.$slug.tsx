import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsArticle, docsHead } from '@/components/docs-page'
import { PAGES } from '@/lib/docs'

const find = (slug: string) => PAGES.find((p) => p.slug && p.slug === slug)

export const Route = createFileRoute('/docs/$slug')({
  loader: ({ params }) => {
    if (!find(params.slug)) throw notFound()
  },
  head: ({ params }) => {
    const page = find(params.slug)
    return page ? docsHead(page) : {}
  },
  component: function DocsSlugPage() {
    return <DocsArticle page={find(Route.useParams().slug)!} />
  },
})
