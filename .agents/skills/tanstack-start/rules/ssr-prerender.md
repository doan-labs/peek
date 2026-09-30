# ssr-prerender: Configure Static Prerendering and ISR

## Priority: MEDIUM

## Explanation

Static prerendering generates HTML at build time for pages that don't require request-time data. Incremental Static Regeneration (ISR) extends this by revalidating cached pages on a schedule. Use these for better performance and lower server costs.

## Bad Example

```tsx
// SSR for completely static content - wasteful
export const Route = createFileRoute('/about')({
  loader: async () => {
    // Fetching static content on every request
    const content = await fetchAboutPageContent()
    return { content }
  },
})

// Or no caching headers for semi-static content
export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)
    return { post }
    // Every request hits the database
  },
})
```

## Good Example: Static Prerendering

```ts
// vite.config.ts - prerendering is configured on the `tanstackStart` plugin.
// There is no `app.config.ts`; that was the removed Vinxi build.
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        // Static routes are discovered automatically; extract links from the
        // rendered HTML and prerender those too.
        autoStaticPathsDiscovery: true,
        crawlLinks: true,
        // Skip paths that must stay request-time.
        filter: ({ path }) => !path.startsWith('/dashboard'),
        failOnError: true,
      },
      // Opt specific paths in or out, merged with discovery above.
      pages: [
        { path: '/pricing', prerender: { enabled: true } },
      ],
    }),
    viteReact(),
  ],
})

// routes/about.tsx - Will be prerendered
export const Route = createFileRoute('/about')({
  loader: async () => {
    // Runs at BUILD time, not request time
    const content = await fetchAboutPageContent()
    return { content }
  },
  component: AboutPage,
})
```

## Good Example: Dynamic Prerendering

```ts
// vite.config.ts - `pages` accepts the paths a build-time query turns up, so
// dynamic segments get prerendered alongside the discovered static ones.
const posts = await db.posts.findMany({
  where: { published: true },
  select: { slug: true },
})

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true },
      pages: posts.map((p) => ({
        path: `/blog/${p.slug}`,
        prerender: { enabled: true },
      })),
    }),
    viteReact(),
  ],
})
```

## Good Example: ISR with Revalidation

```tsx
// routes/blog/$slug.tsx
import { createFileRoute } from '@tanstack/react-router'
import { setResponseHeaders } from '@tanstack/react-start/server'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)

    // ISR: Cache for 60 seconds, then revalidate
    setResponseHeaders(
      new Headers({
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }),
    )

    return { post }
  },
  component: BlogPost,
})

// First request: SSR and cache
// Next 60 seconds: Serve cached version
// After 60 seconds: Serve stale, revalidate in background
// After 300 seconds: Full SSR again
```

## Good Example: Hybrid Static/Dynamic

```tsx
// routes/products.tsx - Prerendered
export const Route = createFileRoute('/products')({
  loader: async () => {
    // Featured products - prerendered at build
    const featured = await fetchFeaturedProducts()
    return { featured }
  },
})

// routes/products/$productId.tsx - ISR
export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const product = await fetchProduct(params.productId)

    if (!product) throw notFound()

    // Cache product pages for 5 minutes
    setResponseHeaders(
      new Headers({
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }),
    )

    return { product }
  },
})

// routes/cart.tsx - Always SSR (user-specific)
export const Route = createFileRoute('/cart')({
  loader: async ({ context }) => {
    // No caching - user-specific data
    setResponseHeaders(
      new Headers({
        'Cache-Control': 'private, no-store',
      }),
    )

    const cart = await fetchUserCart(context.user.id)
    return { cart }
  },
})
```

## Good Example: On-Demand Revalidation

```ts
// routes/api.revalidate.ts - a server route, not a separate `createAPIFileRoute`
// export. That API is gone; handlers hang off `server.handlers` on the normal
// `createFileRoute` call.
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/revalidate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { secret, path } = await request.json()

        // Verify secret
        if (secret !== process.env.REVALIDATE_SECRET) {
          return json({ error: 'Invalid secret' }, { status: 401 })
        }

        // Trigger revalidation (implementation depends on hosting)
        await revalidatePath(path)

        return json({ revalidated: true, path })
      },
    },
  },
})

// Usage: POST /api/revalidate { "secret": "...", "path": "/blog/my-post" }
```

## Cache-Control Directives

| Directive | Meaning |
|-----------|---------|
| `s-maxage=N` | CDN cache duration (seconds) |
| `max-age=N` | Browser cache duration |
| `stale-while-revalidate=N` | Serve stale while fetching fresh |
| `private` | Don't cache on CDN (user-specific) |
| `no-store` | Never cache |

## Context

- Prerendering happens at build time - no request context
- ISR requires CDN/edge support (Vercel, Cloudflare, etc.)
- Use prerendering for truly static pages (about, pricing)
- Use ISR for content that changes but not per-request
- Always SSR for user-specific or real-time data
- Test with production builds - dev server is always SSR
