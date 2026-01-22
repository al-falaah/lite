import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Book, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, Save, X, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';
import { useAuth } from '../context/AuthContext';

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
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [editingChapter, setEditingChapter] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
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
    try {
      const { data, error } = await supabase
        .from('lesson_courses')
        .select('*')
        .order('program_id')
        .order('display_order');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('lesson_chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('chapter_number');

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
      const { error } = await supabase
        .from('lesson_courses')
        .insert({
          ...courseForm,
          created_by: user.id
        });

      if (error) throw error;
      toast.success('Course created successfully');
      setShowCourseModal(false);
      setCourseForm({ title: '', slug: '', description: '', program_id: 'qari', display_order: 0 });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Research Admin</h1>
                <p className="text-sm text-gray-600">Manage lesson notes and course materials</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile?.role === 'director' && (
                <button
                  onClick={() => navigate('/director')}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Courses */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Courses</h2>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="p-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-emerald-600">{getProgramName(course.program_id)}</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {courses.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No courses yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Chapters */}
          <div className="col-span-12 lg:col-span-9">
            {selectedCourse ? (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedCourse.description}</p>
                  <button
                    onClick={handleCreateChapter}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Chapter
                  </button>
                </div>

                <div className="p-6">
                  {editingChapter ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Editing Chapter</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveChapter}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingChapter(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Title</label>
                        <input
                          type="text"
                          value={editingChapter.title}
                          onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content (Supports Markdown, Arabic text, and HTML)
                        </label>
                        <textarea
                          value={editingChapter.content}
                          onChange={(e) => setEditingChapter({ ...editingChapter, content: e.target.value })}
                          rows={20}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                          placeholder="Write your lesson content here...&#10;&#10;Use HTML for special formatting:&#10;- <div class='verse'>Quranic verse</div>&#10;- <div class='tip'>Quick tip</div>&#10;- <table> for tables&#10;- Arabic text works natively"
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
                    <div className="space-y-2">
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">#{chapter.chapter_number}</span>
                            <div>
                              <p className="font-medium text-gray-900">{chapter.title}</p>
                              <p className="text-xs text-gray-500">
                                {chapter.is_published ? (
                                  <span className="text-emerald-600">Published</span>
                                ) : (
                                  <span className="text-gray-500">Draft</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
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
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a course to manage its chapters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Course</h2>
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
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchAdmin;
