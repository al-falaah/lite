import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';

const LessonNotes = () => {
  const { courseSlug } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndChapters();
  }, [courseSlug]);

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
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{course.title} | Lesson Notes | The FastTrack Madrasah</title>
        <meta
          name="description"
          content={course.description || `Lesson notes and study materials for ${course.title}`}
        />
      </Helmet>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/resources" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
              <ChevronLeft className="h-4 w-4" />
              <span>Resources</span>
            </Link>
            <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Chapters */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-20">
              <div className="mb-6 pb-4 border-b">
                <h2 className="font-bold text-gray-900 text-lg mb-1.5">{course.title}</h2>
                {course.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                )}
              </div>

              <div className="space-y-0.5">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all duration-150 ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`text-xs font-bold mt-0.5 min-w-[20px] ${
                        selectedChapter?.id === chapter.id ? 'text-emerald-100' : 'text-gray-400'
                      }`}>
                        {chapter.chapter_number}
                      </span>
                      <span className="text-sm font-medium leading-snug">{chapter.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              {chapters.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No chapters yet</p>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {selectedChapter ? (
              <div>
                <div className="mb-6 pb-5 border-b">
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    Chapter {selectedChapter.chapter_number}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{selectedChapter.title}</h1>
                </div>

                <div className="pb-8">
                  <div 
                    className="prose prose-lg max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:my-6 prose-li:my-1.5 prose-li:text-gray-700
                      prose-ol:my-6
                      prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl
                      prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                      prose-table:border-collapse prose-table:w-full prose-table:my-6
                      prose-th:bg-gray-50 prose-th:border prose-th:border-gray-200 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:text-sm
                      prose-td:border prose-td:border-gray-200 prose-td:px-4 prose-td:py-2.5 prose-td:text-sm
                      [&_.verse]:text-2xl [&_.verse]:text-center [&_.verse]:my-10 [&_.verse]:text-emerald-900 [&_.verse]:font-serif [&_.verse]:leading-loose [&_.verse]:border-t [&_.verse]:border-b [&_.verse]:border-emerald-300 [&_.verse]:py-8 [&_.verse]:px-4
                      [&_.tip]:bg-blue-50 [&_.tip]:border-l-4 [&_.tip]:border-blue-500 [&_.tip]:p-5 [&_.tip]:my-6 [&_.tip]:rounded-r-lg
                      [&_.tip:before]:content-['💡_Tip:'] [&_.tip:before]:font-bold [&_.tip:before]:text-blue-700 [&_.tip:before]:block [&_.tip:before]:mb-2 [&_.tip:before]:text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeContent(selectedChapter.content) }}
                    style={{ direction: 'ltr' }}
                  />
                </div>

                {/* Navigation Footer */}
                <div className="border-t pt-6 mt-8">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={!hasPrev}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                        hasPrev
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-sm">Previous</span>
                    </button>

                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {selectedChapter.chapter_number} / {chapters.length}
                    </span>

                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={!hasNext}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                        hasNext
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Select a chapter to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonNotes;
