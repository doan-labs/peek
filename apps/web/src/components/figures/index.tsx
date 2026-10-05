/* Every docs figure by id. lib/docs.ts places them; each page's figures
 * live in the file named for it. */
import type { FigureId } from '@/lib/docs'
import { HashMachine, Versions } from './identity'
import { Install, RunsWhere } from './install'
import { IntroNumbers, SameFace } from './intro'
import { Hydration, PropsPlayground } from './react'
import { Alive, Expressions, GazePad } from './state'
import { DataUri, SameBytes, ServeIt } from './svg'

export const FIGURES: Record<FigureId, () => React.ReactNode> = {
  'intro-numbers': IntroNumbers,
  'same-face': SameFace,
  install: Install,
  'runs-where': RunsWhere,
  'props-playground': PropsPlayground,
  hydration: Hydration,
  'same-bytes': SameBytes,
  'serve-it': ServeIt,
  'data-uri': DataUri,
  'hash-machine': HashMachine,
  versions: Versions,
  expressions: Expressions,
  'gaze-pad': GazePad,
  alive: Alive,
}
