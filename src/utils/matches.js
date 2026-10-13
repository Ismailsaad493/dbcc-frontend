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
  return upsertMatch(matches, { ...match, points })
}

export function addMatchExpenses(matches, date, matchNumber, items) {
  if (!items.length) return matches
  const match = findOrCreateMatch(matches, date, matchNumber)
  return upsertMatch(matches, { ...match, expenses: [...match.expenses, ...items] })
}
