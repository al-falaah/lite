import { Link } from 'react-router-dom';
import { Briefcase, Mail, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const VacanciesPage = () => {
  // Add your job vacancies here
  const vacancies = [
    // Example vacancy structure (currently empty):
    // {
    //   id: 1,
    //   role: "Islamic Studies Teacher",
    //   description: "We are seeking a qualified Islamic Studies teacher to join our team...",
    //   responsibilities: [
    //     "Teach Quran and Tajweed to students",
    //     "Prepare and deliver engaging lessons",
    //     "Monitor student progress and provide feedback"
    //   ]
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-8 w-8 md:h-10 md:w-10"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link to="/">
              <button className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Career Opportunities
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our team of dedicated educators in providing authentic Islamic education
            </p>
          </div>

          {/* Vacancies List */}
          {vacancies.length > 0 ? (
            <div className="space-y-6">
              {vacancies.map((vacancy) => (
                <div
                  key={vacancy.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100 hover:shadow-xl transition-shadow"
                >
                  <div className="p-6 md:p-8">
                    {/* Role */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {vacancy.role}
                    </h2>

                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {vacancy.description}
                      </p>
                    </div>

                    {/* Responsibilities */}
                    {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Responsibilities
                        </h3>
                        <ul className="space-y-2">
                          {vacancy.responsibilities.map((responsibility, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-1">•</span>
                              <span className="text-gray-600">{responsibility}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contact Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <a
                        href="mailto:admin@tftmadrasah.nz?subject=Application for {vacancy.role}"
                        className="inline-block"
                      >
                        <Button
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                        >
                          <Mail className="h-5 w-5" />
                          Apply Now
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // No vacancies available
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center border border-emerald-100">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                <Briefcase className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Current Vacancies
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                We don't have any open positions at the moment, but we're always looking for passionate educators.
                Feel free to send your CV and we'll keep it on file for future opportunities.
              </p>
              <a
                href="mailto:admin@tftmadrasah.nz?subject=General Application - The FastTrack Madrasah"
                className="inline-block"
              >
                <Button
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Send General Application
                </Button>
              </a>
            </div>
          )}

          {/* Contact Information */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-2">
              Questions about working with us?
            </p>
            <a
              href="mailto:admin@tftmadrasah.nz"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              admin@tftmadrasah.nz
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Authentic Islamic Education Rooted in the Qur'an and Sunnah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VacanciesPage;
