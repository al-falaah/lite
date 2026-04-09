import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Book, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, Save, X, LogOut, HelpCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, ClipboardCheck, Settings, BarChart3, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';
import RichTextEditor from '../components/common/RichTextEditor';
import TestSettingsPanel from '../components/admin/TestSettingsPanel';
import TestQuestionManager from '../components/admin/TestQuestionManager';
import TestResultsDashboard from '../components/admin/TestResultsDashboard';

// Helper function to generate URL-friendly slugs
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
};

const ResearchAdmin = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [editingChapter, setEditingChapter] = useState(null);
  const [previewChapter, setPreviewChapter] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    program_id: 'qari',
    display_order: 0
  });

  // Quiz state
  const [quizChapter, setQuizChapter] = useState(null); // chapter whose quiz we're managing
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    subtitle: '',
    passing_score: 7,
    shuffle_questions: true,
    shuffle_options: true
  });

  // Tests & Exams state
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'tests'
  const [testSubTab, setTestSubTab] = useState('questions'); // 'settings' | 'questions' | 'results'
  const [testSettings, setTestSettings] = useState([]);
  const [selectedTestProgram, setSelectedTestProgram] = useState(Object.keys(PROGRAMS)[0] || 'qari');

  useEffect(() => {
    checkAccess();
    fetchCourses();
    fetchTestSettings();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse.id);
    }
  }, [selectedCourse]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const hasAccess = profile?.role && ['director', 'academic_dean'].includes(profile.role);
    if (!hasAccess) {
      toast.error('Access denied');
      navigate('/');
    }
  };

  const fetchCourses = async () => {
    let progressInterval;
    try {
      setLoadingProgress(0);
      
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          if (prev >= 90) return prev;
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 300);
      
      // Add timeout to prevent infinite loading
      const fetchWithTimeout = (promise, timeout = 20000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const { data, error } = await fetchWithTimeout(
        supabase
          .from('lesson_courses')
          .select('*')
          .order('program_id')
          .order('display_order')
      );

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      if (progressInterval) clearInterval(progressInterval);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    try {
      // Add timeout to prevent infinite loading
      const fetchWithTimeout = (promise, timeout = 20000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const { data, error } = await fetchWithTimeout(
        supabase
          .from('lesson_chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('chapter_number')
      );

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    }
  };

  const fetchTestSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('program_test_settings')
        .select('*')
        .order('program_id');
      if (error) throw error;
      setTestSettings(data || []);
    } catch (error) {
      console.error('Error fetching test settings:', error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('lesson_courses')
          .update({
            title: courseForm.title,
            slug: courseForm.slug,
            description: courseForm.description,
            program_id: courseForm.program_id,
            display_order: courseForm.display_order
          })
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success('Course updated successfully');
      } else {
        // Create new course
        const { error } = await supabase
          .from('lesson_courses')
          .insert({
            ...courseForm,
            created_by: user.id
          });

        if (error) throw error;
        toast.success('Course created successfully');
      }
      
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ title: '', slug: '', description: '', program_id: 'qari', display_order: 0 });
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course and all its chapters?')) return;

    try {
      const { error } = await supabase
        .from('lesson_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      toast.success('Course deleted');
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setChapters([]);
      }
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedCourse) return;

    const chapterNumber = chapters.length + 1;
    const chapterTitle = `Chapter ${chapterNumber}`;
    const newChapter = {
      course_id: selectedCourse.id,
      title: chapterTitle,
      slug: generateSlug(chapterTitle),
      chapter_number: chapterNumber,
      content: '',
      is_published: false
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lesson_chapters')
        .insert({ ...newChapter, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      toast.success('Chapter created');
      setChapters([...chapters, data]);
      setEditingChapter(data);
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error('Failed to create chapter');
    }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;

    try {
      const { error } = await supabase
        .from('lesson_chapters')
        .update({
          title: editingChapter.title,
          slug: generateSlug(editingChapter.title),
          content: editingChapter.content,
          content_type: editingChapter.content_type || 'rich_text',
          is_published: editingChapter.is_published
        })
        .eq('id', editingChapter.id);

      if (error) throw error;
      toast.success('Chapter saved');
      fetchChapters(selectedCourse.id);
      setEditingChapter(null);
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error('Failed to save chapter');
    }
  };

  const handleTogglePublish = async (chapter) => {
    try {
      const { error } = await supabase
        .from('lesson_chapters')
        .update({ is_published: !chapter.is_published })
        .eq('id', chapter.id);

      if (error) throw error;
      toast.success(chapter.is_published ? 'Chapter unpublished' : 'Chapter published');
      fetchChapters(selectedCourse.id);
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update chapter');
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('Delete this chapter?')) return;

    try {
      const { error } = await supabase
        .from('lesson_chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;
      toast.success('Chapter deleted');
      fetchChapters(selectedCourse.id);
      if (editingChapter?.id === chapterId) {
        setEditingChapter(null);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  // ── Quiz Functions ──
  const openQuizManager = async (chapter) => {
    setQuizChapter(chapter);
    setEditingChapter(null);
    try {
      const { data: quizData, error } = await supabase
        .from('lesson_quizzes')
        .select('*')
        .eq('chapter_id', chapter.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (quizData) {
        setQuiz(quizData);
        setQuizForm({
          title: quizData.title,
          subtitle: quizData.subtitle || '',
          passing_score: quizData.passing_score,
          shuffle_questions: quizData.shuffle_questions,
          shuffle_options: quizData.shuffle_options
        });
        // Fetch questions
        const { data: qData, error: qError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('question_number');
        if (qError) throw qError;
        setQuestions(qData || []);
      } else {
        setQuiz(null);
        setQuestions([]);
        setQuizForm({
          title: `Quiz: ${chapter.title}`,
          subtitle: '',
          passing_score: 7,
          shuffle_questions: true,
          shuffle_options: true
        });
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    }
  };

  const handleCreateQuiz = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lesson_quizzes')
        .insert({
          chapter_id: quizChapter.id,
          title: quizForm.title,
          subtitle: quizForm.subtitle,
          passing_score: quizForm.passing_score,
          shuffle_questions: quizForm.shuffle_questions,
          shuffle_options: quizForm.shuffle_options,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setQuiz(data);
      toast.success('Quiz created');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    }
  };

  const handleSaveQuizSettings = async () => {
    if (!quiz) return;
    try {
      const { error } = await supabase
        .from('lesson_quizzes')
        .update({
          title: quizForm.title,
          subtitle: quizForm.subtitle,
          passing_score: quizForm.passing_score,
          shuffle_questions: quizForm.shuffle_questions,
          shuffle_options: quizForm.shuffle_options
        })
        .eq('id', quiz.id);

      if (error) throw error;
      setQuiz({ ...quiz, ...quizForm });
      setShowQuizSettings(false);
      toast.success('Quiz settings saved');
    } catch (error) {
      console.error('Error saving quiz settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleToggleQuizPublish = async () => {
    if (!quiz) return;
    try {
      const { error } = await supabase
        .from('lesson_quizzes')
        .update({ is_published: !quiz.is_published })
        .eq('id', quiz.id);

      if (error) throw error;
      setQuiz({ ...quiz, is_published: !quiz.is_published });
      toast.success(quiz.is_published ? 'Quiz unpublished' : 'Quiz published');
    } catch (error) {
      console.error('Error toggling quiz publish:', error);
      toast.error('Failed to update quiz');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz || !confirm('Delete this quiz and all its questions?')) return;
    try {
      const { error } = await supabase
        .from('lesson_quizzes')
        .delete()
        .eq('id', quiz.id);

      if (error) throw error;
      setQuiz(null);
      setQuestions([]);
      setQuizChapter(null);
      toast.success('Quiz deleted');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleAddQuestion = () => {
    const newQ = {
      question_number: questions.length + 1,
      question: '',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      correct_answer: 'A',
      explanation: '',
      difficulty: 'medium',
      section_tag: ''
    };
    setEditingQuestion(newQ);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !quiz) return;
    try {
      if (editingQuestion.id) {
        // Update existing
        const { error } = await supabase
          .from('quiz_questions')
          .update({
            question: editingQuestion.question,
            options: editingQuestion.options,
            correct_answer: editingQuestion.correct_answer,
            explanation: editingQuestion.explanation,
            difficulty: editingQuestion.difficulty,
            section_tag: editingQuestion.section_tag
          })
          .eq('id', editingQuestion.id);
        if (error) throw error;
        toast.success('Question updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_number: editingQuestion.question_number,
            question: editingQuestion.question,
            options: editingQuestion.options,
            correct_answer: editingQuestion.correct_answer,
            explanation: editingQuestion.explanation,
            difficulty: editingQuestion.difficulty,
            section_tag: editingQuestion.section_tag
          });
        if (error) throw error;
        toast.success('Question added');
      }

      // Refresh questions
      const { data, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('question_number');
      if (fetchError) throw fetchError;
      setQuestions(data || []);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Delete this question?')) return;
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
      if (error) throw error;

      // Refresh and renumber
      const remaining = questions.filter(q => q.id !== questionId);
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].question_number !== i + 1) {
          await supabase
            .from('quiz_questions')
            .update({ question_number: i + 1 })
            .eq('id', remaining[i].id);
        }
      }

      const { data } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('question_number');
      setQuestions(data || []);
      toast.success('Question deleted');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const getProgramName = (programId) => {
    const program = Object.values(PROGRAMS).find(p => p.id === programId);
    return program ? program.shortName : programId.toUpperCase();
  };

  const sanitizeContent = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr', 'sup',
                     'style', 'section', 'header', 'footer', 'nav', 'article',
                     'svg', 'defs', 'linearGradient', 'stop', 'rect', 'circle', 'ellipse',
                     'line', 'polygon', 'text', 'tspan', 'path', 'g'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style', 'data-footnote',
                     'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                     'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
                     'width', 'height', 'opacity', 'transform', 'text-anchor', 'font-family',
                     'font-size', 'font-weight', 'font-style', 'letter-spacing', 'points',
                     'offset', 'stop-color', 'stop-opacity', 'd', 'direction', 'src', 'alt']
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-4">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle cx="48" cy="48" r="40" stroke="#059669" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - loadingProgress / 100)}
                className="transition-all duration-300 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-900">{Math.round(loadingProgress)}%</span>
            </div>
          </div>
          <p className="text-gray-600">Loading research admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Helmet><title>Research Admin | The FastTrack Madrasah</title></Helmet>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Research Admin</h1>
                <p className="text-xs text-gray-500">Manage lesson notes and course materials</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile?.role === 'director' && (
                <button
                  onClick={() => navigate('/director')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab('courses')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'bg-slate-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Book className="h-4 w-4" />
              Courses & Lessons
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests'
                  ? 'bg-slate-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClipboardCheck className="h-4 w-4" />
              Tests & Exams
            </button>
          </div>
        </div>
      </div>

      {/* Tests & Exams Tab */}
      {activeTab === 'tests' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Sub-tab navigation */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTestSubTab('questions')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  testSubTab === 'questions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Question Bank
              </button>
              <button
                onClick={() => setTestSubTab('settings')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  testSubTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <button
                onClick={() => setTestSubTab('results')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  testSubTab === 'results' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Results
              </button>
            </div>
            {testSubTab === 'questions' && (
              <select
                value={selectedTestProgram}
                onChange={(e) => setSelectedTestProgram(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                {Object.values(PROGRAMS).map(p => (
                  <option key={p.id} value={p.id}>{p.shortName} — {p.name}</option>
                ))}
              </select>
            )}
          </div>

          {testSubTab === 'settings' && (
            <TestSettingsPanel
              settings={testSettings}
              onSettingsUpdate={setTestSettings}
            />
          )}
          {testSubTab === 'questions' && (
            <TestQuestionManager
              selectedProgram={selectedTestProgram}
              settings={testSettings}
            />
          )}
          {testSubTab === 'results' && (
            <TestResultsDashboard />
          )}
        </div>
      )}

      {/* Courses & Lessons Tab */}
      {activeTab === 'courses' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Courses */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Courses</h2>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Add new course"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedCourse?.id === course.id
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{getProgramName(course.program_id)}</span>
                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{course.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setCourseForm({
                              title: course.title,
                              slug: course.slug,
                              description: course.description || '',
                              program_id: course.program_id,
                              display_order: course.display_order || 0
                            });
                            setShowCourseModal(true);
                          }}
                          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded p-1 transition-all"
                          title="Edit course"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-all"
                          title="Delete course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {courses.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-10">No courses yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Chapters */}
          <div className="col-span-12 lg:col-span-9">
            {selectedCourse ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h2>
                  <p className="text-sm text-gray-600 mt-1.5">{selectedCourse.description}</p>
                  <button
                    onClick={handleCreateChapter}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    New Chapter
                  </button>
                </div>

                <div className="p-6">
                  {editingChapter ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Editing Chapter</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveChapter}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold shadow-sm hover:shadow-md transition-all"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingChapter(null)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Chapter Title</label>
                        <input
                          type="text"
                          value={editingChapter.title}
                          onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-900">Content</label>
                          <select
                            value={editingChapter.content_type || 'rich_text'}
                            onChange={(e) => setEditingChapter({ ...editingChapter, content_type: e.target.value })}
                            className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600"
                          >
                            <option value="rich_text">Rich Text</option>
                            <option value="full_html">HTML File</option>
                          </select>
                        </div>

                        {(!editingChapter.content_type || editingChapter.content_type === 'rich_text') ? (
                          <RichTextEditor
                            value={editingChapter.content}
                            onChange={(newContent) => setEditingChapter({ ...editingChapter, content: newContent })}
                            placeholder="Write your lesson content here..."
                          />
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm transition-colors">
                                <Upload className="h-4 w-4" />
                                {editingChapter.content && editingChapter.content_type === 'full_html' ? 'Replace file' : 'Choose file'}
                                <input
                                  type="file"
                                  accept=".html,.htm"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setEditingChapter({ ...editingChapter, content: ev.target.result, content_type: 'full_html' });
                                      toast.success(`Loaded ${file.name}`);
                                    };
                                    reader.readAsText(file);
                                  }}
                                />
                              </label>
                              {editingChapter.content && editingChapter.content_type === 'full_html' && (
                                <span className="text-xs text-gray-400">{(editingChapter.content.length / 1024).toFixed(0)} KB loaded</span>
                              )}
                            </div>
                            {editingChapter.content && editingChapter.content_type === 'full_html' && (
                              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                                <iframe
                                  srcDoc={editingChapter.content}
                                  title="Preview"
                                  className="w-full h-full border-0"
                                  sandbox="allow-same-origin"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="published"
                          checked={editingChapter.is_published}
                          onChange={(e) => setEditingChapter({ ...editingChapter, is_published: e.target.checked })}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="published" className="text-sm text-gray-700">
                          Publish this chapter (make it publicly visible)
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-500">#{chapter.chapter_number}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{chapter.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {chapter.is_published ? (
                                  <span className="text-indigo-600 font-semibold">Published</span>
                                ) : (
                                  <span className="text-gray-500">Draft</span>
                                )}
                                {chapter.content_type === 'full_html' && (
                                  <span className="text-gray-400 ml-2">· HTML</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openQuizManager(chapter)}
                              className={`p-2 rounded-lg ${
                                quizChapter?.id === chapter.id
                                  ? 'text-amber-600 bg-amber-50'
                                  : 'text-amber-500 hover:bg-amber-50'
                              }`}
                              title="Manage quiz"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPreviewChapter(chapter)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Preview content"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(chapter)}
                              className={`p-2 rounded-lg ${
                                chapter.is_published
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={chapter.is_published ? 'Unpublish' : 'Publish'}
                            >
                              {chapter.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setEditingChapter(chapter)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {chapters.length === 0 && (
                        <p className="text-center text-gray-500 py-12">No chapters yet. Create one to get started.</p>
                      )}
                    </div>
                  )}

                  {/* Quiz Manager Panel */}
                  {quizChapter && !editingChapter && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-amber-500" />
                            Quiz for: {quizChapter.title}
                          </h3>
                          {quiz && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {questions.length} question{questions.length !== 1 ? 's' : ''} · Pass: {quiz.passing_score}/{questions.length} · {quiz.is_published ? <span className="text-indigo-600 font-semibold">Published</span> : <span className="text-gray-500">Draft</span>}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {quiz && (
                            <>
                              <button
                                onClick={() => setShowQuizSettings(!showQuizSettings)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                              >
                                Settings
                              </button>
                              <button
                                onClick={handleToggleQuizPublish}
                                className={`px-3 py-1.5 text-sm rounded-lg ${quiz.is_published ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                              >
                                {quiz.is_published ? 'Published' : 'Publish'}
                              </button>
                              <button
                                onClick={handleDeleteQuiz}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                Delete Quiz
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => { setQuizChapter(null); setQuiz(null); setQuestions([]); setEditingQuestion(null); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quiz Settings (collapsible) */}
                      {showQuizSettings && quiz && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                            <input type="text" value={quizForm.title}
                              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input type="text" value={quizForm.subtitle}
                              onChange={(e) => setQuizForm({ ...quizForm, subtitle: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score</label>
                              <input type="number" min="1" value={quizForm.passing_score}
                                onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={quizForm.shuffle_questions}
                                  onChange={(e) => setQuizForm({ ...quizForm, shuffle_questions: e.target.checked })}
                                  className="rounded border-gray-300 text-emerald-600" />
                                Shuffle questions
                              </label>
                            </div>
                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={quizForm.shuffle_options}
                                  onChange={(e) => setQuizForm({ ...quizForm, shuffle_options: e.target.checked })}
                                  className="rounded border-gray-300 text-emerald-600" />
                                Shuffle options
                              </label>
                            </div>
                          </div>
                          <button onClick={handleSaveQuizSettings}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900">
                            Save Settings
                          </button>
                        </div>
                      )}

                      {/* No quiz yet — create one */}
                      {!quiz && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                          <HelpCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                          <p className="text-gray-700 mb-1 font-medium">No quiz for this chapter yet</p>
                          <p className="text-sm text-gray-500 mb-4">Create a quiz to help students test their understanding</p>
                          <div className="max-w-sm mx-auto space-y-3 mb-4">
                            <input type="text" value={quizForm.title} placeholder="Quiz title"
                              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          </div>
                          <button onClick={handleCreateQuiz}
                            className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold text-sm">
                            Create Quiz
                          </button>
                        </div>
                      )}

                      {/* Questions list */}
                      {quiz && !editingQuestion && (
                        <div className="space-y-2">
                          {questions.map((q) => (
                            <div key={q.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                  {q.question_number}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.question}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                      q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>{q.difficulty}</span>
                                    {q.section_tag && <span className="text-xs text-gray-500">{q.section_tag}</span>}
                                    <span className="text-xs text-emerald-600 font-medium">Answer: {q.correct_answer}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button onClick={() => setEditingQuestion(q)}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button onClick={handleAddQuestion}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 flex items-center justify-center gap-2 transition-all">
                            <Plus className="h-4 w-4" /> Add Question
                          </button>
                        </div>
                      )}

                      {/* Question editor */}
                      {quiz && editingQuestion && (
                        <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900">
                              {editingQuestion.id ? `Edit Question #${editingQuestion.question_number}` : `New Question #${editingQuestion.question_number}`}
                            </h4>
                            <div className="flex gap-2">
                              <button onClick={handleSaveQuestion}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900">
                                <Save className="h-3.5 w-3.5" /> Save
                              </button>
                              <button onClick={() => setEditingQuestion(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <textarea rows={2} value={editingQuestion.question}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                            {(editingQuestion.options || []).map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-2">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  editingQuestion.correct_answer === String.fromCharCode(65 + idx)
                                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <input type="text" value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...editingQuestion.options];
                                    newOpts[idx] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, options: newOpts });
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                <button
                                  onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: String.fromCharCode(65 + idx) })}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                                    editingQuestion.correct_answer === String.fromCharCode(65 + idx)
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                  }`}
                                >
                                  {editingQuestion.correct_answer === String.fromCharCode(65 + idx) ? 'Correct' : 'Set correct'}
                                </button>
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (shown after answering)</label>
                            <textarea rows={3} value={editingQuestion.explanation || ''}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                              <select value={editingQuestion.difficulty}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Section Tag</label>
                              <input type="text" value={editingQuestion.section_tag || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, section_tag: e.target.value })}
                                placeholder="e.g. Arabia Before Islam"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <Book className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Select a course to manage its chapters</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Create/Edit Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setCourseForm({ 
                      ...courseForm, 
                      title: newTitle,
                      slug: generateSlug(newTitle)
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                  <span className="text-xs text-gray-500 ml-2">(auto-generated, editable)</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm({ ...courseForm, slug: generateSlug(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., tajweed-basics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select
                  value={courseForm.program_id}
                  onChange={(e) => setCourseForm({ ...courseForm, program_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="qari">QARI</option>
                  <option value="tajweed">TMP (Tajweed)</option>
                  <option value="essentials">EASI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setEditingCourse(null);
                    setCourseForm({ title: '', slug: '', description: '', program_id: 'qari', display_order: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Preview: {previewChapter.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Chapter {previewChapter.chapter_number}</p>
              </div>
              <button
                onClick={() => setPreviewChapter(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div 
                className="prose max-w-none
                  prose-headings:font-normal prose-headings:text-gray-900
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:my-4 prose-li:my-1 prose-li:text-gray-700
                  prose-ol:my-4
                  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gray-50 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200
                  prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-table:border-collapse prose-table:w-full
                  prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm
                  prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm
                  [&_.verse]:text-xl [&_.verse]:text-center [&_.verse]:my-8 [&_.verse]:text-gray-900 [&_.verse]:font-serif [&_.verse]:leading-relaxed [&_.verse]:py-4
                  [&_.tip]:bg-blue-50 [&_.tip]:border-l-2 [&_.tip]:border-blue-400 [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:my-4
                  [&_.tip:before]:content-['Tip:'] [&_.tip:before]:font-semibold [&_.tip:before]:text-blue-700 [&_.tip:before]:block [&_.tip:before]:mb-1"
                dangerouslySetInnerHTML={{ __html: sanitizeContent(previewChapter.content) }}
                style={{ direction: 'ltr' }}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingChapter(previewChapter);
                  setPreviewChapter(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Edit
              </button>
              <button
                onClick={() => setPreviewChapter(null)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchAdmin;
