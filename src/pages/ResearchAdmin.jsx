import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Book, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, Save, X, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';
import RichTextEditor from '../components/common/RichTextEditor';

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

  useEffect(() => {
    checkAccess();
    fetchCourses();
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

    const hasAccess = profile?.role && ['director', 'research_admin'].includes(profile.role);
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

  const getProgramName = (programId) => {
    const program = Object.values(PROGRAMS).find(p => p.id === programId);
    return program ? program.shortName : programId.toUpperCase();
  };

  const sanitizeContent = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr', 'sup'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style', 'data-footnote']
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
        </div>
      </div>

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
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Content
                        </label>
                        <RichTextEditor
                          value={editingChapter.content}
                          onChange={(newContent) => setEditingChapter({ ...editingChapter, content: newContent })}
                          placeholder="Write your lesson content here... Use the formatting buttons above to style your content."
                        />
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
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
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
