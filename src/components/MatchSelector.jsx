import { useState } from 'react'
import { formatDateInput, isValidDate } from '../utils/dateFormat'

export default function MatchSelector({ matchDate, matchNumber, onSetMatch }) {
  const [date, setDate] = useState('')
  const [number, setNumber] = useState('')
  const hasMatch = Boolean(matchDate && matchNumber)
  const dateValid = isValidDate(date)

  function handleStart() {
    if (!dateValid || !number.trim()) return
    onSetMatch(date, number.trim())
  }

  if (hasMatch) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-200">
        <span>📅 Match: {matchDate} · #{matchNumber}</span>
        <button
          type="button"
          onClick={() => onSetMatch(null, null)}
          className="text-[10px] font-semibold text-gray-400 underline decoration-dotted underline-offset-4 hover:text-gray-200"
        >
          Change Match
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-400/40 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Select Match</h2>
      <p className="text-xs text-gray-500">
        Pick the match date and number before entering points or match day expenses — both are
        required.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Match Date</span>
          <input
            type="text"
            inputMode="numeric"
            value={date}
            onChange={(e) => setDate(formatDateInput(e.target.value))}
            placeholder="Enter date"
            maxLength={8}
            className="rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-400/60"
          />
          {date && !dateValid && (
            <span className="text-[10px] font-semibold text-red-300">Enter a valid date as dd/mm/yy</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Match Number</span>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter match number"
            className="rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-400/60"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={!dateValid || !number.trim()}
        onClick={handleStart}
        className="self-start rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 transition-all hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start Entering Data
      </button>
    </div>
  )
}
