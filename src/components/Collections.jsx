import { useEffect, useMemo, useRef, useState } from 'react'
import { apiGet, apiPut } from '../utils/api'
import {
  createInitialCollections,
  FULL_AMOUNT,
  paymentStatus,
  formatPendingText,
} from '../data/collections'
import { sortAlphabetical } from '../data/playerOrder'

const STATUS_STYLES = {
  Paid: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  'Partially Paid': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  'Not Paid': 'border-red-400/40 bg-red-400/10 text-red-300',
}

function mergeWithInitial(data) {
  const initial = createInitialCollections()
  if (!Array.isArray(data) || data.length !== initial.length) return initial
  return initial.map((c, i) => ({ ...c, ...data[i], name: c.name }))
}

export default function Collections({ onSendToPeriod, periodLabel, hasPeriod = true }) {
  const [collections, setCollections] = useState(createInitialCollections)
  const [selected, setSelected] = useState(() => new Set())
  const [copyState, setCopyState] = useState('idle')
  const [addedState, setAddedState] = useState('idle')
  const [pendingExpanded, setPendingExpanded] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/collections')
      .then((data) => {
        if (cancelled) return
        setCollections(mergeWithInitial(data))
      })
      .catch((err) => console.error('Failed to load collections from the API:', err))
      .finally(() => {
        if (!cancelled) loadedRef.current = true
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    apiPut('/api/collections', collections).catch((err) =>
      console.error('Failed to save collections to the API:', err),
    )
  }, [collections])

  const orderedCollections = useMemo(() => sortAlphabetical(collections), [collections])

  function setAmount(id, amount) {
    const clamped = Number.isFinite(amount) ? Math.max(0, amount) : 0
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, amountPaid: clamped } : c)))
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === collections.length ? new Set() : new Set(collections.map((c) => c.id)),
    )
  }

  function applyBulkAmount(amount) {
    if (!selected.size || !Number.isFinite(amount)) return
    const clamped = Math.max(0, amount)
    setCollections((prev) =>
      prev.map((c) => {
        if (!selected.has(c.id)) return c
        // Marking everyone "Full" in bulk shouldn't overwrite an amount
        // someone already partially paid — only fill in players still at ₹0.
        if (clamped === FULL_AMOUNT && c.amountPaid > 0 && c.amountPaid < FULL_AMOUNT) return c
        return { ...c, amountPaid: clamped }
      }),
    )
  }

  async function handleCopyPending() {
    try {
      await navigator.clipboard.writeText(formatPendingText(orderedCollections))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('idle')
    }
  }

  const totalCollected = collections.reduce((sum, c) => sum + (c.amountPaid || 0), 0)
  const totalExpected = collections.length * FULL_AMOUNT
  const pending = orderedCollections.filter((c) => c.amountPaid < FULL_AMOUNT)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
        Monthly Contributions
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-purple-500/10 bg-[#1a0f2e] px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Collected</div>
          <div className="text-xl font-black text-white">₹{totalCollected}</div>
        </div>
        <div className="rounded-lg border border-purple-500/10 bg-[#1a0f2e] px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Expected</div>
          <div className="text-xl font-black text-white">₹{totalExpected}</div>
        </div>
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Pending</div>
          <div className="text-xl font-black text-amber-300">₹{totalExpected - totalCollected}</div>
        </div>
      </div>

      <div className="rounded-lg border border-purple-500/10 bg-black/20">
        <button
          type="button"
          onClick={() => setPendingExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-3 text-left"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            {pendingExpanded ? '▾' : '▸'} Pending Contributions ({pending.length})
          </span>
          <span className="text-[10px] font-semibold normal-case tracking-normal text-gray-600">
            {pendingExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </button>
        {pendingExpanded && (
          <div className="border-t border-purple-500/10 p-3 pt-2">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopyPending}
                className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-400/25"
              >
                {copyState === 'copied' ? '✓ Copied!' : '📋 Copy List'}
              </button>
            </div>
            {pending.length ? (
              <ol className="list-decimal space-y-0.5 pl-5 text-sm font-semibold text-gray-300">
                {pending.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    {paymentStatus(c.amountPaid) === 'Partially Paid'
                      ? `(₹${FULL_AMOUNT - c.amountPaid})`
                      : ''}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm font-semibold text-emerald-300">Everyone has paid in full. 🎉</p>
            )}
          </div>
        )}
      </div>

      {onSendToPeriod && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!hasPeriod}
            title={!hasPeriod ? 'Start tracking a month in Team Expense Tracker first' : undefined}
            onClick={() => {
              onSendToPeriod(totalCollected)
              setAddedState('added')
              setTimeout(() => setAddedState('idle'), 1800)
            }}
            className={`self-start rounded-lg border px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              addedState === 'added'
                ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                : 'border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
            }`}
          >
            {addedState === 'added' ? '✓ Added to Collection' : `+ Add to Collection (₹${totalCollected})`}
          </button>
          {!hasPeriod && (
            <span className="text-[10px] font-semibold text-gray-500">
              Start tracking a month in Team Expense Tracker first
            </span>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-400/10 p-3">
          <span className="text-xs font-bold text-purple-200">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => applyBulkAmount(FULL_AMOUNT)}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/25"
          >
            Mark Full (₹{FULL_AMOUNT})
          </button>
          <button
            type="button"
            onClick={() => applyBulkAmount(0)}
            className="rounded-lg border border-red-400/40 bg-red-400/15 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-400/25"
          >
            Mark Not Paid (₹0)
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-gray-500 hover:text-gray-300"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={selected.size === collections.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 accent-purple-500"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Select All</span>
        </div>

        {orderedCollections.map((c) => {
          const status = paymentStatus(c.amountPaid)
          const remaining = Math.max(0, FULL_AMOUNT - c.amountPaid)
          return (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-purple-500/10 bg-black/20 p-3"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleSelected(c.id)}
                className="h-4 w-4 accent-purple-500"
              />
              <span className="min-w-[90px] flex-1 font-bold uppercase text-white">{c.name}</span>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">₹</span>
                <input
                  type="number"
                  value={c.amountPaid}
                  onChange={(e) => setAmount(c.id, Number(e.target.value))}
                  className="w-20 rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-amber-400/60"
                />
                <span className="text-xs text-gray-500">/ ₹{FULL_AMOUNT}</span>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAmount(c.id, 0)}
                  className="rounded border border-red-400/30 bg-red-400/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-400/20"
                >
                  ₹0
                </button>
              </div>

              <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[status]}`}>
                {status}
              </span>

              <span className="text-xs font-semibold text-gray-500">
                {remaining > 0 ? `₹${remaining} remaining` : 'Settled'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
