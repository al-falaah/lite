import { Link } from 'react-router-dom';
import { Search, BookOpen, Sparkles } from 'lucide-react';

const TOOLS = [
  {
    path: '/tools/examples',
    title: 'Quranic Examples Finder',
    titleAr: 'باحث الأمثلة القرآنية',
    description: 'Search for tajweed, nahw (grammar), and sarf (morphology) topics and find real examples from the Quran with highlighted references and brief English explanations.',
    icon: Search,
    status: 'live',
  },
  {
    path: '#',
    title: 'More tools coming soon',
    titleAr: 'المزيد قريبًا',
    description: 'We\'re building more free Quranic learning tools. Stay tuned!',
    icon: Sparkles,
    status: 'coming',
  },
];

function ToolsHome() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          Free Quranic Learning Tools
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          The FastTrack Madrasah Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Powerful, free tools to help you learn tajweed, Arabic grammar, and morphology
          through real examples from the Quran.
        </p>
        <p className="font-arabic text-xl text-emerald-700 mt-4" dir="rtl">
          أدوات مجانية لتعلم القرآن الكريم
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isLive = tool.status === 'live';

          const content = (
            <div
              className={`rounded-xl border p-6 transition-all ${
                isLive
                  ? 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md cursor-pointer'
                  : 'border-dashed border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isLive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`font-semibold ${isLive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {tool.title}
                  </h2>
                  {isLive && (
                    <p className="font-arabic text-sm text-gray-500 mt-0.5" dir="rtl">
                      {tool.titleAr}
                    </p>
                  )}
                  <p className={`text-sm mt-2 ${isLive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {tool.description}
                  </p>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium mt-3">
                      Open tool
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          return isLive ? (
            <Link key={tool.path} to={tool.path}>
              {content}
            </Link>
          ) : (
            <div key={tool.path}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

export default ToolsHome;
