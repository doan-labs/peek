/*
 * The site's Peek: every face on the page wears the outfit its name picks,
 * so the cast looks dressed at random and stays dressed the same on every
 * visit. An explicit slot, `'none'` included, still wins.
 */
import { Peek as Base, type PeekProps } from '@doan-labs/peek'
import { wardrobeFor } from '@/lib/wardrobe'

export function Peek(props: PeekProps) {
  return <Base {...wardrobeFor(props.name)} {...props} />
}
