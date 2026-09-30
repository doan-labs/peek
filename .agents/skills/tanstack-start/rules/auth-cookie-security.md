# auth-cookie-security: Configure Secure Cookie Settings

## Priority: HIGH

## Explanation

A session cookie readable by JavaScript is one XSS away from being stolen; one
without `Secure` rides plaintext on any downgraded request; one with
`SameSite: 'none'` is attached to cross-site requests by default. The defaults
are not safe - set the flags explicitly.

Cookie helpers come from `@tanstack/react-start/server`: `getCookie`,
`setCookie`, `deleteCookie`, plus the sealed-session helpers `useSession`,
`getSession`, `updateSession` and `clearSession`.

| Flag | Session cookie | Why |
|---|---|---|
| `httpOnly` | `true` | JS cannot read it, so XSS cannot exfiltrate it |
| `secure` | `true` in production | Never sent over plain HTTP |
| `sameSite` | `'lax'` | Not attached to cross-site POSTs; survives top-level navigation |
| `path` | `'/'` | Scope to the app, not one subtree |
| `maxAge` | bounded | An unbounded session never expires |

## Bad Example

```tsx
import { setCookie } from '@tanstack/react-start/server'

export const signIn = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const user = await verifyCredentials(data)

    // Readable by any script, sent over HTTP, attached cross-site, never expires
    setCookie('session', user.id)

    return { ok: true }
  })
```

The value is also the raw user id - anyone can forge a session by editing it.

## Good Example: Signed, Sealed Session

`useSession` seals and signs the payload, so the client cannot read or forge it.

```tsx
// lib/session.server.ts
import { useSession } from '@tanstack/react-start/server'

type SessionData = { userId: string; role: 'user' | 'admin' }

export function getAppSession() {
  return useSession<SessionData>({
    name: 'hyperwatcher_session',
    password: process.env.SESSION_SECRET!, // 32+ chars, server-only
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  })
}
```

```tsx
// lib/auth.functions.ts
export const signIn = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const user = await verifyCredentials(data)

    const session = await getAppSession()
    await session.update({ userId: user.id, role: user.role })

    return { ok: true }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAppSession()
  await session.clear()
  return { ok: true }
})
```

## Good Example: Reading the Session

```tsx
import { getAppSession } from '#/lib/session.server.ts'

export async function requireSession() {
  const session = await getAppSession()

  if (!session.data.userId) {
    throw new Error('Unauthorized')
  }

  return session.data
}
```

## Good Example: Non-Session Cookies

Preferences the client legitimately reads can drop `httpOnly` - but nothing that
grants access should.

```tsx
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

setCookie('theme', theme, {
  httpOnly: false, // the client toggles this
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
})

const theme = getCookie('theme')
deleteCookie('theme', { path: '/' })
```

## Context

- `httpOnly: true` on anything that authenticates; no exceptions
- `secure` must be conditional on the environment or local HTTP dev breaks
- `sameSite: 'lax'` is the right default; `'strict'` breaks inbound links from
  email, `'none'` requires `secure` and re-opens CSRF
- `deleteCookie` must be given the same `path` (and `domain`) the cookie was set
  with, or it silently does nothing
- Session secrets live in non-`VITE_` env vars and in `*.server.ts` modules
- Cookie flags are not CSRF protection - pair them with
  [`sec-csrf-protection`](./sec-csrf-protection.md)
- This repo has no auth provider wired yet - `useSession` is the zero-dependency
  option; if you adopt a library (better-auth, Clerk), it owns the cookie and
  these helpers are only for Start-managed cookies alongside it
