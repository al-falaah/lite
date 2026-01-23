import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';

const LessonNotes = () => {
  const { courseSlug } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('lessonNotesDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    fetchCourseAndChapters();
  }, [courseSlug]);

  useEffect(() => {
    localStorage.setItem('lessonNotesDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchCourseAndChapters = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('lesson_courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch published chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('lesson_chapters')
        .select('*')
        .eq('course_id', courseData.id)
        .eq('is_published', true)
        .order('chapter_number');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);
      
      // Auto-select first chapter
      if (chaptersData && chaptersData.length > 0) {
        setSelectedChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateChapter = (direction) => {
    const currentIndex = chapters.findIndex(ch => ch.id === selectedChapter?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedChapter(chapters[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < chapters.length - 1) {
      setSelectedChapter(chapters[currentIndex + 1]);
    }
  };

  const sanitizeContent = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span', 
                     'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img'],
      ALLOWED_ATTR: ['class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'style']
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h1>
          <Link to="/resources" className="text-emerald-600 hover:text-emerald-700">
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = chapters.findIndex(ch => ch.id === selectedChapter?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Helmet>
        <title>{course.title} | Lesson Notes | The FastTrack Madrasah</title>
        <meta
          name="description"
          content={course.description || `Lesson notes and study materials for ${course.title}`}
        />
      </Helmet>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b transition-colors ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/resources" className={`flex items-center gap-1.5 transition-colors text-sm ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <ChevronLeft className="h-4 w-4" />
              <span>Resources</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Chapters */}
          <div className="lg:col-span-1">
            <div className={`lg:sticky lg:top-24 border p-4 transition-colors ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`mb-4 pb-3 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`font-medium text-sm mb-1 ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{course.title}</h2>
                {course.description && (
                  <p className={`text-xs leading-relaxed ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{course.description}</p>
                )}
              </div>

              <nav className="space-y-0.5">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left px-2.5 py-2 text-sm transition-colors ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-emerald-600 text-white'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium mt-0.5 min-w-[18px] ${
                        selectedChapter?.id === chapter.id 
                          ? 'text-emerald-100' 
                          : darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {chapter.chapter_number}
                      </span>
                      <span className="leading-snug">{chapter.title}</span>
                    </div>
                  </button>
                ))}
              </nav>

              {chapters.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No chapters yet</p>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedChapter ? (
              <div className={`border transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`px-8 pt-8 pb-6 border-b transition-colors ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <h1 className={`text-2xl font-normal ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>{selectedChapter.chapter_number}. {selectedChapter.title}</h1>
                </div>

                <div className="px-8 py-6">
                  <div 
                    className={`prose max-w-none transition-colors ${
                      darkMode
                        ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-gray-100 prose-li:text-gray-300 prose-code:bg-gray-900 prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border-gray-700 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400 prose-th:bg-gray-900 prose-th:border-gray-700 prose-td:border-gray-700 [&_.verse]:text-gray-100 [&_.tip]:bg-blue-950 [&_.tip]:border-blue-800 [&_.tip:before]:text-blue-400'
                        : 'prose-headings:font-normal prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-li:text-gray-700 prose-code:text-sm prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-td:border prose-td:border-gray-300 [&_.verse]:text-xl [&_.verse]:text-center [&_.verse]:my-8 [&_.verse]:text-gray-900 [&_.verse]:font-serif [&_.verse]:leading-relaxed [&_.verse]:py-4 [&_.tip]:bg-blue-50 [&_.tip]:border-l-2 [&_.tip]:border-blue-400 [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:my-4 [&_.tip:before]:content-[\"Tip:\"] [&_.tip:before]:font-semibold [&_.tip:before]:text-blue-700 [&_.tip:before]:block [&_.tip:before]:mb-1'
                    } prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-a:no-underline prose-ul:my-4 prose-li:my-1 prose-ol:my-4 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-[''] prose-table:border-collapse prose-table:w-full prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm prose-td:px-3 prose-td:py-2 prose-td:text-sm`}
                    dangerouslySetInnerHTML={{ __html: sanitizeContent(selectedChapter.content) }}
                    style={{ direction: 'ltr' }}
                  />
                </div>

                {/* Navigation Footer */}
                <div className={`border-t px-8 py-4 transition-colors ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={!hasPrev}
                      className={`${
                        hasPrev
                          ? darkMode ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'
                          : darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      ← Previous
                    </button>

                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {selectedChapter.chapter_number} / {chapters.length}
                    </span>

                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={!hasNext}
                      className={`${
                        hasNext
                          ? darkMode ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'
                          : darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-20 border transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <BookOpen className={`h-12 w-12 mx-auto mb-3 ${
                  darkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Select a chapter to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonNotes;
