# sf-response-headers: Customize Response Headers When Needed

## Priority: MEDIUM

## Explanation

Server functions and loaders run inside a request context, so they can shape the
outgoing response without returning a `Response` object. Import the helpers from
`@tanstack/react-start/server`:

- `setResponseHeader(name, value)` - one header
- `setResponseHeaders(headers)` - a `Headers` object
- `setResponseStatus(code, text?)` - the status line
- `getRequest()`, `getRequestHeader(name)` - read the incoming request

These are the current names. `setHeaders` and `getWebRequest` were earlier
spellings and no longer exist.

The one that matters most is `Cache-Control`. `public` tells every CDN and proxy
between you and the user that the response may be handed to **anyone**. If the
handler reads a session, a cookie, or an auth header - or branches on identity at
all - `public` will cache one user's response and replay it to the next.

## Bad Example

```tsx
import { setHeaders } from '@tanstack/react-start/server' // does not exist

export const getMyOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()

    // Identity-dependent response marked shareable - the next user gets this
    // user's orders straight from the CDN
    setHeaders({ 'Cache-Control': 'public, max-age=300' })

    return db.orders.findMany({ where: { userId: session.userId } })
  },
)
```

## Good Example: Public, Non-Personalized Data

```tsx
import {
  setResponseHeaders,
  setResponseStatus,
} from '@tanstack/react-start/server'

export const getPublicData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(
      new Headers({
        // Safe: the response does not depend on who is asking.
        'Cache-Control': 'public, max-age=300',
        'CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=600',
      }),
    )
    setResponseStatus(200)

    return fetchPublicData()
  },
)
```

## Good Example: Authenticated Data

```tsx
export const getMyOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()

    setResponseHeaders(
      new Headers({
        // Only the user-agent may cache. `Vary` keys any intermediary that does
        // cache by identity rather than URL alone.
        'Cache-Control': 'private, max-age=60',
        Vary: 'Cookie, Authorization',
      }),
    )

    return db.orders.findMany({ where: { userId: session.userId } })
  },
)

// For anything sensitive, opt out entirely:
// setResponseHeaders(new Headers({ 'Cache-Control': 'no-store' }))
```

## Good Example: Status Codes

```tsx
import { setResponseStatus } from '@tanstack/react-start/server'

export const createApiKey = createServerFn({ method: 'POST' })
  .validator(createKeySchema)
  .handler(async ({ data }) => {
    const key = await db.apiKeys.create({ data })

    setResponseStatus(201)
    return key
  })
```

For not-found and redirect outcomes, throw `notFound()` / `redirect()` rather
than setting the status by hand - the router owns those and needs to unwind the
load. See [`err-not-found`](./err-not-found.md) and
[`err-redirects`](./err-redirects.md).

## Good Example: Reading the Request

```tsx
import { getRequest, getRequestHeader } from '@tanstack/react-start/server'

export const getLocale = createServerFn().handler(async () => {
  const accepted = getRequestHeader('accept-language') ?? 'en'
  const { pathname } = new URL(getRequest().url)

  return negotiateLocale(accepted, pathname)
})
```

## Good Example: Headers From a Loader

The same helpers work in a route loader, which is how page-level CDN caching is
set. See [`ssr-prerender`](./ssr-prerender.md) for the ISR pattern.

```tsx
export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)

    setResponseHeaders(
      new Headers({
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }),
    )

    return post
  },
})
```

## Context

- Import from `@tanstack/react-start/server`; that specifier is denied in the
  client bundle by import protection, which is the intended safety net
- `setResponseHeaders` takes a `Headers` object; `setResponseHeader` takes a pair
- `public` is only ever correct for responses that do not depend on identity
- Add `Vary: Cookie, Authorization` to any cacheable authenticated response
- `setResponseStatus` is for ordinary statuses; use `notFound()` / `redirect()`
  for 404s and 3xx so the router unwinds correctly
- These are no-ops on client-side navigations - there is no response to shape
