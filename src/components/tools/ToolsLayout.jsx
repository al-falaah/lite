import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

function ToolsLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/tools';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Nav — matches Blog/main app pattern */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/tools" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="The FastTrack Logo"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs sm:text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs sm:text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              {!isHome && (
                <Link
                  to="/tools"
                  className="text-sm text-gray-600 hover:text-emerald-600 transition-colors py-1"
                >
                  All Tools
                </Link>
              )}
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Main Site</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5 sm:space-y-2">
          <p className="text-sm text-gray-500">
            A sadaqah jaariyah from{' '}
            <a
              href="https://www.tftmadrasah.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              The FastTrack Madrasah
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Quranic data provided by{' '}
            <a
              href="https://dev.surahapp.com/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:underline"
            >
              Surah App API
            </a>
            {' '}by the{' '}
            <a
              href="https://tafsir.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:underline"
            >
              Tafsir Center for Qur'anic Studies
            </a>
            , discovered via{' '}
            <a
              href="https://itqan.dev/en/tools/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:underline"
            >
              Itqan.dev
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ToolsLayout;
