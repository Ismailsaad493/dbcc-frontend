/** Rounds to 2 decimals so sums like 0.1 + 0.2 display as 0.3, not 0.30000000000000004. */
export function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
