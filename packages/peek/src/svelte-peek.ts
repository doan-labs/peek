/* What peek.svelte imports. Built as its own file, since the component ships
 * as source and the app's bundler compiles it. */
import type { Gaze } from './draw'
import type { PeekOptions } from './svg'

export { Live } from './animate'
export { draw, restPose } from './draw'
export { serialize, settle } from './svg'

export type PeekProps = Omit<PeekOptions, 'gaze' | 'id'> & {
  name: string
  /** x and y in -1..1, or 'pointer' to follow the pointer (animate only). */
  gaze?: Gaze | 'pointer'
  /** Bring it to life after mount. Off under prefers-reduced-motion. */
  animate?: boolean
  class?: string
  style?: string
}
