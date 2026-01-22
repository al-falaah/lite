import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Book, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const Resources = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

      if (error) throw error;
      setCourses(data || []);
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
    qari: courses.filter(c => c.program_id === 'qari'),
    tajweed: courses.filter(c => c.program_id === 'tajweed'),
    essentials: courses.filter(c => c.program_id === 'essentials')
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

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
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-7 w-7" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-sm font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-12 pb-8 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Resources</h1>
          <p className="text-lg text-gray-600">Lesson notes for our programs</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources yet</h3>
              <p className="text-gray-600">Check back soon for lesson notes</p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* QARI Program */}
              {coursesByProgram.qari.length > 0 && (
                <div>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                      <span className="text-sm font-semibold text-emerald-700">QARI</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{getProgramName('qari')}</h2>
                    <p className="text-gray-600">Learn to read Arabic from zero</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {coursesByProgram.qari.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Book className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                            )}
                          </div>
                          <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* TMP Program */}
              {coursesByProgram.tajweed.length > 0 && (
                <div>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                      <span className="text-sm font-semibold text-emerald-700">TMP</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{getProgramName('tajweed')}</h2>
                    <p className="text-gray-600">Master Tajweed rules & Quranic sciences</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {coursesByProgram.tajweed.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Book className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                            )}
                          </div>
                          <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* EASI Program */}
              {coursesByProgram.essentials.length > 0 && (
                <div>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                      <span className="text-sm font-semibold text-emerald-700">EASI</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{getProgramName('essentials')}</h2>
                    <p className="text-gray-600">Arabic grammar & Islamic sciences</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {coursesByProgram.essentials.map((course) => (
                      <Link
                        key={course.id}
                        to={`/resources/${course.slug}`}
                        className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Book className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                            )}
                          </div>
                          <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
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
