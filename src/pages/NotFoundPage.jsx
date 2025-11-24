import { Link } from 'react-router-dom';
import { Home, Search, BookOpen } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50/30 to-white flex items-center justify-center px-4">
      {/* Islamic Geometric Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23059669' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="max-w-2xl w-full text-center relative">
        {/* Arabic Calligraphy Decoration */}
        <div className="text-9xl text-emerald-600/10 font-arabic select-none mb-4">
          404
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-12">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-full mb-6">
            <Search className="h-10 w-10 text-emerald-600" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-700 to-amber-600 bg-clip-text text-transparent">
              Page Not Found
            </span>
          </h1>

          {/* Arabic Text */}
          <p className="text-emerald-700 font-arabic text-2xl mb-6">
            الصفحة غير موجودة
          </p>

          {/* Description */}
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/30"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </Link>

            <Link to="/apply">
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Apply Now
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
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
                to="/payment"
                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Payment Upload
              </Link>
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

        {/* Footer Text */}
        <p className="mt-8 text-sm text-gray-500">
          © {new Date().getFullYear()} Al-Falaah Academy • New Zealand
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
