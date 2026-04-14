import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../services/supabase';
import {
  getLevel, getLevelTitle, levelProgress, xpToNextLevel,
} from '../../utils/drillHelpers';
import { usePullToRefresh, PullIndicator } from '../../hooks/usePullToRefresh.jsx';

export default function DrillHub() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState([]); // per-program stats
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState('all');
  const [tab, setTab] = useState('decks'); // decks | endless | leaderboard
  const [endlessLength, setEndlessLength] = useState(10);
  const [endlessRule, setEndlessRule] = useState('');
  const [endlessRules, setEndlessRules] = useState([]); // loaded lazily
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

  // Lazy-load tajweed drill data for the Endless tab (just for the rule list)
  useEffect(() => {
    if (tab !== 'endless' || endlessRules.length > 0) return;
    fetch('/content/tajweed_drills.json')
      .then(r => r.json())
      .then(data => {
        const list = Object.values(data.rules)
          .filter(r => r.examples?.length >= 4)
          .map(r => ({ id: r.id, name_en: r.name_en, name_ar: r.name_ar, category: r.category, count: r.examples.length }))
          .sort((a, b) => a.category.localeCompare(b.category) || a.name_en.localeCompare(b.name_en));
        setEndlessRules(list);
      })
      .catch(() => {});
  }, [tab, endlessRules.length]);

  const startEndless = () => {
    const id = `endless-tajweed-${Date.now()}`;
    const params = new URLSearchParams({ n: String(endlessLength) });
    if (endlessRule) params.set('rule', endlessRule);
    navigate(`/drills/play/${id}?${params.toString()}`);
  };

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
            {['decks', 'endless', 'leaderboard'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === t ? 'text-gray-900 border-b-2 border-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {t === 'decks' ? 'Decks' : t === 'endless' ? 'Endless' : 'Leaderboard'}
                {t === 'endless' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">Beta</span>
                )}
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

          {/* ── ENDLESS TAB ────────────────────────────── */}
          {tab === 'endless' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">♾️</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">Endless Tajweed</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">Beta</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Unlimited mixed questions drawn from the Qur'an, powered by scholar-annotated data.</p>
                    <p className="text-[11px] text-amber-700 mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Experimental — some questions may have imperfect rule-to-word matching. Please report issues.
                    </p>
                  </div>
                </div>

                {/* Length picker */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Session length</label>
                  <div className="flex gap-2">
                    {[10, 20, 50].map(n => (
                      <button key={n} onClick={() => setEndlessLength(n)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          endlessLength === n ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {n} questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rule filter */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Focus on a rule (optional)</label>
                  <select value={endlessRule} onChange={(e) => setEndlessRule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All rules (mixed)</option>
                    {endlessRules.map(r => (
                      <option key={r.id} value={r.id}>{r.category} — {r.name_en}</option>
                    ))}
                  </select>
                </div>

                <button onClick={startEndless}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors">
                  Start Endless Session
                </button>
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  Source: Ahkam at-Tajweed fi Kalimat al-Aziz al-Hameed — Ahmad At-Taweel
                </p>
              </div>
            </div>
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
