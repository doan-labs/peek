import { createFileRoute } from '@tanstack/react-router'
import { ApiServicePage } from '@/components/api-service-page'

const TITLE = 'Peek · API'
const DESCRIPTION =
  'The hosted Peek API from Doan Labs: request a face by URL and get SVG back, on your own endpoint, locked to your domains.'
const PAGE = 'https://peek.doan-labs.com/api-service'

export const Route = createFileRoute('/api-service')({
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
  component: ApiServicePage,
})
