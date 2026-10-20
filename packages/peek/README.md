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

## Accessories

Dress a face with three independent slots:

```tsx
<Peek name='Linh' eyewear='glasses' headwear='bow' />
<Peek name='Linh' eyewear='sunglasses' headwear='sprout' />
<Peek name='Linh' headwear='cap' neckwear='tie' animate />
```

Eyewear: `none`, `glasses`, `sunglasses`. Headwear: `none`, `bow`, `cap`,
`sprout`. Neckwear: `none`, `tie`. All default to `none` at `peek@1`, so
existing avatars stay unchanged. Slots combine and work with every
expression, gaze and frame. The same options work with `toSvg`.

## Variants

Draw the same face another way. A variant never changes who it is:

```tsx
<Peek name='Linh' variant='haze' />
<Peek name='Linh' variant='bloc' expression='angry' animate />
```

`peek` (default), `haze` (the body in soft color) or `bloc` (flat
geometry: two tones, one bar, hard edges). Every variant draws every
expression, gaze and frame.

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
