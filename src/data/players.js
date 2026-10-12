export const PLAYER_NAMES = [
  'Mujahid',
  'Nabeel',
  'Tahir',
  'Nathiq',
  'Fouzan',
  'Bilal',
  'Danish',
  'Sanaulla',
  'Pk',
  'Sharu',
  'Muzammil',
  'Faizal',
  'Eathu',
  'Saif',
  'Firdose',
  'Irfan',
]

export function createInitialPlayers() {
  return PLAYER_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    batting: 0,
    bowling: 0,
    fielding: 0,
  }))
}
