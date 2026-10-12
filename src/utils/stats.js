export function getRanked(players) {
  return [...players]
    .map((p) => ({ ...p, total: p.batting + p.bowling + p.fielding }))
    .sort((a, b) => b.total - a.total)
}

export function topBy(players, key) {
  const best = players.reduce(
    (best, p) => (p[key] > (best ? best[key] : -Infinity) ? p : best),
    null,
  )
  return best && best[key] > 0 ? best : null
}

export function getLeaders(players) {
  const ranked = getRanked(players)
  return {
    ranked,
    battingLeader: topBy(players, 'batting'),
    bowlingLeader: topBy(players, 'bowling'),
    fieldingLeader: topBy(players, 'fielding'),
    overallLeader: ranked[0] && ranked[0].total > 0 ? ranked[0] : null,
  }
}
