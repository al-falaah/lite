import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { students, classSchedules, teachers, teacherAssignments } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';
import OralTestGrading from '../components/admin/OralTestGrading';
import RecitationAssignments from '../components/admin/RecitationAssignments';

/**
 * Teacher's student-detail page.
 *
 * Replaces the heavy modal that lived inside TeacherPortal. Mounts the same
 * sub-components (oral grading, recitation assignments) but with a calmer,
 * page-level layout: name + program switch in a sticky header, this-week's
 * classes + contact details in a two-column row, then the existing oral
 * grading and recitation assignment blocks below.
 */

const formatTime = (t) => {
  if (!t) return null;
  return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatMeetingLink = (link) => {
  if (!link) return null;
  if (!link.startsWith('http://') && !link.startsWith('https://')) return `https://${link}`;
  return link;
};

function getCurrentMilestone(currentWeek, milestones) {
  const m = milestones.find(x => currentWeek >= x.weekStart && currentWeek <= x.weekEnd);
  if (!m) {
    const last = milestones[milestones.length - 1];
    return { ...last, weeksInMilestone: 0, weeksCompleted: 0, milestoneProgress: 100 };
  }
  const weeksInMilestone = m.weekEnd - m.weekStart + 1;
  const weeksCompleted = currentWeek - m.weekStart;
  return {
    ...m,
    weeksInMilestone,
    weeksCompleted,
    milestoneProgress: Math.round((weeksCompleted / weeksInMilestone) * 100),
  };
}

function getActiveWeek(schedules, programConfig) {
  if (!schedules.length || !programConfig) return { year: 1, week: 1 };
  const weekMap = {};
  schedules.forEach(s => {
    const key = `${s.academic_year}-${s.week_number}`;
    if (!weekMap[key]) weekMap[key] = [];
    weekMap[key].push(s);
  });
  const totalYears = programConfig.duration.years;
  const weeksPerYear = Math.ceil(programConfig.duration.weeks / totalYears);
  for (let year = 1; year <= totalYears; year++) {
    for (let week = 1; week <= weeksPerYear; week++) {
      const cls = weekMap[`${year}-${week}`];
      if (!cls || cls.length === 0) return { year, week };
      if (!cls.every(c => c.status === 'completed')) return { year, week };
    }
  }
  return { year: totalYears, week: weeksPerYear };
}

function CopyableText({ value, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-gray-400">—</span>;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };
  return (
    <button
      onClick={onCopy}
      className="group inline-flex items-center gap-1.5 text-left hover:text-gray-900 transition-colors"
      aria-label={`Copy ${label}`}
    >
      <span>{value}</span>
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
        : <Copy className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />}
    </button>
  );
}

export default function TeacherStudentDetail() {
  const { studentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [teacher, setTeacher] = useState(null);
  const [student, setStudent] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [assignedPrograms, setAssignedPrograms] = useState([]); // programs this teacher teaches THIS student
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const program = searchParams.get('program');
  const programConfig = program ? PROGRAMS[program] : null;
  const isActive = enrollment?.status === 'active';

  const goBackToStudents = () => {
    try { sessionStorage.setItem('teacherTab', 'students'); } catch { /* ignore */ }
    navigate('/teacher');
  };

  // Load teacher + student + assignments + schedules + enrollments
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (!user) return;
        // Resolve teacher row
        const { data: t } = await teachers.getByAuthUserId(user.id);
        if (cancelled || !t) return;
        setTeacher(t);

        // Confirm this teacher is assigned to this student (security gate)
        const { data: assignments } = await teacherAssignments.getByTeacher(t.id);
        if (cancelled) return;
        const hits = (assignments || []).filter(a => a.student_id === studentId && a.status === 'assigned');
        if (hits.length === 0) {
          toast.error('You are not assigned to this student.');
          navigate('/teacher');
          return;
        }
        const programs = hits.map(a => a.program);
        setAssignedPrograms(programs);

        // Default the program param if missing
        let activeProgram = program;
        if (!activeProgram || !programs.includes(activeProgram)) {
          activeProgram = programs[0];
          setSearchParams({ program: activeProgram }, { replace: true });
          return; // re-runs with the program now set
        }

        // Load student details
        const { data: s } = await students.getById(studentId);
        if (cancelled || !s) return;
        setStudent(s);

        // Find the enrollment for the active program
        const enr = (s.enrollments || []).find(e => e.program === activeProgram);
        setEnrollment(enr || null);

        // Schedules for this program
        const { data: sched } = await classSchedules.getByStudentId(studentId);
        if (cancelled) return;
        setSchedules((sched || []).filter(x => x.program === activeProgram));
      } catch (err) {
        console.error('Failed to load student detail:', err);
        toast.error('Failed to load student details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId, program, user, navigate, setSearchParams]);

  const active = useMemo(() => getActiveWeek(schedules, programConfig), [schedules, programConfig]);

  const milestones = programConfig?.milestones || [];
  const totalYears = programConfig?.duration?.years || 1;
  const totalWeeks = programConfig?.duration?.weeks || 24;
  const weeksPerYear = Math.ceil(totalWeeks / totalYears);
  const currentWeekNumber = (active.year - 1) * weeksPerYear + active.week;
  const currentMilestone = useMemo(
    () => milestones.length ? getCurrentMilestone(currentWeekNumber, milestones) : null,
    [currentWeekNumber, milestones]
  );

  const currentWeekClasses = schedules.filter(s => s.academic_year === active.year && s.week_number === active.week);
  const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
  const shortClass = currentWeekClasses.find(c => c.class_type === 'short');

  const completedClasses = schedules.filter(s => s.status === 'completed').length;
  const totalClassCount = totalWeeks * 2;
  const overallPct = totalClassCount > 0 ? Math.round((completedClasses / totalClassCount) * 100) : 0;

  const handleMarkComplete = async (scheduleId) => {
    if (!isActive) {
      toast.error('Cannot mark complete — student enrollment is not active');
      return;
    }
    setSaving(true);
    try {
      const { error } = await classSchedules.update(scheduleId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Class marked complete');
      const { data: sched } = await classSchedules.getByStudentId(studentId);
      setSchedules((sched || []).filter(x => x.program === program));
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark complete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-slate-700">Student not found.</p>
        <button onClick={goBackToStudents} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">← Back to my students</button>
      </div>
    );
  }

  const programLabel = programConfig?.shortName || program;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet><title>{`${student.full_name} | Teacher`}</title></Helmet>

      {/* Sticky page header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <button
            onClick={goBackToStudents}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            My students
          </button>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">{student.full_name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                ID {student.student_id}
                {enrollment && (
                  <>
                    {' · '}
                    <span className={isActive ? 'text-slate-700' : 'text-red-700 font-medium'}>
                      {enrollment.status === 'active' ? `Active · Week ${currentWeekNumber} of ${totalWeeks}` :
                       enrollment.status === 'withdrawn' ? 'Withdrawn' :
                       enrollment.status === 'completed' ? 'Graduated' : enrollment.status}
                    </span>
                  </>
                )}
              </p>
            </div>

            {assignedPrograms.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Program</span>
                <select
                  value={program || ''}
                  onChange={(e) => setSearchParams({ program: e.target.value })}
                  className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none"
                >
                  {assignedPrograms.map(p => (
                    <option key={p} value={p}>{PROGRAMS[p]?.shortName || p}</option>
                  ))}
                </select>
              </div>
            )}
            {assignedPrograms.length === 1 && (
              <span className="text-sm font-medium text-slate-700">{programLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Two-column row: this week's classes + contact info */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* THIS WEEK'S CLASSES */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">This week's classes</h2>
            </div>
            <div className="px-5 py-4">
              {!isActive ? (
                <div className="px-3 py-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    Enrollment is {enrollment?.status || 'inactive'}. Schedule management is not available.
                  </p>
                </div>
              ) : currentWeekClasses.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">No classes scheduled for this week.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[mainClass, shortClass].filter(Boolean).map((cls) => {
                    const isMain = cls.class_type === 'main';
                    const duration = isMain
                      ? programConfig?.schedule?.session1?.duration
                      : programConfig?.schedule?.session2?.duration;
                    const dayLabel = cls.day_of_week ?? '';
                    const timeLabel = formatTime(cls.class_time);
                    const completed = cls.status === 'completed';
                    return (
                      <div key={cls.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {isMain ? 'Main class' : 'Short class'}
                              <span className="text-slate-400 font-normal"> · {duration}</span>
                            </p>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {dayLabel}{timeLabel ? ` · ${timeLabel}` : ''}
                            </p>
                          </div>
                          <span className={`text-xs font-medium ${completed ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {completed ? 'Completed' : 'Scheduled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {cls.meeting_link && (
                            <a
                              href={formatMeetingLink(cls.meeting_link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                            >
                              Join class
                            </a>
                          )}
                          {!completed && (
                            <button
                              onClick={() => handleMarkComplete(cls.id)}
                              disabled={saving}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Mark complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Milestone + overall progress */}
            {isActive && currentMilestone && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-sm">
                  <span className="text-slate-500">Milestone {currentMilestone.id} of {milestones.length}:</span>
                  <span className="text-slate-900 ml-1.5 font-medium">{currentMilestone.name}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentMilestone.weeksCompleted} of {currentMilestone.weeksInMilestone} weeks ·{' '}
                  {currentMilestone.milestoneProgress}% through this milestone
                </p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Overall classes completed</span>
                    <span className="tabular-nums font-medium text-slate-700">{completedClasses} / {totalClassCount}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            </div>
            <dl className="px-5 py-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</dt>
                <dd className="text-slate-900 break-all"><CopyableText value={student.email} label="email" /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</dt>
                <dd className="text-slate-900"><CopyableText value={student.phone} label="phone" /></dd>
              </div>
              {student.gender && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Gender</dt>
                  <dd className="text-slate-900 capitalize">{student.gender}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Oral test grading */}
        {isActive && program && (
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold text-slate-900">Oral grading</h2>
            </div>
            <OralTestGrading
              student={student}
              program={program}
              currentWeek={currentWeekNumber}
            />
          </section>
        )}

        {/* Recitation assignments */}
        {isActive && program && teacher && (
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold text-slate-900">Recitation practice</h2>
            </div>
            <RecitationAssignments
              student={student}
              program={program}
              teacherId={teacher.id}
            />
          </section>
        )}
      </div>
    </div>
  );
}
