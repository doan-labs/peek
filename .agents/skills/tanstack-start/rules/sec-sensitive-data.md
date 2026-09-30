# sec-sensitive-data: Keep Secrets Server-Side Only

## Priority: CRITICAL

## Explanation

Start builds the same source tree for two environments. A module imported from a
route component ends up in the browser bundle, secrets and all - and a leaked key
is public the moment the bundle ships, whether or not anything calls the code.

Two mechanisms keep the boundary honest:

- **Import protection** (on by default) denies `*.server.*` files and the
  `@tanstack/react-start/server` specifier in the client environment, and
  `*.client.*` files on the server. In dev it warns and mocks; in a build it
  **fails the build**.
- **The `VITE_` prefix** is the client's allow-list. `import.meta.env.VITE_FOO`
  is inlined into the browser bundle at build time. Anything without the prefix
  stays server-side.

Name any module that touches a secret `*.server.ts` and let the build enforce it.

## Bad Example

```ts
// lib/stripe.ts - no naming signal, so nothing stops a component importing it
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

```ts
// env.ts - the VITE_ prefix publishes this to every visitor
export const env = {
  VITE_DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
  VITE_STRIPE_SECRET: import.meta.env.VITE_STRIPE_SECRET,
}
```

```tsx
// Returning the whole record from a server function - the password hash, the
// internal notes and the Stripe customer id all serialize to the client
export const getUser = createServerFn().handler(async ({ data }) => {
  return db.users.findUnique({ where: { id: data.id } })
})
```

## Good Example: `.server.ts` Naming

```ts
// lib/stripe.server.ts - import protection denies this in the client graph
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

```tsx
// routes/billing.success.tsx - reached only through a server function
import { createServerFn } from '@tanstack/react-start'

export const confirmCheckout = createServerFn({ method: 'POST' })
  .validator(z.object({ sessionId: z.string() }))
  .handler(async ({ data }) => {
    const { stripe } = await import('#/lib/stripe.server.ts')
    const session = await stripe.checkout.sessions.retrieve(data.sessionId)

    // Return only what the UI renders
    return { status: session.status }
  })
```

## Good Example: Deliberate Client Config

```ts
// env.ts - VITE_ values are public by construction. Only put things here that
// you would print on the login page.
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_BACKEND_URL: z.url(),
    VITE_POSTHOG_KEY: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
})
```

## Good Example: Narrow the Return Shape

Server functions serialize whatever they return. Select columns explicitly rather
than trimming after the fact.

```tsx
export const getUser = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return db.users.findUnique({
      where: { id: data.id },
      select: { id: true, name: true, avatarUrl: true },
    })
  })
```

## Good Example: Type-Only Crossings Are Fine

Types are erased, so importing one from a server module does not pull the module
into the client bundle. Split the import when only the type is safe.

```ts
import type { User } from '#/lib/db.server.ts'

// NOT this - `getUsers` is a runtime value and drags the module across
// import { type User, getUsers } from '#/lib/db.server.ts'
```

## Context

- `*.server.ts` / `*.client.ts` naming is enforced by import protection with no
  configuration; use it as the default habit
- Dev **mocks and warns**, build **errors** - a violation you ignored locally
  fails CI
- `VITE_`-prefixed env vars are baked into the client bundle at build time and are
  public forever - this repo declares them in `src/env.ts` (T3Env), where the
  `clientPrefix` split is the contract for what is publishable
- Never reach for `VITE_` to "make a secret available" - move the code server-side
  instead
- Server functions serialize their whole return value; `select` the fields you
  need rather than deleting fields afterwards
- Secrets in error messages leak too - do not echo `process.env` into a thrown error
