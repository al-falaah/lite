import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { supabase } from '../services/supabase';
import DOMPurify from 'dompurify';

// Disable screenshots and screen recording
const preventScreenCapture = () => {
  // Add visual watermark overlay
  const watermark = document.createElement('div');
  watermark.className = 'lesson-watermark';
  document.body.appendChild(watermark);

  // Prevent right-click context menu
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.lesson-content-protected')) {
      e.preventDefault();
      return false;
    }
  });

  // Detect screenshot attempts and blur content
  let blurTimeout;
  const blurContent = () => {
    const content = document.querySelector('.lesson-content-protected');
    if (content) {
      content.style.filter = 'blur(20px)';
      content.style.transition = 'filter 0.1s';
      
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        content.style.filter = 'none';
      }, 3000);
    }
  };

  // Prevent keyboard shortcuts for copy/screenshot
  document.addEventListener('keydown', (e) => {
    if (!e.target.closest('.lesson-content-protected')) return;
    
    // Prevent Cmd+C, Cmd+X, Cmd+P, Cmd+S
    if ((e.metaKey || e.ctrlKey) && 
        ['c', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      blurContent();
      return false;
    }
    
    // Detect screenshot shortcuts and blur
    // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
    if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
      blurContent();
      e.preventDefault();
      return false;
    }
    
    // Windows: PrintScreen, Alt+PrintScreen, Win+Shift+S
    if (e.key === 'PrintScreen' || 
        (e.key === 's' && e.metaKey && e.shiftKey) ||
        (e.key === 'S' && e.metaKey && e.shiftKey)) {
      blurContent();
      e.preventDefault();
      return false;
    }
  });

  // Detect when window loses focus (possible screenshot tool)
  let wasBlurred = false;
  window.addEventListener('blur', () => {
    wasBlurred = true;
    blurContent();
  });

  window.addEventListener('focus', () => {
    if (wasBlurred) {
      setTimeout(() => {
        const content = document.querySelector('.lesson-content-protected');
        if (content) content.style.filter = 'none';
      }, 500);
      wasBlurred = false;
    }
  });

  // Prevent drag and drop
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.lesson-content-protected')) {
      e.preventDefault();
      return false;
    }
  });

  // Detect visibility change (screenshot tools often cause this)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      blurContent();
    }
  });
};

const LessonNotes = () => {
  const { courseSlug } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lessonNotesTheme');
    return saved || 'light';
  });

  useEffect(() => {
    fetchCourseAndChapters();
  }, [courseSlug]);

  useEffect(() => {
    localStorage.setItem('lessonNotesTheme', theme);
  }, [theme]);

  useEffect(() => {
    // Enable content protection
    preventScreenCapture();
    
    return () => {
      // Cleanup watermark on unmount
      const watermark = document.querySelector('.lesson-watermark');
      if (watermark) watermark.remove();
    };
  }, []);

  const cycleTheme = () => {
    setTheme(current => {
      if (current === 'light') return 'sepia';
      if (current === 'sepia') return 'dark';
      return 'light';
    });
  };

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
    <div className={`min-h-screen transition-colors lesson-content-protected ${
      theme === 'dark' ? 'bg-gray-900' : theme === 'sepia' ? 'bg-[#f5f1e8]' : 'bg-white'
    }`} style={{ userSelect: 'none', WebkitUserSelect: 'none', msUserSelect: 'none' }}>
      <Helmet>
        <title>{course.title} | Lesson Notes | The FastTrack Madrasah</title>
        <meta
          name="description"
          content={course.description || `Lesson notes and study materials for ${course.title}`}
        />
        <style>{`
          @media print {
            body { display: none !important; }
          }
          .lesson-content-protected * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
          }
          .lesson-watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            overflow: hidden;
          }
          .lesson-watermark::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 250px,
              rgba(0, 0, 0, 0.005) 250px,
              rgba(0, 0, 0, 0.005) 500px
            );
          }
          .lesson-watermark::after {
            content: '\u00a9 The FastTrack Madrasah';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 4rem;
            color: rgba(0, 0, 0, 0.012);
            white-space: nowrap;
            pointer-events: none;
            font-weight: 600;
            letter-spacing: 0.2em;
          }
          /* Dynamic watermark repeating pattern */
          body.lesson-page::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 200%;
            height: 200%;
            pointer-events: none;
            z-index: 9997;
            background-image: 
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 150px,
                rgba(0, 0, 0, 0.008) 150px,
                rgba(0, 0, 0, 0.008) 151px
              );
          }
          @media screen and (-webkit-min-device-pixel-ratio:0) {
            body::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 9999;
            }
          }
        `}</style>
      </Helmet>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b transition-colors ${
        theme === 'dark' ? 'bg-gray-900 border-gray-700' : 
        theme === 'sepia' ? 'bg-[#f5f1e8] border-[#d4c9b8]' : 
        'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/resources" className={`flex items-center gap-1.5 transition-colors text-sm ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 
              theme === 'sepia' ? 'text-[#5a4a3a] hover:text-[#3d3229]' :
              'text-gray-600 hover:text-gray-900'
            }`}>
              <ChevronLeft className="h-4 w-4" />
              <span>Resources</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={cycleTheme}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  theme === 'dark' ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 
                  theme === 'sepia' ? 'border-[#d4c9b8] text-[#5a4a3a] hover:bg-[#ebe4d8]' :
                  'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Change theme"
              >
                {theme === 'light' ? 'Light' : theme === 'sepia' ? 'Sepia' : 'Dark'}
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
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 
              theme === 'sepia' ? 'bg-[#ebe4d8] border-[#d4c9b8]' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className={`mb-4 pb-3 border-b ${
                theme === 'dark' ? 'border-gray-700' : 
                theme === 'sepia' ? 'border-[#d4c9b8]' :
                'border-gray-200'
              }`}>
                <h2 className={`font-medium text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-100' : 
                  theme === 'sepia' ? 'text-[#3d3229]' :
                  'text-gray-900'
                }`}>{course.title}</h2>
                {course.description && (
                  <p className={`text-xs leading-relaxed ${
                    theme === 'dark' ? 'text-gray-400' : 
                    theme === 'sepia' ? 'text-[#5a4a3a]' :
                    'text-gray-600'
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
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : theme === 'sepia'
                            ? 'text-[#3d3229] hover:bg-[#dfd6c8]'
                            : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium mt-0.5 min-w-[18px] ${
                        selectedChapter?.id === chapter.id 
                          ? 'text-emerald-100' 
                          : theme === 'dark' ? 'text-gray-500' : 
                            theme === 'sepia' ? 'text-[#8a7a6a]' :
                            'text-gray-400'
                      }`}>
                        {chapter.chapter_number}
                      </span>
                      <span className="leading-snug">{chapter.title}</span>
                    </div>
                  </button>
                ))}
              </nav>

              {chapters.length === 0 && (
                <p className={`text-sm text-center py-6 ${
                  theme === 'dark' ? 'text-gray-400' : 
                  theme === 'sepia' ? 'text-[#5a4a3a]' :
                  'text-gray-500'
                }`}>No chapters yet</p>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedChapter ? (
              <div className={`border transition-colors ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 
                theme === 'sepia' ? 'bg-[#f5f1e8] border-[#d4c9b8]' :
                'bg-white border-gray-200'
              }`}>
                <div className={`px-8 pt-8 pb-6 border-b transition-colors ${
                  theme === 'dark' ? 'border-gray-700' : 
                  theme === 'sepia' ? 'border-[#d4c9b8]' :
                  'border-gray-100'
                }`}>
                  <h1 className={`text-2xl font-normal ${
                    theme === 'dark' ? 'text-gray-100' : 
                    theme === 'sepia' ? 'text-[#3d3229]' :
                    'text-gray-900'
                  }`}>{selectedChapter.chapter_number}. {selectedChapter.title}</h1>
                </div>

                <div className="px-8 py-6">
                  <div 
                    className={`prose max-w-none transition-colors ${
                      theme === 'dark'
                        ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-gray-100 prose-li:text-gray-300 prose-code:bg-gray-900 prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border-gray-700 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400 prose-th:bg-gray-900 prose-th:border-gray-700 prose-td:border-gray-700 [&_.verse]:text-gray-100 [&_.tip]:bg-blue-950 [&_.tip]:border-blue-800 [&_.tip:before]:text-blue-400'
                        : theme === 'sepia'
                          ? 'prose-headings:font-normal prose-headings:text-[#3d3229] prose-p:text-[#3d3229] prose-p:leading-relaxed prose-a:text-[#2c5f7f] hover:prose-a:underline prose-strong:text-[#3d3229] prose-strong:font-semibold prose-li:text-[#3d3229] prose-code:text-sm prose-code:bg-[#ebe4d8] prose-pre:bg-[#ebe4d8] prose-pre:text-[#3d3229] prose-pre:border prose-pre:border-[#d4c9b8] prose-blockquote:border-l-2 prose-blockquote:border-[#8a7a6a] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#5a4a3a] prose-th:bg-[#ebe4d8] prose-th:border prose-th:border-[#d4c9b8] prose-td:border prose-td:border-[#d4c9b8] [&_.verse]:text-xl [&_.verse]:text-center [&_.verse]:my-8 [&_.verse]:text-[#3d3229] [&_.verse]:font-serif [&_.verse]:leading-relaxed [&_.verse]:py-4 [&_.tip]:bg-[#e8dcc8] [&_.tip]:border-l-2 [&_.tip]:border-[#8a7a6a] [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:my-4 [&_.tip:before]:content-[\"Tip:\"] [&_.tip:before]:font-semibold [&_.tip:before]:text-[#5a4a3a] [&_.tip:before]:block [&_.tip:before]:mb-1'
                          : 'prose-headings:font-normal prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-li:text-gray-700 prose-code:text-sm prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-td:border prose-td:border-gray-300 [&_.verse]:text-xl [&_.verse]:text-center [&_.verse]:my-8 [&_.verse]:text-gray-900 [&_.verse]:font-serif [&_.verse]:leading-relaxed [&_.verse]:py-4 [&_.tip]:bg-blue-50 [&_.tip]:border-l-2 [&_.tip]:border-blue-400 [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:my-4 [&_.tip:before]:content-[\"Tip:\"] [&_.tip:before]:font-semibold [&_.tip:before]:text-blue-700 [&_.tip:before]:block [&_.tip:before]:mb-1'
                    } prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-a:no-underline prose-ul:my-4 prose-li:my-1 prose-ol:my-4 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-[''] prose-table:border-collapse prose-table:w-full prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm prose-td:px-3 prose-td:py-2 prose-td:text-sm`}
                    dangerouslySetInnerHTML={{ __html: sanitizeContent(selectedChapter.content) }}
                    style={{ direction: 'ltr' }}
                  />
                </div>

                {/* Navigation Footer */}
                <div className={`border-t px-8 py-4 transition-colors ${
                  theme === 'dark' ? 'border-gray-700' : 
                  theme === 'sepia' ? 'border-[#d4c9b8]' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={!hasPrev}
                      className={`${
                        hasPrev
                          ? theme === 'dark' ? 'text-blue-400 hover:underline' : 
                            theme === 'sepia' ? 'text-[#2c5f7f] hover:underline' :
                            'text-blue-600 hover:underline'
                          : theme === 'dark' ? 'text-gray-600 cursor-not-allowed' : 
                            theme === 'sepia' ? 'text-[#b5a594] cursor-not-allowed' :
                            'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      ← Previous
                    </button>

                    <span className={theme === 'dark' ? 'text-gray-400' : 
                      theme === 'sepia' ? 'text-[#5a4a3a]' :
                      'text-gray-500'}>
                      {selectedChapter.chapter_number} / {chapters.length}
                    </span>

                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={!hasNext}
                      className={`${
                        hasNext
                          ? theme === 'dark' ? 'text-blue-400 hover:underline' : 
                            theme === 'sepia' ? 'text-[#2c5f7f] hover:underline' :
                            'text-blue-600 hover:underline'
                          : theme === 'dark' ? 'text-gray-600 cursor-not-allowed' : 
                            theme === 'sepia' ? 'text-[#b5a594] cursor-not-allowed' :
                            'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Copyright Notice */}
                <div className={`border-t px-8 py-4 text-center transition-colors ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-900' : 
                  theme === 'sepia' ? 'border-[#d4c9b8] bg-[#ebe4d8]' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 
                    theme === 'sepia' ? 'text-[#5a4a3a]' :
                    'text-gray-600'
                  }`}>
                    © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
                  </p>
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 
                    theme === 'sepia' ? 'text-[#8a7a6a]' :
                    'text-gray-500'
                  }`}>
                    This content is proprietary and confidential. Unauthorized copying, distribution, or reproduction is strictly prohibited.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`text-center py-20 border transition-colors ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 
                theme === 'sepia' ? 'bg-[#f5f1e8] border-[#d4c9b8]' :
                'bg-white border-gray-200'
              }`}>
                <BookOpen className={`h-12 w-12 mx-auto mb-3 ${
                  theme === 'dark' ? 'text-gray-600' : 
                  theme === 'sepia' ? 'text-[#b5a594]' :
                  'text-gray-300'
                }`} />
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 
                  theme === 'sepia' ? 'text-[#5a4a3a]' :
                  'text-gray-500'
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
