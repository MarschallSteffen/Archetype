interface ShortcutRow {
  key: string
  action: string
}

interface ShortcutSection {
  title: string
  rows: ShortcutRow[]
}

const SECTIONS: ShortcutSection[] = [
  {
    title: 'Tools',
    rows: [
      { key: 'V', action: 'Select tool' },
      { key: 'H', action: 'Pan tool' },
      { key: 'C', action: 'Class' },
      { key: 'P', action: 'Package' },
      { key: 'A', action: 'Agent' },
      { key: 'U', action: 'Human Agent' },
      { key: 'S', action: 'Storage' },
      { key: 'Q', action: 'Queue' },
      { key: 'E', action: 'Use Case' },
      { key: 'T', action: 'State' },
      { key: 'L', action: 'Sequence Diagram' },
      { key: 'X', action: 'Comment' },
    ],
  },
  {
    title: 'Edit',
    rows: [
      { key: '⌘Z / Ctrl+Z', action: 'Undo' },
      { key: '⌘Y / Ctrl+Y', action: 'Redo' },
      { key: '⌘A / Ctrl+A', action: 'Select All' },
      { key: '⌘C / Ctrl+C', action: 'Copy' },
      { key: '⌘V / Ctrl+V', action: 'Paste' },
      { key: 'Delete / ⌫', action: 'Delete selected' },
      { key: 'Arrow keys', action: 'Nudge 1px' },
      { key: 'Shift+Arrow', action: 'Nudge 10px' },
    ],
  },
  {
    title: 'File',
    rows: [
      { key: '⌘N / Ctrl+N', action: 'New diagram' },
      { key: '⌘⇧O / Ctrl+Shift+O', action: 'Open…' },
      { key: '⌘⇧S / Ctrl+Shift+S', action: 'Save' },
      { key: '⌘⇧⌥S / Ctrl+Shift+Alt+S', action: 'Save As…' },
    ],
  },
  {
    title: 'View',
    rows: [
      { key: '⌘F / Ctrl+F', action: 'Search / Find' },
      { key: 'Scroll', action: 'Zoom in/out' },
      { key: 'Middle drag', action: 'Pan canvas' },
      { key: '?', action: 'Show this help' },
    ],
  },
]

function buildSection(section: ShortcutSection): string {
  const rows = section.rows
    .map(
      r =>
        `<div class="help-modal-row">
          <span class="help-modal-key">${r.key}</span>
          <span class="help-modal-action">${r.action}</span>
        </div>`,
    )
    .join('')
  return `<div class="help-modal-section">
    <div class="help-modal-section-title">${section.title}</div>
    ${rows}
  </div>`
}

function buildHTML(): string {
  const sections = SECTIONS.map(buildSection).join('')
  return `<div class="modal-overlay" id="help-modal-overlay">
  <div class="modal-dialog help-modal" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
    <div class="modal-header">
      <h2 class="modal-title">Keyboard Shortcuts</h2>
      <button class="modal-close" aria-label="Close">✕</button>
    </div>
    <div class="modal-body help-modal-body">
      ${sections}
    </div>
  </div>
</div>`
}

let overlayEl: HTMLElement | null = null

function getOverlay(): HTMLElement {
  if (!overlayEl) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = buildHTML()
    overlayEl = wrapper.firstElementChild as HTMLElement
    document.body.appendChild(overlayEl)

    overlayEl.addEventListener('click', e => {
      if (e.target === overlayEl) closeHelpModal()
    })

    overlayEl.querySelector('.modal-close')?.addEventListener('click', closeHelpModal)
  }
  return overlayEl
}

export function isHelpModalOpen(): boolean {
  return overlayEl?.classList.contains('open') ?? false
}

export function openHelpModal(): void {
  getOverlay().classList.add('open')
}

export function closeHelpModal(): void {
  overlayEl?.classList.remove('open')
}

export function toggleHelpModal(): void {
  getOverlay().classList.toggle('open')
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isHelpModalOpen()) {
    e.stopPropagation()
    closeHelpModal()
  }
})
