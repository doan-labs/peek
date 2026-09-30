# deploy-adapters: Choose Appropriate Deployment Adapter

## Priority: LOW

## Explanation

TanStack Start builds through Vite. The hosting target is chosen by the plugins
in `vite.config.ts` - either a platform's own Vite plugin (Cloudflare) or
[Nitro](https://nitro.build/), whose preset covers most other hosts. There is no
`app.config.ts` and no `@tanstack/react-start/config`; both belonged to the
removed Vinxi build and no longer exist.

## Bad Example

```ts
// app.config.ts - Vinxi-era, removed. `@tanstack/react-start/config` has no
// export map entry, so this fails to resolve.
import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  server: {
    preset: 'node-server',
  },
})
```

```ts
// vite.config.ts - plugin present but no server target chosen. The build emits
// a client bundle plus an SSR entry with no runtime around it.
export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
```

## Good Example: Nitro (this repo)

This repo uses the Nitro (agnostic) adapter, already wired in `vite.config.ts`,
with no host chosen yet. Plugin order there is load-bearing: `devtools()` must
stay first, `nitro()` ahead of `tanstackStart()`.

```ts
// vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [nitro(), tanstackStart(), viteReact()],
})
```

Nitro auto-detects most hosts from CI environment variables. Force one with the
`NITRO_PRESET` env var or `nitro({ preset: 'node-server' })`. The build lands in
`.output/` - `.output/public` for static assets, `.output/server` for the
handler - and runs with `node .output/server/index.mjs`.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY .output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## Good Example: Cloudflare Workers

Cloudflare does not go through Nitro - it uses its own Vite plugin, which must
claim the `ssr` environment.

```ts
// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
```

```jsonc
// wrangler.jsonc
{
  "name": "hyperwatcher",
  "main": ".output/server/index.js",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".output/public" },
}
```

## Good Example: SPA / Static Output

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: { enabled: true },
      prerender: { enabled: true, crawlLinks: true },
    }),
    viteReact(),
  ],
})
```

Every route must render without request-time context. See
[`ssr-prerender`](./ssr-prerender.md) for the full prerender option set.

## Good Example: Node Throughput Tweak

Nitro runs on [srvx](https://srvx.h3.dev/), whose `FastResponse` skips the
Web-`Response`-to-Node conversion for roughly 5% more throughput. Node targets
only - it is a no-op elsewhere.

```ts
// src/server.ts
import { FastResponse } from 'srvx'

globalThis.Response = FastResponse
```

## Target Comparison

| Target | Chosen by | Runtime | Output |
|---|---|---|---|
| Nitro (default) | `nitro()` plugin + `NITRO_PRESET` | Node / Bun / Deno / edge | `.output/` |
| Cloudflare Workers | `@cloudflare/vite-plugin` | Workers | `.output/` + `wrangler.jsonc` |
| Netlify / Vercel | Nitro preset (auto-detected in CI) | Node / edge | `.output/` |
| SPA / static | `tanstackStart({ spa, prerender })` | none | `.output/public` |

## Context

- The bundler owns the target - there is no separate adapter package to install
- Nitro presets are auto-detected in CI; pin with `NITRO_PRESET` for reproducibility
- Edge runtimes have no filesystem and a reduced Node API surface
- Verify locally with `bun run build && bun run preview` - the dev server does not
  exercise the deployed handler
- `@tanstack/react-start` peers on `vite >= 7`; this repo runs Vite 8
