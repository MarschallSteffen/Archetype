/**
 * Floating properties panel shown when a single element is selected.
 * Exposes the "Multiple instances" toggle and, for queues, a flow-direction toggle.
 * Positioned and dismissed consistently with Connection/Message popovers.
 */

let currentPanel: HTMLElement | null = null
let currentOutsideHandler: ((e: MouseEvent) => void) | null = null
let pendingTimerId: ReturnType<typeof setTimeout> | null = null

export function showElementPropertiesPanel(
  screenX: number,
  screenY: number,
  multiInstance: boolean,
  onChange: (multiInstance: boolean) => void,
  flowReversed?: boolean,
  onFlowReversed?: (reversed: boolean) => void,
) {
  hideElementPropertiesPanel()

  const layer = document.getElementById('popover-layer')!

  const panel = document.createElement('div')
  panel.id = 'elem-props-panel'
  panel.classList.add('popover', 'elem-props-panel')
  panel.style.left = `${screenX}px`
  panel.style.top  = `${screenY}px`

  const flowRow = onFlowReversed != null ? `
    <div class="popover-row">
      <label class="props-label">
        <input type="checkbox" id="ep-flow-rev" ${flowReversed ? 'checked' : ''}/>
        Reverse flow arrow
      </label>
    </div>
  ` : ''

  panel.innerHTML = `
    <div class="popover-row">
      <label class="props-label">
        <input type="checkbox" id="ep-multi" ${multiInstance ? 'checked' : ''}/>
        Multiple instances
      </label>
    </div>
    ${flowRow}
  `

  layer.appendChild(panel)
  currentPanel = panel

  panel.querySelector<HTMLInputElement>('#ep-multi')!.addEventListener('change', e => {
    onChange((e.target as HTMLInputElement).checked)
  })

  if (onFlowReversed) {
    panel.querySelector<HTMLInputElement>('#ep-flow-rev')!.addEventListener('change', e => {
      onFlowReversed((e.target as HTMLInputElement).checked)
    })
  }

  // Outside-click dismissal (same pattern as ConnectionPopover)
  const onOutside = (e: MouseEvent) => {
    if (!panel.contains(e.target as Node)) hideElementPropertiesPanel()
  }
  pendingTimerId = setTimeout(() => {
    pendingTimerId = null
    currentOutsideHandler = onOutside
    document.addEventListener('mousedown', onOutside)
  }, 150)
}

export function hideElementPropertiesPanel() {
  if (pendingTimerId !== null) {
    clearTimeout(pendingTimerId)
    pendingTimerId = null
  }
  if (currentOutsideHandler) {
    document.removeEventListener('mousedown', currentOutsideHandler)
    currentOutsideHandler = null
  }
  currentPanel?.remove()
  currentPanel = null
}
