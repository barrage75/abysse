const INTERACTIVE_TARGETS = 'button, a[href], input, select, textarea, summary, [contenteditable="true"], [role="button"]'

export function isInteractiveTarget(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false
  const closest = (target as { closest?: unknown }).closest
  return typeof closest === 'function' && Boolean(closest.call(target, INTERACTIVE_TARGETS))
}
