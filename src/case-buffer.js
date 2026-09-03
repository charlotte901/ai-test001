/** Two surfaces maximum: current + requested, outgoing + current, or
 * current + preload. A rapid manual jump drops the stale outgoing buffer. */
export function getCaseLayers(previous, shown, requested, next) {
  const pair = requested.id !== shown.id ? [shown, requested]
    : previous ? [previous, shown] : [shown, next];
  return [...new Map(pair.filter(Boolean).map(item => [item.id, item])).values()];
}
