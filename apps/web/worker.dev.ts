/*
 * worker.ts in Miniflare, for local use only: `bun run dev` and the check.
 * KV lives in memory and the limit counts locally, so nothing here touches
 * the deployed Worker. Bindings mirror the root wrangler.jsonc.
 */
import { readFileSync } from 'node:fs'
import { transformWithOxc } from 'vite'

const FILE = new URL('./worker.ts', import.meta.url)

export async function devWorker() {
  const { Miniflare } = await import('miniflare')
  const { code } = await transformWithOxc(
    readFileSync(FILE, 'utf8'),
    'worker.ts',
  )
  return new Miniflare({
    modules: true,
    script: code,
    kvNamespaces: ['NOTIFY'],
    ratelimits: {
      LIMIT: { namespace_id: '1001', simple: { limit: 5, period: 60 } },
    },
  })
}
