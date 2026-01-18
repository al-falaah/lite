import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle, ChevronDown, Mail, Phone, MessageCircle, Heart } from 'lucide-react';

const Programs = () => {
  const [expandedProgram, setExpandedProgram] = useState(null);

  // Stripe donation link from environment variable
  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/dRm28t3WQ4Jacmj6gocAo00.com';

  return (
    <>
      <Helmet>
        <title>Programs - Al-Falāḥ Institute</title>
        <meta
          name="description"
          content="Discover our Tajweed Mastery Program and Essential Arabic & Islamic Studies. Expert-led Islamic education programs designed to transform your understanding of the Qur'an and Arabic language."
        />
      </Helmet>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-8 w-8" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-sm sm:text-base font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm sm:text-base font-brand font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Programs Section */}
      <section className="bg-gray-50 py-16 sm:py-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Our Programs
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the learning path that matches your goals
            </p>
          </div>

          {/* Quick Comparison Table */}
          <div className="mb-12 sm:mb-16 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="p-4 sm:p-5"></div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-200">
                  <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium">
                    TMP
                  </div>
                </div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-200">
                  <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium">
                    EAIS
                  </div>
                </div>
              </div>

              {/* Duration Row */}
              <div className="grid grid-cols-3 border-b border-gray-100">
                <div className="p-4 sm:p-5 flex items-center">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Duration</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Time commitment</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">6 months</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">24 weeks</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">2 years</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">104 weeks</p>
                  </div>
                </div>
              </div>

              {/* Investment Row */}
              <div className="grid grid-cols-3 border-b border-gray-100">
                <div className="p-4 sm:p-5 flex items-center">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Investment</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Program fee</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">$120 NZD</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">One-time</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">$35/month</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">$375/year</p>
                  </div>
                </div>
              </div>

              {/* Focus Row */}
              <div className="grid grid-cols-3">
                <div className="p-4 sm:p-5 flex items-center">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Focus</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Core curriculum</p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 border-l border-gray-100 flex items-center justify-center">
                  <p className="text-xs sm:text-sm text-gray-700 text-center">Tajweed & Quranic Sciences</p>
                </div>
                <div className="p-4 sm:p-5 border-l border-gray-100 flex items-center justify-center">
                  <p className="text-xs sm:text-sm text-gray-700 text-center">Arabic Language & Islamic Studies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Cards Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* TMP Program Card */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track 1</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">6 months</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Tajweed Mastery Program
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.6'}}>
                  برنامج إتقان التجويد
                </p>
                <p className="text-xs text-gray-500 italic">
                  Barnāmij Itqān at-Tajwīd
                </p>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  An intensive 24-week sprint to transform basic reading into expert-level precision. Through a structured curriculum, we focus on mastering Tajweed rules through immediate oral application and rigorous precision drills.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">Our Edge:</span> We go beyond rules by integrating a vital introduction to the Sciences of the Qur'an (<span className="italic">ʿUlūm al-Qurʾān</span>), grounding your recitation in authentic scholarly context.
                  </p>
                </div>

                {/* Key Stats */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">6 months · 24 weeks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">$120 NZD</p>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'tmp' ? null : 'tmp')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100"
                >
                  <span>{expandedProgram === 'tmp' ? 'Hide curriculum details' : 'View curriculum details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'tmp' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'tmp' && (
                  <div className="border-t border-gray-200 pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Objectives</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Mastery from A to Z:</span> Complete command over Tajweed rules through effective, focused instruction.</li>
                        <li> <span className="font-semibold">Scholarly Foundation:</span> Attain essential knowledge of <span className="italic font-serif tracking-wide">&lsquo;Ulūm al-Qur&rsquo;ān</span>.</li>
                        <li> <span className="font-semibold">Primary Text:</span> <span style={{fontFamily: 'Traditional Arabic, serif'}}>تيسير الرحمن في تجويد القرآن</span> | <span className="italic font-serif tracking-wide">Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān</span> (Su'ād 'Abdul-Ḥamīd).</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Precision Schedule (Weekly)</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Session 1 (1 Hour): </span> Primary Instruction & Intensive Drill.</li>
                        <li> <span className="font-semibold">Session 2 (30 mins): </span> Dedicated Follow-up, Oral Assessment, and Mentoring.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Age: </span> 14+ years old</li>
                        <li> <span className="font-semibold">Proficiency: </span> Must be able to read the Qur'anic script fluently but currently lacks the technical knowledge or practical application of Tajweed rules.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Link to="/apply">
                    <button className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                      <span>Apply for TMP</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* EAIS Program Card */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track 2</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">2 years</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Essential Arabic & Islamic Studies
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.6'}}>
                  الدراسات الأساسية في اللغة العربية والعلوم الإسلامية
                </p>
                <p className="text-xs text-gray-500 italic">
                  Ad-Dirāsāt al-Asāsiyyah fīl-Lughah al-ʿArabiyyah wal-ʿUlūm al-Islāmiyyah
                </p>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  A comprehensive 2-year accelerator designed for students ready to bridge the gap between reading script and true comprehension. Our structured curriculum delivers a rigorous foundation in Arabic linguistics—Grammar, Morphology, and Spelling—paired with essential Islamic sciences to build lasting scholarly depth.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">Our Edge:</span> We move beyond isolated language study by integrating Creed (<span className="italic">ʿAqīdah</span>), Jurisprudence (<span className="italic">Fiqh</span>), and Ethics (<span className="italic">Ādāb</span>). Through expert mentoring and systematic textual study, we equip you with the linguistic and spiritual infrastructure to engage directly with the Qur'an and Sunnah.
                  </p>
                </div>

                {/* Key Stats */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">2 years · 104 weeks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">$35/month</p>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'eais' ? null : 'eais')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100"
                >
                  <span>{expandedProgram === 'eais' ? 'Hide curriculum details' : 'View curriculum details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'eais' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'eais' && (
                  <div className="border-t border-gray-200 pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Objectives</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Linguistic Mastery:</span> Achieve intermediate Arabic proficiency through structured study of Grammar (<span className="italic font-serif tracking-wide">An-Naḥw</span>), Morphology (<span className="italic font-serif tracking-wide">Aṣ-Ṣarf</span>), and Spelling (<span className="italic font-serif tracking-wide">Al-Imlā&rsquo;</span>).</li>
                        <li> <span className="font-semibold">Scholarly Foundation:</span> Build sound Islamic knowledge in Creed (<span className="italic font-serif tracking-wide">&lsquo;Aqīdah</span>), Jurisprudence (<span className="italic font-serif tracking-wide">Fiqh</span>), and Ethics (<span className="italic font-serif tracking-wide">Ādāb</span>).</li>
                        <li> <span className="font-semibold">Primary Texts:</span> Engage with classical works including <span style={{fontFamily: 'Traditional Arabic, serif'}}>ألفية ابن مالك</span> (<span className="italic font-serif tracking-wide">Alfiyyat Ibn Mālik</span>), <span style={{fontFamily: 'Traditional Arabic, serif'}}>النحو الواضح</span> (<span className="italic font-serif tracking-wide">An-Naḥw al-Wāḍiḥ</span>), <span style={{fontFamily: 'Traditional Arabic, serif'}}>المنهاج المختصر</span> (<span className="italic font-serif tracking-wide">Al-Minhāj al-Mukhtaṣar</span>), <span style={{fontFamily: 'Traditional Arabic, serif'}}>مجموع عقيدة أهل السنة</span> (<span className="italic font-serif tracking-wide">Majmū&rsquo; &lsquo;Aqīdat Ahlus Sunnah</span>), <span style={{fontFamily: 'Traditional Arabic, serif'}}>الدرر البهية</span> (<span className="italic font-serif tracking-wide">Ad-Durar al-Bahiyyah</span>), and <span style={{fontFamily: 'Traditional Arabic, serif'}}>من آداب الإسلام</span> (<span className="italic font-serif tracking-wide">Min Ādāb al-Islām</span>).</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Precision Schedule (Weekly)</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Session 1 (2 Hours): </span> Primary Instruction & Comprehensive Study.</li>
                        <li> <span className="font-semibold">Session 2 (30 mins): </span> Dedicated Follow-up, Assessment, and Mentoring.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li><span className="font-semibold">Age: </span>14+ years old</li>
                        <li><span className="font-semibold">Proficiency: </span> Must be able to read the Qur'an or Arabic text with ḥarakāt (vowel markings) fluently.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Link to="/apply">
                    <button className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                      <span>Apply for EAIS</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Not sure which program is right for you?
            </p>
            <Link to="/apply">
              <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white font-medium rounded transition-colors text-sm">
                <span>Start Your Application</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Recommended Learning Path Visual */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-8 sm:p-10 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium mb-4">
                  <CheckCircle className="h-4 w-4" />
                  Recommended Path
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                  The Strategic Success Path
                </h3>
                <p className="text-base text-gray-600">
                  For optimal results, we recommend this proven progression
                </p>
              </div>

              {/* Desktop: Horizontal Flow */}
              <div className="hidden md:flex items-center justify-center gap-6 mb-8">
                {/* Step 1: TMP */}
                <div className="flex-1 max-w-xs">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 1</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        6 months
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Tajweed Mastery Program
                    </h4>
                    <p className="text-sm text-gray-600">
                      Build a strong foundation with the Qur'an through precision recitation
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />

                {/* Step 2: EAIS */}
                <div className="flex-1 max-w-xs">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 2</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        2 years
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Essential Arabic & Islamic Studies
                    </h4>
                    <p className="text-sm text-gray-600">
                      Master Arabic linguistics and Islamic sciences for direct comprehension
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Vertical Flow */}
              <div className="md:hidden space-y-4 mb-8">
                {/* Step 1: TMP */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 1</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      6 months
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tajweed Mastery Program
                  </h4>
                  <p className="text-sm text-gray-600">
                    Build a strong foundation with the Qur'an through precision recitation
                  </p>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="h-8 w-0.5 bg-gray-300"></div>
                </div>

                {/* Step 2: EAIS */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 2</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      2 years
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Essential Arabic & Islamic Studies
                  </h4>
                  <p className="text-sm text-gray-600">
                    Master Arabic linguistics and Islamic sciences for direct comprehension
                  </p>
                </div>
              </div>

              {/* Why This Path */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                  Why This Progression Works
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Starting with TMP establishes your spiritual connection to the Qur'an through perfected recitation. This 6-month foundation primes your mind and heart for the intensive 2-year EAIS journey, where you'll gain the linguistic tools to engage directly with Revelation. This sequential approach maximizes retention and prevents cognitive overload.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/favicon-white.svg"
                  alt="Al-Falaah Logo"
                  className="h-8 w-8"
                />
                <div>
                  <div className="flex flex-col leading-none -space-y-1">
                    <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                    <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Authentic Islamic education rooted in the Qur'an and Sunnah
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/programs" className="text-gray-400 hover:text-white">Programs</Link></li>
                <li><Link to="/apply" className="text-gray-400 hover:text-white">Apply Now</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Support Our Mission
                  </a>
                </li>
                <li><Link to="/vacancies" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li className="pt-2 border-t border-emerald-900">
                  <Link to="/student" className="text-gray-500 hover:text-gray-300 text-xs">Student Portal</Link>
                </li>
                <li>
                  <Link to="/teacher" className="text-gray-500 hover:text-gray-300 text-xs">Teacher Portal</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm mb-4">
                Questions about our programs?
              </p>
              <div className="space-y-2">
                <a href="mailto:salam@tftmadrasah.nz" className="text-gray-300 hover:text-white text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  salam@tftmadrasah.nz
                </a>
                <a href="tel:+64272131486" className="text-gray-300 hover:text-white text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +6427 213 1486
                </a>
                <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  +6422 465 3509
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-900 pt-8 text-center text-sm text-emerald-200/60">
            <p>© {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Programs;
