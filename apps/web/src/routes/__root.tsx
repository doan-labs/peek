import * as stylex from '@stylexjs/stylex'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { colors } from '@/lib/tokens.stylex'
import appCss from '../styles.css?url'

const styles = stylex.create({
  body: {
    backgroundColor: colors['--paper'],
    color: colors['--ink'],
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Peek' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      /* No icon is designed yet. An empty one stops the browser asking for
       * /favicon.ico, a 404 on every page. */
      { rel: 'icon', href: 'data:,' },
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
        <Scripts />
      </body>
    </html>
  )
}
