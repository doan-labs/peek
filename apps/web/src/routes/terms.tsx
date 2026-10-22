/* PLACEHOLDER: Thanh to review */
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/components/legal-page'
import { REPO } from '@/lib/docs'

const TITLE = 'Peek · Terms'
const DESCRIPTION =
  'The terms for Peek and the hosted Peek API, from Doan Labs.'
const PAGE = 'https://peek.doan-labs.com/terms'

export const Route = createFileRoute('/terms')({
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
  component: () => (
    <LegalPage
      title='Terms'
      updated='22 October 2026'
      sections={[
        {
          h: 'The library',
          body: [
            `The [Peek library](/docs) is MIT licensed. See the [license on GitHub](${REPO}/blob/main/LICENSE).`,
          ],
        },
        {
          h: 'The site and the API',
          body: [
            'The site and the [hosted API](/api-service) are provided as is, without warranty.',
            'Plans and prices are on the [API page](/api-service#pricing). Access starts by email, and anything beyond a listed plan is agreed by email.',
          ],
        },
        {
          h: 'Contact',
          body: ['Questions: [hi@doan-labs.com](mailto:hi@doan-labs.com).'],
        },
      ]}
    />
  ),
})
