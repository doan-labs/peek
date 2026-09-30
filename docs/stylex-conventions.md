# StyleX conventions

How to write StyleX in this repo. Rules only. The plan and the order of work
are in [`stylex-migration.md`](stylex-migration.md); this is what to do once
you are converting a file.

Installed: **`@stylexjs/stylex` 0.19.1**, **`@stylexjs/unplugin` 0.19.1**,
wired in `vite.config.ts` before `viteReact()`. Tailwind is gone; StyleX and
`styles.css` are the whole system.

## Where things live

```
src/lib/tokens.stylex.ts   defineVars for every token. Nothing else may live here.
src/lib/theme.ts           createTheme for dark, plus isDark() and setDark().
src/styles.css             the global stylesheet. Read "What stays in CSS".
```

## Tokens

Import the group you need and index it by the **literal CSS variable name**.
The `--` keys are deliberate, so the names survive into the stylesheet the
canvases and the components layer already read:

```ts
import { colors, fonts, easings } from '@/lib/tokens.stylex'

const styles = stylex.create({
  row: {
    color: colors['--color-ink-muted'],
    fontFamily: fonts['--font-mono'],
    transitionTimingFunction: easings['--ease-premium'],
  },
})
```

- `colors.ink` does not exist and never will. Bracket, always.
- **Never hardcode a hex.** The rule from AGENTS.md is unchanged.
- `tokens.stylex.ts` is the only declaration of these names. `styles.css`
  reads them and declares none.

## Authoring

One `stylex.create` per file, near the top, named for what it styles. Values
are plain CSS; a bare number means `px`.

```tsx
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  row: { display: 'flex', gap: '0.5rem', paddingBlock: '1rem' },
  quiet: { color: colors['--color-ink-faint'] },
})

<div {...stylex.props(styles.row, quiet && styles.quiet)} />
```

- **Spacing is rem**, the scale the site was drawn on. A value that was always
  px, such as a hairline or a 11px label, stays px.
- Breakpoints are `'@media (width >= 48rem)'` and the same shape at 40, 64,
  80 and 96rem.
- **`cn()` is for global class hooks only**, never for styling. Conditionals
  are arguments: `stylex.props(styles.a, x && styles.b)`, and unlike `cn` the
  later one actually wins.

## Dark mode

**You almost never write a dark rule.** `createTheme` re-declares the tokens
on `<html>`, so `colors['--color-ink']` is already the right ink in both
schemes. Drop `dark:` variants as you convert; do not translate them.

The exception is a value that is not a token: an opacity, a blend mode, a
shadow that has to differ. Write it as a media condition, not a class:

```ts
mixBlendMode: {
  default: 'multiply',
  '@media (prefers-color-scheme: dark)': 'screen',
},
```

That is correct for a visitor on the system default and wrong for one who has
used the toggle. If a component genuinely needs per-scheme styling that the
toggle must reach, add the token it is missing to `tokens.stylex.ts` and
`theme.ts` instead. That is the supported path.

## Motion

Reduced motion is a condition on the property, not a variant:

```ts
transform: {
  default: 'none',
  '@media (prefers-reduced-motion: no-preference)': 'translateY(-2px)',
},
```

`motion-reduce:transition-none` is `transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'transform' }`. **Never `default: null` here.** `null` emits nothing, the property falls back to its initial `all`, and with a duration set everything transitions under reduced motion. Verified in the browser both ways.

The same trap for borders: `borderRightWidth: { default: null, '@media (width >= 48rem)': '1px' }` computes to `medium` below the breakpoint wherever nothing has reset the width, because a `borderStyle` is set. Write `default: 0`. In general, `null` is only right where the initial value is the value you want with no reset in play.

Keyframes are values:

```ts
const pulse = stylex.keyframes({ '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } })
// then animationName: pulse
```

AGENTS.md still governs: reduced motion lands on the idle state, and a gesture
is gated on `no-preference` rather than switched off below.

## Hover

Tailwind v4 wrapped every `hover:` in `@media (hover: hover)`, so a plain
`:hover` in StyleX is a behaviour change on touch: the hovered colour sticks
after a tap. Every hover is nested the same way:

```ts
color: {
  default: colors['--color-ink-muted'],
  '@media (hover: hover)': { default: null, ':hover': colors['--color-ink'] },
},
```

The inner `null` is correct here: it emits nothing and the base value stands.
`:focus-visible` is not wrapped; keyboards do not have the problem.

## Hover on a parent

Tailwind's `group` / `group-hover:` is `stylex.when.ancestor()`. The parent
carries a marker, the child asks about it:

```tsx
const styles = stylex.create({
  text: {
    color: {
      default: colors['--color-ink-muted'],
      [stylex.when.ancestor(':hover')]: colors['--color-ink'],
    },
  },
})

<a {...stylex.props(stylex.defaultMarker())}>
  <span {...stylex.props(styles.text)} />
</a>
```

- `stylex.defaultMarker()` is enough when there is one group on the element.
- For nested groups, `stylex.defineMarker()`, which **must be a named export
  from a `.stylex.ts` file**. It errors in a component file.
- `when.ancestor()` styles a descendant from an ancestor's own state. It
  cannot ask whether an ancestor *contains* something hovered. That is
  `:has()`, and those rules stay in CSS.

## Recipes

**Screen reader only**, replacing `sr-only`:

```ts
srOnly: {
  position: 'absolute',
  width: '1px', height: '1px',
  padding: 0, margin: '-1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
},
```

`focus:not-sr-only` is the same namespace applied conditionally on
`:focus-visible`, or a second namespace passed after it.

**Focus**, which the global `:focus-visible` outline already covers. Only add
one where the component wants something other than the default:

```ts
outlineOffset: { default: null, ':focus-visible': '6px' },
```

**Container queries** work, on the element that declares
`containerType: 'inline-size'`:

```ts
plate: { containerType: 'inline-size' },
word: { fontSize: '38.2cqw' },
```

`@container (min-width: 20rem)` as a condition key works too. See
`site-footer.tsx`.

## What stays in styles.css

Do not try to move these. They are not a backlog.

- **The eight `:has()` rules.** StyleX has no expression for them, and moving
  the behaviour into React state is forbidden by AGENTS.md.
- **Every global class hook**: `.dm-*`, `.reveal`, `.rise`, `.project-*`,
  `.stage-*`, `.relief-*`, `.person-*`, and anything a keyframe references by
  a global name.
- **Any class added from JS**, such as the `is-visible` that `reveal.tsx`
  sets. StyleX binds a class at the call site; adding one later fights it.
- **`html:has(.profile[open])`** and anything else styling an element no
  component renders.
- The `@fontsource-variable` and `lenis` imports, and the `@layer base` reset.

StyleX rules are emitted **unlayered** with specificity boosts, so they beat
both the `@layer base` reset and the `@layer components` rules without anyone
writing `!important`.

## Gotchas, all hit for real on 0.19.1

- **Three shorthands compile to nothing, silently: `animation`, `background`,
  `border`.** No error, no CSS, the style just is not there. Write
  `animationName` / `animationDuration` / `animationTimingFunction` /
  `animationIterationCount`, `backgroundColor` or `backgroundImage`, and
  `borderWidth` / `borderStyle` / `borderColor`. Every other shorthand tested
  (`margin`, `padding`, `inset`, `transition`, `outline`, `font`, `flex`,
  `grid`, `boxShadow`, `textDecoration`) is fine.
- **`@/` imports of `.stylex.ts` files only resolve because `vite.config.ts`
  repeats the alias** to the plugin. StyleX does its own resolution and does
  not read tsconfig. A new alias has to be added there too, or the build fails
  with "Only static values are allowed inside of a createTheme() call".
- **`stylex.props(theme).className` returns more than one class.** The theme
  override and the variable group it overrides. `classList.toggle` throws on a
  string with a space in it, inside a `try`, which looks exactly like a page
  with no dark mode. `lib/theme.ts` keeps them as a list; use `setDark()`.
- **Do not read a generated class name at module scope in a route file.** The
  same chunk-ordering footgun AGENTS.md documents for `site.links`: the
  pre-paint script in `__root.tsx` is built by a function for that reason, and
  as a `const` it shipped `classList.toggle('undefined')`.
- A `.stylex.ts` file may hold only named `defineVars`, `defineConsts` and
  `defineMarker` exports. `createTheme` lives in an ordinary file.
- The dev server adds a readable debug class next to each hashed one
  (`theme__darkTheme`). Production does not. Never match on a class name.
- The build appends StyleX's sheet to `styles.css`, so there is one stylesheet
  in production and no extra `<link>`. Dev serves `/virtual:stylex.css`
  separately, which is why `__root.tsx` links it under `import.meta.env.DEV`.

## Gates

Unchanged, and every one of them has to pass before a phase is handed on:

```bash
bun run lint
bun run check-types
bun run build
WORKERS_CI=1 bun run build
```

Then look at `/` in both schemes, and check the hero object's `<canvas>` is
actually in the DOM. It fails by unmounting, never by erroring.
