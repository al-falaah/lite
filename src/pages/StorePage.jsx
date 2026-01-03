import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const StorePage = () => {
  return (
    <>
      <Helmet>
        <title>Store - Coming Soon | The FastTrack Madrasah</title>
        <meta name="description" content="Islamic store for madrasah books and souvenirs coming soon to The FastTrack Madrasah" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-30 rounded-full"></div>
              <div className="relative bg-white p-4 sm:p-6 rounded-full shadow-xl">
                <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Store Coming Soon
          </h1>

          {/* Subheading */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            <p className="text-lg sm:text-xl text-emerald-700 font-semibold">
              In Shā'a Allāh
            </p>
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto px-4">
            We're working on bringing you a curated collection of Islamic books and madrasah souvenirs to support your learning journey.
            Stay tuned for quality resources and meaningful items.
          </p>

          {/* Features Preview */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-left mx-4 sm:mx-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center">What to Expect</h2>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Carefully selected books on Tajweed and Quranic sciences</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Arabic language learning resources</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Islamic Studies books for all levels</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Madrasah souvenirs and meaningful items</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Easy online ordering and secure payment</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg hover:shadow-xl text-sm sm:text-base mx-4 sm:mx-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default StorePage;
