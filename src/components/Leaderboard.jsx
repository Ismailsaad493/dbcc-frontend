import { useMemo } from 'react'
import LeaderCard from './LeaderCard'
import ReportGenerator from './ReportGenerator'
import { getLeaders } from '../utils/stats'

const RANK_STYLES = [
  'bg-gradient-to-r from-amber-400/20 to-transparent border-l-4 border-amber-400',
  'bg-gradient-to-r from-gray-300/10 to-transparent border-l-4 border-gray-300',
  'bg-gradient-to-r from-amber-700/20 to-transparent border-l-4 border-amber-700',
]

export default function Leaderboard({ players }) {
  const { ranked, battingLeader, bowlingLeader, fieldingLeader, overallLeader } = useMemo(
    () => getLeaders(players),
    [players],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
          Current Leaders
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LeaderCard
            title="Batting Leader"
            player={battingLeader}
            value={battingLeader?.batting}
            type="batting"
          />
          <LeaderCard
            title="Bowling Leader"
            player={bowlingLeader}
            value={bowlingLeader?.bowling}
            type="bowling"
          />
          <LeaderCard
            title="Fielding & Discipline Leader"
            player={fieldingLeader}
            value={fieldingLeader?.fielding}
            type="fielding"
          />
          <LeaderCard
            title="Overall Leader"
            player={overallLeader}
            value={overallLeader?.total}
            type="overall"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-purple-500/20 bg-[#150f22] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-purple-500/20 bg-[#1a0f2e] text-left text-xs font-bold uppercase tracking-wider text-purple-300">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">Batting Pts</th>
                <th className="px-4 py-3 text-right">Bowling Pts</th>
                <th className="px-4 py-3 text-right">Fielding &amp; Disc. Pts</th>
                <th className="px-4 py-3 text-right">Total Pts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-purple-500/10 last:border-0 ${
                    RANK_STYLES[index] ?? 'hover:bg-purple-500/5'
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-gray-300">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{player.name}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{player.batting}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{player.bowling}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{player.fielding}</td>
                  <td className="px-4 py-3 text-right font-black text-amber-300">
                    {player.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReportGenerator
        ranked={ranked}
        battingLeader={battingLeader}
        bowlingLeader={bowlingLeader}
        fieldingLeader={fieldingLeader}
        overallLeader={overallLeader}
      />
    </div>
  )
}
