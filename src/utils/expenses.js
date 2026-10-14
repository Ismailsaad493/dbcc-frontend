import { roundMoney } from './money'

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Derives this month's label, last month's balance label, and this month's collection label from a {monthIndex, year} pick. */
export function describeFirstMonth({ monthIndex, year }) {
  const monthLabel = `${MONTHS[monthIndex]} '${year}`
  const lastMonthIndex = (monthIndex - 1 + 12) % 12
  // January's "last month" is December of the previous year (00 wraps to 99).
  const lastMonthYear =
    monthIndex === 0 && /^\d{1,2}$/.test(year)
      ? String((Number(year) + 99) % 100).padStart(2, '0')
      : year
  const lastMonthLabel = `${MONTHS[lastMonthIndex]}'${lastMonthYear} balance`
  const collectionLabel = `${MONTHS[monthIndex]} collection`
  return { monthLabel, lastMonthLabel, collectionLabel }
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

/**
 * Normalizes saved expense state on load: fills in fields older periods lack
 * (collection label/amount) and repairs malformed periods, so stored data in an
 * unexpected shape can't crash the whole app.
 */
export function migrateState(data) {
  if (!data || !Array.isArray(data.periods)) return { periods: [], activeId: null }
  return {
    ...data,
    periods: data.periods.filter(isObject).map((p) => {
      const label = typeof p.label === 'string' ? p.label : ''
      return {
        collectionLabel: defaultCollectionLabel(label),
        collectionAmount: '',
        openingBalanceLabel: '',
        editableOpening: false,
        ...p,
        label,
        openingBalance: Number(p.openingBalance) || 0,
        income: Array.isArray(p.income) ? p.income.filter(isObject) : [],
        expenses: Array.isArray(p.expenses) ? p.expenses.filter(isObject) : [],
      }
    }),
  }
}

export function defaultCollectionLabel(label) {
  const firstWord = label.split(/[\s']/)[0]
  return firstWord ? `${firstWord} collection` : 'This month collection'
}

export function createPeriod({ label, openingBalanceLabel, openingBalance, editableOpening }) {
  return {
    id: uid(),
    label,
    openingBalanceLabel,
    openingBalance: Number(openingBalance) || 0,
    editableOpening: Boolean(editableOpening),
    collectionLabel: defaultCollectionLabel(label),
    collectionAmount: '',
    income: [],
    expenses: [],
  }
}

export function newLineItem(label = '', amount = '') {
  return { id: uid(), label, amount }
}

export function newExpenseItem(label = '', amount = '', date = '') {
  return { id: uid(), label, amount, date }
}

function sum(items) {
  return roundMoney(items.reduce((total, item) => total + (Number(item.amount) || 0), 0))
}

/** Parses a "DD/MM" style date tag into a sortable number; undated sorts last. */
function dateSortKey(date) {
  const m = /^(\d{1,2})\/(\d{1,2})/.exec((date || '').trim())
  if (!m) return Infinity
  return Number(m[2]) * 100 + Number(m[1])
}

/**
 * Groups expense items by their match-day date tag (items sharing the same
 * date are "that weekend's" expenses), in chronological order, with
 * undated one-off items collected into a trailing "Other" group.
 */
export function groupExpensesByDate(expenses) {
  const groups = new Map()
  expenses.forEach((item) => {
    const key = item.date?.trim() || ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return [...groups.entries()]
    .sort((a, b) => dateSortKey(a[0]) - dateSortKey(b[0]))
    .map(([date, items]) => ({ date, items, subtotal: sum(items) }))
}

export function totals(period) {
  const incomeSum = roundMoney(sum(period.income) + (Number(period.collectionAmount) || 0))
  const expenseSum = sum(period.expenses)
  const totalCollection = roundMoney(period.openingBalance + incomeSum)
  const inHand = roundMoney(totalCollection - expenseSum)
  return { incomeSum, expenseSum, totalCollection, inHand }
}

/** Watercan and Banana are bought at every match, so a new match day starts with them pre-filled. */
export function defaultMatchDayItems() {
  return [
    { label: 'Watercan', amount: '' },
    { label: 'Banana', amount: '' },
  ]
}

/** Builds the next month's period, carrying the previous month's in-hand balance forward. */
export function nextPeriod(previousPeriod, label) {
  const { inHand } = totals(previousPeriod)
  return createPeriod({
    label,
    openingBalanceLabel: `${previousPeriod.label} balance`,
    openingBalance: inHand,
    editableOpening: false,
  })
}

export function formatSummaryText(period) {
  const { totalCollection, expenseSum, inHand } = totals(period)
  const lines = []
  lines.push('FYI:-')
  lines.push(`${period.openingBalanceLabel} - ${period.openingBalance}`)
  period.income.forEach((item) => {
    if (item.label) lines.push(`${item.label} - ${item.amount || 0}`)
  })
  if (period.collectionLabel) {
    lines.push(`${period.collectionLabel} - ${period.collectionAmount || 0}`)
  }
  lines.push(`Total collection - ${totalCollection}`)
  lines.push('')
  lines.push(`${period.label} expenses:`)
  groupExpensesByDate(period.expenses).forEach(({ date, items }) => {
    const labeled = items.filter((item) => item.label)
    if (!labeled.length) return
    // The date tag gets its own line above its day's items, once per day.
    if (date) lines.push(date)
    labeled.forEach((item) => {
      lines.push(`${item.label} - ${item.amount || 0}`)
    })
  })
  lines.push(`Total expense - ${expenseSum}`)
  lines.push('')
  lines.push(`= ${totalCollection} - ${expenseSum} = ${inHand}`)
  lines.push('')
  lines.push(`₹${inHand} in-hand till now.`)
  return lines.join('\n')
}
