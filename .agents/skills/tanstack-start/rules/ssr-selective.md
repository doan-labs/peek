# ssr-selective: Apply Selective SSR When Beneficial

## Priority: MEDIUM

## Explanation

Every route matching the initial request is server-rendered by default:
`beforeLoad` and `loader` run on the server and the component's HTML ships with
the document. That is what you want almost always - it is the difference between
a shareable, crawlable URL and a blank page that fills in later.

The `ssr` route property lets you opt a single route out when the default cannot
work: the loader needs `localStorage`, the component needs `canvas` or
`window.matchMedia` at first paint, or a third-party widget refuses to render
outside a browser. Reach for it per route, not per app - turning SSR off globally
is [SPA mode](https://tanstack.com/start/latest/docs/framework/react/spa-mode),
a much bigger decision.

| Value | `beforeLoad` / `loader` | Component |
|---|---|---|
| `true` (default) | server | server |
| `'data-only'` | server | client |
| `false` | client | client |

## Bad Example

```tsx
// Default SSR, but the loader touches a browser API - the server render throws
export const Route = createFileRoute('/dashboard/preferences')({
  loader: () => {
    const saved = localStorage.getItem('preferences') // ReferenceError on server
    return JSON.parse(saved ?? '{}')
  },
  component: PreferencesPage,
})
```

```tsx
// Disabling SSR to dodge one browser-only widget, costing the whole page its
// server-rendered HTML
export const Route = createFileRoute('/markets')({
  ssr: false,
  loader: loadMarketsBoard, // perfectly server-safe, now runs late on the client
  component: MarketsPage,
})
```

## Good Example: `ssr: false` for Browser-Only Routes

```tsx
// routes/dashboard.preferences.tsx
export const Route = createFileRoute('/dashboard/preferences')({
  ssr: false,
  loader: () => {
    // Now runs on the client during hydration, where localStorage exists
    return JSON.parse(localStorage.getItem('preferences') ?? '{}')
  },
  component: PreferencesPage,
})
```

## Good Example: `'data-only'` for Browser-Only Rendering

Keep the server round trip for data - so the loader still runs close to the
database and the page is not waterfall-ed - while leaving the render to the
client.

```tsx
// routes/markets.heatmap.tsx
export const Route = createFileRoute('/markets/heatmap')({
  // Fetch on the server; paint the WebGL canvas on the client
  ssr: 'data-only',
  loader: () => loadHeatmapCells(),
  component: HeatmapPage,
})
```

## Good Example: Keep SSR, Isolate the Widget

Usually better than opting the route out: server-render the page and wrap only
the browser-only subtree in `ClientOnly`.

```tsx
import { ClientOnly } from '@tanstack/react-router'

function MarketsPage() {
  return (
    <>
      <MarketsBoard /> {/* server-rendered, crawlable */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <WebGlChart />
      </ClientOnly>
    </>
  )
}
```

## Good Example: Changing the Default

```tsx
// src/start.ts
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
```

## Context

- `ssr` applies to the **initial server request** only; client navigations always
  run loaders on the client
- `ssr: false` costs the route its server-rendered HTML - no crawlable content,
  slower first paint, a spinner where markup used to be
- Prefer `ClientOnly` around the offending subtree, then `'data-only'`, then
  `false` - in that order
- A child cannot re-enable SSR that a parent disabled
- Marketing and detail pages should stay `true`; this is a tool for
  behind-the-login, browser-dependent screens
- `defaultSsr` in `createStart` flips the default for every route at once
