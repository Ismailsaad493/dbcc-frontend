const TABS = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'manager', label: 'Points Manager' },
  { id: 'collections', label: 'Collections' },
  { id: 'expenses', label: 'Expenses' },
]

export default function Tabs({ active, onChange }) {
  return (
    <div className="mx-auto flex w-full max-w-md gap-1 rounded-xl border border-purple-500/20 bg-[#150f22] p-1 sm:max-w-lg">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
              isActive
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
