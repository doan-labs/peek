# auth-route-protection: Guard Routes at the Layout Boundary

## Priority: HIGH

## Explanation

Put the auth check on the layout route that owns a subtree, so every child
inherits it and no page can be reached without passing through it. There are two
places to do that, and they answer different questions:

- **`beforeLoad`** runs before the loader, on the server for the initial request.
  It can `throw redirect()` before any data is fetched or rendered, and it can
  extend route context for children. Use it when the session is readable
  server-side.
- **A client guard in the layout component** - read the session, render nothing
  while it resolves, `navigate()` away when it fails. Use it when the session
  lives behind a client SDK. It is UX only: the browser has already received the
  route's JS, so **the server must enforce the same rule on every endpoint the
  page calls.**

Never guard in a leaf page's `useEffect` alone. By then the loader has run and
the markup has painted.

## Bad Example

```tsx
// Checking auth in the page component - too late, data already loaded
function DashboardPage() {
  const user = useAuth()

  useEffect(() => {
    if (!user) {
      navigate({ to: '/sign-in' }) // Redirect after render
    }
  }, [user])

  if (!user) return null // Flash of content possible

  return <Dashboard user={user} />
}

// No protection on the route at all
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Fetches sensitive data even for unauthenticated users
    return await fetchDashboardData()
  },
  component: DashboardPage,
})
```

## Good Example: `beforeLoad` on the Layout Route

Per [ADR-010](../../../../docs/decisions/010-web-routing-conventions.md), routes
are flat dot-notation and a layout segment **must** render `<Outlet />`.
`dashboard.tsx` is the layout; `dashboard.index.tsx`, `dashboard.usage.tsx` and
friends are its children and inherit the guard.

```tsx
// routes/dashboard.tsx - layout route, guards the whole /dashboard subtree
import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '#/components/dashboard/dashboard-layout'
import { getSession } from '#/lib/session.server.ts'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // Extend context for every child route
    return { user: session.user }
  },
  component: DashboardLayout,
})
```

```tsx
// routes/dashboard.usage.tsx - protected by the parent, no repeated check
export const Route = createFileRoute('/dashboard/usage')({
  loader: async ({ context }) => {
    // context.user is guaranteed by the parent's beforeLoad
    return await fetchUsage(context.user.id)
  },
  component: DashboardUsagePage,
})
```

## Good Example: Client Guard

When sessions are read through a client SDK, the guard lives
in the layout component. Note what it does while the session is pending - it
renders a placeholder, not the page - and that it returns `null` rather than
falling through on failure.

```tsx
// components/dashboard/dashboard-layout.tsx
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authClient } from '#/lib/auth-client'

export function DashboardLayout() {
  const navigate = useNavigate()
  const { data, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !data?.session) {
      navigate({ to: '/sign-in' })
    }
  }, [isPending, data?.session, navigate])

  if (isPending) {
    return <SessionLoading />
  }

  if (!data?.session) {
    return null
  }

  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
```

```tsx
// routes/dashboard.tsx - registration only (see file-route-exports)
import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '#/components/dashboard/dashboard-layout'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})
```

## Good Example: Role-Based Access

`admin.tsx` nests the same way - it adds a role check on top of the session
check, and the backend re-checks the role on every admin endpoint so a bypassed
client guard yields 401/403 rather than data.

```tsx
// components/admin/admin-layout.tsx
export function AdminLayout() {
  const navigate = useNavigate()
  const { data, isPending } = authClient.useSession()
  const isAdmin = data?.user?.role === 'admin'

  useEffect(() => {
    if (isPending) return
    if (!data?.session) {
      navigate({ to: '/sign-in' })
    } else if (!isAdmin) {
      navigate({ to: '/dashboard' })
    }
  }, [isPending, data?.session, isAdmin, navigate])

  if (isPending) return <SessionLoading />
  if (!data?.session || !isAdmin) return null

  return (
    <AdminChrome>
      <Outlet />
    </AdminChrome>
  )
}
```

## Good Example: Preserving the Redirect Target

```tsx
// routes/sign-in.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInPage } from '#/components/auth/sign-in-page'

export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: SignInPage,
})
```

```tsx
// components/auth/sign-in-page.tsx
export function SignInPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()

  // Send the user back where they were headed, defaulting to the console.
  // Validate `redirect` is a relative path - an absolute URL here is an open
  // redirect.
  const target = redirect?.startsWith('/') ? redirect : '/dashboard'

  return <SignInForm onSuccess={() => navigate({ to: target })} />
}
```

## Context

- Guard on the layout route that owns the subtree - children inherit it
- `beforeLoad` runs before the loader; throwing `redirect()` stops the load entirely
- Context returned from `beforeLoad` flows to the loader and every child
- A client guard is UX only - the server must enforce the same rule independently
- `redirect()` from a loader/`beforeLoad` produces a real 307 on the initial
  server request; see [`err-redirects`](./err-redirects.md)
- Validate any `redirect` search param is a relative path before navigating to it
- ADR-010: flat dot-notation, layout segments render `<Outlet />`, index pages
  are `*.index.tsx`, route components carry a `Layout` / `Page` suffix
