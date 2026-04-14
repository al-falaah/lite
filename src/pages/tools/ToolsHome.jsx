import { Link } from 'react-router-dom';

const TOOLS = [
  {
    path: '/tools/examples',
    title: 'Quranic Examples Finder',
    description: 'Search for tajweed and grammar topics and see real examples from the Quran with highlighted references.',
    status: 'live',
  },
];

function ToolsHome() {
  return (
    <>
      {/* Header — matches Blog page pattern */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <h1 className="text-2xl sm:text-4xl font-semibold text-gray-900 mb-2 sm:mb-3 tracking-tight">
            Learning Tools
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl">
            Free tools to help you study tajweed, Arabic grammar, and morphology through the Quran.
          </p>
        </div>
      </div>

      {/* Tools list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="block bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:border-emerald-300 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{tool.title}</h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{tool.description}</p>
              <span className="text-emerald-600 text-sm font-medium mt-2 sm:mt-3 inline-block">
                Open &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default ToolsHome;
