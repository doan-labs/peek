# mw-function-middleware: Use Function Middleware for Server Functions

## Priority: HIGH

## Explanation

`createMiddleware({ type: 'function' })` wraps `createServerFn` calls
specifically. Unlike request middleware it can run **client-side** logic around
the call as well as server-side logic inside it, and it can `.validator()` input
shared across many functions. Attach it with `.middleware([...])` on the server
function.

Pick by scope: request middleware for anything every request needs (tracing,
CSRF, security headers); function middleware for concerns that only make sense
around an RPC (auth context, per-call timing, tenant scoping).

| | Request middleware | Function middleware |
|---|---|---|
| Runs for | every server request, incl. SSR | server functions only |
| Methods | `.server()` | `.client()`, `.server()` |
| `.validator()` | no | yes |
| Can depend on | request middleware | both types |

## Bad Example

```tsx
// The same session lookup copy-pasted into every server function
export const listKeys = createServerFn().handler(async () => {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return db.apiKeys.findMany({ where: { userId: session.userId } })
})

export const revokeKey = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')
    return db.apiKeys.delete({ where: { id: data.id } })
  })
// One handler that forgets the check is an authorization bug
```

```tsx
// Request middleware cannot do this - it has no .validator() and no .client()
const authMiddleware = createMiddleware({ type: 'request' })
  .validator(z.object({ workspaceId: z.string() }))
```

## Good Example: Auth Context

```tsx
// lib/middleware/auth.ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Unauthorized')
    }

    // Everything downstream sees `context.user`
    return next({ context: { user: session.user } })
  },
)
```

```tsx
// lib/api-keys.functions.ts
export const listKeys = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return db.apiKeys.findMany({ where: { userId: context.user.id } })
  })

export const revokeKey = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    // Scope the delete to the caller - middleware proves identity, not ownership
    return db.apiKeys.delete({
      where: { id: data.id, userId: context.user.id },
    })
  })
```

## Good Example: Client and Server Halves

`.client()` runs in the browser around the call, so it can measure the real
round trip or attach something only the browser knows.

```tsx
const timingMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    const startedAt = performance.now()
    const result = await next()
    logger.debug('server fn round trip', {
      ms: Math.round(performance.now() - startedAt),
    })
    return result
  })
  .server(async ({ next }) => {
    // Server half of the same middleware
    return next()
  })
```

## Good Example: Shared Input Validation

`.validator()` on middleware merges into the server function's validated input,
so a field every call needs is declared once.

```tsx
const workspaceMiddleware = createMiddleware({ type: 'function' })
  .validator(z.object({ workspaceId: z.string() }))
  .server(async ({ next, data }) => {
    const workspace = await requireWorkspace(data.workspaceId)
    return next({ context: { workspace } })
  })

export const renameWorkspace = createServerFn({ method: 'POST' })
  .middleware([workspaceMiddleware])
  // `workspaceId` is already required by the middleware
  .validator(z.object({ name: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    return db.workspaces.update({
      where: { id: context.workspace.id },
      data: { name: data.name },
    })
  })
```

## Good Example: Composition

```tsx
// Function middleware may depend on request middleware; not the reverse.
const adminMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden')
    }
    return next({ context: { admin: context.user } })
  })
```

## Context

- `createMiddleware({ type: 'function' })` for server functions;
  `{ type: 'request' }` for everything (see [`mw-request-middleware`](./mw-request-middleware.md))
- Always call and return `next()` - a middleware that forgets it silently drops
  the handler
- Extend context via `next({ context })`; it merges down the chain and is typed
- Middleware runs in listed order, dependencies first
- Request middleware cannot depend on function middleware
- Authentication in middleware is not authorization - the handler still has to
  scope its query to the caller
