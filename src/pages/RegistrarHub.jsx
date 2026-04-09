import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, ShoppingBag, LogOut, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const areas = [
  {
    title: 'School Administration',
    description: 'Manage students, teachers, applications, schedules, and certificates',
    icon: GraduationCap,
    href: '/admin',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'hover:border-blue-300'
  },
  {
    title: 'Store Administration',
    description: 'Manage products, orders, and deliveries',
    icon: ShoppingBag,
    href: '/store/admin',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'hover:border-emerald-300'
  }
];

export default function RegistrarHub() {
  const { profile, signOut } = useAuth();

  return (
    <>
      <Helmet>
        <title>Registrar | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="TFT Madrasah" className="h-7 w-7" />
                <h1 className="text-base font-semibold text-gray-900">Registrar</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  <Home className="h-4 w-4" />
                </Link>
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
              Welcome back, <span className="font-medium text-gray-700">{profile?.full_name || 'Registrar'}</span>
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
