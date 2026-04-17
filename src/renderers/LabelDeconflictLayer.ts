/**
 * LabelDeconflictLayer — iterative nudge for overlapping SVG text labels.
 *
 * Usage:
 *   const results = deconflict([{ name: 'conn-labels', boxes }])
 *   for (const [id, pos] of results) renderer.setLabelPosition(pos.x, pos.y)
 *
 * Layering:
 *   Layers are ordered highest-priority first. Boxes in later layers are pushed
 *   away from boxes in earlier layers (which are treated as immovable obstacles).
 *   Boxes within the same layer push each other symmetrically.
 *
 *   To add element-name labels as fixed obstacles in the future:
 *     deconflict([
 *       { name: 'element-names', boxes: elementNameBoxes }, // obstacles
 *       { name: 'conn-labels',   boxes: connLabelBoxes },   // movable
 *     ])
 */

export interface LabelBox {
  id: string  // opaque — used to identify result entries
  x: number   // centre-x
  y: number   // centre-y
  w: number   // bounding-box width
  h: number   // bounding-box height
}

export interface LabelResult {
  id: string
  x: number   // adjusted centre-x
  y: number   // adjusted centre-y
}

export interface DeconflictLayer {
  name: string
  boxes: LabelBox[]
}

/**
 * Run iterative nudge deconfliction over one or more layers.
 *
 * @param layers    ordered from highest priority (fixed obstacles) to lowest (most movable)
 * @param iterations  separation passes per layer (default 5)
 * @param padding   minimum gap between boxes in px (default 2)
 */
export function deconflict(
  layers: DeconflictLayer[],
  iterations = 5,
  padding = 2,
): Map<string, LabelResult> {
  const result = new Map<string, LabelResult>()

  // Working copies — one array per layer, same order as input
  const working: Array<Array<{ id: string; x: number; y: number; w: number; h: number }>> =
    layers.map(layer => layer.boxes.map(b => ({ ...b })))

  for (let li = 0; li < working.length; li++) {
    const cur = working[li]

    // Collect all boxes from previous (higher-priority) layers as immovable obstacles
    const obstacles: Array<{ x: number; y: number; w: number; h: number }> = []
    for (let pi = 0; pi < li; pi++) {
      for (const b of working[pi]) obstacles.push(b)
    }

    for (let iter = 0; iter < iterations; iter++) {
      // Symmetric push within the current layer
      for (let i = 0; i < cur.length; i++) {
        for (let j = i + 1; j < cur.length; j++) {
          nudgePair(cur[i], cur[j], padding)
        }
      }

      // Push current layer away from fixed obstacles (one-sided)
      for (const box of cur) {
        for (const obs of obstacles) {
          nudgeAgainstObstacle(box, obs, padding)
        }
      }
    }
  }

  // Populate result map from all layers
  for (const layer of working) {
    for (const b of layer) {
      result.set(b.id, { id: b.id, x: b.x, y: b.y })
    }
  }

  return result
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface MutableBox {
  x: number; y: number; w: number; h: number
}

/** Push two boxes apart symmetrically along the axis of least overlap. */
function nudgePair(a: MutableBox, b: MutableBox, padding: number): void {
  const ox = (a.w + b.w) / 2 + padding - Math.abs(a.x - b.x)
  const oy = (a.h + b.h) / 2 + padding - Math.abs(a.y - b.y)
  if (ox <= 0 || oy <= 0) return  // no overlap

  const half = 0.5
  if (ox <= oy) {
    // Resolve along X
    const push = ox * half
    if (a.x <= b.x) { a.x -= push; b.x += push }
    else             { a.x += push; b.x -= push }
  } else {
    // Resolve along Y
    const push = oy * half
    if (a.y <= b.y) { a.y -= push; b.y += push }
    else             { a.y += push; b.y -= push }
  }
}

/** Push a movable box away from a fixed obstacle (one-sided). */
function nudgeAgainstObstacle(box: MutableBox, obs: Readonly<MutableBox>, padding: number): void {
  const ox = (box.w + obs.w) / 2 + padding - Math.abs(box.x - obs.x)
  const oy = (box.h + obs.h) / 2 + padding - Math.abs(box.y - obs.y)
  if (ox <= 0 || oy <= 0) return

  if (ox <= oy) {
    const push = ox
    if (box.x <= obs.x) box.x -= push
    else                 box.x += push
  } else {
    const push = oy
    if (box.y <= obs.y) box.y -= push
    else                 box.y += push
  }
}
