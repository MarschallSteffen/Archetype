/**
 * FileMenu — title bar with a diagram title field and a File dropdown menu.
 *
 * Actions exposed:
 *   New        — resets the diagram (prompts for unsaved changes)
 *   Open       — loads a .json file via file picker
 *   Save       — opens a file handle (once) and writes; autosaves on every mutation
 *   Save As    — always opens the picker for a new file
 *   Export PNG — rasterises the SVG to a transparent-background PNG
 */

export interface FileMenuCallbacks {
  onNew:         () => void
  onOpen:        () => void
  onSave:        () => void
  onSaveAs:      () => void
  onExportPng:   () => void
  onTitleChange: (title: string) => void
}

export class FileMenu {
  private titleInput: HTMLInputElement
  private dropdown: HTMLElement
  private menuBtn: HTMLButtonElement
  private fileIndicator: HTMLSpanElement

  constructor(container: HTMLElement, callbacks: FileMenuCallbacks) {
    container.innerHTML = ''

    // ── File menu ──────────────────────────────────────────────────────
    const menuWrap = document.createElement('div')
    menuWrap.classList.add('titlebar-menu')

    this.menuBtn = document.createElement('button')
    this.menuBtn.classList.add('titlebar-menu-btn')
    this.menuBtn.textContent = 'File'
    this.menuBtn.addEventListener('click', e => {
      e.stopPropagation()
      this.toggleDropdown()
    })

    this.dropdown = document.createElement('div')
    this.dropdown.classList.add('titlebar-dropdown')

    const items: Array<{ label: string; shortcut?: string; action: () => void } | 'separator'> = [
      { label: 'New diagram',   shortcut: '⌘N',   action: callbacks.onNew },
      { label: 'Open…',         shortcut: '⌘⇧O',  action: callbacks.onOpen },
      'separator',
      { label: 'Save',          shortcut: '⌘⇧S',  action: callbacks.onSave },
      { label: 'Save As…',      shortcut: '⌘⇧⌥S', action: callbacks.onSaveAs },
      'separator',
      { label: 'Export as PNG', shortcut: '⌘⇧E',  action: callbacks.onExportPng },
    ]

    for (const item of items) {
      if (item === 'separator') {
        const sep = document.createElement('div')
        sep.classList.add('titlebar-menu-separator')
        this.dropdown.appendChild(sep)
        continue
      }
      const btn = document.createElement('button')
      btn.classList.add('titlebar-menu-item')
      btn.innerHTML = `
        <span>${item.label}</span>
        ${item.shortcut ? `<span class="menu-shortcut">${item.shortcut}</span>` : ''}
      `
      btn.addEventListener('click', () => {
        this.closeDropdown()
        item.action()
      })
      this.dropdown.appendChild(btn)
    }

    menuWrap.append(this.menuBtn, this.dropdown)

    // ── Title ──────────────────────────────────────────────────────────
    const titleWrap = document.createElement('div')
    titleWrap.classList.add('titlebar-title')

    this.titleInput = document.createElement('input')
    this.titleInput.type = 'text'
    this.titleInput.classList.add('titlebar-title-input')
    this.titleInput.placeholder = 'Untitled diagram'
    this.titleInput.spellcheck = false
    this.titleInput.addEventListener('change', () => {
      callbacks.onTitleChange(this.titleInput.value.trim())
    })
    this.titleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === 'Escape') this.titleInput.blur()
    })

    // File indicator — shows the active filename when a file is open
    this.fileIndicator = document.createElement('span')
    this.fileIndicator.classList.add('titlebar-file-indicator')

    titleWrap.append(this.titleInput, this.fileIndicator)
    container.append(menuWrap, titleWrap)

    // Close dropdown on outside click
    document.addEventListener('click', () => this.closeDropdown())
  }

  setTitle(title: string) {
    this.titleInput.value = title
  }

  getTitle(): string {
    return this.titleInput.value.trim() || 'diagram'
  }

  /** Show or hide the active file name indicator next to the title. */
  setFileIndicator(filename: string | null) {
    if (filename) {
      this.fileIndicator.innerHTML = `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 14V2h8l4 4v8H2z"/><path d="M10 2v4h4"/><path d="M5 10h6M5 12h4"/></svg> ${filename}`
      this.fileIndicator.style.display = ''
    } else {
      this.fileIndicator.innerHTML = ''
      this.fileIndicator.style.display = 'none'
    }
  }

  private toggleDropdown() {
    const isOpen = this.dropdown.classList.contains('open')
    if (isOpen) {
      this.closeDropdown()
    } else {
      this.dropdown.classList.add('open')
      this.menuBtn.classList.add('open')
    }
  }

  private closeDropdown() {
    this.dropdown.classList.remove('open')
    this.menuBtn.classList.remove('open')
  }
}
