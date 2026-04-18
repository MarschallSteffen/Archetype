import type { Diagram } from '../entities/Diagram.ts'
import type { ElementKind } from '../types.ts'
import { elementShape } from './shapeGeometry.ts'

/** Minimal renderer interface — only the method we need here. */
interface SizedRenderer {
  getRenderedSize(): { w: number; h: number }
}

/** Minimal element descriptor — subset of ElementDesc in main.ts. */
export interface LayoutElementDesc {
  kind: ElementKind
  collection: keyof Diagram
  renderers: Map<string, SizedRenderer>
}

export interface ElementRect {
  kind: ElementKind
  id: string
  x: number
  y: number
  w: number
  h: number
  ewZone?: number
}

/** Get all elements as {kind, id, x, y, w, h} for rubber-band / hit-testing */
export function getAllElementRects(
  state: Readonly<Diagram>,
  elements: LayoutElementDesc[],
): ElementRect[] {
  return elements.flatMap(desc => {
    const items = (state[desc.collection] as Array<{ id: string; position: { x: number; y: number }; size: { w: number; h: number } }>) ?? []
    return items.map(el => {
      const rs = desc.renderers.get(el.id)?.getRenderedSize() ?? el.size
      const isPill = elementShape(desc.kind) === 'pill'
      return {
        kind: desc.kind, id: el.id,
        x: el.position.x, y: el.position.y, w: rs.w, h: rs.h,
        ...(isPill ? { ewZone: rs.h / 2 } : {}),
      }
    })
  })
}

/**
 * Returns all element ids whose center lies strictly within the given
 * container's current rendered rect. Works for packages, UC systems,
 * and combined fragments — all container-type elements.
 */
export function getContainedElements(
  containerId: string,
  state: Readonly<Diagram>,
  elements: LayoutElementDesc[],
  pkgR: Map<string, SizedRenderer>,
  ucSysR: Map<string, SizedRenderer>,
  seqFragR: Map<string, SizedRenderer>,
): Array<{ kind: ElementKind; id: string }> {
  // Find the container in any of the container collections
  type Container = { id: string; position: { x: number; y: number }; size: { w: number; h: number } }
  let container: Container | undefined
  let renderedSize: { w: number; h: number } | undefined

  container = state.packages.find(p => p.id === containerId)
  if (container) renderedSize = pkgR.get(containerId)?.getRenderedSize()

  if (!container) {
    container = state.ucSystems.find(u => u.id === containerId)
    if (container) renderedSize = ucSysR.get(containerId)?.getRenderedSize()
  }
  if (!container) {
    container = state.combinedFragments?.find(f => f.id === containerId)
    if (container) renderedSize = seqFragR.get(containerId)?.getRenderedSize()
  }

  if (!container) return []
  const { w, h } = renderedSize ?? container.size
  const { x, y } = container.position
  const result: Array<{ kind: ElementKind; id: string }> = []
  const inside = (el: { position: { x: number; y: number }; size: { w: number; h: number } }) => {
    const cx = el.position.x + el.size.w / 2
    const cy = el.position.y + el.size.h / 2
    return cx > x && cx < x + w && cy > y && cy < y + h
  }
  for (const desc of elements) {
    const items = (state[desc.collection] as Array<{ id: string; position: { x: number; y: number }; size: { w: number; h: number } }>) ?? []
    items.forEach(el => { if (inside(el)) result.push({ kind: desc.kind, id: el.id }) })
  }
  return result
}
