import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const StorePage = () => {
  return (
    <>
      <Helmet>
        <title>Store - Coming Soon | The FastTrack Madrasah</title>
        <meta name="description" content="Islamic store for madrasah books and souvenirs coming soon to The FastTrack Madrasah" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-30 rounded-full"></div>
              <div className="relative bg-white p-6 rounded-full shadow-xl">
                <BookOpen className="h-16 w-16 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Store Coming Soon
          </h1>

          {/* Subheading */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <p className="text-xl text-emerald-700 font-semibold">
              In Shā'a Allāh
            </p>
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            We're working on bringing you a curated collection of Islamic books and madrasah souvenirs to support your learning journey.
            Stay tuned for quality resources and meaningful items.
          </p>

          {/* Features Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">What to Expect</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Carefully selected books on Tajweed and Quranic sciences</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Arabic language learning resources</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Islamic Studies books for all levels</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Madrasah souvenirs and meaningful items</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                </div>
                <span>Easy online ordering and secure payment</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default StorePage;
