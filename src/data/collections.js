import { PLAYER_NAMES } from './players'

export const FULL_AMOUNT = 300

export function createInitialCollections() {
  return PLAYER_NAMES.map((name, index) => ({ id: index + 1, name, amountPaid: 0 }))
}

export function paymentStatus(amountPaid) {
  if (amountPaid >= FULL_AMOUNT) return 'Paid'
  if (amountPaid > 0) return 'Partially Paid'
  return 'Not Paid'
}

export function formatPendingText(collections) {
  const pending = collections.filter((c) => c.amountPaid < FULL_AMOUNT)
  if (!pending.length) return 'Awaiting contribution from the below.\n\nEveryone has paid in full. 🎉'
  const lines = ['Awaiting contribution from the below.', '']
  pending.forEach((c, i) => {
    const suffix = paymentStatus(c.amountPaid) === 'Partially Paid' ? `(₹${FULL_AMOUNT - c.amountPaid})` : ''
    lines.push(`${i + 1}. ${c.name}${suffix}`)
  })
  return lines.join('\n')
}
