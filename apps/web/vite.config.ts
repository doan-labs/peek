import { fileURLToPath } from 'node:url'
import stylex from '@stylexjs/unplugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { devWorker } from './worker.dev'

/* Dev only: /api/notify goes to the real Worker in Miniflare, so the form
 * works on :5173. `apply: 'serve'` keeps it out of the build. */
const worker = (): Plugin => ({
  name: 'peek:worker',
  apply: 'serve',
  async configureServer(server) {
    let mf = await devWorker()
    server.httpServer?.once('close', () => mf.dispose())
    // a change to the Worker swaps in a fresh one, KV and all
    server.watcher.on('change', async (file) => {
      if (!file.endsWith('/worker.ts')) return
      const old = mf
      mf = await devWorker()
      await old.dispose()
    })
    server.middlewares.use('/api/notify', async (req, res) => {
      const body: Buffer[] = []
      for await (const c of req) body.push(c)
      const out = await mf.dispatchFetch('http://localhost/api/notify', {
        method: req.method,
        headers: {
          'content-type': req.headers['content-type'] ?? '',
          'cf-connecting-ip': req.socket.remoteAddress ?? 'unknown',
        },
        body: body.length ? Buffer.concat(body) : undefined,
      })
      res.statusCode = out.status
      out.headers.forEach((v, k) => {
        res.setHeader(k, v)
      })
      res.end(Buffer.from(await out.arrayBuffer()))
    })
  },
})

const src = fileURLToPath(new URL('./src/*', import.meta.url))

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 5173 },
  plugins: [
    // First, so it sees source before anything else transforms it. It strips
    // the devtools from the build on its own.
    devtools(),
    /*
     * StyleX compiles at build time and ships no runtime. The build appends
     * its sheet to the one CSS asset, styles.css; dev serves it as
     * /virtual:stylex.css, which __root.tsx links. It sits before viteReact()
     * to keep Fast Refresh.
     *
     * `aliases` repeats tsconfig on purpose: StyleX resolves `.stylex.ts`
     * imports with its own resolver, which never reads tsconfig paths.
     */
    stylex.vite({ aliases: { '@/*': [src], '#/*': [src] } }),
    // Static for now: every route prerenders to HTML, which the root
    // wrangler.jsonc serves as Worker assets.
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    viteReact(),
    worker(),
  ],
})
