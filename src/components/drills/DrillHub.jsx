import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../services/supabase';
import {
  getLevel, getLevelTitle, levelProgress, xpToNextLevel,
} from '../../utils/drillHelpers';
import { usePullToRefresh, PullIndicator } from '../../hooks/usePullToRefresh.jsx';
import { Inbox, Infinity as InfinityIcon, Trophy, Flame } from 'lucide-react';

export default function DrillHub() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState([]); // per-program stats
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('decks'); // decks | endless | leaderboard
  const [endlessGame, setEndlessGame] = useState(null); // 'tajweed' | 'nahw' — set once enrollments load
  const [endlessLength, setEndlessLength] = useState(10);
  const [endlessRule, setEndlessRule] = useState('');
  const [endlessLevel, setEndlessLevel] = useState(''); // '' | '1' | '2' | '3' (nahw only)
  const [endlessRules, setEndlessRules] = useState([]); // loaded lazily
  // Leaderboard period filter
  const [lbPeriod, setLbPeriod] = useState('all_time'); // all_time | week | month
  const [lbLoading, setLbLoading] = useState(false);
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
      // Default endless game to whichever program the student has — prefer tajweed if both.
      setEndlessGame(programs.includes('tajweed') ? 'tajweed' : programs.includes('essentials') ? 'nahw' : null);

      // Fetch decks and personal stats in parallel.
      // RLS on drill_decks gates by enrollment — students only see their programs'.
      const [{ data: dks }, { data: st }] = await Promise.all([
        supabase.from('drill_decks').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('student_drill_stats').select('*').eq('student_id', stu.id),
      ]);

      setDecks(dks || []);
      setStats(st || []);
      setLoading(false);
    };
    load();
  }, []);

  // Load leaderboard — reactive to period selection.
  useEffect(() => {
    const now = new Date();
    const args = { p_period: lbPeriod, p_limit: 50 };
    if (lbPeriod === 'week') {
      // ISO week & year
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const isoYear = d.getUTCFullYear();
      const jan4 = new Date(Date.UTC(isoYear, 0, 4));
      const isoWeek = Math.ceil((((d - jan4) / 86400000) + jan4.getUTCDay() || 7) / 7);
      args.p_iso_year = isoYear;
      args.p_iso_week = isoWeek;
    } else if (lbPeriod === 'month') {
      args.p_iso_year = now.getFullYear();
      args.p_month = now.getMonth() + 1;
    }
    setLbLoading(true);
    supabase.rpc('get_drill_leaderboard_period', args).then(({ data }) => {
      setLeaderboard(data || []);
      setLbLoading(false);
    });
  }, [lbPeriod]);

  // Lazy-load tajweed rule list for the Endless tab (only when Tajweed game selected)
  useEffect(() => {
    if (tab !== 'endless' || endlessGame !== 'tajweed' || endlessRules.length > 0) return;
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
  }, [tab, endlessGame, endlessRules.length]);

  const startEndless = () => {
    const prefix = endlessGame === 'nahw' ? 'endless-nahw' : 'endless-tajweed';
    const id = `${prefix}-${Date.now()}`;
    const params = new URLSearchParams({ n: String(endlessLength) });
    if (endlessGame === 'tajweed' && endlessRule) params.set('rule', endlessRule);
    if (endlessGame === 'nahw' && endlessLevel) params.set('level', endlessLevel);
    navigate(`/drills/play/${id}?${params.toString()}`);
  };

  const canTajweedEndless = enrolledPrograms.includes('tajweed');
  const canArabiyyahEndless = enrolledPrograms.includes('essentials');

  // Aggregate stats
  const totalXP = stats.reduce((s, r) => s + r.total_xp, 0);
  const totalDrills = stats.reduce((s, r) => s + r.drills_completed, 0);
  const bestStreak = Math.max(0, ...stats.map(r => r.current_streak));
  const level = getLevel(totalXP);
  const progress = levelProgress(totalXP);
  const remaining = xpToNextLevel(totalXP);

  // Program labels (used only for deck subtitles)
  const PROGRAM_LABELS = { qari: 'QARI', tajweed: 'Tajweed (TMP)', essentials: 'Essentials (EASI)' };

  const leaderboardRows = leaderboard;

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
              {decks.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                  <p className="text-sm">No drills available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {decks.map(d => (
                    <button key={d.id} onClick={() => navigate(`/drills/play/${d.id}`)}
                      className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center gap-4">
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
              {/* Game picker — only show programs the student is enrolled in */}
              {(canTajweedEndless || canArabiyyahEndless) ? (
                <div className="flex gap-2">
                  {canTajweedEndless && (
                    <button onClick={() => setEndlessGame('tajweed')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                        endlessGame === 'tajweed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}>
                      Tajweed
                    </button>
                  )}
                  {canArabiyyahEndless && (
                    <button onClick={() => setEndlessGame('nahw')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                        endlessGame === 'nahw' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}>
                      Arabiyyah
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  Endless drills are available to enrolled students only.
                </div>
              )}

              {(canTajweedEndless || canArabiyyahEndless) && (
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <InfinityIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                  <h3 className="font-semibold text-gray-900 text-base">
                    {endlessGame === 'nahw' ? 'Endless Arabiyyah' : 'Endless Tajweed'}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                  {endlessGame === 'nahw'
                    ? "Unlimited mixed nahw & sarf questions from scholar-annotated Qur'an i'rab data."
                    : "Unlimited mixed tajweed questions drawn from the Qur'an."}
                </p>
                <p className="text-[11px] text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-snug">
                  Experimental — some questions may have imperfect matching.
                </p>

                {/* Length picker */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Session length</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50].map(n => (
                      <button key={n} onClick={() => setEndlessLength(n)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          endlessLength === n ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tajweed: rule filter */}
                {endlessGame === 'tajweed' && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Focus on a rule (optional)</label>
                    <select value={endlessRule} onChange={(e) => setEndlessRule(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">All rules (mixed)</option>
                      {endlessRules.map(r => (
                        <option key={r.id} value={r.id}>{r.category} — {r.name_en}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nahw: level filter — 2x2 grid on mobile so labels never wrap */}
                {endlessGame === 'nahw' && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Difficulty (optional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { v: '', label: 'All Levels' },
                        { v: '1', label: 'Foundations' },
                        { v: '2', label: 'Intermediate' },
                        { v: '3', label: 'Advanced' },
                      ].map(o => (
                        <button key={o.v} onClick={() => setEndlessLevel(o.v)}
                          className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                            endlessLevel === o.v ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={startEndless}
                  className="w-full py-3 bg-emerald-600 active:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                  Start Endless Session
                </button>
                <p className="text-[10px] text-gray-400 mt-3 text-center leading-relaxed">
                  {endlessGame === 'nahw'
                    ? "Source: Scholar-annotated Qur'an i'rab corpus"
                    : "Source: Ahmad At-Taweel — Ahkam at-Tajweed"}
                </p>
              </div>
              )}

            </div>
          )}

          {/* ── LEADERBOARD TAB ────────────────────────── */}
          {tab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Period selector */}
              <div className="flex gap-2">
                {[
                  { v: 'all_time', label: 'All Time' },
                  { v: 'week', label: 'This Week' },
                  { v: 'month', label: 'This Month' },
                ].map(o => (
                  <button key={o.v} onClick={() => setLbPeriod(o.v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                      lbPeriod === o.v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>

              {lbLoading && (
                <div className="text-center text-gray-400 py-4 text-sm">Loading…</div>
              )}

              {!lbLoading && leaderboardRows.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {leaderboardRows.slice(0, 20).map((row, i) => {
                    const isMe = row.student_id === studentId;
                    return (
                      <div key={row.student_id} className={`flex items-center px-4 py-3 text-sm ${isMe ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}>
                        <span className={`w-7 text-center font-bold tabular-nums ${
                          i === 0 ? 'text-amber-600' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-orange-700' : 'text-gray-400'
                        }`}>
                          {i + 1}
                        </span>
                        <span className={`flex-1 font-medium ${isMe ? 'text-emerald-700' : 'text-gray-700'}`}>{isMe ? 'You' : (row.display_name || 'Student')}</span>
                        <span className="text-amber-600 font-bold tabular-nums">{row.total_xp} XP</span>
                        {row.current_streak >= 3 && (
                          <span className="ml-2 text-orange-500 text-xs inline-flex items-center gap-0.5">
                            <Flame className="w-3 h-3" strokeWidth={2.5} />
                            {row.current_streak}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!lbLoading && leaderboardRows.length === 0 && (
                <div className="text-center text-gray-400 py-16">
                  <Trophy className="w-10 h-10 mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
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

