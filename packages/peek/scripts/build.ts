/* Compile public entry points and declarations for ordinary JS consumers.
 * peek.svelte ships as source for the app's bundler to compile; it imports
 * svelte-peek.js, built here like any entry. */
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'

for (const entry of [
  'src/index.ts',
  'src/svg.ts',
  'src/identity.ts',
  'src/vue.ts',
  'src/svelte.ts',
  'src/svelte-peek.ts',
]) {
  const result = await Bun.build({
    entrypoints: [entry],
    outdir: 'dist',
    target: 'browser',
    format: 'esm',
    external: ['react', 'vue', 'svelte', '*.svelte'],
  })
  if (!result.success) {
    for (const log of result.logs) console.error(log)
    process.exit(1)
  }
}
const declarations = Bun.spawn(['bunx', 'tsc', '-p', 'tsconfig.build.json'], {
  stdout: 'inherit',
  stderr: 'inherit',
})
if (await declarations.exited) process.exit(1)
await copyFile('src/peek.svelte', 'dist/peek.svelte')
await copyFile('src/peek.svelte.d.ts', 'dist/peek.svelte.d.ts')
// Node's ESM resolver requires extensions in declaration imports too.
for (const file of await readdir('dist')) {
  if (!file.endsWith('.d.ts') && !file.endsWith('.svelte')) continue
  const path = `dist/${file}`
  const source = await readFile(path, 'utf8')
  await writeFile(
    path,
    source.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g, '$1$2.js$3'),
  )
}
