import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Tabs from './components/Tabs'
import Leaderboard from './components/Leaderboard'
import PointsManager from './components/PointsManager'
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
  const [selectedId, setSelectedId] = useState(1)
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

  function addPoints(playerId, category, points) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [category]: p[category] + points } : p)),
    )
  }

  function resetMonth() {
    if (!window.confirm('Reset all players to zero points for a new month? This cannot be undone.')) {
      return
    }
    setPlayers(createInitialPlayers())
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
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddPoints={addPoints}
          />
        )}
        {activeTab === 'expenses' && <ExpenseTracker />}

        {activeTab !== 'expenses' && (
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
