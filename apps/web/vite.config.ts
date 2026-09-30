import { fileURLToPath } from 'node:url'
import stylex from '@stylexjs/unplugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
  ],
})
