import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Book, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const Resources = () => {
  // Load cached data immediately for instant display
  const getCachedCourses = () => {
    try {
      const cached = localStorage.getItem('courses_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [courses, setCourses] = useState(getCachedCourses());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_courses')
        .select('*')
        .order('program_id')
        .order('display_order');

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        throw error;
      }
      
      const freshData = data || [];
      setCourses(freshData);
      
      // Cache for next visit
      if (freshData.length > 0) {
        localStorage.setItem('courses_cache', JSON.stringify(freshData));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgramName = (programId) => {
    const program = Object.values(PROGRAMS).find(p => p.id === programId);
    return program ? program.name : programId.toUpperCase();
  };

  const getProgramShortName = (programId) => {
    const program = Object.values(PROGRAMS).find(p => p.id === programId);
    return program ? program.shortName : programId.toUpperCase();
  };

  const coursesByProgram = {
    qari: courses?.filter(c => c.program_id === 'qari') || [],
    tajweed: courses?.filter(c => c.program_id === 'tajweed') || [],
    essentials: courses?.filter(c => c.program_id === 'essentials') || []
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Learning Resources | Lesson Notes | The FastTrack Madrasah</title>
        <meta
          name="description"
          content="Access free lesson notes and study materials for QARI, Tajweed, and EASI programs. Comprehensive Islamic education resources from The FastTrack Madrasah."
        />
      </Helmet>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-normal text-gray-900 mb-2">Resources</h1>
          <p className="text-base text-gray-600">Course materials and lesson notes</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          {loading && !courses ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50 rounded-lg border border-red-200">
              <BookOpen className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <p className="text-red-600 mb-2">Error loading resources</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : !courses || courses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No resources available yet</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* QARI Program */}
              {coursesByProgram.qari.length > 0 && (
                <div>
                  <h2 className="text-xl font-normal text-gray-900 mb-4">{getProgramName('qari')}</h2>
                  <div className="space-y-1">
                    {coursesByProgram.qari.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="block border-b border-gray-200 hover:bg-gray-50 p-4 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-base text-gray-900">
                            {course.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        {course.description && (
                          <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* TMP Program */}
              {coursesByProgram.tajweed.length > 0 && (
                <div>
                  <h2 className="text-xl font-normal text-gray-900 mb-4">{getProgramName('tajweed')}</h2>
                  <div className="space-y-1">
                    {coursesByProgram.tajweed.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="block border-b border-gray-200 hover:bg-gray-50 p-4 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-base text-gray-900">
                            {course.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        {course.description && (
                          <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* EASI Program */}
              {coursesByProgram.essentials.length > 0 && (
                <div>
                  <h2 className="text-xl font-normal text-gray-900 mb-4">{getProgramName('essentials')}</h2>
                  <div className="space-y-1">
                    {coursesByProgram.essentials.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="block border-b border-gray-200 hover:bg-gray-50 p-4 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-base text-gray-900">
                            {course.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        {course.description && (
                          <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resources;
