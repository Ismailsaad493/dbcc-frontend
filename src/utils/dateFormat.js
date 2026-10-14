/** True for a complete, real dd/mm/yy date such as 12/10/26 (rejects 31/02/26, 00/00/00, partial input). */
export function isValidDate(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value)
  if (!m) return false
  const day = Number(m[1])
  const month = Number(m[2])
  const year = 2000 + Number(m[3])
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

/** Formats raw digit input into dd/mm/yy as the user types, inserting '/' automatically. */
export function formatDateInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
