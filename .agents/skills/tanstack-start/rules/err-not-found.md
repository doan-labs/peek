# err-not-found: Handle Not-Found Scenarios

## Priority: MEDIUM

## Explanation

When a loader cannot resolve the thing the URL names, `throw notFound()`. The
router stops the load, renders the nearest `notFoundComponent`, and - on the
initial server request - sends a real **HTTP 404**. Rendering an "not found"
message from the component instead returns 200 with sad text in the body, which
tells crawlers the page exists and keeps the dead URL indexed.

`notFound()` is exported from `@tanstack/react-router`, not from
`@tanstack/react-start`.

## Bad Example

```tsx
export const Route = createFileRoute('/markets/$asset')({
  loader: async ({ params }) => {
    const asset = resolveAsset(params.asset)
    // Null flows through as loader data
    return { asset }
  },
  component: AssetDetailPage,
})

function AssetDetailPage() {
  const { asset } = Route.useLoaderData()

  // HTTP 200 - the URL now "exists" as far as any crawler is concerned
  if (!asset) {
    return <p>Asset not found</p>
  }

  return <AssetDetail asset={asset} />
}
```

## Good Example: Throw From the Loader

```tsx
// routes/markets.$asset.tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { AssetNotFound } from '#/components/markets/asset-detail-body.tsx'

export const Route = createFileRoute('/markets/$asset')({
  loader: async ({ params }) => {
    const resolved = resolveAsset(params.asset)
    if (!resolved) {
      // Unknown slug 404s on the server, before any feed is fetched
      throw notFound()
    }

    return loadAssetDetail(resolved)
  },
  notFoundComponent: AssetNotFound,
  component: AssetDetailPage,
})
```

The `notFoundComponent` is referenced by value, so it lives in `src/components/`
alongside the page body rather than being exported from the route file - see
[`file-route-exports`](./file-route-exports.md).

## Good Example: Global Fallback

Routes without their own `notFoundComponent` fall back to the router default.

```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { NotFoundScreen } from '#/components/marketing/error-console.tsx'

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundScreen,
})
```

## Good Example: Not-Found With Data

Pass data to the boundary when the message can be more useful than "not found".

```tsx
export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)
    if (!post) {
      throw notFound({ data: { slug: params.slug } })
    }
    return post
  },
  notFoundComponent: ({ data }) => (
    <PostMissing slug={(data as { slug: string } | undefined)?.slug} />
  ),
})
```

## Verifying

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/markets/not-a-real-asset
# 404
```

Assert the status in e2e, not just the copy - a component that renders the right
words under a 200 passes a text-only assertion.

## Context

- Import `notFound` from `@tanstack/react-router`
- Always `throw` it; a returned value becomes loader data
- Throw as early as possible - validating the param before fetching avoids the
  round trip entirely
- Nearest `notFoundComponent` wins; `defaultNotFoundComponent` on the router is
  the fallback
- The initial server request gets a real 404; client navigations render the same
  boundary without a round trip
- `match.status === 'notFound'` is how a not-found match reads in router state
  (the old `globalNotFound` field is private as of router 1.170.19)
