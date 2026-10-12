import { useState } from 'react'
import { ACTION_GROUPS } from '../data/actions'

const ACCENTS = {
  gold: {
    header: 'text-amber-300',
    btnPositive:
      'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/70',
  },
  purple: {
    header: 'text-purple-300',
    btnPositive:
      'border-purple-400/40 bg-purple-400/10 text-purple-200 hover:bg-purple-400/20 hover:border-purple-400/70',
  },
  pink: {
    header: 'text-pink-300',
    btnPositive:
      'border-pink-400/40 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20 hover:border-pink-400/70',
  },
  blue: {
    header: 'text-sky-300',
    btnPositive:
      'border-sky-400/40 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20 hover:border-sky-400/70',
  },
}

const btnNegative =
  'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/70'

export default function PointsManager({ players, selectedId, onSelect, onAddPoints }) {
  const [lastAction, setLastAction] = useState(null)
  const [runsInput, setRunsInput] = useState('')
  const [bowlingMinusInput, setBowlingMinusInput] = useState('')
  const selectedPlayer = players.find((p) => p.id === selectedId)

  function handleClick(category, action) {
    onAddPoints(selectedId, category, action.points)
    setLastAction(`${selectedPlayer.name}: ${action.label} (${action.points > 0 ? '+' : ''}${action.points} pts)`)
  }

  function handleAddRuns() {
    const runs = parseInt(runsInput, 10)
    if (!selectedPlayer || !Number.isFinite(runs) || runs === 0) return
    onAddPoints(selectedId, 'batting', runs)
    setLastAction(`${selectedPlayer.name}: ${runs} Run${Math.abs(runs) === 1 ? '' : 's'} (${runs > 0 ? '+' : ''}${runs} pts)`)
    setRunsInput('')
  }

  function handleSubtractBowling() {
    const amount = parseInt(bowlingMinusInput, 10)
    if (!selectedPlayer || !Number.isFinite(amount) || amount <= 0) return
    onAddPoints(selectedId, 'bowling', -amount)
    setLastAction(`${selectedPlayer.name}: Manual Minus (-${amount} pts)`)
    setBowlingMinusInput('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-purple-300">
          Select Player
        </label>
        <select
          value={selectedId}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-4 py-3 text-base font-semibold text-white outline-none focus:border-amber-400/60"
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {selectedPlayer && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-[#1a0f2e] py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Batting</div>
              <div className="font-bold text-amber-300">{selectedPlayer.batting}</div>
            </div>
            <div className="rounded-lg bg-[#1a0f2e] py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Bowling</div>
              <div className="font-bold text-purple-300">{selectedPlayer.bowling}</div>
            </div>
            <div className="rounded-lg bg-[#1a0f2e] py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Fielding</div>
              <div className="font-bold text-pink-300">{selectedPlayer.fielding}</div>
            </div>
            <div className="rounded-lg bg-gradient-to-b from-amber-400/20 to-transparent py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">Total</div>
              <div className="font-black text-white">
                {selectedPlayer.batting + selectedPlayer.bowling + selectedPlayer.fielding}
              </div>
            </div>
          </div>
        )}
      </div>

      {lastAction && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-300">
          ✓ {lastAction}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ACTION_GROUPS.map((group, idx) => {
          const accent = ACCENTS[group.accent]
          return (
            <div
              key={group.title}
              className="rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <h3 className={`mb-3 text-sm font-bold uppercase tracking-wider ${accent.header}`}>
                {group.title}
              </h3>
              {group.title === 'Batting Actions' && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter runs scored"
                    value={runsInput}
                    disabled={!selectedPlayer}
                    onChange={(e) => setRunsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRuns()}
                    className="min-w-0 flex-1 rounded-lg border border-amber-400/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-400/70 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <button
                    type="button"
                    disabled={!selectedPlayer || runsInput === ''}
                    onClick={handleAddRuns}
                    className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 transition-all hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add Runs
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {group.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={!selectedPlayer}
                    onClick={() => handleClick(group.key, action)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      action.points < 0 ? btnNegative : accent.btnPositive
                    }`}
                  >
                    <span>{action.label}</span>
                    <span className="font-black">
                      {action.points > 0 ? '+' : ''}
                      {action.points}
                    </span>
                  </button>
                ))}
              </div>
              {group.title === 'Bowling Actions' && (
                <div className="mt-3 flex gap-2 border-t border-purple-500/10 pt-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="Manual minus (e.g. extra wides)"
                    value={bowlingMinusInput}
                    disabled={!selectedPlayer}
                    onChange={(e) => setBowlingMinusInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubtractBowling()}
                    className="min-w-0 flex-1 rounded-lg border border-red-500/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-red-500/70 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <button
                    type="button"
                    disabled={!selectedPlayer || bowlingMinusInput === ''}
                    onClick={handleSubtractBowling}
                    className="shrink-0 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-300 transition-all hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Subtract
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
