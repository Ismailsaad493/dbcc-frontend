import { useEffect, useRef, useState } from 'react'
import {
  createPeriod,
  newLineItem,
  newExpenseItem,
  totals,
  nextPeriod,
  formatSummaryText,
  groupExpensesByDate,
  defaultMatchDayItems,
  defaultCollectionLabel,
} from '../utils/expenses'
import { apiGet, apiPut } from '../utils/api'
import { formatDateInput } from '../utils/dateFormat'
import Collections from './Collections'

const MONTHS = [
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

function migrateState(data) {
  if (!data || !Array.isArray(data.periods)) return { periods: [], activeId: null }
  // Migrate periods saved before the dedicated monthly-collection field existed.
  return {
    ...data,
    periods: data.periods.map((p) => ({
      collectionLabel: defaultCollectionLabel(p.label || ''),
      collectionAmount: '',
      ...p,
    })),
  }
}

/** Derives this month's label, last month's balance label, and this month's collection label from a {monthIndex, year} pick. */
function describeFirstMonth({ monthIndex, year }) {
  const yearNum = Number(year)
  const monthLabel = `${MONTHS[monthIndex]} '${year}`
  const lastMonthIndex = (monthIndex - 1 + 12) % 12
  const lastMonthYear =
    monthIndex === 0 && !Number.isNaN(yearNum)
      ? String(yearNum - 1).padStart(2, '0').slice(-2)
      : year
  const lastMonthLabel = `${MONTHS[lastMonthIndex]}'${lastMonthYear} balance`
  const collectionLabel = `${MONTHS[monthIndex]} collection`
  return { monthLabel, lastMonthLabel, collectionLabel }
}

const inputClass =
  'rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-400/60'
const labelClass = 'text-xs font-bold uppercase tracking-wider text-purple-300'

export default function ExpenseTracker({ matchDate, matchNumber, onRecordMatchExpenses }) {
  const [view, setView] = useState('tracker') // 'tracker' | 'contributions'
  const [state, setState] = useState({ periods: [], activeId: null })
  const [copyState, setCopyState] = useState('idle') // idle | copied
  const [newMonthLabel, setNewMonthLabel] = useState('')
  const [showNewMonth, setShowNewMonth] = useState(false)
  const now = new Date()
  const [firstMonthForm, setFirstMonthForm] = useState({
    monthIndex: now.getMonth(),
    year: String(now.getFullYear()).slice(-2),
    openingAmount: '',
    collectionAmount: '',
  })
  const [matchDayForm, setMatchDayForm] = useState(null) // { date, items: [{label, amount}] }
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/expenses')
      .then((data) => {
        if (cancelled) return
        setState(migrateState(data))
      })
      .catch((err) => console.error('Failed to load expenses from the API:', err))
      .finally(() => {
        if (!cancelled) loadedRef.current = true
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    apiPut('/api/expenses', state).catch((err) =>
      console.error('Failed to save expenses to the API:', err),
    )
  }, [state])

  const periods = state.periods
  const activePeriod = periods.find((p) => p.id === state.activeId) || periods[periods.length - 1]

  function updatePeriod(id, updater) {
    setState((prev) => ({
      ...prev,
      periods: prev.periods.map((p) => (p.id === id ? updater(p) : p)),
    }))
  }

  function sendToPeriodCollection(amount) {
    if (activePeriod) {
      updatePeriod(activePeriod.id, (p) => ({ ...p, collectionAmount: amount }))
      return
    }
    // No month being tracked yet — start one automatically (same as Start
    // Tracking would, using today's month/year) so this works standalone.
    const { monthLabel, lastMonthLabel, collectionLabel } = describeFirstMonth(firstMonthForm)
    const period = createPeriod({
      label: monthLabel,
      openingBalanceLabel: lastMonthLabel,
      openingBalance: firstMonthForm.openingAmount,
      editableOpening: true,
    })
    period.collectionLabel = collectionLabel
    period.collectionAmount = amount
    setState({ periods: [period], activeId: period.id })
  }

  function createFirstPeriod() {
    const { monthLabel, lastMonthLabel, collectionLabel } = describeFirstMonth(firstMonthForm)
    const period = createPeriod({
      label: monthLabel,
      openingBalanceLabel: lastMonthLabel,
      openingBalance: firstMonthForm.openingAmount,
      editableOpening: true,
    })
    period.collectionLabel = collectionLabel
    period.collectionAmount = firstMonthForm.collectionAmount
    setState({ periods: [period], activeId: period.id })
  }

  function createNewMonth() {
    if (!newMonthLabel.trim() || !activePeriod) return
    const period = nextPeriod(activePeriod, newMonthLabel.trim())
    setState((prev) => ({
      periods: [...prev.periods, period],
      activeId: period.id,
    }))
    setNewMonthLabel('')
    setShowNewMonth(false)
  }

  function deletePeriod(id) {
    if (!window.confirm('Delete this month’s records? This cannot be undone.')) return
    setState((prev) => {
      const remaining = prev.periods.filter((p) => p.id !== id)
      const activeId = prev.activeId === id ? remaining[remaining.length - 1]?.id ?? null : prev.activeId
      return { periods: remaining, activeId }
    })
  }

  function startMatchDayForm() {
    if (!matchDate || !matchNumber) return
    setMatchDayForm({ date: matchDate, items: defaultMatchDayItems() })
  }

  function saveMatchDayForm() {
    if (!matchDayForm || !activePeriod) return
    const items = matchDayForm.items.filter((it) => it.label.trim())
    if (!items.length) {
      setMatchDayForm(null)
      return
    }
    updatePeriod(activePeriod.id, (p) => ({
      ...p,
      expenses: [
        ...p.expenses,
        ...items.map((it) => newExpenseItem(it.label.trim(), it.amount, matchDayForm.date.trim())),
      ],
    }))
    onRecordMatchExpenses?.(
      items.map((it) => ({ label: it.label.trim(), amount: Number(it.amount) || 0 })),
    )
    setMatchDayForm(null)
  }

  function removeMatchDay(date) {
    if (!window.confirm(`Remove all expenses logged for ${date || 'Other Expenses'}?`)) return
    updatePeriod(activePeriod.id, (p) => ({
      ...p,
      expenses: p.expenses.filter((it) => (it.date?.trim() || '') !== date),
    }))
  }

  async function handleCopy() {
    if (!activePeriod) return
    try {
      await navigator.clipboard.writeText(formatSummaryText(activePeriod))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('idle')
    }
  }

  let trackerSection
  if (!activePeriod) {
    const { monthLabel, lastMonthLabel, collectionLabel } = describeFirstMonth(firstMonthForm)
    trackerSection = (
      <div className="flex flex-col gap-4 rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
          Team Expense Tracker
        </h2>
        <p className="text-xs text-gray-500">
          Pick the current month below — last month's balance label and this month's collection
          label fill in automatically. Every month after this one will carry the in-hand balance
          forward on its own.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Current Month</span>
            <select
              value={firstMonthForm.monthIndex}
              onChange={(e) =>
                setFirstMonthForm((f) => ({ ...f, monthIndex: Number(e.target.value) }))
              }
              className={inputClass}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Year</span>
            <input
              type="text"
              value={firstMonthForm.year}
              onChange={(e) => setFirstMonthForm((f) => ({ ...f, year: e.target.value }))}
              placeholder="26"
              className={inputClass}
            />
          </label>
        </div>

        <div className="rounded-lg border border-purple-500/10 bg-black/20 p-3 text-xs text-gray-400">
          Tracking <span className="font-bold text-amber-300">{monthLabel}</span> — last month's
          balance will show as <span className="font-bold text-amber-300">{lastMonthLabel}</span>,
          this month's collection as{' '}
          <span className="font-bold text-amber-300">{collectionLabel}</span>.
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{lastMonthLabel}</span>
            <input
              type="number"
              value={firstMonthForm.openingAmount}
              onChange={(e) =>
                setFirstMonthForm((f) => ({ ...f, openingAmount: e.target.value }))
              }
              placeholder="Enter amount"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{collectionLabel}</span>
            <input
              type="number"
              value={firstMonthForm.collectionAmount}
              onChange={(e) =>
                setFirstMonthForm((f) => ({ ...f, collectionAmount: e.target.value }))
              }
              placeholder="Enter amount"
              className={inputClass}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={createFirstPeriod}
          className="self-start rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 transition-all hover:bg-amber-400/25"
        >
          Start Tracking
        </button>
      </div>
    )
  } else {
    const { incomeSum, expenseSum, totalCollection, inHand } = totals(activePeriod)
    trackerSection = (
    <div className="flex flex-col gap-4 rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
        Team Expense Tracker
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, activeId: p.id }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                p.id === activePeriod.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                  : 'bg-[#1a0f2e] text-gray-400 hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowNewMonth((s) => !s)}
          className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition-all hover:bg-amber-400/25"
        >
          + New Month
        </button>
      </div>

      {showNewMonth && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-purple-500/10 p-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>New Month Label</span>
            <input
              type="text"
              value={newMonthLabel}
              onChange={(e) => setNewMonthLabel(e.target.value)}
              placeholder="October '26"
              className={inputClass}
            />
          </label>
          <div className="text-xs text-gray-500">
            Opens with <span className="font-bold text-amber-300">₹{inHand}</span> carried
            forward as {activePeriod.label} balance.
          </div>
          <button
            type="button"
            onClick={createNewMonth}
            disabled={!newMonthLabel.trim()}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 transition-all hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Income */}
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/20 bg-black/10 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Collection / Income
            </h3>
            <span className="text-xs font-bold text-emerald-300">₹{totalCollection}</span>
          </div>

          {/* Opening balance — carried in as part of this month's collection */}
          <div className="flex items-center justify-between rounded-lg border border-purple-500/10 bg-black/20 p-2">
            {activePeriod.editableOpening ? (
              <>
                <input
                  type="text"
                  value={activePeriod.openingBalanceLabel}
                  onChange={(e) =>
                    updatePeriod(activePeriod.id, (p) => ({
                      ...p,
                      openingBalanceLabel: e.target.value,
                    }))
                  }
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  value={activePeriod.openingBalance}
                  onChange={(e) =>
                    updatePeriod(activePeriod.id, (p) => ({
                      ...p,
                      openingBalance: Number(e.target.value) || 0,
                    }))
                  }
                  className={`${inputClass} ml-2 w-24 text-right`}
                />
              </>
            ) : (
              <>
                <span className="px-1 text-sm font-semibold text-gray-300">
                  {activePeriod.openingBalanceLabel}
                </span>
                <span className="px-1 text-sm font-bold text-amber-300">
                  ₹{activePeriod.openingBalance}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-2">
            <input
              type="text"
              value={activePeriod.collectionLabel}
              placeholder="September collection"
              onChange={(e) =>
                updatePeriod(activePeriod.id, (p) => ({
                  ...p,
                  collectionLabel: e.target.value,
                }))
              }
              className={`${inputClass} flex-1`}
            />
            <input
              type="number"
              value={activePeriod.collectionAmount}
              placeholder="0"
              onChange={(e) =>
                updatePeriod(activePeriod.id, (p) => ({
                  ...p,
                  collectionAmount: e.target.value,
                }))
              }
              className={`${inputClass} w-24 text-right`}
            />
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Other Income
          </div>
          {activePeriod.income.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.label}
                placeholder="e.g. Sponsorship"
                onChange={(e) =>
                  updatePeriod(activePeriod.id, (p) => ({
                    ...p,
                    income: p.income.map((it) =>
                      it.id === item.id ? { ...it, label: e.target.value } : it,
                    ),
                  }))
                }
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                value={item.amount}
                placeholder="0"
                onChange={(e) =>
                  updatePeriod(activePeriod.id, (p) => ({
                    ...p,
                    income: p.income.map((it) =>
                      it.id === item.id ? { ...it, amount: e.target.value } : it,
                    ),
                  }))
                }
                className={`${inputClass} w-24 text-right`}
              />
              <button
                type="button"
                onClick={() =>
                  updatePeriod(activePeriod.id, (p) => ({
                    ...p,
                    income: p.income.filter((it) => it.id !== item.id),
                  }))
                }
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updatePeriod(activePeriod.id, (p) => ({
                ...p,
                // First item added suggests "Ball sold" (a common recurring
                // one-off); anything after that starts blank.
                income: [...p.income, p.income.length === 0 ? newLineItem('Ball sold') : newLineItem()],
              }))
            }
            className="self-start rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
          >
            + Add Anything
          </button>
        </div>

        {/* Expenses, grouped by match day */}
        <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-black/10 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
              Match Day Expenses
            </h3>
            <span className="text-xs font-bold text-red-300">₹{expenseSum}</span>
          </div>

          {groupExpensesByDate(activePeriod.expenses).map(({ date, items, subtotal }) => (
            <div key={date || 'other'} className="rounded-lg border border-red-400/10 bg-black/20 p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  {date ? `Match Day – ${date}` : 'Other Expenses'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">₹{subtotal}</span>
                  <button
                    type="button"
                    onClick={() => removeMatchDay(date)}
                    className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
                  >
                    Remove day
                  </button>
                </div>
              </div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Expenses
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      placeholder="e.g. Ice, Ground fee"
                      onChange={(e) =>
                        updatePeriod(activePeriod.id, (p) => ({
                          ...p,
                          expenses: p.expenses.map((it) =>
                            it.id === item.id ? { ...it, label: e.target.value } : it,
                          ),
                        }))
                      }
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="number"
                      value={item.amount}
                      placeholder="0"
                      onChange={(e) =>
                        updatePeriod(activePeriod.id, (p) => ({
                          ...p,
                          expenses: p.expenses.map((it) =>
                            it.id === item.id ? { ...it, amount: e.target.value } : it,
                          ),
                        }))
                      }
                      className={`${inputClass} w-24 text-right`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updatePeriod(activePeriod.id, (p) => ({
                          ...p,
                          expenses: p.expenses.filter((it) => it.id !== item.id),
                        }))
                      }
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updatePeriod(activePeriod.id, (p) => ({
                      ...p,
                      expenses: [...p.expenses, newExpenseItem('', '', date)],
                    }))
                  }
                  className="self-start text-[11px] font-bold text-red-300 hover:text-red-200"
                >
                  + item
                </button>
              </div>
            </div>
          ))}

          {matchDayForm ? (
            <div className="rounded-lg border border-amber-400/30 bg-black/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={labelClass}>Match Date</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={matchDayForm.date}
                  onChange={(e) =>
                    setMatchDayForm((f) => ({ ...f, date: formatDateInput(e.target.value) }))
                  }
                  placeholder="06/09"
                  maxLength={8}
                  className={`${inputClass} w-24`}
                />
              </div>
              <div className="flex flex-col gap-2">
                {matchDayForm.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      placeholder="e.g. Ice, Ground fee"
                      onChange={(e) =>
                        setMatchDayForm((f) => ({
                          ...f,
                          items: f.items.map((it, j) =>
                            j === i ? { ...it, label: e.target.value } : it,
                          ),
                        }))
                      }
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="number"
                      value={item.amount}
                      placeholder="0"
                      onChange={(e) =>
                        setMatchDayForm((f) => ({
                          ...f,
                          items: f.items.map((it, j) =>
                            j === i ? { ...it, amount: e.target.value } : it,
                          ),
                        }))
                      }
                      className={`${inputClass} w-24 text-right`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMatchDayForm((f) => ({
                          ...f,
                          items: f.items.filter((_, j) => j !== i),
                        }))
                      }
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMatchDayForm((f) => ({
                      ...f,
                      items: [...f.items, { label: '', amount: '' }],
                    }))
                  }
                  className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-500/20"
                >
                  + item
                </button>
                <button
                  type="button"
                  onClick={saveMatchDayForm}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/25"
                >
                  Save Match Day
                </button>
                <button
                  type="button"
                  onClick={() => setMatchDayForm(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startMatchDayForm}
                disabled={!matchDate || !matchNumber}
                title={!matchDate || !matchNumber ? 'Select a match (top of page) first' : undefined}
                className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition-all hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add Match Day
              </button>
              {(!matchDate || !matchNumber) && (
                <span className="text-[10px] font-semibold text-gray-500">
                  Select a match above first
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  updatePeriod(activePeriod.id, (p) => ({
                    ...p,
                    expenses: [...p.expenses, newExpenseItem()],
                  }))
                }
                className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-400/20"
              >
                + Add One-off Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-purple-500/10 bg-[#1a0f2e] px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Total Collection
          </div>
          <div className="text-xl font-black text-white">₹{totalCollection}</div>
        </div>
        <div className="rounded-lg border border-purple-500/10 bg-[#1a0f2e] px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Total Expense
          </div>
          <div className="text-xl font-black text-white">₹{expenseSum}</div>
        </div>
        <div
          className={`rounded-lg border px-4 py-3 text-center ${
            inHand >= 0
              ? 'border-emerald-400/40 bg-emerald-400/10'
              : 'border-red-400/40 bg-red-400/10'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            In-Hand
          </div>
          <div
            className={`text-xl font-black ${inHand >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
          >
            ₹{inHand}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 transition-all hover:bg-amber-400/25"
        >
          {copyState === 'copied' ? '✓ Copied!' : '📋 Copy Summary (WhatsApp format)'}
        </button>
        <button
          type="button"
          onClick={() => deletePeriod(activePeriod.id)}
          className="text-xs font-semibold text-gray-600 underline decoration-dotted underline-offset-4 hover:text-red-400"
        >
          Delete {activePeriod.label}
        </button>
      </div>

      {/* History */}
      {periods.length > 1 && (
        <div className="rounded-lg border border-purple-500/10 bg-black/20 p-3">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-300">
            History
          </h3>
          <div className="flex flex-col gap-1">
            {periods.map((p) => {
              const t = totals(p)
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span className="font-semibold text-gray-300">{p.label}</span>
                  <span
                    className={`font-bold ${t.inHand >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                  >
                    ₹{t.inHand} in-hand
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-purple-500/20 bg-[#150f22] p-1.5">
        <button
          type="button"
          onClick={() => setView('contributions')}
          className={`rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
            view === 'contributions'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Monthly Contribution
        </button>
        <button
          type="button"
          onClick={() => setView('tracker')}
          className={`rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
            view === 'tracker'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Team Expense Tracker
        </button>
      </div>

      {view === 'tracker' && trackerSection}
      {view === 'contributions' && (
        <Collections
          onSendToPeriod={sendToPeriodCollection}
          periodLabel={activePeriod?.collectionLabel}
        />
      )}
    </div>
  )
}
