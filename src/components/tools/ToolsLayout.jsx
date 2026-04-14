import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/tools', label: 'Home', icon: Home },
  { path: '/tools/examples', label: 'Examples Finder', icon: Search },
];

function ToolsLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/tools" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                TFT Madrasah
              </span>
              <span className="text-[10px] text-gray-500 block -mt-0.5">Tools</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            A <span className="font-arabic text-sm">صدقة جارية</span> (sadaqah jaariyah) from{' '}
            <a
              href="https://www.tftmadrasah.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              The FastTrack Madrasah
            </a>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Quranic data sourced from Surah App. All tools are free to use.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ToolsLayout;
