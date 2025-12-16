import { Link } from 'react-router-dom';
import { Home, Search, BookOpen, ArrowLeft, Heart } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  // Stripe donation link from environment variable
  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/your-link';

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
              <div className="flex flex-col">
                <span className="text-md md:text-xl font-semibold text-emerald-600">Al-Falaah Academy</span>
              </div>
            </Link>
            <Link to="/">
              <button className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl md:text-[12rem] font-bold text-emerald-600/20 select-none">
              404
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
            <div className="px-8 py-12">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                <Search className="h-10 w-10 text-emerald-600" />
              </div>

              {/* Heading */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Page Not Found
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved. Let's get you back on track.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/" className="inline-block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>

                <Link to="/apply" className="inline-block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Apply Now
                  </Button>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    to="/"
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Home
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link
                    to="/apply"
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Application
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link
                    to="/student"
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Student Portal
                  </Link>
                  <span className="text-gray-300">•</span>
                  <a
                    href={donationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Donate
                  </a>
                  <span className="text-gray-300">•</span>
                  <Link
                    to="/admin"
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Al-Falaah Academy. All rights reserved.
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

export default NotFoundPage;
