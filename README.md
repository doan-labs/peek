# Peek

<img src=".github/banner.svg" alt="Seven Peek faces looking at the one in the middle" width="100%">

A string in, a face out. The same name gives the same face, on the server
and in the browser, as pure SVG. A Doan Labs project.

```sh
npm install @doan-labs/peek
```

```tsx
import { Peek } from '@doan-labs/peek'

<Peek name='Linh' expression='happy' animate gaze='pointer' />
```

No React? `toSvg('Linh')` returns the SVG string, with no runtime
dependencies.

- **Deterministic.** No storage, no network, no randomness.
- **Alive.** Expressions, gaze, blinking, all opt-in.
- **Pinned.** A style version keeps today's faces forever.

[Docs](https://peek.doan-labs.com/docs) ·
[Changelog](https://peek.doan-labs.com/docs/changelog) ·
[npm](https://www.npmjs.com/package/@doan-labs/peek)

## Develop

```sh
bun install
bun run dev    # the site on :5173
bun run build
```

The library is `packages/peek`, the site is `apps/web`. Regenerate the
banner above with `bun scripts/banner.ts` in `packages/peek`.

## License

The code is [MIT](./LICENSE) © Doan Labs. The Doan Labs name and mark are
not covered by the license.
