/*
 * A nav link's own small Peek, worked out from the link's label. Undressed:
 * at this size an accessory reads as noise, so the face stays just a face.
 */
import { Peek } from '@doan-labs/peek'
import * as stylex from '@stylexjs/stylex'

export function LinkFace({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <Peek
      name={name}
      size={size}
      frame='none'
      title={false}
      expression='happy'
      {...stylex.props(styles.face)}
    />
  )
}

const styles = stylex.create({
  // overhangs the line a little, so the label keeps its centre line
  face: { flexShrink: 0, marginBlock: '-3px' },
})
