import type { DiagramStore } from '../store/DiagramStore.ts'
import type { Toolbar } from '../ui/Toolbar.ts'

export interface ViewportCallbacks {
  dismissPopovers: () => void       // called inside applyViewport
  onViewportChanged: () => void     // called after applyViewport → seqCtrl.refreshLifelineAddButtons()
}

export class ViewportController {
  private panActive = false
  private panStart = { x: 0, y: 0 }
  private vpStart  = { x: 0, y: 0 }

  constructor(
    private store: DiagramStore,
    private svg: SVGSVGElement,
    private viewGroup: SVGGElement,
    private canvasContainer: HTMLElement,
    private toolbar: Toolbar,
    private callbacks: ViewportCallbacks,
  ) {}

  applyViewport(): void {
    const { x, y, zoom } = this.store.state.viewport
    this.viewGroup.setAttribute('transform', `translate(${x},${y}) scale(${zoom})`)
    // Shift dot-grid background by pan offset so it appears fixed in screen space
    const DOT_GRID_SIZE = 50 * zoom
    const bgX = ((x % DOT_GRID_SIZE) + DOT_GRID_SIZE) % DOT_GRID_SIZE
    const bgY = ((y % DOT_GRID_SIZE) + DOT_GRID_SIZE) % DOT_GRID_SIZE
    ;(this.svg.parentElement as HTMLElement).style.backgroundSize = `${DOT_GRID_SIZE}px ${DOT_GRID_SIZE}px`
    ;(this.svg.parentElement as HTMLElement).style.backgroundPosition = `${bgX}px ${bgY}px`
    this.updateZoomLabel()
    this.callbacks.onViewportChanged()
    // Dismiss open popovers — they're screen-pinned and would drift from their element
    this.callbacks.dismissPopovers()
  }

  private updateZoomLabel(): void {
    const zoomLabel = document.getElementById('zoom-label')
    if (!zoomLabel) return
    const z = this.store.state.viewport.zoom
    zoomLabel.textContent = `${Math.round(z * 100)}%`
  }

  register(): void {
    // ─── Pan ────────────────────────────────────────────────────────────────

    this.svg.addEventListener('mousedown', e => {
      if (this.toolbar.activeTool !== 'pan') return
      this.panActive = true
      this.panStart = { x: e.clientX, y: e.clientY }
      this.vpStart  = { x: this.store.state.viewport.x, y: this.store.state.viewport.y }
      this.canvasContainer.classList.add('pan-grabbing')
    })

    window.addEventListener('mousemove', e => {
      if (!this.panActive) return
      this.store.updateViewport({ x: this.vpStart.x + e.clientX - this.panStart.x, y: this.vpStart.y + e.clientY - this.panStart.y })
      this.applyViewport()
    })

    window.addEventListener('mouseup', () => {
      this.panActive = false
      this.canvasContainer.classList.remove('pan-grabbing')
    })

    // ─── Wheel zoom ─────────────────────────────────────────────────────────

    this.svg.addEventListener('wheel', e => {
      e.preventDefault()
      const vp = this.store.state.viewport
      const newZoom = Math.min(4, Math.max(0.2, vp.zoom * (e.deltaY < 0 ? 1.1 : 0.9)))

      // Keep the canvas point under the cursor fixed during zoom.
      // cursor in SVG element space → canvas point before zoom → recompute offset
      const svgRect = this.svg.getBoundingClientRect()
      const cursorX = e.clientX - svgRect.left
      const cursorY = e.clientY - svgRect.top
      // canvasPoint = (cursor - offset) / oldZoom  →  newOffset = cursor - canvasPoint * newZoom
      const newX = cursorX - ((cursorX - vp.x) / vp.zoom) * newZoom
      const newY = cursorY - ((cursorY - vp.y) / vp.zoom) * newZoom

      this.store.updateViewport({ zoom: newZoom, x: newX, y: newY })
      this.applyViewport()
    }, { passive: false })

    // ─── Zoom indicator / controller ────────────────────────────────────────

    const zoomCtrl = document.createElement('div')
    zoomCtrl.id = 'zoom-ctrl'
    zoomCtrl.innerHTML = `
  <button id="zoom-out" class="zoom-btn" title="Zoom out (scroll down)">−</button>
  <span id="zoom-label" class="zoom-label">100%</span>
  <button id="zoom-in"  class="zoom-btn" title="Zoom in (scroll up)">+</button>
  <button id="zoom-reset" class="zoom-btn zoom-reset" title="Reset zoom">⟳</button>
`
    this.canvasContainer.appendChild(zoomCtrl)

    // Pan mode cursor — keep grab cursor visible whenever pan tool is active
    this.toolbar.onToolChange(tool => {
      this.canvasContainer.classList.toggle('pan-mode', tool === 'pan')
      if (tool !== 'pan') this.canvasContainer.classList.remove('pan-grabbing')
    })
    if (this.toolbar.activeTool === 'pan') this.canvasContainer.classList.add('pan-mode')

    document.getElementById('zoom-out')!.addEventListener('click', () => {
      const vp = this.store.state.viewport
      const newZoom = Math.min(4, Math.max(0.2, vp.zoom * 0.9))
      this.store.updateViewport({ zoom: newZoom })
      this.applyViewport()
    })

    document.getElementById('zoom-in')!.addEventListener('click', () => {
      const vp = this.store.state.viewport
      const newZoom = Math.min(4, Math.max(0.2, vp.zoom * 1.1))
      this.store.updateViewport({ zoom: newZoom })
      this.applyViewport()
    })

    document.getElementById('zoom-reset')!.addEventListener('click', () => {
      this.store.updateViewport({ zoom: 1, x: 0, y: 0 })
      this.applyViewport()
    })
  }
}
