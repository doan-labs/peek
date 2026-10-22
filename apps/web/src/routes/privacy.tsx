/* PLACEHOLDER: Thanh to review */
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/components/legal-page'

const TITLE = 'Peek · Privacy'
const DESCRIPTION = 'How Peek, from Doan Labs, handles your data.'
const PAGE = 'https://peek.doan-labs.com/privacy'

export const Route = createFileRoute('/privacy')({
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
      title='Privacy'
      updated='22 October 2026'
      sections={[
        {
          h: 'Who we are',
          // PLACEHOLDER: confirm there are no cookies or analytics
          body: [
            'Peek is made by [Doan Labs](https://doan-labs.com). This site does not use cookies or analytics.',
          ],
        },
        {
          h: 'Email',
          body: [
            'If you email us or join a waitlist, we keep your address only to reply and to tell you about Peek. Ask at [hi@doan-labs.com](mailto:hi@doan-labs.com) and we delete it.',
          ],
        },
        {
          h: 'Hosting',
          body: [
            'The site is served by [Cloudflare](https://www.cloudflare.com/privacypolicy/), which may log requests (such as IP address) for security.',
          ],
        },
        {
          h: 'The library',
          body: [
            'The [npm package](https://www.npmjs.com/package/@doan-labs/peek) runs in your app and sends nothing to us.',
          ],
        },
      ]}
    />
  ),
})
