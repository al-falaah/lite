import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../services/supabase';
import {
  getLevel, getLevelTitle, levelProgress, xpToNextLevel,
} from '../../utils/drillHelpers';
import { usePullToRefresh, PullIndicator } from '../../hooks/usePullToRefresh';

export default function DrillHub() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState([]); // per-program stats
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState('all');
  const [tab, setTab] = useState('decks'); // decks | leaderboard
  const { pullDistance, isPulling } = usePullToRefresh();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Get student + enrollments
      const { data: stu } = await supabase
        .from('students')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!stu) { setLoading(false); return; }
      setStudentId(stu.id);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('program')
        .eq('student_id', stu.id)
        .eq('status', 'active');

      const programs = (enrollments || []).map(e => e.program);
      setEnrolledPrograms(programs);

      // Fetch published decks, stats, leaderboard in parallel
      const [{ data: dks }, { data: st }, { data: lb }] = await Promise.all([
        supabase.from('drill_decks').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('student_drill_stats').select('*').eq('student_id', stu.id),
        supabase.rpc('get_drill_leaderboard', { p_limit: 50 }),
      ]);

      setDecks(dks || []);
      setStats(st || []);
      setLeaderboard(lb || []);
      setLoading(false);
    };
    load();
  }, []);

  // Aggregate stats
  const totalXP = stats.reduce((s, r) => s + r.total_xp, 0);
  const totalDrills = stats.reduce((s, r) => s + r.drills_completed, 0);
  const bestStreak = Math.max(0, ...stats.map(r => r.current_streak));
  const level = getLevel(totalXP);
  const progress = levelProgress(totalXP);
  const remaining = xpToNextLevel(totalXP);

  // Filter decks
  const filteredDecks = activeProgram === 'all' ? decks : decks.filter(d => d.program === activeProgram);

  // Program labels
  const PROGRAM_LABELS = { qari: 'QARI', tajweed: 'Tajweed (TMP)', essentials: 'Essentials (EASI)' };

  // Group leaderboard by program
  const leaderboardByProgram = {};
  leaderboard.forEach(row => {
    if (!leaderboardByProgram[row.program]) leaderboardByProgram[row.program] = [];
    leaderboardByProgram[row.program].push(row);
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <>
      <Helmet><title>Practice Drills | Al-Falaah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 pt-5 pb-5">
            <button onClick={() => navigate('/student')} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-3 block">
              ← Back to Portal
            </button>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Practice Drills</h1>

            {/* Stats row */}
            <div className="flex items-center gap-6 text-sm mb-4">
              <div>
                <span className="font-bold text-gray-900">{totalXP}</span>
                <span className="text-gray-500 ml-1">XP</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">{bestStreak}</span>
                <span className="text-gray-500 ml-1">day streak</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">{totalDrills}</span>
                <span className="text-gray-500 ml-1">completed</span>
              </div>
            </div>

            {/* Level Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium">{getLevelTitle(level).en} · Level {level}</span>
                <span className="text-gray-400">{remaining} XP to next</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="flex gap-4 mb-4 border-b border-gray-200">
            {['decks', 'leaderboard'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  tab === t ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {t === 'decks' ? 'Decks' : 'Leaderboard'}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-12">
          {/* ── DECKS TAB ──────────────────────────────── */}
          {tab === 'decks' && (
            <>
              {/* Program filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
                <FilterPill active={activeProgram === 'all'} onClick={() => setActiveProgram('all')} label="All" />
                {Object.entries(PROGRAM_LABELS).map(([key, label]) => (
                  <FilterPill key={key} active={activeProgram === key} onClick={() => setActiveProgram(key)} label={label} />
                ))}
              </div>

              {filteredDecks.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-sm">No drills available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDecks.map(d => (
                    <button key={d.id} onClick={() => navigate(`/drills/play/${d.id}`)}
                      className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center gap-4">
                      <span className="text-2xl flex-shrink-0">{d.cover_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{d.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{d.topic} · {PROGRAM_LABELS[d.program] || d.program}</p>
                      </div>
                      <span className="text-gray-300 text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── LEADERBOARD TAB ────────────────────────── */}
          {tab === 'leaderboard' && (
            <div className="space-y-6">
              {Object.entries(leaderboardByProgram).map(([program, rows]) => (
                <div key={program}>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{PROGRAM_LABELS[program] || program}</h3>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {rows.slice(0, 10).map((row, i) => {
                      const isMe = row.student_id === studentId;
                      return (
                        <div key={row.student_id} className={`flex items-center px-4 py-3 text-sm ${isMe ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}>
                          <span className={`w-7 text-center font-bold ${i < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </span>
                          <span className={`flex-1 font-medium ${isMe ? 'text-emerald-700' : 'text-gray-700'}`}>{isMe ? 'You' : (row.display_name || 'Student')}</span>
                          <span className="text-amber-600 font-bold">{row.total_xp} XP</span>
                          {row.current_streak >= 3 && (
                            <span className="ml-2 text-orange-500 text-xs">🔥{row.current_streak}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(leaderboardByProgram).length === 0 && (
                <div className="text-center text-gray-400 py-16">
                  <p className="text-4xl mb-2">🏆</p>
                  <p className="text-sm">No scores yet — be the first!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterPill({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
      }`}>
      {label}
    </button>
  );
}
