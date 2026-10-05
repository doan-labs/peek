/* Compile public entry points and declarations for ordinary JS consumers. */
import { readdir, readFile, writeFile } from 'node:fs/promises'

for (const entry of ['src/index.ts', 'src/svg.ts', 'src/identity.ts']) {
  const result = await Bun.build({
    entrypoints: [entry],
    outdir: 'dist',
    target: 'browser',
    format: 'esm',
    external: ['react'],
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
// Node's ESM resolver requires extensions in declaration imports too.
for (const file of await readdir('dist')) {
  if (!file.endsWith('.d.ts')) continue
  const path = `dist/${file}`
  const source = await readFile(path, 'utf8')
  await writeFile(
    path,
    source.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g, '$1$2.js$3'),
  )
}
