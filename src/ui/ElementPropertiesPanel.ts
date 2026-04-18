/**
 * Floating properties panel shown when a single element is selected.
 * Exposes the "Multiple instances" toggle and, for queues, a flow-direction toggle.
 * Also exposes an "Accent color" picker row with 8 Catppuccin color swatches.
 * For UML classes, exposes a stereotype selector.
 * Positioned and dismissed consistently with Connection/Message popovers.
 */

import type { Stereotype } from '../entities/UmlClass.ts'
import { STEREOTYPES } from '../entities/UmlClass.ts'
import { createPopover } from './popover.ts'

const ACCENT_COLORS = [
  '--ctp-red',
  '--ctp-peach',
  '--ctp-yellow',
  '--ctp-green',
  '--ctp-teal',
  '--ctp-blue',
  '--ctp-lavender',
  '--ctp-mauve',
] as const

let currentDismiss: (() => void) | null = null

export function showElementPropertiesPanel(
  screenX: number,
  screenY: number,
  multiInstance: boolean | undefined,
  onChange: (multiInstance: boolean) => void,
  flowReversed?: boolean,
  onFlowReversed?: (reversed: boolean) => void,
  accentColor?: string,
  onAccentColor?: (color: string | undefined) => void,
  stereotype?: Stereotype,
  onStereotype?: (s: Stereotype) => void,
) {
  hideElementPropertiesPanel()

  const multiRow = multiInstance !== undefined ? `
    <div class="popover-row">
      <label class="props-label">
        <input type="checkbox" id="ep-multi" ${multiInstance ? 'checked' : ''}/>
        Multiple instances
      </label>
    </div>
  ` : ''

  const flowRow = onFlowReversed != null ? `
    <div class="popover-row">
      <label class="props-label">
        <input type="checkbox" id="ep-flow-rev" ${flowReversed ? 'checked' : ''}/>
        Reverse flow arrow
      </label>
    </div>
  ` : ''

  const stereotypeRow = onStereotype != null ? `
    <div class="popover-section-label">Stereotype</div>
    <div class="popover-row" id="ep-stereotype-row"></div>
  ` : ''

  const { el: panel, dismiss } = createPopover('elem-props-panel', ['elem-props-panel'], screenX, screenY)
  currentDismiss = dismiss

  panel.innerHTML = `
    ${stereotypeRow}
    ${multiRow}
    ${flowRow}
    <div class="popover-row accent-row">
      <span class="accent-label">Accent color</span>
      <div class="accent-swatches" id="ep-accent-swatches"></div>
    </div>
  `

  if (onStereotype != null) {
    const row = panel.querySelector<HTMLElement>('#ep-stereotype-row')!
    for (const { value, label } of STEREOTYPES) {
      const btn = document.createElement('button')
      btn.classList.add('conn-type-btn', 'conn-type-btn--text')
      if (stereotype === value) btn.classList.add('active')
      btn.title = label
      btn.textContent = label
      btn.addEventListener('click', e => {
        e.stopPropagation()
        row.querySelectorAll('.conn-type-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        onStereotype(value)
      })
      row.appendChild(btn)
    }
  }

  if (multiInstance !== undefined) {
    panel.querySelector<HTMLInputElement>('#ep-multi')!.addEventListener('change', e => {
      onChange((e.target as HTMLInputElement).checked)
    })
  }

  if (onFlowReversed) {
    panel.querySelector<HTMLInputElement>('#ep-flow-rev')!.addEventListener('change', e => {
      onFlowReversed((e.target as HTMLInputElement).checked)
    })
  }

  // Build color swatches
  if (onAccentColor) {
    const swatchContainer = panel.querySelector<HTMLElement>('#ep-accent-swatches')!

    ACCENT_COLORS.forEach(color => {
      const btn = document.createElement('button')
      btn.classList.add('accent-swatch')
      if (accentColor === color) btn.classList.add('accent-swatch--active')
      btn.style.background = `var(${color})`
      btn.title = color.replace('--ctp-', '')
      btn.addEventListener('click', e => {
        e.stopPropagation()
        const isActive = btn.classList.contains('accent-swatch--active')
        swatchContainer.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('accent-swatch--active'))
        if (isActive) {
          onAccentColor(undefined)
        } else {
          btn.classList.add('accent-swatch--active')
          onAccentColor(color)
        }
      })
      swatchContainer.appendChild(btn)
    })

    // Clear button
    const clearBtn = document.createElement('button')
    clearBtn.classList.add('accent-swatch', 'accent-swatch--clear')
    if (!accentColor) clearBtn.classList.add('accent-swatch--active')
    clearBtn.title = 'None'
    clearBtn.textContent = '×'
    clearBtn.addEventListener('click', e => {
      e.stopPropagation()
      swatchContainer.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('accent-swatch--active'))
      clearBtn.classList.add('accent-swatch--active')
      onAccentColor(undefined)
    })
    swatchContainer.appendChild(clearBtn)
  }
}

export function hideElementPropertiesPanel() {
  currentDismiss?.()
  currentDismiss = null
}
