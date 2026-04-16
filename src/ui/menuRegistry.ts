/** Shared registry so titlebar menus close each other when one opens. */
const registry: Array<() => void> = []

export function registerMenu(closeFn: () => void) {
  registry.push(closeFn)
}

export function closeAllMenus() {
  registry.forEach(fn => fn())
}
