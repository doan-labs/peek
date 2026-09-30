# file-route-naming: Route File and Page Component Naming

## Priority: HIGH

This is the **canonical naming convention** for `src/routes/`. Every other rule
defers to it. If a route file or route component disagrees with this file, this
file wins.

## Explanation

TanStack Router derives each route's URL **from the file name itself** - there is
no fixed `page.tsx` like Next.js. The same tree can be expressed two ways:

- **Flat** dot-notation - `dashboard.keys.tsx` → `/dashboard/keys`
- **Directory** - `dashboard/keys.tsx` + `dashboard/route.tsx`

Both can be mixed, which lets the route tree drift into two styles. Worse, in
flat mode a bare `segment.tsx` that has children (e.g. `dashboard.tsx` next to
`dashboard.keys.tsx`) **silently becomes the layout** for those children: the
generated tree sets `getParentRoute: () => DashboardRoute`, so the child only
renders if the parent renders an `<Outlet />`. A parent page that forgets the
`<Outlet />` swallows every child route - the URL changes, the child never
paints, and nothing errors.

## The Rules

### 1. Flat by default

One file per route under `src/routes/`. `.` = `/`. Reach for a directory only
when a subtree is deep enough that flat names get unwieldy; never mix styles
within the same subtree.

### 2. A bare `segment.tsx` may only have children if it renders `<Outlet />`

If a segment has children, pick one shape:

- **Pure container** (no shared UI): omit `segment.tsx` entirely. Use
  `segment.index.tsx` for the index and `segment.child.tsx` for siblings - they
  attach to the root with no layout coupling.
- **Real layout** (shared chrome, auth guard): `segment.tsx` **is** the layout and
  **must** render `<Outlet />`; its index page lives in `segment.index.tsx`.

### 3. Index pages are always `*.index.tsx`

(Or root `index.tsx`.) A `segment.tsx` never doubles as both a leaf page and a
parent.

### 4. Standard tokens

| Token | Meaning |
| --- | --- |
| `$param` | dynamic segment (`blog.$slug.tsx`) |
| `$` alone | splat / catch-all |
| leading `_` | pathless layout - groups children, adds no URL segment |
| leading `-` | ignored by the router; colocate non-route files here |
| `__root.tsx` | the root shell (the only fixed filename) |

### 5. kebab-case segment names

`sign-in.tsx`, `api-keys.tsx` - never camelCase or PascalCase segments. This
matches the repo-wide filename rule: all React/TS files are kebab-case.

### 6. Route components are PascalCase and MUST carry a role suffix

`Layout` for layout routes, `Page` for leaf/index pages; `Route` is also accepted
for data-backed pages. The suffix is required on **every** route component,
including leaves - `HomePage`, never `Home` - so a route's role is legible from
its definition alone.

| File | Component |
| --- | --- |
| `index.tsx` | `HomePage` |
| `dashboard.tsx` | `DashboardLayout` |
| `dashboard.index.tsx` | `DashboardIndexPage` |
| `markets.$asset.tsx` | `MarketDetailPage` |
| `api-keys.tsx` | `ApiKeysRoute` (data-backed) |

## Bad Example

```tsx
// routes/dashboard.tsx - has children (dashboard.keys.tsx) but no <Outlet />.
// /dashboard/keys silently renders this page instead of the keys panel.
export const Route = createFileRoute('/dashboard')({ component: Dashboard })

function Dashboard() {          // no role suffix - is this a page or a layout?
  return <DashboardStats />
}
```

## Good Example

```tsx
// routes/dashboard.tsx - the layout, and it says so
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({ component: DashboardLayout })

function DashboardLayout() {
  return (
    <div className="flex">
      <DashboardNav />
      <Outlet />
    </div>
  )
}
```

```tsx
// routes/dashboard.index.tsx - the page at /dashboard
export const Route = createFileRoute('/dashboard/')({ component: DashboardIndexPage })

function DashboardIndexPage() {
  return <DashboardStats />
}
```

## Context

- The route tree is generated - `bun run generate-routes` (or the dev server)
  rewrites `src/routeTree.gen.ts`. Never hand-edit it; it is Biome-ignored.
- Read the generated `getParentRoute` when a child page mysteriously does not
  render. It names the parent that owes you an `<Outlet />`.
- Route components stay **unexported** - see
  [`file-route-exports`](./file-route-exports.md). Naming and export rules
  compose: one `Route` export, one role-suffixed component.
- A component that outgrows its route file moves to `src/components/` under the
  same kebab-case name and keeps its suffix (`dashboard-layout.tsx` exporting
  `DashboardLayout`).
