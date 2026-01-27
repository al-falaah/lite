import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Book, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const Resources = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    let timeoutId;
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching courses from Supabase...');
      
      // Increase timeout to 20 seconds for slower connections
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout - please check your internet connection'));
        }, 20000);
      });

      // Fetch courses with better error handling
      const { data, error: fetchError } = await Promise.race([
        supabase
          .from('lesson_courses')
          .select('*')
          .order('program_id')
          .order('display_order'),
        timeoutPromise
      ]);

      // Clear timeout immediately on response
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw new Error(fetchError.message || 'Database error occurred');
      }
      
      console.log('Courses loaded successfully:', data?.length || 0);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // More specific error messages
      if (error.message.includes('timeout')) {
        setError('Connection is taking too long. Please check your internet and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Cannot reach the server. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to load courses');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Home
            </Link>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            
            <h1 className="text-2xl font-normal text-gray-900 mb-3">
              Unable to Load Resources
            </h1>
            
            <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
              {error}
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={fetchCourses}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Go Home
              </Link>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Still having trouble? Contact us at{' '}
                <a href="mailto:admin@tftmadrasah.nz" className="text-gray-900 hover:underline">
                  admin@tftmadrasah.nz
                </a>
              </p>
            </div>
          </div>
        </div>
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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-7 w-7" />
              <div className="flex flex-col justify-center leading-tight">
                <span className="text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.005em"}}>The FastTrack</span>
                <span className="text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
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
          {courses.length === 0 ? (
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
