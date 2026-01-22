import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle, ChevronDown, Mail, Phone, MessageCircle, Heart } from 'lucide-react';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const Programs = () => {
  const [expandedProgram, setExpandedProgram] = useState(null);

  // Get program configs (ordered: QARI Track 1, TMP Track 2, EASI Track 3)
  const qari = PROGRAMS[PROGRAM_IDS.QARI];
  const tajweed = PROGRAMS[PROGRAM_IDS.TAJWEED];
  const essentials = PROGRAMS[PROGRAM_IDS.ESSENTIALS];

  // Stripe donation link from environment variable
  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/dRm28t3WQ4Jacmj6gocAo00.com';

  return (
    <>
      <Helmet>
        <title>Programs - The FastTrack Madrasah</title>
        <meta
          name="description"
          content="Discover our Beginner friendly Qur'an & Arabic Reading Literacy, Tajweed Mastery Program and Essential Arabic & Islamic Studies. Expert-led Islamic education programs designed to transform your understanding of the Qur'an and Arabic language."
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

          {/* Quick Comparison - Mobile Cards / Desktop Table */}
          <div className="mb-12 sm:mb-16 max-w-6xl mx-auto">
            {/* Mobile View: Stacked Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {/* QARI Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">QARI</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Beginner</span>
                  </div>
                  <span className="text-xs text-gray-500">Track 1</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-semibold text-gray-900">{qari.duration.display}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Investment</span>
                    <span className="text-sm font-semibold text-gray-900">{qari.pricing.displayPrice}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Focus</span>
                    <span className="text-sm text-gray-700 text-right max-w-[60%]">{qari.focus}</span>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'qari-mobile' ? null : 'qari-mobile')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100 mt-4"
                >
                  <span>{expandedProgram === 'qari-mobile' ? 'Hide details' : 'View details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'qari-mobile' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'qari-mobile' && (
                  <div className="border-t border-gray-200 pt-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Program Header */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm">{qari.name}</h4>
                      <p className="text-base text-emerald-900 mb-3 leading-loose" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl'}}>
                        {qari.arabicName}
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        {qari.description}
                      </p>
                      <div className="bg-white rounded-md p-3 border border-emerald-200">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-emerald-700">💡 Our Edge:</span> {qari.ourEdge}
                        </p>
                      </div>
                    </div>

                    {/* Program Objectives */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-emerald-600">🎯</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Program Objectives</h4>
                      </div>
                      <div className="space-y-2.5">
                        {qari.objectives.map((obj, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                            <p className="text-xs text-gray-700 flex-1">
                              <span className="font-semibold text-gray-900">{obj.title}:</span> {obj.description}
                            </p>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Primary Text:</span> <span className="text-sm" style={{fontFamily: 'Traditional Arabic, serif'}}>{qari.primaryText.arabic}</span> <span className="text-gray-500">|</span> <span className="italic font-serif tracking-wide text-gray-600">{qari.primaryText.transliteration}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-blue-600">📅</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Weekly Schedule</h4>
                      </div>
                      <div className="space-y-2.5">
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 1 <span className="text-blue-600">({qari.schedule.session1.duration})</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">{qari.schedule.session1.description}</p>
                        </div>
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 2 <span className="text-blue-600">({qari.schedule.session2.duration})</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">{qari.schedule.session2.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-amber-600">✓</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Prerequisites</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Age:</span> {qari.prerequisites.age}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Proficiency:</span> {qari.prerequisites.proficiency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <Link to="/apply">
                        <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                          <span>Apply for QARI</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* TMP Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">TMP</span>
                  <span className="text-xs text-gray-500">Track 2</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-semibold text-gray-900">{tajweed.duration.display}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Investment</span>
                    <span className="text-sm font-semibold text-gray-900">{tajweed.pricing.displayPrice}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Focus</span>
                    <span className="text-sm text-gray-700 text-right max-w-[60%]">Tajweed & Qur'anic Sciences</span>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'tmp-mobile' ? null : 'tmp-mobile')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100 mt-4"
                >
                  <span>{expandedProgram === 'tmp-mobile' ? 'Hide details' : 'View details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'tmp-mobile' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'tmp-mobile' && (
                  <div className="border-t border-gray-200 pt-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Program Header */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm">Tajweed Mastery Program (TMP)</h4>
                      <p className="text-base text-emerald-900 mb-3 leading-loose" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl'}}>
                        برنامج إتقان التجويد
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        An intensive 24-week sprint to transform basic reading into expert-level precision. Through a structured curriculum, we focus on mastering Tajweed rules through immediate oral application and rigorous precision drills.
                      </p>
                      <div className="bg-white rounded-md p-3 border border-emerald-200">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-emerald-700">💡 Our Edge:</span> We go beyond rules by integrating a vital introduction to the Sciences of the Qur'an (<span className="italic">ʿUlūm al-Qurʾān</span>), grounding your recitation in authentic scholarly context.
                        </p>
                      </div>
                    </div>

                    {/* Program Objectives */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-emerald-600">🎯</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Program Objectives</h4>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex gap-2">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Mastery from A to Z:</span> Complete command over Tajweed rules through effective, focused instruction.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Scholarly Foundation:</span> Attain essential knowledge of <span className="italic font-serif tracking-wide">&lsquo;Ulūm al-Qur&rsquo;ān</span>.
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Primary Text:</span> <span className="text-sm" style={{fontFamily: 'Traditional Arabic, serif'}}>تيسير الرحمن في تجويد القرآن</span> <span className="text-gray-500">|</span> <span className="italic font-serif tracking-wide text-gray-600">Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān</span> <span className="text-gray-600">(Su'ād 'Abdul-Ḥamīd)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-blue-600">📅</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Precision Schedule (Weekly)</h4>
                      </div>
                      <div className="space-y-2.5">
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 1 <span className="text-blue-600">(1 Hour)</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">Primary Instruction & Intensive Drill.</p>
                        </div>
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 2 <span className="text-blue-600">(30 mins)</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">Dedicated Follow-up, Oral Assessment, and Mentoring.</p>
                        </div>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-amber-600">✓</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Prerequisites</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Age:</span> 14+ years old</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Proficiency:</span> Must be able to read the Qur'anic script fluently but currently lacks the technical knowledge or practical application of Tajweed rules.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <Link to="/apply">
                        <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                          <span>Apply for TMP</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* EASI Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">EASI</span>
                  <span className="text-xs text-gray-500">Track 3</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-semibold text-gray-900">{essentials.duration.display}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Investment</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{essentials.pricing.displayPriceMonthly}</span>
                      <span className="text-xs text-gray-500 block">{essentials.pricing.displayPriceAnnual}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Focus</span>
                    <span className="text-sm text-gray-700 text-right max-w-[60%]">Arabic Language & Islamic Studies</span>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'easi-mobile' ? null : 'easi-mobile')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100 mt-4"
                >
                  <span>{expandedProgram === 'easi-mobile' ? 'Hide details' : 'View details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'easi-mobile' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'easi-mobile' && (
                  <div className="border-t border-gray-200 pt-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Program Header */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm">Essential Arabic & Islamic Studies (EASI)</h4>
                      <p className="text-base text-emerald-900 mb-3 leading-loose" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl'}}>
                        الدراسات الأساسية في اللغة العربية والعلوم الإسلامية
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        A comprehensive 2-year accelerator designed for students ready to bridge the gap between reading script and true comprehension. We structured our curriculum to deliver a rigorous foundation in Arabic linguistics and essential Islamic sciences.
                      </p>
                      <div className="bg-white rounded-md p-3 border border-emerald-200">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-emerald-700">💡 Our Edge:</span> Beyond isolated language study, we integrate Creed (<span className="italic">ʿAqīdah</span>), Jurisprudence (<span className="italic">Fiqh</span>), and Ethics (<span className="italic">Ādāb</span>). Expert mentoring for direct engagement with the Qur'an and Sunnah.
                        </p>
                      </div>
                    </div>

                    {/* Program Objectives */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-emerald-600">🎯</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Program Objectives</h4>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex gap-2">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Linguistic Mastery:</span> Achieve intermediate Arabic proficiency through structured study of Grammar (<span className="italic font-serif tracking-wide">An-Naḥw</span>), Morphology (<span className="italic font-serif tracking-wide">Aṣ-Ṣarf</span>), and Spelling (<span className="italic font-serif tracking-wide">Al-Imlā&rsquo;</span>).
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Scholarly Foundation:</span> Build sound Islamic knowledge in Creed (<span className="italic font-serif tracking-wide">&lsquo;Aqīdah</span>), Jurisprudence (<span className="italic font-serif tracking-wide">Fiqh</span>), and Ethics (<span className="italic font-serif tracking-wide">Ādāb</span>).
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <span className="text-emerald-500 text-xs mt-0.5">▪</span>
                          <p className="text-xs text-gray-700 flex-1">
                            <span className="font-semibold text-gray-900">Primary Texts:</span> Engage with classical works including <span className="text-sm" style={{fontFamily: 'Traditional Arabic, serif'}}>ألفية ابن مالك</span> (<span className="italic font-serif tracking-wide text-gray-600">Alfiyyat Ibn Mālik</span>), <span className="text-sm" style={{fontFamily: 'Traditional Arabic, serif'}}>النحو الواضح</span> (<span className="italic font-serif tracking-wide text-gray-600">An-Naḥw al-Wāḍiḥ</span>), and more.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-blue-600">📅</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Precision Schedule (Weekly)</h4>
                      </div>
                      <div className="space-y-2.5">
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 1 <span className="text-blue-600">(2 Hours)</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">Primary Instruction & Comprehensive Study.</p>
                        </div>
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Session 2 <span className="text-blue-600">(30 mins)</span></p>
                          <p className="text-xs text-gray-700 leading-relaxed">Dedicated Follow-up, Assessment, and Mentoring.</p>
                        </div>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-amber-600">✓</span>
                        <h4 className="font-semibold text-gray-900 text-xs">Prerequisites</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Age:</span> 14+ years old</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">•</span>
                          <p className="text-xs text-gray-700 flex-1"><span className="font-semibold text-gray-900">Proficiency:</span> Must be able to read the Qur'an or Arabic text with ḥarakāt (vowel markings) fluently.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <Link to="/apply">
                        <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                          <span>Apply for EASI</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Table Header - Order: QARI, TMP, EASI */}
              <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
                <div className="p-5"></div>
                <div className="p-5 text-center border-l border-gray-200">
                  <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                    QARI
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-200">
                  <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                    TMP
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-200">
                  <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                    EASI
                  </div>
                </div>
              </div>

              {/* Duration Row */}
              <div className="grid grid-cols-4 border-b border-gray-100">
                <div className="p-5 flex items-center">
                  <div>
                    <p className="text-base font-semibold text-gray-900">Duration</p>
                    <p className="text-sm text-gray-500 mt-0.5">Time commitment</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{qari.duration.display}</p>
                    <p className="text-sm text-gray-500 mt-1">{qari.duration.displayWeeks}</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{tajweed.duration.display}</p>
                    <p className="text-sm text-gray-500 mt-1">{tajweed.duration.displayWeeks}</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{essentials.duration.display}</p>
                    <p className="text-sm text-gray-500 mt-1">{essentials.duration.displayWeeks}</p>
                  </div>
                </div>
              </div>

              {/* Investment Row */}
              <div className="grid grid-cols-4 border-b border-gray-100">
                <div className="p-5 flex items-center">
                  <div>
                    <p className="text-base font-semibold text-gray-900">Investment</p>
                    <p className="text-sm text-gray-500 mt-0.5">Program fee</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{qari.pricing.displayPrice}</p>
                    <p className="text-sm text-gray-500 mt-1">{qari.pricing.displayNote}</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{tajweed.pricing.displayPrice}</p>
                    <p className="text-sm text-gray-500 mt-1">{tajweed.pricing.displayNote}</p>
                  </div>
                </div>
                <div className="p-5 text-center border-l border-gray-100 flex items-center justify-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{essentials.pricing.displayPriceMonthly}</p>
                    <p className="text-sm text-gray-500 mt-1">{essentials.pricing.displayPriceAnnual}</p>
                  </div>
                </div>
              </div>

              {/* Focus Row */}
              <div className="grid grid-cols-4">
                <div className="p-5 flex items-center">
                  <div>
                    <p className="text-base font-semibold text-gray-900">Focus</p>
                    <p className="text-sm text-gray-500 mt-0.5">Core curriculum</p>
                  </div>
                </div>
                <div className="p-5 border-l border-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-700 text-center">{qari.focus}</p>
                </div>
                <div className="p-5 border-l border-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-700 text-center">Tajweed & Qur'anic Sciences</p>
                </div>
                <div className="p-5 border-l border-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-700 text-center">Arabic Language & Islamic Studies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Cards Grid - Order: QARI (Track 1), TMP (Track 2), EASI (Track 3) */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* QARI Program Card - Track 1 */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track 1</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{qari.duration.display}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Beginner</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  {qari.name} ({qari.shortName})
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.6'}}>
                  {qari.arabicName}
                </p>
                {/* <p className="text-xs text-gray-500 italic">
                  {qari.transliteration}
                </p> */}
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {qari.description}
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">Our Edge:</span> {qari.ourEdge}
                  </p>
                </div>

                {/* Key Stats */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{qari.duration.display} · {qari.duration.displayWeeks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{qari.pricing.displayPrice}</p>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'qari' ? null : 'qari')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-t border-gray-100"
                >
                  <span>{expandedProgram === 'qari' ? 'Hide curriculum details' : 'View curriculum details'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedProgram === 'qari' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'qari' && (
                  <div className="border-t border-gray-200 pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Objectives</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {qari.objectives.map((obj, idx) => (
                          <li key={idx}><span className="font-semibold">{obj.title}:</span> {obj.description}</li>
                        ))}
                        <li><span className="font-semibold">Primary Text:</span> <span style={{fontFamily: 'Traditional Arabic, serif'}}>{qari.primaryText.arabic}</span> | <span className="italic font-serif tracking-wide">{qari.primaryText.transliteration}</span></li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Schedule (Weekly)</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li><span className="font-semibold">Session 1 ({qari.schedule.session1.duration}):</span> {qari.schedule.session1.description}</li>
                        <li><span className="font-semibold">Session 2 ({qari.schedule.session2.duration}):</span> {qari.schedule.session2.description}</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li><span className="font-semibold">Age:</span> {qari.prerequisites.age}</li>
                        <li><span className="font-semibold">Proficiency:</span> {qari.prerequisites.proficiency}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <Link to="/apply">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                      <span>Apply for QARI</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* TMP Program Card - Track 2 */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track 2</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">6 months</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Tajweed Mastery Program (TMP)
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.6'}}>
                  برنامج إتقان التجويد
                </p>
                {/* <p className="text-xs text-gray-500 italic">
                  Barnāmij Itqān at-Tajwīd
                </p> */}
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
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{tajweed.duration.display} · {tajweed.duration.displayWeeks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{tajweed.pricing.displayPrice}</p>
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
                <div className="px-6 py-4 border-t border-gray-100">
                  <Link to="/apply">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                      <span>Apply for TMP</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* EASI Program Card - Track 3 */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track 3</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">2 years</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Essential Arabic & Islamic Studies (EASI)
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.6'}}>
                  الدراسات الأساسية في اللغة العربية والعلوم الإسلامية
                </p>
                {/* <p className="text-xs text-gray-500 italic">
                  Ad-Dirāsāt al-Asāsiyyah fīl-Lughah al-ʿArabiyyah wal-ʿUlūm al-Islāmiyyah
                </p> */}
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  A comprehensive 2-year accelerator designed for students ready to bridge the gap between reading script and true comprehension.  We structured our curriculum  to deliver a rigorous foundation in Arabic linguistics and essential Islamic sciences.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">Our Edge:</span> Beyond isolated language study, we integrate Creed (<span className="italic">ʿAqīdah</span>), Jurisprudence (<span className="italic">Fiqh</span>), and Ethics (<span className="italic">Ādāb</span>). Expert mentoring for direct engagement with the Qur'an and Sunnah.
                  </p>
                </div>

                {/* Key Stats */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{essentials.duration.display} · {essentials.duration.displayWeeks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{essentials.pricing.displayPriceMonthly}</p>
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
                <div className="px-6 py-4 border-t border-gray-100">
                  <Link to="/apply">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-900 text-white font-medium py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                      <span>Apply for EASI</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom CTA Section */}
          {/* <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Not sure which program is right for you?
            </p>
            <Link to="/apply">
              <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-900 text-white font-medium rounded transition-colors text-sm">
                <span>Start Your Application</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div> */}

          {/* Find Your Path - Clean Selection Guide */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
                Find Your Starting Point
              </h3>
              <p className="text-base text-gray-600 max-w-xl mx-auto">
                Select the option that best describes your current level
              </p>
            </div>

            {/* Selection Cards */}
            <div className="space-y-4">
              {/* Option 1: Absolute Beginner */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:border-emerald-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">1</span>
                      <h4 className="font-semibold text-gray-900">I cannot read Arabic script</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-11">
                      New to Arabic? Start here to learn the alphabet and develop fluent reading skills.
                    </p>
                  </div>
                  <div className="ml-11 sm:ml-0">
                    <Link to="/apply">
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-medium rounded transition-colors">
                        Start with {qari.shortName}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Option 2: Can Read, No Tajweed */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:border-emerald-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">2</span>
                      <h4 className="font-semibold text-gray-900">I can read but lack Tajweed knowledge</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-11">
                      You can read the Qur'an but want to perfect your recitation with proper rules.
                    </p>
                  </div>
                  <div className="ml-11 sm:ml-0">
                    <Link to="/apply">
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-medium rounded transition-colors">
                        Start with {tajweed.shortName}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Option 3: Has Tajweed */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:border-emerald-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">3</span>
                      <h4 className="font-semibold text-gray-900">I have Tajweed and want to study Arabic & Islamic sciences</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-11">
                      Ready to master Arabic grammar, morphology, and foundational Islamic knowledge.
                    </p>
                  </div>
                  <div className="ml-11 sm:ml-0">
                    <Link to="/apply">
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-medium rounded transition-colors">
                        Start with {essentials.shortName}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Path */}
            <div className="mt-10 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4 text-center">The Complete Learning Path</h4>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
                <div className="text-center px-4">
                  <div className="text-lg font-bold text-gray-900">{qari.shortName}</div>
                  <div className="text-xs text-gray-500">{qari.duration.display}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 rotate-90 sm:rotate-0" />
                <div className="text-center px-4">
                  <div className="text-lg font-bold text-gray-900">{tajweed.shortName}</div>
                  <div className="text-xs text-gray-500">{tajweed.duration.display}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 rotate-90 sm:rotate-0" />
                <div className="text-center px-4">
                  <div className="text-lg font-bold text-gray-900">{essentials.shortName}</div>
                  <div className="text-xs text-gray-500">{essentials.duration.display}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Join at any point based on your level. Our admissions process will confirm the right track for you.
              </p>
            </div>

            {/* Contact */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">Need help deciding?</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <a href="mailto:salam@tftmadrasah.nz" className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  salam@tftmadrasah.nz
                </a>
                <a href="tel:+64272131486" className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  +64 27 213 1486
                </a>
                <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
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
                  alt="The FastTrack Madrasah"
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
