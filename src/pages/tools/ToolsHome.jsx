import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const TOOLS = [
  {
    path: '/tools/examples',
    title: 'Shawaahid',
    description: "Qur'anic Examples Finder — Search for any tajweed or grammar topic and see real Qur'anic examples with scholar-annotated references.",
    status: 'live',
  },
  {
    path: '/tools/roots',
    title: 'Tasreef',
    description: "Root Word Explorer — Enter any Arabic word or root letters to explore its morphology — root, pattern, derived forms, and every Qur'anic occurrence.",
    status: 'live',
  },
  {
    path: '/tools/pages',
    title: 'Safha',
    description: "Qur'an Page Insights — Scholar-curated benefits and lessons from every page of the Qur'an (604 pages), with English translation.",
    status: 'live',
  },
];

function ToolsHome() {
  return (
    <>
      <Helmet>
        <title>Free Qur'anic Learning Tools | The FastTrack Madrasah</title>
        <meta name="description" content="Free tools for studying tajweed, Arabic grammar, and Qur'anic morphology — Shawaahid (examples finder), Tasreef (root explorer), and Safha (page insights)." />
      </Helmet>
      {/* Header — matches Blog page pattern */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
            Learning Tools
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Free tools to help you study tajweed, Arabic grammar, and morphology through the Qur'an.
          </p>
        </div>
      </div>

      {/* Tools list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <h2 className="font-semibold text-gray-900 mb-1">{tool.title}</h2>
              <p className="text-sm text-gray-600">{tool.description}</p>
              <span className="text-emerald-600 text-sm font-medium mt-3 inline-block">
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
