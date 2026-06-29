import { LeaderboardEntry } from '../types';
import { Trophy, Star, Shield, ArrowUpRight } from 'lucide-react';

interface LeaderboardTabProps {
  leaderboard: LeaderboardEntry[];
  currentUserEmail: string;
}

export default function LeaderboardTab({ leaderboard, currentUserEmail }: LeaderboardTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-3xl mx-auto">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="text-amber-500" size={18} /> Community Honor Roster
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Top performing citizens protecting the grid in Metro City</p>
        </div>
        <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-amber-500">
          Updated live • Seattle Basin
        </div>
      </div>

      <div className="space-y-4">
        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 font-mono text-[10px] uppercase">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Citizen Name</th>
                <th className="pb-3">Performance Tier</th>
                <th className="pb-3 text-center">Reports</th>
                <th className="pb-3 text-right pr-2">Reward Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const isTop3 = entry.rank <= 3;
                
                return (
                  <tr
                    key={index}
                    className={`border-b border-slate-800/40 transition-colors hover:bg-slate-950/40 ${
                      entry.name === 'Nav' ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-1">
                        {entry.rank === 1 && <span className="text-lg">🥇</span>}
                        {entry.rank === 2 && <span className="text-lg">🥈</span>}
                        {entry.rank === 3 && <span className="text-lg">🥉</span>}
                        {entry.rank > 3 && <span className="font-mono text-slate-400 font-bold ml-1">{entry.rank}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{entry.name}</span>
                        {entry.name === 'Nav' && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded font-mono uppercase font-bold">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800 w-fit">
                        🛡️ {entry.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-center text-slate-300 font-mono">
                      {entry.reportsCount}
                    </td>
                    <td className="py-3.5 text-right pr-2 text-amber-400 font-mono font-bold">
                      {entry.points} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tip banner */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3 mt-6">
          <Star size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-300">How to raise your rank:</p>
            <p className="mt-0.5">
              Submit active issues with high AI classification scores (+30 pts), complete academy lessons (+50 pts), or review reported incidents inside the community verification feed (+10 pts per vote). Let’s make Metro City safer, together!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
