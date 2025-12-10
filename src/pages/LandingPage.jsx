import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, ExternalLink, GraduationCap, Heart, Star, ArrowRight, CheckCircle, Sparkles, Menu, X } from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  // Replace this with your actual Google Form URL
  const TAFSEER_COURSE_FORM_URL = "https://forms.google.com/your-form-link-here";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Elegant & Minimal */}
      <nav className="bg-white/98 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-amber-600 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-emerald-600 to-amber-600 p-2 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 bg-clip-text text-transparent">
                  Al-Falaah
                </span>
                <span className="text-xs text-gray-600 -mt-1 font-arabic">الفلاح - Success</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-3">
              <Link to="/student">
                <Button variant="outline" size="md" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap">
                  Student Portal
                </Button>
              </Link>
              <a href="#essentials-program">
                <Button variant="outline" size="md" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap">
                  2-Year Program
                </Button>
              </a>
              <Link to="/apply">
                <Button variant="primary" size="md" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/30 whitespace-nowrap">
                  Apply Now
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-amber-100">
              <div className="flex flex-col gap-3">
                <Link to="/student" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    Student Portal
                  </Button>
                </Link>
                <a href="#essentials-program" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    2-Year Program
                  </Button>
                </a>
                <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/30">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Islamic & Modern */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-amber-50/30 to-white py-24 md:py-32">
        {/* Islamic Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23059669' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Decorative Arabic Calligraphy */}
        <div className="absolute top-20 right-10 text-8xl text-emerald-600/5 font-arabic select-none">
          بسم الله
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Basmala */}
          <div className="mb-8">
            <div className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600/10 to-amber-600/10 rounded-full border border-emerald-600/20">
              <p className="text-emerald-800 font-semibold text-lg tracking-wide font-arabic">
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
              </p>
            </div>
          </div>

          {/* Main Heading - Elegant Typography */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 sm:mb-8 leading-tight px-4">
            <span className="bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 bg-clip-text text-transparent block mb-2">
              Your Journey to
            </span>
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-amber-600 bg-clip-text text-transparent block">
              Islamic Excellence
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 mb-4 max-w-4xl mx-auto leading-relaxed font-light px-4">
            Authentic Knowledge • Personal Growth • Lifelong Impact
          </p>

          <p className="text-base sm:text-lg text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto italic px-4">
            "Seek knowledge from the cradle to the grave" - Prophet Muhammad ﷺ
          </p>

          {/* Dual Offering Cards - Premium Design */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
            {/* FREE Tafseer Course - Elegant Card */}
            <div className="group bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-100 p-6 sm:p-8 md:p-10 hover:shadow-3xl hover:border-emerald-200 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>

              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-600/30">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>

                <div className="inline-block px-4 py-1.5 bg-emerald-600 text-white text-sm font-bold rounded-full mb-4 shadow-md">
                  100% FREE
                </div>

                <h3 className="text-3xl font-bold text-gray-900 mb-4">Weekly Tafseer</h3>

                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Unlock the profound wisdom of the Qur'an through expert-guided Tafseer sessions in a supportive community
                </p>

                <ul className="text-left space-y-3 mb-8">
                  {[
                    'Live weekly sessions',
                    'Community discussion',
                    'Q&A with scholars',
                    'No commitment required'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={TAFSEER_COURSE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" size="lg" className="w-full border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold">
                    Join Free Course
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>

            {/* 2-Year Essentials - Premium Card */}
            <div className="group relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 text-white hover:shadow-3xl transition-all duration-300 overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-5 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-block px-4 py-1.5 bg-amber-400 text-emerald-900 text-sm font-bold rounded-full shadow-md">
                    FLAGSHIP PROGRAM
                  </div>
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>

                <h3 className="text-3xl font-bold mb-4">2-Year Islamic Essentials</h3>

                <p className="text-emerald-50 mb-6 text-lg leading-relaxed">
                  Comprehensive, personalized curriculum covering the foundations every Muslim should know
                </p>

                <ul className="text-left space-y-3 mb-8">
                  {[
                    'One-on-one personalized instruction',
                    'Flexible scheduling (2 sessions/week)',
                    'Quran, Hadith, Fiqh, Aqeedah and more',
                    'Progress at your own pace'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">$300<span className="text-xl font-normal">/year</span></div>
                    <div className="text-emerald-100 text-sm">Full payment or up to 4 installments per year</div>
                  </div>
                </div>

                <Link to="/apply" className="block">
                  <Button variant="secondary" size="lg" className="w-full bg-white text-emerald-700 hover:bg-gray-50 font-semibold shadow-lg">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Year Program Details - Modern Islamic Design */}
      <section id="essentials-program" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-sm mb-6 border border-emerald-200">
              COMPREHENSIVE ISLAMIC EDUCATION
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your <span className="bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">Deen</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A structured 2-year journey through the essential knowledge every Muslim needs,
              taught with care, wisdom, and modern pedagogy
            </p>
          </div>

          {/* Perfect For - Islamic Cards */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Who Will Benefit Most?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: 'New Muslims',
                  desc: 'Build a comprehensive foundation with patient, expert guidance through your journey',
                  gradient: 'from-emerald-500 to-emerald-600'
                },
                {
                  icon: BookOpen,
                  title: 'Lifelong Seekers',
                  desc: 'Deepen your understanding and fill knowledge gaps with structured, authentic learning',
                  gradient: 'from-emerald-600 to-teal-600'
                },
                {
                  icon: Heart,
                  title: 'Parents & Educators',
                  desc: 'Equip yourself to guide your family with confidence in authentic Islamic practice',
                  gradient: 'from-teal-600 to-emerald-700'
                }
              ].map((item, i) => (
                <div key={i} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum - Modern Grid */}
          <div className="bg-gradient-to-br from-emerald-50 to-amber-50/30 rounded-3xl p-12 mb-20 border border-emerald-100">
            <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center">What You'll Master</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { subject: "Qur'anic Studies & Tafseer", icon: '📖' },
                { subject: 'Hadith Sciences & Authentication', icon: '📜' },
                { subject: 'Islamic Jurisprudence (Fiqh)', icon: '⚖️' },
                { subject: 'Aqeedah (Creed & Theology)', icon: '☪️' },
                { subject: 'Seerah (Prophetic Biography)', icon: '🕌' },
                { subject: 'Islamic History & Civilization', icon: '🏛️' },
                { subject: 'Arabic Language Essentials', icon: '🔤' },
                { subject: 'Contemporary Fiqh Issues', icon: '💡' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all group">
                  <div className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="flex-1">
                    <span className="text-gray-800 font-semibold text-lg">{item.subject}</span>
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Features - Icon Grid */}
          <div className="grid md:grid-cols-3 gap-10 mb-16">
            {[
              { icon: Calendar, title: 'Your Schedule', desc: '2 weekly sessions (90min + 30min) at times that work for you' },
              { icon: Video, title: 'Personal Attention', desc: 'One-on-one instruction adapted to your learning style' },
              { icon: Star, title: 'Expert Scholars', desc: 'Learn from qualified instructors with deep Islamic knowledge' }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-5 group-hover:scale-110 transition-transform shadow-xl shadow-emerald-600/30">
                  <item.icon className="h-10 w-10 text-white" />
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA - Premium */}
          <div className="text-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent"></div>
            <div className="relative">
              <h3 className="text-3xl font-bold mb-4">Begin Your Transformation Today</h3>
              <div className="text-6xl font-bold mb-3">$300 <span className="text-3xl font-normal">/year</span></div>
              <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
                Full payment or up to 4 installments per year • Personalized learning journey • Invest in your Akhirah
              </p>
              <Link to="/apply">
                <Button variant="secondary" size="lg" className="bg-white text-emerald-700 hover:bg-gray-50 font-semibold text-lg px-10 py-4 shadow-xl">
                  Apply Now
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story - Elegant & Islamic */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Why <span className="font-arabic text-emerald-700">Al-Falaah</span>?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-600 to-amber-600 mx-auto rounded-full"></div>
          </div>

          <div className="prose prose-xl max-w-none">
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50/30 rounded-3xl p-10 mb-10 border-l-4 border-emerald-600">
              <p className="text-2xl text-gray-800 leading-relaxed mb-0 italic">
                "The best of you are those who learn the Qur'an and teach it."
              </p>
              <p className="text-emerald-700 font-semibold mt-4 mb-0">— Prophet Muhammad ﷺ (Sahih Bukhari)</p>
            </div>

            <p className="text-xl leading-relaxed text-gray-700 mb-6">
              <span className="font-bold text-emerald-700 text-2xl">Al-Falaah</span> (الفلاح - Success) was born from a profound conviction:
              every Muslim deserves access to authentic Islamic knowledge that transforms not just minds, but hearts and souls.
            </p>

            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              In an age of information overload, we recognized the critical need for wisdom rooted in the Qur'an and Sunnah,
              guided by the understanding of the Salaf us-Salih (righteous predecessors). Our approach honors traditional
              Islamic scholarship while embracing modern pedagogical excellence.
            </p>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 my-10">
              <p className="text-lg italic text-gray-700 mb-4 leading-relaxed">
                "We envision a generation of Muslims deeply connected to their faith, equipped with authentic knowledge,
                and empowered to live Islam with confidence and wisdom in every aspect of life."
              </p>
              <p className="text-emerald-700 font-bold mb-0">— Founder, Al-Falaah Academy</p>
            </div>

            <p className="text-lg leading-relaxed text-gray-600">
              Your journey is unique, and so is our approach. We don't just teach—we mentor, guide, and walk alongside
              you on the path to Islamic excellence. This is education with purpose, learning with impact, and knowledge
              that lasts a lifetime and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* Current Students Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-amber-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Current Students
            </h2>
            <p className="text-lg text-gray-600">
              Access your schedule, track progress, and manage your subscription
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Portal Card */}
            <Link to="/student">
              <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-600/30">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    Student Portal
                  </h3>
                  <p className="text-gray-600 mb-4 flex-grow">
                    View your class schedule, track your progress, and access your weekly class meeting links using your 6-digit student ID.
                  </p>
                  <div className="flex items-center text-emerald-700 font-semibold group-hover:translate-x-2 transition-transform">
                    Access Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Stripe Customer Portal Card */}
            <a
              href="https://billing.stripe.com/p/login/dRm28t3WQ4Jacmj6gocAo00"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                    <ExternalLink className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                    Manage Subscription
                  </h3>
                  <p className="text-gray-600 mb-4 flex-grow">
                    Update payment methods, view billing history, manage installments, or update your subscription details.
                  </p>
                  <div className="flex items-center text-blue-700 font-semibold group-hover:translate-x-2 transition-transform">
                    Billing Portal
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Modern Islamic */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-600 to-amber-600 p-2 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Al-Falaah</div>
                  <div className="text-sm text-gray-400 font-arabic">الفلاح</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Authentic Islamic education for the modern Muslim, rooted in the Qur'an and Sunnah.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/apply" className="text-gray-400 hover:text-emerald-400 transition-colors">Apply Now</Link></li>
                <li><Link to="/student" className="text-gray-400 hover:text-emerald-400 transition-colors">Student Portal</Link></li>
                <li><a href="#essentials-program" className="text-gray-400 hover:text-emerald-400 transition-colors">2-Year Program</a></li>
                <li><a href={TAFSEER_COURSE_FORM_URL} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition-colors">Free Tafseer Course</a></li>
                <li><Link to="/payment" className="text-gray-400 hover:text-emerald-400 transition-colors">Submit Payment</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4">Get in Touch</h3>
              <p className="text-gray-400 mb-4">
                Questions about our programs? We're here to help guide you on your journey.
              </p>
              <a href="mailto:info@alfalaah.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                info@alfalaah.com
              </a>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Al-Falaah Academy. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm italic font-arabic">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
