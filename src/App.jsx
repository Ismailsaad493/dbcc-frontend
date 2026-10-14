import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Tabs from './components/Tabs'
import Leaderboard from './components/Leaderboard'
import PointsManager from './components/PointsManager'
import ExpenseTracker from './components/ExpenseTracker'
import MatchSelector from './components/MatchSelector'
import MatchHistory from './components/MatchHistory'
import { createInitialPlayers } from './data/players'
import { apiGet, apiPut } from './utils/api'
import {
  addMatchPoints,
  addMatchExpenses,
  clearMatchPlayerCategory,
  normalizeMatches,
} from './utils/matches'

function readStoredMatchField(key) {
  try {
    return localStorage.getItem(key) || null
  } catch {
    return null
  }
}

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
  const [matchDate, setMatchDateState] = useState(() => readStoredMatchField('dbcc_matchDate'))
  const [matchNumber, setMatchNumberState] = useState(() => readStoredMatchField('dbcc_matchNumber'))
  const [matches, setMatches] = useState([])
  const loadedRef = useRef(false)
  const matchesLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/players')
      .then((data) => {
        if (cancelled) return
        setPlayers(mergeWithInitial(data))
        // Saving is only enabled after a successful load, so a failed load can never overwrite server data with defaults.
        loadedRef.current = true
      })
      .catch((err) => console.error('Failed to load players from the API:', err))
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

  useEffect(() => {
    let cancelled = false
    apiGet('/api/matches')
      .then((data) => {
        if (cancelled) return
        setMatches(normalizeMatches(data))
        matchesLoadedRef.current = true
      })
      .catch((err) => console.error('Failed to load matches from the API:', err))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!matchesLoadedRef.current) return
    apiPut('/api/matches', matches).catch((err) =>
      console.error('Failed to save matches to the API:', err),
    )
  }, [matches])

  function setMatch(date, number) {
    setMatchDateState(date)
    setMatchNumberState(number)
    try {
      if (date && number) {
        localStorage.setItem('dbcc_matchDate', date)
        localStorage.setItem('dbcc_matchNumber', number)
      } else {
        localStorage.removeItem('dbcc_matchDate')
        localStorage.removeItem('dbcc_matchNumber')
      }
    } catch {
      // ignore — localStorage is a convenience, not a requirement
    }
  }

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
    if (matchDate && matchNumber) {
      const player = players.find((p) => p.id === playerId)
      setMatches((prev) =>
        addMatchPoints(prev, matchDate, matchNumber, playerId, player?.name || '', category, points),
      )
    }
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
    if (matchDate && matchNumber) {
      const player = players.find((p) => p.id === playerId)
      setMatches((prev) =>
        addMatchPoints(prev, matchDate, matchNumber, playerId, player?.name || '', category, -action.points),
      )
    }
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
    if (matchDate && matchNumber) {
      setMatches((prev) => clearMatchPlayerCategory(prev, matchDate, matchNumber, playerId, category))
    }
  }

  function recordMatchExpenses(items) {
    if (!matchDate || !matchNumber || !items.length) return
    setMatches((prev) => addMatchExpenses(prev, matchDate, matchNumber, items))
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

        <MatchSelector matchDate={matchDate} matchNumber={matchNumber} onSetMatch={setMatch} />

        {activeTab === 'leaderboard' && (
          <>
            <Leaderboard players={players} />
            <MatchHistory matches={matches} />
          </>
        )}
        {activeTab === 'manager' && (
          matchDate && matchNumber ? (
            <PointsManager
              players={players}
              onAddPoints={addPoints}
              onClearCategory={clearPlayerCategory}
              onUndo={undoLastAction}
              lastActions={lastActions}
              touchedKeys={touchedKeys}
            />
          ) : (
            <div className="rounded-lg border border-purple-500/10 bg-black/20 py-8 text-center text-sm text-gray-500">
              Select a match date and number above before entering points.
            </div>
          )
        )}
        {activeTab === 'expenses' && (
          <ExpenseTracker
            matchDate={matchDate}
            matchNumber={matchNumber}
            onRecordMatchExpenses={recordMatchExpenses}
          />
        )}

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
