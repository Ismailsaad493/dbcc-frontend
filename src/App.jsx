import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Tabs from './components/Tabs'
import Leaderboard from './components/Leaderboard'
import PointsManager from './components/PointsManager'
import Collections from './components/Collections'
import ExpenseTracker from './components/ExpenseTracker'
import { createInitialPlayers } from './data/players'
import { apiGet, apiPut } from './utils/api'

function mergeWithInitial(data) {
  const initial = createInitialPlayers()
  if (!Array.isArray(data) || data.length !== initial.length) return initial
  return initial.map((p, i) => ({ ...p, ...data[i], name: p.name }))
}

export default function App() {
  const [players, setPlayers] = useState(createInitialPlayers)
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [lastActions, setLastActions] = useState(() => new Map()) // "playerId:category" -> { points, label }
  const [touchedKeys, setTouchedKeys] = useState(() => new Set()) // "playerId:category" already updated this session
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/players')
      .then((data) => {
        if (cancelled) return
        setPlayers(mergeWithInitial(data))
      })
      .catch((err) => console.error('Failed to load players from the API:', err))
      .finally(() => {
        if (!cancelled) loadedRef.current = true
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    apiPut('/api/players', players).catch((err) =>
      console.error('Failed to save players to the API:', err),
    )
  }, [players])

  function addPoints(playerId, category, points, label) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [category]: p[category] + points } : p)),
    )
    const key = `${playerId}:${category}`
    setTouchedKeys((prev) => new Set(prev).add(key))
    setLastActions((prev) => {
      const next = new Map(prev)
      const history = next.get(key) || []
      next.set(key, [...history, { points, label }])
      return next
    })
  }

  function undoLastAction(playerId, category) {
    const key = `${playerId}:${category}`
    const history = lastActions.get(key)
    if (!history || history.length === 0) return
    const action = history[history.length - 1]
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [category]: p[category] - action.points } : p)),
    )
    setLastActions((prev) => {
      const next = new Map(prev)
      const remaining = history.slice(0, -1)
      if (remaining.length) next.set(key, remaining)
      else next.delete(key)
      return next
    })
  }

  function clearPlayerCategory(playerId, category) {
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    if (
      !window.confirm(`Clear ${player.name}'s ${category} points back to 0?`)
    ) {
      return
    }
    const key = `${playerId}:${category}`
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [category]: 0 } : p)),
    )
    setTouchedKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setLastActions((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }

  function resetMonth() {
    if (!window.confirm('Reset all players to zero points for a new month? This cannot be undone.')) {
      return
    }
    setPlayers(createInitialPlayers())
    setTouchedKeys(new Set())
    setLastActions(new Map())
  }

  return (
    <div className="min-h-screen bg-[#0b0712] text-gray-100">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:py-8">
        <Tabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'leaderboard' && <Leaderboard players={players} />}
        {activeTab === 'manager' && (
          <PointsManager
            players={players}
            onAddPoints={addPoints}
            onClearCategory={clearPlayerCategory}
            onUndo={undoLastAction}
            lastActions={lastActions}
            touchedKeys={touchedKeys}
          />
        )}
        {activeTab === 'collections' && <Collections />}
        {activeTab === 'expenses' && <ExpenseTracker />}

        {(activeTab === 'leaderboard' || activeTab === 'manager') && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={resetMonth}
              className="text-xs font-semibold text-gray-600 underline decoration-dotted underline-offset-4 hover:text-red-400"
            >
              Reset Month (clear all points)
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-purple-500/10 px-4 py-6 text-center text-xs text-gray-600">
        Fair play, respect and team spirit are as important as performance. Committee's decision is final.
        <br />
        Play Hard. Play Fair. Play Together. — We are DBCC!
      </footer>
    </div>
  )
}
