/*
 * <Peek name="Ada" />: the same tree as toSvg, rendered through React. ids
 * come from useId, so the server and the client agree.
 *
 * A name decides identity unless the caller overrides an axis: pass `face`,
 * `color`, `eyes`, `brows`, `mouth`, `cheeks` or `trait` and that axis wins
 * over the hash while every other axis stays as the name made it.
 *
 * With `animate`, the first paint (server and hydration) is still the static
 * pose of `expression`; after mount the shared loop takes over and writes
 * straight to the DOM. The tree React renders stays in the pose the
 * component mounted with, so a change of expression or gaze never reaches
 * React's diff and React never fights the loop.
 */

import {
  type CSSProperties,
  createElement,
  type ReactElement,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Live } from './animate'
import { draw, type Gaze, type Node, restPose } from './draw'
import { type PeekOptions, settle } from './svg'

export type PeekProps = Omit<PeekOptions, 'gaze' | 'id'> & {
  name: string
  /** x and y in -1..1, or 'pointer' to follow the pointer (animate only). */
  gaze?: Gaze | 'pointer'
  /** Bring it to life after mount. Off under prefers-reduced-motion. */
  animate?: boolean
  className?: string
  style?: CSSProperties
}

const camel = (k: string) =>
  k.startsWith('aria-') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function toReact(
  node: Node,
  root?: { ref: Ref<SVGSVGElement>; className?: string; style?: CSSProperties },
): ReactElement {
  const props: Record<string, unknown> = { key: node.key, ...root }
  for (const k in node.attrs) props[camel(k)] = node.attrs[k]
  return createElement(node.tag, props, ...node.children.map((c) => toReact(c)))
}

export function Peek({
  name,
  gaze,
  animate = false,
  className,
  style,
  ...rest
}: PeekProps) {
  const id = `peek${useId().replace(/[^\w-]/g, '')}`
  const fixed = Array.isArray(gaze) ? (gaze as Gaze) : undefined
  const { who, pose, opts } = settle(
    name,
    { ...rest, gaze: fixed, id },
    animate,
  )
  const svg = useRef<SVGSVGElement>(null)
  const live = useRef<Live | null>(null)
  const expression = rest.expression ?? 'normal'
  const [first] = useState(() => ({ expression, gaze: fixed }))

  // live: the tree only changes when what the face is changes
  const sig = JSON.stringify([who, opts])
  const tree = draw(
    who,
    animate ? restPose(who, first.expression, first.gaze) : pose,
    opts,
  )

  const gazeKey = String(gaze ?? '')
  useEffect(() => {
    if (!animate || !svg.current) return
    const l = new Live(svg.current, tree, who, opts, expression, gaze)
    live.current = l
    return () => {
      l.destroy()
      live.current = null
    }
  }, [animate, sig])
  useEffect(() => {
    live.current?.setExpression(expression)
  }, [expression])
  useEffect(() => {
    live.current?.setGaze(gaze)
  }, [gazeKey])

  return toReact(tree, { ref: svg, className, style })
}
