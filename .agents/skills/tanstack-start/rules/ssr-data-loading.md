# ssr-data-loading: Load Data Appropriately for SSR

## Priority: MEDIUM

## Explanation

A route's `loader` runs on the server for the initial request and on the client
for subsequent navigations. Everything it returns is serialized into the document
and handed to the component, so the first paint already has real data - no
loading spinner, no effect, no hydration flash.

The failure modes are all about *shape*: fetching in the component instead of the
loader (waterfall + spinner), awaiting independent fetches in sequence (the page
waits for the sum), and letting one slow feed hold the whole page hostage.

## Bad Example

```tsx
// Fetching in the component - SSR emits an empty shell and the browser starts
// the request only after hydration
function AssetDetailPage() {
  const { asset } = Route.useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchAsset(asset).then(setData)
  }, [asset])

  if (!data) return <Spinner />
  return <AssetDetail data={data} />
}
```

```tsx
// Sequential awaits - total latency is the sum, not the max
loader: async ({ params }) => {
  const board = await loadBoard()
  const metadata = await loadMetadata(params.asset)
  const candles = await loadCandles(params.asset)
  return { board, metadata, candles }
}
```

## Good Example: Parallel, Fault-Tolerant Loader

From `routes/markets.$asset.tsx`. Each seed never throws - it resolves to `null`
on failure - so one dead feed degrades a single panel instead of 500-ing the
page, and the client's poll fills it in on the next tick.

```tsx
export const Route = createFileRoute('/markets/$asset')({
  loader: async ({ params }) => {
    const resolved = resolveAsset(params.asset)
    if (!resolved) {
      throw notFound()
    }

    const { assetId, quote } = backendAssetKey(resolved)

    // Every feed in flight at once; slowest one sets the latency, not the sum.
    const [board, metadataSeed, candlesSeed] = await Promise.all([
      loadMarketsBoard().then((r) => r.board),
      loadAssetMetadataSeed(assetId, quote),
      loadAssetCandlesSeed(assetId, quote),
    ])

    return { slug: params.asset, boardSeed: board, metadataSeed, candlesSeed }
  },
  component: AssetDetailPage,
})
```

## Good Example: Pending UI That Actually Shows

The router's default `pendingMs` is 1000 - for a 200ms loader the user sees
nothing happen, then a jump. Drop it to 0 with a floor so the shell does not
flicker.

```tsx
export const Route = createFileRoute('/markets/$asset')({
  loader: loadAssetDetail,
  pendingComponent: AssetDetailPending,
  pendingMs: 0,
  pendingMinMs: 200,
})
```

## Good Example: Caching and Preload

`defaultPreload: 'intent'` starts the loader on hover; a non-zero stale time is
what makes that preload still valid by the time the click lands. With
`defaultPreloadStaleTime: 0` the hover work is thrown away and the click refetches.

```tsx
// src/router.tsx
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
})
```

```tsx
// Per route, when this route's data ages differently
export const Route = createFileRoute('/markets/$asset')({
  loader: loadAssetDetail,
  staleTime: 30_000,
})
```

## Good Example: Remount on Param Change

By default the component is reused across a param change. If its hooks seed from
loader data with `useState(seed)`, they keep the *previous* asset's state and the
new data never lands. `remountDeps` throws that state away.

```tsx
export const Route = createFileRoute('/markets/$asset')({
  loader: loadAssetDetail,
  // BTC → ETH must reset the seeded feed hooks and the chart timeframe
  remountDeps: ({ params }) => ({ asset: params.asset }),
})
```

## Good Example: Typed Access in the Component

```tsx
function AssetDetailPage() {
  const { slug, boardSeed, metadataSeed } = Route.useLoaderData()

  return (
    <AssetDetailBody
      slug={slug}
      boardSeed={boardSeed}
      metadataSeed={metadataSeed}
    />
  )
}
```

## Context

- Fetch in the `loader`, not in the component - that is what makes SSR worth
  having
- `Promise.all` independent fetches; sequential `await`s add up
- Let individual feeds fail soft (`null`) rather than taking the page down, when
  the UI can render a degraded panel honestly
- `pendingMs: 0` + `pendingMinMs` for fast loaders; the 1000ms default is a
  no-op for them
- `defaultPreload: 'intent'` needs a non-zero `defaultPreloadStaleTime` to pay off
- `remountDeps` whenever component state is seeded from loader data
- Loader data is serialized into the HTML - do not return anything the client
  should not see (see [`sec-sensitive-data`](./sec-sensitive-data.md))
