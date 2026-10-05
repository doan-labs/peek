# Peek

A name in, a face out. Deterministic SVG avatars by Doan Labs.

```sh
npm install @doan-labs/peek
```

## React 19

Install React 19 or newer in your app, then render a face:

```tsx
import { Peek } from '@doan-labs/peek'

<Peek name='Linh' size={96} expression='happy' />
```

Use `animate` for blinking and expression transitions, and
`gaze='pointer'` to follow the pointer. Animation respects reduced motion.

## Plain SVG, without React

The SVG and identity entry points have no runtime dependencies:

```js
import { toSvg } from '@doan-labs/peek/svg'
import { identify } from '@doan-labs/peek/identity'

const svg = toSvg('Linh', { size: 96, expression: 'happy' })
const identity = identify('Linh')
```

The root entry point also exports `toSvg` and `identify` for React apps.
The same normalized name and options produce the same SVG every time.

See the [documentation](https://peek.doan-labs.com/docs) for options,
expressions, identity axes and versioned styles.

## License

[MIT](./LICENSE) © Doan Labs
