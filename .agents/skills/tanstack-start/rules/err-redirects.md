# err-redirects: Use Redirects Appropriately

## Priority: MEDIUM

## Explanation

`redirect()` from `@tanstack/react-router` is **thrown**, not returned. Throwing
it from `beforeLoad` or a `loader` aborts the load: no further loaders run, no
component renders. On the initial server request the router turns it into a real
HTTP 3xx with a `Location` header, so crawlers, `curl` and the back button all
see the redirect. On a client navigation the same throw becomes a router
navigation with no round trip.

Returning `redirect()` instead of throwing does nothing - the value is treated as
loader data and the page renders anyway.

## Bad Example

```tsx
export const Route = createFileRoute('/dashboard/usage')({
  loader: async () => {
    const session = await getSession()

    if (!session) {
      // Returned, not thrown - the loader "succeeds" and the page renders
      return redirect({ to: '/sign-in' })
    }

    return fetchUsage(session.user.id)
  },
})
```

```tsx
// Redirecting from the component - the loader already ran and the markup
// already went out with a 200
function LegacyPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/markets' })
  }, [navigate])
  return null
}
```

## Good Example: Throw From the Loader

```tsx
// routes/dashboard.usage.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/usage')({
  loader: async () => {
    // Usage moved under the dashboard index; send old links to the new home.
    throw redirect({ to: '/dashboard' })
  },
})
```

## Good Example: Permanent vs Temporary

The default status is 307 (temporary, method-preserving). Use 301 only when the
move really is permanent - browsers cache it aggressively and users cannot undo
that.

```tsx
export const Route = createFileRoute('/old-pricing')({
  beforeLoad: () => {
    throw redirect({
      to: '/pricing',
      statusCode: 301,
    })
  },
})
```

## Good Example: Carrying Params and Search

`redirect()` takes the same options as `Link` / `navigate`, so params and search
stay type-checked against the target route.

```tsx
export const Route = createFileRoute('/asset/$symbol')({
  beforeLoad: ({ params }) => {
    // Legacy path - forward to the canonical markets detail route.
    throw redirect({
      to: '/markets/$asset',
      params: { asset: params.symbol.toLowerCase() },
      search: { ref: 'legacy' },
    })
  },
})
```

## Good Example: Redirecting to an External URL

```tsx
export const Route = createFileRoute('/docs/legacy')({
  beforeLoad: () => {
    throw redirect({ href: 'https://docs.example.com/v1' })
  },
})
```

## Verifying

A redirect that only works client-side is a broken redirect. Check the server
response directly:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:5173/dashboard/usage
# 307 http://localhost:5173/dashboard
```

## Context

- Always `throw redirect(...)`, never return it
- Default status is 307; pass `statusCode: 301` only for genuinely permanent moves
- `beforeLoad` is the cheapest place - it runs before the loader fetches anything
- Use `to` + `params` / `search` for internal targets so types are checked; `href`
  for external ones
- Redirects thrown during SSR emit a real `Location` header; verify with `curl`,
  not just by clicking
- Never redirect to an unvalidated user-supplied URL - check it is relative first
