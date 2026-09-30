# sec-csrf-protection: Protect Mutations With CSRF Middleware

## Priority: CRITICAL

## Explanation

Server functions and server routes are ordinary HTTP endpoints reachable from any
origin. If the browser attaches session cookies automatically, a page on another
site can trigger a state change on behalf of a logged-in user. TanStack Start
ships `createCsrfMiddleware()`, which validates `Sec-Fetch-Site`, `Origin` and
(as a fallback) `Referer` before the handler runs, and returns 403 when the
request did not come from your own origin.

Register it as **request** middleware in `createStart` so it covers every server
function and SSR request at once - a per-endpoint opt-in is one forgotten
endpoint away from a hole.

## Bad Example

```tsx
// A cookie-authenticated mutation with no origin check. Any site can POST here
// from a logged-in user's browser and the cookie rides along.
export const deleteApiKey = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    await db.apiKeys.delete({ where: { id: data.id, userId: session.userId } })
  })
```

```tsx
// Hand-rolled and wrong: `Origin` is absent on same-origin GETs and on some
// navigations, so this both over-blocks and under-blocks.
if (request.headers.get('origin') !== 'https://hyperwatcher.app') {
  throw new Error('bad origin')
}
```

## Good Example: Global Request Middleware

```tsx
// src/start.ts
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const csrfMiddleware = createCsrfMiddleware({
  // Defaults to the trusted request origin; list extras explicitly.
  origin: ['https://hyperwatcher.app'],
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}))
```

## Good Example: Scoping With `filter`

Public read-only endpoints - a webhook receiver with its own signature check, a
public JSON feed - should skip origin validation, because a legitimate caller has
no `Origin` to present.

```tsx
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ request }) => {
    const { pathname } = new URL(request.url)

    // Stripe verifies itself with a signature; it has no browser origin.
    if (pathname.startsWith('/api/webhooks/')) return false

    // Public GET feeds are safe to serve cross-origin.
    if (request.method === 'GET' && pathname.startsWith('/api/public/')) {
      return false
    }

    return true
  },
})
```

## Good Example: Custom Failure Response

```tsx
const csrfMiddleware = createCsrfMiddleware({
  secFetchSite: ['same-origin', 'same-site'],
  failureResponse: () =>
    Response.json(
      { error: 'cross_origin_request_rejected' },
      { status: 403 },
    ),
})
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `filter` | validates everything | Return `false` to skip this request |
| `origin` | the trusted request origin | Allowed `Origin` values, or a predicate |
| `secFetchSite` | `'same-origin'` | Allowed `Sec-Fetch-Site` values |
| `referer` | `true` | Use `Referer` when `Sec-Fetch-Site` and `Origin` are absent |
| `allowRequestsWithoutOriginCheck` | `false` | Allow requests presenting none of the three |
| `failureResponse` | `403 Forbidden` | Response returned on rejection |

## Context

- Register globally via `createStart({ requestMiddleware })` - opt endpoints out
  with `filter`, never opt them in one at a time
- Leave `allowRequestsWithoutOriginCheck` at `false`; flipping it to `true`
  disables the protection for exactly the clients that would attack you
- CSRF middleware is not a substitute for authorization - the handler must still
  check that the session may touch the record it was handed
- Webhooks need their own authenticity check (signature verification), since they
  are excluded from origin validation
- `isCsrfRequestAllowed()` exposes the same check if you need it inline
