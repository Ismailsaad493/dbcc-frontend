const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

/** Cleans the match log on load so a malformed record can't crash Match History. */
export function normalizeMatches(data) {
  if (!Array.isArray(data)) return []
  return data
    .filter((m) => isObject(m) && typeof m.id === 'string')
    .map((m) => ({
      ...m,
      date: String(m.date ?? ''),
      matchNumber: String(m.matchNumber ?? ''),
      points: (Array.isArray(m.points) ? m.points : []).filter(isObject).map((p) => ({
        ...p,
        batting: Number(p.batting) || 0,
        bowling: Number(p.bowling) || 0,
        fielding: Number(p.fielding) || 0,
      })),
      expenses: (Array.isArray(m.expenses) ? m.expenses : []).filter(isObject).map((e) => ({
        ...e,
        label: String(e.label ?? ''),
        amount: Number(e.amount) || 0,
      })),
    }))
}

export function matchId(date, matchNumber) {
  return `${date.trim()}__${matchNumber.trim()}`
}

function createMatch(date, matchNumber) {
  return { id: matchId(date, matchNumber), date: date.trim(), matchNumber: matchNumber.trim(), points: [], expenses: [] }
}

function findOrCreateMatch(matches, date, matchNumber) {
  const id = matchId(date, matchNumber)
  return matches.find((m) => m.id === id) || createMatch(date, matchNumber)
}

function upsertMatch(matches, match) {
  const idx = matches.findIndex((m) => m.id === match.id)
  if (idx === -1) return [...matches, match]
  const next = [...matches]
  next[idx] = match
  return next
}

export function addMatchPoints(matches, date, matchNumber, playerId, playerName, category, delta) {
  const match = findOrCreateMatch(matches, date, matchNumber)
  const hasEntry = match.points.some((p) => p.playerId === playerId)
  const points = hasEntry
    ? match.points.map((p) =>
        p.playerId === playerId ? { ...p, [category]: (p[category] || 0) + delta } : p,
      )
    : [
        ...match.points,
        { playerId, playerName, batting: 0, bowling: 0, fielding: 0, [category]: delta },
      ]
  return upsertMatch(matches, { ...match, points: onlyScorers(points) })
}

/** Used by "Clear <category> Points": zeroes that card's points in the given match so the history matches the correction. */
export function clearMatchPlayerCategory(matches, date, matchNumber, playerId, category) {
  const id = matchId(date, matchNumber)
  const match = matches.find((m) => m.id === id)
  if (!match) return matches
  const points = match.points.map((p) => (p.playerId === playerId ? { ...p, [category]: 0 } : p))
  return upsertMatch(matches, { ...match, points: onlyScorers(points) })
}

// A player whose points were all undone or cleared shouldn't linger as having "scored".
function onlyScorers(points) {
  return points.filter((p) => p.batting || p.bowling || p.fielding)
}

export function addMatchExpenses(matches, date, matchNumber, items) {
  if (!items.length) return matches
  const match = findOrCreateMatch(matches, date, matchNumber)
  return upsertMatch(matches, { ...match, expenses: [...match.expenses, ...items] })
}
