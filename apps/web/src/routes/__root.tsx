import * as stylex from '@stylexjs/stylex'
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'
import { colors } from '@/lib/tokens.stylex'
import appCss from '../styles.css?url'

const SITE = 'https://peek.doan-labs.com'
/* Dev points the card at the local server, which has the file; the build
 * needs the live origin, since scrapers drop a relative URL. */
const CARD = `${import.meta.env.DEV ? '' : SITE}/og.png`
const TITLE = 'Peek · Coming soon'
const DESCRIPTION = 'Peek, from Doan Labs. Coming soon.'
const CARD_ALT =
  'Peek, icons from a string: a curious semicircle, a surprised circle and a happy diamond, each in its own ink frame.'

const styles = stylex.create({
  body: { backgroundColor: colors['--ground'] },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#121110' },
      /* The share card, public/og.png, 1200x630: a sheet from the Avatar
       * Studio, three faces in riso print. X reads only the twitter: tags,
       * so they repeat the og: ones. */
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE },
      { property: 'og:image', content: CARD },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: CARD_ALT },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
      { name: 'twitter:image', content: CARD },
      { name: 'twitter:image:alt', content: CARD_ALT },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      /* The semicircle peeking over the tab's edge, eyes up. The touch icon
       * is the same drawing, square, since iOS rounds its own corners. */
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        {/* The build appends StyleX's sheet to styles.css. Dev serves it
            separately, and this shell is not an index.html, so the plugin
            cannot inject it: the link is written here. */}
        {import.meta.env.DEV ? (
          <link rel='stylesheet' href='/virtual:stylex.css' />
        ) : null}
        <HeadContent />
      </head>
      <body {...stylex.props(styles.body)}>
        {children}
        <TanStackDevtools
          plugins={[
            { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
