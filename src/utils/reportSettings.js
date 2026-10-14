const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

/** Merges saved report settings over the defaults, ignoring wrong-typed fields so the preview can't crash. */
export function mergeReportSettings(defaults, saved) {
  const s = isObject(saved) ? saved : {}
  const text = (k) => (typeof s[k] === 'string' ? s[k] : defaults[k])
  const count = (k) => (typeof s[k] === 'string' || Number.isFinite(s[k]) ? s[k] : defaults[k])
  return {
    ...defaults,
    ...s,
    monthLabel: text('monthLabel'),
    tillDate: text('tillDate'),
    customMessage: text('customMessage'),
    matchesPlayed: count('matchesPlayed'),
    wins: count('wins'),
    losses: count('losses'),
    showWinsLosses: typeof s.showWinsLosses === 'boolean' ? s.showWinsLosses : defaults.showWinsLosses,
  }
}
