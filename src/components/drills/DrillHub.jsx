import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Flame, Zap, Trophy, BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
  getLevel, getLevelTitle, levelProgress, xpToNextLevel,
  LEVEL_TITLES, DECK_EMOJIS,
} from '../../utils/drillHelpers';

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
        supabase.from('student_drill_stats').select('student_id, program, total_xp, current_streak, best_streak')
          .order('total_xp', { ascending: false }).limit(50),
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
            <button onClick={() => navigate('/student')} className="flex items-center gap-1 text-emerald-200 hover:text-white text-sm mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Portal
            </button>
            <h1 className="text-2xl font-bold mb-4">Practice Drills</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Zap className="h-5 w-5 text-amber-300 mx-auto mb-1" />
                <p className="text-xl font-bold">{totalXP}</p>
                <p className="text-[10px] text-emerald-200">Total XP</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{bestStreak}</p>
                <p className="text-[10px] text-emerald-200">Day Streak</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <BookOpen className="h-5 w-5 text-cyan-300 mx-auto mb-1" />
                <p className="text-xl font-bold">{totalDrills}</p>
                <p className="text-[10px] text-emerald-200">Completed</p>
              </div>
            </div>

            {/* Level Bar */}
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold">{getLevelTitle(level)}</span>
                <span className="text-emerald-200">Level {level} · {remaining} XP to next</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 -mt-4">
          <div className="flex gap-2 mb-4">
            {['decks', 'leaderboard'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${
                  tab === t ? 'bg-white text-gray-900' : 'bg-white/60 text-gray-500 hover:bg-white/80'
                }`}>
                {t === 'decks' ? '📝 Decks' : '🏆 Leaderboard'}
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
                      className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center gap-4 group">
                      <span className="text-3xl flex-shrink-0">{d.cover_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{d.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{d.topic} · {PROGRAM_LABELS[d.program] || d.program}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
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
                        <div key={row.student_id} className={`flex items-center px-4 py-3 text-sm ${isMe ? 'bg-emerald-50' : ''}`}>
                          <span className={`w-7 text-center font-bold ${i < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </span>
                          <span className="flex-1 font-medium text-gray-700">{isMe ? 'You' : `Student`}</span>
                          <span className="text-amber-600 font-bold">⚡ {row.total_xp}</span>
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
