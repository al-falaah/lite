import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trophy, Crown, Medal, Zap } from 'lucide-react';

/**
 * Per-quiz leaderboard. Reuses the get_quiz_leaderboard RPC.
 *
 * Pass darkMode for the dark themed (used inside DrillPlayer summary).
 * Default = light theme (used inside the Leaderboard tab).
 */
export default function QuizLeaderboard({ quizId, program, darkMode = false, limit = 50, autoRefreshMs = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quizId || !program) return;
    let cancelled = false;
    let interval = null;

    const load = async () => {
      const { data, error } = await supabase.rpc('get_quiz_leaderboard', {
        p_quiz_id: quizId,
        p_program: program,
        p_limit: limit,
      });
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setRows(data || []);
        setError(null);
      }
      setLoading(false);
    };

    load();
    if (autoRefreshMs) interval = setInterval(load, autoRefreshMs);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [quizId, program, limit, autoRefreshMs]);

  const t = darkMode
    ? {
        wrap: 'bg-gray-800/50 border border-gray-700/50',
        header: 'text-gray-300',
        emptyText: 'text-gray-500',
        rowHover: 'hover:bg-gray-700/40',
        selfRow: 'bg-amber-500/10',
        rank: 'text-gray-300',
        name: 'text-white',
        sub: 'text-gray-400',
        xp: 'text-amber-400',
      }
    : {
        wrap: 'bg-white border border-gray-200',
        header: 'text-gray-700',
        emptyText: 'text-gray-500',
        rowHover: 'hover:bg-gray-50',
        selfRow: 'bg-amber-50',
        rank: 'text-gray-600',
        name: 'text-gray-900',
        sub: 'text-gray-500',
        xp: 'text-amber-600',
      };

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-3.5 w-3.5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-3.5 w-3.5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-3.5 w-3.5 text-amber-700" />;
    return null;
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-5 text-center text-xs ${t.wrap} ${t.emptyText}`}>
        Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-5 text-center text-xs ${t.wrap} ${t.emptyText}`}>
        {error.includes('Access denied') ? 'You need to be enrolled in this program to view the leaderboard.' : `Couldn't load leaderboard: ${error}`}
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${t.wrap} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} flex items-center gap-2 ${t.header}`}>
        <Trophy className={`h-4 w-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
        <h3 className="text-sm font-semibold">Leaderboard</h3>
        <span className={`text-[10px] ${t.sub}`}>{rows.length} player{rows.length === 1 ? '' : 's'}</span>
      </div>

      {rows.length === 0 ? (
        <div className={`px-4 py-8 text-center text-xs ${t.emptyText}`}>
          No attempts yet. Be the first to play this drill!
        </div>
      ) : (
        <ul>
          {rows.map((r) => (
            <li
              key={r.student_id}
              className={`px-4 py-2.5 flex items-center gap-3 ${r.is_self ? t.selfRow : t.rowHover} ${darkMode ? 'border-b border-gray-700/30 last:border-b-0' : 'border-b border-gray-100 last:border-b-0'}`}
            >
              <div className={`w-6 text-center font-mono font-bold text-xs ${t.rank} flex items-center justify-center`}>
                {rankIcon(Number(r.rank)) || `#${r.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${t.name} flex items-center gap-1`}>
                  <span className="truncate">{r.is_self ? 'You' : r.full_name}</span>
                  {r.attempts_count === 1 && (
                    <Zap
                      className={`h-3 w-3 flex-shrink-0 ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`}
                      aria-label="First try"
                    />
                  )}
                </p>
                <p className={`text-[10px] ${t.sub}`}>
                  {r.score}/{r.total_questions} correct · {r.time_seconds}s · {r.attempts_count} attempt{r.attempts_count === 1 ? '' : 's'}
                </p>
              </div>
              <div className={`text-sm font-bold font-mono ${t.xp}`}>
                {r.xp} XP
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
