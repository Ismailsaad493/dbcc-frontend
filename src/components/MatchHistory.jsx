import { useState } from 'react'

export default function MatchHistory({ matches }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!matches.length) return null

  const sorted = [...matches].reverse()

  return (
    <div className="rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
        Match History
      </h2>
      <div className="flex flex-col gap-2">
        {sorted.map((m) => {
          const expenseTotal = m.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
          const expanded = expandedId === m.id
          return (
            <div key={m.id} className="rounded-lg border border-purple-500/10 bg-black/20">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : m.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold text-white"
              >
                <span>
                  {m.date} · Match #{m.matchNumber}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {m.points.length} player{m.points.length === 1 ? '' : 's'} scored · ₹{expenseTotal} spent
                </span>
              </button>
              {expanded && (
                <div className="border-t border-purple-500/10 p-4 text-xs text-gray-300">
                  {m.points.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase text-gray-500">
                          <th className="pb-1">Player</th>
                          <th className="pb-1">Batting</th>
                          <th className="pb-1">Bowling</th>
                          <th className="pb-1">Fielding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.points.map((p) => (
                          <tr key={p.playerId}>
                            <td className="py-0.5 font-semibold uppercase text-white">{p.playerName}</td>
                            <td className="py-0.5">{p.batting || 0}</td>
                            <td className="py-0.5">{p.bowling || 0}</td>
                            <td className="py-0.5">{p.fielding || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500">No points recorded for this match.</p>
                  )}

                  {m.expenses.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Expenses
                      </div>
                      {m.expenses.map((e, i) => (
                        <div key={i} className="flex justify-between py-0.5">
                          <span>{e.label}</span>
                          <span className="font-semibold text-red-300">₹{e.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
