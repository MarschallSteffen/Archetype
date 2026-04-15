import type { DiagramStore } from '../store/DiagramStore.ts'
import type { Selectable } from './SelectionManager.ts'
import type { ElementKind } from '../types.ts'

interface DragTarget {
  kind: ElementKind
  id: string
  startX: number
  startY: number
}

export class DragController {
  private active: DragTarget[] = []
  private startMouseX = 0
  private startMouseY = 0

  constructor(
    private store: DiagramStore,
    private getSvgPoint: (e: MouseEvent) => DOMPoint,
    /**
     * Returns the ids of all non-package elements whose center lies within the
     * given container package rect. Called when a container package drag starts
     * so those elements are co-dragged.
     */
    private getContainedElements: (pkgId: string) => Array<{ kind: ElementKind; id: string }> = () => [],
  ) {}

  /**
   * Start dragging. If `selection` is provided and the dragged element is
   * part of the selection, ALL selected (non-connection) items are dragged.
   * Otherwise only the single element is dragged.
   */
  startDrag(
    target: { kind: ElementKind; id: string },
    e: MouseEvent,
    selection: Selectable[] = [],
  ) {
    const pt = this.getSvgPoint(e)

    // Determine which items to drag: if the clicked element is in the
    // multi-selection, drag everything selected; otherwise just this one.
    const inSelection = selection.some(s => s.id === target.id && s.kind === target.kind)
    const items: Array<{ kind: ElementKind; id: string }> = inSelection
      ? (selection.filter(s => s.kind !== 'connection') as Array<{ kind: ElementKind; id: string }>)
      : [target]

    // If the dragged item is a package being moved alone (single selection or
    // not yet in selection), expand with all elements contained inside it.
    const draggingPackageAlone = target.kind === 'package' &&
      (!inSelection || (inSelection && selection.filter(s => s.kind !== 'connection').length === 1))
    if (draggingPackageAlone) {
      const contained = this.getContainedElements(target.id)
      for (const c of contained) {
        if (!items.some(i => i.id === c.id && i.kind === c.kind)) {
          items.push(c)
        }
      }
    }

    this.active = []
    for (const item of items) {
      const el = this.store.findElementById(item.kind, item.id)
      if (el) {
        this.active.push({ kind: item.kind, id: item.id, startX: el.position.x, startY: el.position.y })
      }
    }

    this.startMouseX = pt.x
    this.startMouseY = pt.y
  }

  onMouseMove(e: MouseEvent) {
    if (this.active.length === 0) return
    const pt = this.getSvgPoint(e)
    const dx = pt.x - this.startMouseX
    const dy = pt.y - this.startMouseY

    for (const t of this.active) {
      this.store.updateElementPosition(t.kind, t.id, {
        position: { x: t.startX + dx, y: t.startY + dy },
      })
    }
  }

  onMouseUp() { this.active = [] }

  get isDragging() { return this.active.length > 0 }
}
