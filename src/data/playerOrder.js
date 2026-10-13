// Custom display order for the Points Manager player cards, per category.
// Fielding & Discipline and the Attendance checklist both use alphabetical
// order instead of a fixed list.

export const BATTING_ORDER = [
  'Nabeel',
  'Mujahid',
  'Tahir',
  'Nathiq',
  'Sanaulla',
  'Fouzan',
  'Danish',
  'Bilal',
  'Pk',
  'Saif',
  'Firdose',
  'Sharu',
  'Irfan',
  'Muzammil',
  'Eathu',
  'Faizal',
]

export const BOWLING_ORDER = [
  'Bilal',
  'Muzammil',
  'Pk',
  'Nabeel',
  'Tahir',
  'Irfan',
  'Sanaulla',
  'Danish',
  'Faizal',
  'Eathu',
  'Mujahid',
  'Nathiq',
  'Sharu',
  'Saif',
  'Firdose',
  'Fouzan',
]

/** Sorts players to match a fixed name order; unknown names sort last. */
export function sortByNameOrder(players, order) {
  const index = new Map(order.map((name, i) => [name.toLowerCase(), i]))
  return [...players].sort((a, b) => {
    const ai = index.get(a.name.toLowerCase()) ?? order.length
    const bi = index.get(b.name.toLowerCase()) ?? order.length
    return ai - bi
  })
}

export function sortAlphabetical(players) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name))
}
