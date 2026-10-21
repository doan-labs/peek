/* bun test preload: compile .svelte imports for the server, so the tests can
 * render peek.svelte the way an app's SSR would. */
import { plugin } from 'bun'
import { compile } from 'svelte/compiler'

plugin({
  name: 'svelte',
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await Bun.file(path).text(), {
        filename: path,
        generate: 'server',
      }).js.code,
      loader: 'js',
    }))
  },
})
