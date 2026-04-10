import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, FileText, Gamepad2, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const areas = [
  {
    title: 'Blog Administration',
    description: 'Create and manage blog posts and content',
    icon: BookOpen,
    href: '/blog/admin',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'hover:border-orange-300'
  },
  {
    title: 'Study Administration',
    description: 'Manage lesson notes, study materials, and assessments',
    icon: FileText,
    href: '/research/admin',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    borderColor: 'hover:border-teal-300'
  },
  {
    title: 'Drill Manager',
    description: 'Create and manage interactive drill decks for all programs',
    icon: Gamepad2,
    href: '/drills/manage',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderColor: 'hover:border-purple-300'
  }
];

export default function AcademicDeanHub() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  return (
    <>
      <Helmet>
        <title>Academic Dean | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <h1 className="text-base font-semibold text-gray-900">Academic Dean</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500">
              Welcome back, <span className="font-medium text-gray-700">{profile?.full_name || 'Academic Dean'}</span>
            </p>
          </div>

          <div className="space-y-3">
            {areas.map((area) => {
              const Icon = area.icon;
              return (
                <Link
                  key={area.href}
                  to={area.href}
                  className={`flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 ${area.borderColor} transition-all group`}
                >
                  <div className={`p-3 rounded-xl ${area.iconBg}`}>
                    <Icon className={`h-6 w-6 ${area.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{area.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{area.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
