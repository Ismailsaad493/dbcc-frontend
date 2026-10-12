const ICONS = {
  batting: '🏏',
  bowling: '🔴',
  fielding: '🧤',
  overall: '🏆',
}

export default function LeaderCard({ title, player, value, type }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-purple-500/20 bg-gradient-to-b from-[#1a0f2e] to-[#150f22] px-4 py-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <span className="text-2xl">{ICONS[type]}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
        {title}
      </span>
      <span className="text-lg font-black text-white">
        {player ? player.name : '—'}
      </span>
      <span className="text-sm font-bold text-amber-200">
        {player ? `${value} pts` : ''}
      </span>
    </div>
  )
}
