<!--
  <Peek name="Ada" /> for Svelte 5: the same tree and the same rules as the
  React component in peek.tsx. ids come from $props.id(), so the server and
  the client agree. The inside of the svg is the exact markup toSvg writes.

  With `animate`, the markup stays in the pose the component mounted with and
  the shared loop writes every frame straight to the DOM, so a change of
  expression or gaze never reaches Svelte.
-->
<script lang="ts">
import { untrack } from 'svelte'
import {
  draw,
  Live,
  type PeekProps,
  restPose,
  serialize,
  settle,
} from './svelte-peek'

let {
  name,
  gaze,
  animate = false,
  class: className,
  style,
  ...rest
}: PeekProps = $props()
const uid = $props.id()
const id = `peek${uid.replace(/[^\w-]/g, '')}`
const fixedOf = (g: PeekProps['gaze']) =>
  Array.isArray(g) ? (g as readonly [number, number]) : undefined
const first = untrack(() => ({
  expression: rest.expression ?? 'normal',
  gaze: fixedOf(gaze),
}))

const s = $derived(settle(name, { ...rest, gaze: fixedOf(gaze), id }, animate))
const tree = $derived(
  draw(
    s.who,
    animate ? restPose(s.who, first.expression, first.gaze) : s.pose,
    s.opts,
  ),
)
const inner = $derived(tree.children.map(serialize).join(''))
const expression = $derived(rest.expression ?? 'normal')
// live: the face only restarts when what the face is changes
const sig = $derived(JSON.stringify([s.who, s.opts]))
const gazeKey = $derived(String(gaze ?? ''))

let svg: SVGSVGElement | undefined
let live: Live | null = null

$effect(() => {
  void sig
  if (!animate || !svg) return
  const l = untrack(() => new Live(svg!, tree, s.who, s.opts, expression, gaze))
  live = l
  return () => {
    l.destroy()
    live = null
  }
})
$effect(() => {
  live?.setExpression(expression)
})
$effect(() => {
  void gazeKey
  untrack(() => live?.setGaze(gaze))
})
</script>

<!-- spread, so an unset class is no attribute rather than class="" -->
<svg bind:this={svg} {...tree.attrs} {...{ class: className, style }}>{@html inner}</svg>
