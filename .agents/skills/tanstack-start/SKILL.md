---
name: tanstack-start-best-practices
description: TanStack Start best practices for full-stack React applications. Server functions, middleware, SSR, authentication, and deployment patterns. Activate for any task touching `src/routes/`, server functions, or the Nitro build in this repo, or when building full-stack apps with TanStack Start elsewhere.
---

# TanStack Start Best Practices

Comprehensive guidelines for implementing TanStack Start patterns in full-stack React applications. These rules cover server functions, middleware, SSR, authentication, and deployment.

## When to Apply

- Any task that reads from or modifies files under `src/routes/` or `src/lib/` in this repo
- Creating server functions for data mutations
- Setting up middleware for auth/logging
- Configuring SSR and hydration
- Implementing authentication flows
- Handling errors across client/server boundary
- Organizing full-stack code
- Deploying to various platforms

## Versions

Written against the versions this repo resolves in `package.json`:
`@tanstack/react-start` 1.168.x, `@tanstack/react-router` 1.170.x, Vite 8,
React 19 (with the React Compiler on). Start builds through Vite - `app.config.ts`,
`@tanstack/react-start/config` and `createAPIFileRoute` belonged to the removed
Vinxi build and no longer resolve.

## Quick Reference

Every entry below has a file in `rules/`. There are no other rules.

### Server Functions (Prefix: `sf-`)

- [`sf-create-server-fn`](rules/sf-create-server-fn.md) - Use createServerFn for server-side logic
- [`sf-input-validation`](rules/sf-input-validation.md) - Always validate server function inputs
- [`sf-response-headers`](rules/sf-response-headers.md) - Customize response headers when needed

### Security (Prefix: `sec-`)

- [`sec-csrf-protection`](rules/sec-csrf-protection.md) - Protect mutations with CSRF middleware
- [`sec-sensitive-data`](rules/sec-sensitive-data.md) - Keep secrets server-side only

### Middleware (Prefix: `mw-`)

- [`mw-request-middleware`](rules/mw-request-middleware.md) - Use request middleware for cross-cutting concerns
- [`mw-function-middleware`](rules/mw-function-middleware.md) - Use function middleware for server functions

### Authentication (Prefix: `auth-`)

- [`auth-session-management`](rules/auth-session-management.md) - Implement secure session handling
- [`auth-route-protection`](rules/auth-route-protection.md) - Guard routes at the layout boundary
- [`auth-cookie-security`](rules/auth-cookie-security.md) - Configure secure cookie settings

### API Routes (Prefix: `api-`)

- [`api-routes`](rules/api-routes.md) - Create server routes for external consumers

### SSR (Prefix: `ssr-`)

- [`ssr-data-loading`](rules/ssr-data-loading.md) - Load data appropriately for SSR
- [`ssr-hydration-safety`](rules/ssr-hydration-safety.md) - Prevent hydration mismatches
- [`ssr-selective`](rules/ssr-selective.md) - Apply selective SSR when beneficial
- [`ssr-streaming`](rules/ssr-streaming.md) - Implement streaming SSR for faster TTFB
- [`ssr-prerender`](rules/ssr-prerender.md) - Configure static prerendering and ISR

### Environment (Prefix: `env-`)

- [`env-functions`](rules/env-functions.md) - Use environment functions for configuration

### Error Handling (Prefix: `err-`)

- [`err-server-errors`](rules/err-server-errors.md) - Handle server function errors
- [`err-redirects`](rules/err-redirects.md) - Use redirects appropriately
- [`err-not-found`](rules/err-not-found.md) - Handle not-found scenarios

### File Organization (Prefix: `file-`)

- [`file-route-naming`](rules/file-route-naming.md) - **Canonical.** Route file names, layout/`<Outlet/>` rule, `*.index.tsx`, role-suffixed page components
- [`file-route-exports`](rules/file-route-exports.md) - Route files export only `Route`
- [`file-separation`](rules/file-separation.md) - Separate server and client code

### Deployment (Prefix: `deploy-`)

- [`deploy-adapters`](rules/deploy-adapters.md) - Choose appropriate deployment adapter

## How to Use

Each rule file in the `rules/` directory contains:
1. **Explanation** - Why this pattern matters
2. **Bad Example** - Anti-pattern to avoid
3. **Good Example** - Recommended implementation
4. **Context** - When to apply or skip this rule

## Full Reference

See individual rule files in `rules/` directory for detailed guidance and code examples.
