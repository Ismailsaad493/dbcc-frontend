import { useMemo, useState } from 'react'
import { ACTION_GROUPS } from '../data/actions'
import { BATTING_ORDER, BOWLING_ORDER, sortByNameOrder, sortAlphabetical } from '../data/playerOrder'

const CATEGORIES = [
  { key: 'batting', label: 'Batting', accent: 'gold' },
  { key: 'bowling', label: 'Bowling', accent: 'purple' },
  { key: 'fielding', label: 'Fielding & Discipline', accent: 'pink' },
]

const ACCENTS = {
  gold: {
    tab: 'data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-500 data-[active=true]:to-amber-400 data-[active=true]:text-[#1a0f2e]',
    header: 'text-amber-300',
    ring: 'border-amber-400/30',
    btnPositive:
      'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/70',
  },
  purple: {
    tab: 'data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-600 data-[active=true]:to-purple-500 data-[active=true]:text-white',
    header: 'text-purple-300',
    ring: 'border-purple-400/30',
    btnPositive:
      'border-purple-400/40 bg-purple-400/10 text-purple-200 hover:bg-purple-400/20 hover:border-purple-400/70',
  },
  pink: {
    tab: 'data-[active=true]:bg-gradient-to-r data-[active=true]:from-pink-600 data-[active=true]:to-pink-500 data-[active=true]:text-white',
    header: 'text-pink-300',
    ring: 'border-pink-400/30',
    btnPositive:
      'border-pink-400/40 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20 hover:border-pink-400/70',
  },
}

const btnNegative =
  'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/70'

function ActionButton({ action, accent, onFire }) {
  const [justSaved, setJustSaved] = useState(false)

  function handleClick() {
    onFire(action)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
        justSaved
          ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
          : action.points < 0
            ? btnNegative
            : ACCENTS[accent].btnPositive
      }`}
    >
      <span className="truncate">{justSaved ? '✓ Saved' : action.label}</span>
      {!justSaved && (
        <span className="shrink-0 font-black">
          {action.points > 0 ? '+' : ''}
          {action.points}
        </span>
      )}
    </button>
  )
}

function RunsEntry({ player, onAddPoints }) {
  const [value, setValue] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  function handleAdd() {
    const runs = parseInt(value, 10)
    if (!Number.isFinite(runs) || runs === 0) return
    onAddPoints(player.id, 'batting', runs, `${player.name}: ${runs} Run${Math.abs(runs) === 1 ? '' : 's'}`)
    setValue('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1200)
  }

  return (
    <div className="flex gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        placeholder="Runs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="min-w-0 flex-1 rounded-lg border border-amber-400/30 bg-[#1a0f2e] px-2.5 py-2 text-xs font-semibold text-white outline-none focus:border-amber-400/70"
      />
      <button
        type="button"
        disabled={value === ''}
        onClick={handleAdd}
        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          justSaved
            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
            : 'border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
        }`}
      >
        {justSaved ? '✓ Saved' : 'Add Runs'}
      </button>
    </div>
  )
}

function BowlingManualEntry({ player, onAddPoints }) {
  const [value, setValue] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  function apply(sign) {
    const amount = parseInt(value, 10)
    if (!Number.isFinite(amount) || amount <= 0) return
    const label = sign > 0 ? `${player.name}: Manual +${amount}` : `${player.name}: Manual Minus`
    onAddPoints(player.id, 'bowling', sign * amount, label)
    setValue('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1200)
  }

  return (
    <div className="flex gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        min="1"
        placeholder="Manual points"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply(1)}
        className="min-w-0 flex-1 rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-2.5 py-2 text-xs font-semibold text-white outline-none focus:border-purple-400/70"
      />
      <button
        type="button"
        disabled={value === ''}
        onClick={() => apply(1)}
        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          justSaved
            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
            : 'border-purple-400/40 bg-purple-400/15 text-purple-200 hover:bg-purple-400/25'
        }`}
      >
        {justSaved ? '✓ Saved' : '+ Add'}
      </button>
      <button
        type="button"
        disabled={value === ''}
        onClick={() => apply(-1)}
        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          justSaved
            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
            : 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25'
        }`}
      >
        {justSaved ? '✓ Saved' : '− Subtract'}
      </button>
    </div>
  )
}

function PointsDisplay({ player, category, accent }) {
  return (
    <span className={`shrink-0 text-sm font-black ${ACCENTS[accent].header}`}>
      {player[category]} PTS
    </span>
  )
}

const ATTENDANCE_ACTION = (() => {
  for (const g of ACTION_GROUPS) {
    const found = g.actions.find((a) => a.id === 'attendance')
    if (found) return { action: found, category: g.key }
  }
  return null
})()

function BulkActionsPanel({ players, onAddPoints, onMarkAttendance }) {
  // Everyone starts checked — the normal case is "the whole squad showed
  // up," so the admin's job is to uncheck the few who didn't, not to
  // individually check off everyone who did.
  const [checkedIds, setCheckedIds] = useState(() => new Set(players.map((p) => p.id)))
  const [justApplied, setJustApplied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const absentCount = players.length - checkedIds.size

  function toggle(id) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleApply() {
    if (!ATTENDANCE_ACTION) return
    checkedIds.forEach((id) => {
      const player = players.find((p) => p.id === id)
      if (!player) return
      onAddPoints(
        id,
        ATTENDANCE_ACTION.category,
        ATTENDANCE_ACTION.action.points,
        `${player.name}: ${ATTENDANCE_ACTION.action.label}`,
      )
    })
    onMarkAttendance(checkedIds)
    setJustApplied(true)
    setTimeout(() => setJustApplied(false), 1500)
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center justify-between gap-2 self-start rounded-xl border border-amber-400/30 bg-[#150f22] px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:bg-amber-400/10"
      >
        <span>
          ☰ Attendance — {checkedIds.size} present
          {absentCount > 0 ? `, ${absentCount} absent` : ''}
        </span>
        <span className="font-semibold normal-case tracking-normal text-gray-500">tap to view</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
          Attendance {ATTENDANCE_ACTION ? `(+${ATTENDANCE_ACTION.action.points})` : ''}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-500">
            {checkedIds.size} of {players.length} present — uncheck the absentees
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            title="Collapse"
            className="text-gray-500 hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {players.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all ${
              checkedIds.has(p.id)
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            <input
              type="checkbox"
              checked={checkedIds.has(p.id)}
              onChange={() => toggle(p.id)}
              className="accent-amber-400"
            />
            <span className="truncate uppercase">{p.name}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={checkedIds.size === 0}
        onClick={handleApply}
        className={`self-start rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          justApplied
            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
            : 'border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
        }`}
      >
        {justApplied
          ? '✓ Applied'
          : `Apply Attendance to ${checkedIds.size || ''} Player${checkedIds.size === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}

function PlayerCard({
  player,
  category,
  accent,
  groups,
  touched,
  canUndo,
  onAddPoints,
  onClearCategory,
  onUndo,
}) {
  const [locked, setLocked] = useState(false)

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border bg-[#150f22] p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
        touched ? ACCENTS[accent].ring : 'border-purple-500/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-black uppercase text-white">{player.name}</span>
        <div className="flex shrink-0 items-center gap-2">
          <PointsDisplay player={player} category={category} accent={accent} />
          {touched && (
            <span className="rounded-full border border-emerald-400/50 bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
              ✓ Updated
            </span>
          )}
        </div>
      </div>

      <div className={locked ? 'pointer-events-none flex flex-col gap-2.5 opacity-40' : 'flex flex-col gap-2.5'}>
        {category === 'batting' && <RunsEntry player={player} onAddPoints={onAddPoints} />}

        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5">
            {groups.length > 1 && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {group.title}
              </span>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {group.actions.map((action) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  accent={accent}
                  onFire={(a) => onAddPoints(player.id, category, a.points, `${player.name}: ${a.label}`)}
                />
              ))}
            </div>
          </div>
        ))}

        {category === 'bowling' && <BowlingManualEntry player={player} onAddPoints={onAddPoints} />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!locked && (
            <button
              type="button"
              onClick={() => onClearCategory(player.id, category)}
              className="text-[10px] font-semibold text-gray-600 underline decoration-dotted underline-offset-4 hover:text-red-400"
            >
              Clear {CATEGORIES.find((c) => c.key === category).label} Points
            </button>
          )}
          {!locked && canUndo && (
            <button
              type="button"
              onClick={() => onUndo(player.id, category)}
              className="text-[10px] font-bold text-purple-300 underline decoration-dotted underline-offset-4 hover:text-purple-200"
            >
              ↩ Undo
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setLocked((l) => !l)}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all ${
            locked
              ? 'border-amber-400/50 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
              : 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
          }`}
        >
          {locked ? '✎ Edit' : '✓ Save'}
        </button>
      </div>
    </div>
  )
}

export default function PointsManager({ players, onAddPoints, onClearCategory, onUndo, lastActions, touchedKeys }) {
  const [category, setCategory] = useState('batting')
  const [search, setSearch] = useState('')
  // null = attendance hasn't been marked yet this session, so nobody is
  // filtered out. Once the bulk panel is used, this becomes the set of
  // player ids who were checked — everyone else drops to the Absent section.
  const [attendedIds, setAttendedIds] = useState(null)
  const [absentExpanded, setAbsentExpanded] = useState(false)

  const groups = useMemo(
    () => ACTION_GROUPS.filter((g) => g.key === category),
    [category],
  )

  // Batting and Bowling use a fixed custom order; Fielding & Discipline (and
  // the Attendance checklist, separately) use alphabetical order.
  const orderedPlayers = useMemo(() => {
    if (category === 'batting') return sortByNameOrder(players, BATTING_ORDER)
    if (category === 'bowling') return sortByNameOrder(players, BOWLING_ORDER)
    return sortAlphabetical(players)
  }, [players, category])

  const alphabeticalPlayers = useMemo(() => sortAlphabetical(players), [players])

  const activePlayers = useMemo(() => {
    if (!attendedIds) return orderedPlayers
    return orderedPlayers.filter((p) => attendedIds.has(p.id))
  }, [orderedPlayers, attendedIds])

  const absentPlayers = useMemo(() => {
    if (!attendedIds) return []
    return orderedPlayers.filter((p) => !attendedIds.has(p.id))
  }, [orderedPlayers, attendedIds])

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activePlayers
    return activePlayers.filter((p) => p.name.toLowerCase().includes(q))
  }, [activePlayers, search])

  const accent = CATEGORIES.find((c) => c.key === category).accent

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-purple-500/20 bg-[#150f22] p-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            data-active={c.key === category}
            onClick={() => setCategory(c.key)}
            className={`rounded-lg px-2 py-2.5 text-xs font-black uppercase tracking-wide text-gray-400 transition-all hover:text-gray-200 ${ACCENTS[c.accent].tab}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <BulkActionsPanel
        players={alphabeticalPlayers}
        onAddPoints={onAddPoints}
        onMarkAttendance={setAttendedIds}
      />

      {attendedIds && (
        <div className="flex items-center justify-between rounded-lg border border-purple-500/10 bg-black/20 px-4 py-2 text-xs text-gray-400">
          <span>
            Showing <span className="font-bold text-emerald-300">{activePlayers.length}</span> active
            player{activePlayers.length === 1 ? '' : 's'}.
          </span>
          <button
            type="button"
            onClick={() => setAttendedIds(null)}
            className="font-semibold text-gray-500 underline decoration-dotted underline-offset-4 hover:text-gray-300"
          >
            Show everyone
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search player…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-amber-400/60"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visiblePlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            category={category}
            accent={accent}
            groups={groups}
            touched={touchedKeys.has(`${player.id}:${category}`)}
            canUndo={lastActions.has(`${player.id}:${category}`)}
            onAddPoints={onAddPoints}
            onClearCategory={onClearCategory}
            onUndo={onUndo}
          />
        ))}
        {visiblePlayers.length === 0 && (
          <div className="col-span-full rounded-lg border border-purple-500/10 bg-black/20 py-8 text-center text-sm text-gray-500">
            No players match “{search}”.
          </div>
        )}
      </div>

      {attendedIds && absentPlayers.length > 0 && (
        <div className="rounded-xl border border-dashed border-gray-600/50 bg-black/20">
          <button
            type="button"
            onClick={() => setAbsentExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-200"
          >
            <span>
              {absentExpanded ? '▾' : '▸'} Absent / Did Not Play ({absentPlayers.length})
            </span>
            <span className="text-[10px] font-semibold normal-case tracking-normal text-gray-600">
              {absentExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </button>
          {absentExpanded && (
            <div className="grid grid-cols-1 gap-3 border-t border-dashed border-gray-600/50 p-3 opacity-80 sm:grid-cols-2">
              {absentPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  category={category}
                  accent={accent}
                  groups={groups}
                  touched={touchedKeys.has(`${player.id}:${category}`)}
                  canUndo={lastActions.has(`${player.id}:${category}`)}
                  onAddPoints={onAddPoints}
                  onClearCategory={onClearCategory}
                  onUndo={onUndo}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
