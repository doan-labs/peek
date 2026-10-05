import { createFileRoute } from '@tanstack/react-router'
import { StudioPage } from '@/components/studio-page'

const TITLE = 'Peek · Studio'
const DESCRIPTION =
  'Type a name, meet its face. The Peek studio from Doan Labs: every face, color and part, eleven expressions, and the API.'
const PAGE = 'https://peek.doan-labs.com/studio'

export const Route = createFileRoute('/studio')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: PAGE },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: PAGE }],
  }),
  component: StudioPage,
})
