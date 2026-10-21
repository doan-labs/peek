/*
 * <Peek name="Ada" /> for Vue 3.5+: the same tree and the same rules as the
 * React component in peek.tsx. ids come from Vue's useId, so the server and
 * the client agree; `class` and `style` fall through to the <svg>.
 *
 * With `animate`, the tree Vue renders stays in the pose the component
 * mounted with and the shared loop writes every frame straight to the DOM,
 * so a change of expression or gaze never reaches Vue's patch.
 */

import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  useId,
  type VNode,
  type VNodeRef,
  watch,
} from 'vue'
import { Live } from './animate'
import { draw, type Gaze, type Node, restPose } from './draw'
import { type PeekOptions, settle } from './svg'

export * from './core'

export type PeekProps = Omit<PeekOptions, 'gaze' | 'id'> & {
  name: string
  /** x and y in -1..1, or 'pointer' to follow the pointer (animate only). */
  gaze?: Gaze | 'pointer'
  /** Bring it to life after mount. Off under prefers-reduced-motion. */
  animate?: boolean
}

function toVue(node: Node, ref?: VNodeRef): VNode {
  return h(
    node.tag,
    { key: node.key, ...node.attrs, ref },
    node.children.map((c) => toVue(c)),
  )
}

// Every prop unset stays undefined so the name decides it, as in React.
// Booleans need their type, or `<Peek animate />` would arrive as ''.
const any = { type: null, default: undefined }
const flag = { type: Boolean, default: undefined }

export const Peek = defineComponent(
  (props: PeekProps) => {
    const id = `peek${useId().replace(/[^\w-]/g, '')}`
    const svg = ref<SVGSVGElement>()
    let live: Live | null = null
    const fixedOf = (g: PeekProps['gaze']) =>
      Array.isArray(g) ? (g as Gaze) : undefined
    const first = {
      expression: props.expression ?? 'normal',
      gaze: fixedOf(props.gaze),
    }

    const view = computed(() => {
      const { name, gaze, animate, ...rest } = props
      const { who, pose, opts } = settle(
        name,
        { ...rest, gaze: fixedOf(gaze), id },
        animate,
      )
      const tree = draw(
        who,
        animate ? restPose(who, first.expression, first.gaze) : pose,
        opts,
      )
      // live: the tree only changes when what the face is changes
      return { who, opts, tree, sig: JSON.stringify([who, opts]) }
    })
    const expression = () => props.expression ?? 'normal'

    onMounted(() => {
      watch(
        [() => props.animate, () => view.value.sig],
        () => {
          live?.destroy()
          live = null
          if (!props.animate || !svg.value) return
          const { tree, who, opts } = view.value
          live = new Live(svg.value, tree, who, opts, expression(), props.gaze)
        },
        { immediate: true, flush: 'post' },
      )
      watch(expression, (e) => live?.setExpression(e), { flush: 'post' })
      watch(
        () => String(props.gaze ?? ''),
        () => live?.setGaze(props.gaze),
        { flush: 'post' },
      )
    })
    onBeforeUnmount(() => live?.destroy())

    return () => toVue(view.value.tree, svg)
  },
  {
    // biome-ignore lint/style/useVueMultiWordComponentNames: <Peek> in every framework
    name: 'Peek',
    props: {
      name: { type: String, required: true },
      gaze: any,
      animate: { type: Boolean, default: false },
      size: { type: Number, default: undefined },
      expression: any,
      frame: any,
      square: flag,
      title: {
        type: [String, Boolean] as PropType<string | false>,
        default: undefined,
      },
      riso: flag,
      version: { type: Number, default: undefined },
      variant: any,
      face: any,
      color: any,
      eyes: any,
      brows: any,
      mouth: any,
      cheeks: any,
      trait: any,
      eyewear: any,
      headwear: any,
      neckwear: any,
    },
  },
)
