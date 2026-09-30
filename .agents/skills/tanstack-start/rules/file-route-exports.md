# file-route-exports: Route Files Export Only `Route`

## Priority: HIGH

## Explanation

`tanstackStart()` enables automatic code-splitting, which rewrites each route
file so its `component`, `loader`, and friends land in separate chunks loaded on
demand. The transform can only do that for a file whose *sole* export is `Route`.
Any additional export means something outside the route may import the module, so
the splitter has to keep the whole file - components, helpers, constants and all -
in the eagerly-loaded graph, and warns on every dev-server start:

```
[tanstack-router] These exports from ".../routes/admin.tsx" will not be
code-split and will increase your bundle size: - AdminLayout
```

The usual cause is a test that wants to render the page component directly. Move
the component to `src/components/`, import it back into the route file, and the
test imports it from its new home.

## Bad Example

```tsx
// routes/admin.tsx - two exports, so nothing in this file gets split
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

// Exported only so `src/test/admin-ui.test.tsx` can render it
export function AdminLayout() {
  return <Outlet />
}
```

## Good Example

```tsx
// components/admin/admin-layout.tsx
import { Outlet } from '@tanstack/react-router'

export function AdminLayout() {
  return <Outlet />
}
```

```tsx
// routes/admin.tsx - registration only
import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '#/components/admin/admin-layout'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})
```

```tsx
// src/test/admin-ui.test.tsx
import { AdminLayout } from '#/components/admin/admin-layout'
```

A route file may still hold a component that nothing else needs - a thin page
wrapper that reads `Route.useLoaderData()` and forwards it - as long as that
component is not exported.

## Context

- One export per route file: `Route`. Nothing else, including types and constants
- `notFoundComponent` / `errorComponent` targets live in `src/components/` too,
  since the route references them by value
- The warning is per-export and per-file; it names exactly what to move
- `bun run build` prints the same warnings - grep the build log for
  `tanstack-router` to confirm a file is clean
- Route naming and layout conventions live in
  [`file-route-naming`](./file-route-naming.md) - read both before adding a route
