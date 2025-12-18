import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart, ChevronDown, ArrowUp } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Background image URL from Supabase with fallback to iStock
  const bgImageUrl = storage.getPublicUrl('payment-documents', 'public/landing-bg.jpg');

  // Stripe donation link from environment variable
  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/your-link';

  const quotes = [
    {
      text: "Whoever follows a path in the pursuit of knowledge, Allah will make a path to Paradise easy for him.",
      source: "Sahih Muslim 2699"
    },
    {
      text: "The best of you are those who learn the Qur'an and teach it.",
      source: "Sahih Bukhari 5027"
    },
    {
      text: "Seeking knowledge is an obligation upon every Muslim.",
      source: "Sunan Ibn Majah 224"
    },
    {
      text: "The superiority of the scholar over the worshipper is like that of the moon on the night when it is full over the rest of the stars.",
      source: "Sunan Abu Dawud 3641"
    }
  ];

  const faqs = [
    {
      question: "How does the class schedule work?",
      answer: "For the 2-Year Essential program, you'll have 2 sessions per week (one 2-hour main session and one 30-minute review session) scheduled at times convenient for you. The Tajweed program also includes 2 weekly sessions (one 1-hour main session and one 30-minute practice session). All classes are one-on-one online via video call."
    },
    {
      question: "What are the fees and payment options?",
      answer: "The 2-Year Essential Arabic & Islamic Studies program costs $25 NZD per month or $275 NZD per year (saving you $25 with annual payment). The Tajweed Program is a one-time payment of $120 NZD for the full 6-month course."
    },
    {
      question: "How do I access my classes after enrolling?",
      answer: "After successful enrollment and payment, you'll receive a welcome email with your Student ID. You can access your personalized student portal using this ID to view your class schedule, meeting links, and track your progress."
    },
    {
      question: "Can I enroll in both programs?",
      answer: "Yes, you can enroll in both programs simultaneously. Many students find that combining the comprehensive Essential program with focused Tajweed training enhances their overall Islamic learning journey."
    },
    {
      question: "What if I need to miss a class?",
      answer: "We understand that life happens. Please contact us in advance if you need to reschedule a session. We'll work with you to find a suitable alternative time within the same week when possible."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full Screen with Background */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-black"
          style={{
            backgroundImage: `url("${bgImageUrl}")`,
          }}
        >
          {/* Diagonal gradient: light top-left to dark bottom-right */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/95 to-black/100"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 backdrop-blur-sm bg-black/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
                <img
                  src="/favicon-white.svg"
                  alt="Al-Falaah Logo"
                  className="h-7 w-7 md:h-10 md:w-10"
                />
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base md:text-xl font-semibold text-white">Al-Falaah Academy</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                <a href="#mission">
                  <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg">
                    Our Mission
                  </button>
                </a>
                <a href="#programs">
                  <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg">
                    Programs
                  </button>
                </a>
                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    Donate
                  </button>
                </a>
                <Link to="/apply">
                  <button className="px-5 py-2 ml-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all hover:scale-105 shadow-lg shadow-emerald-600/30">
                    Apply Now
                  </button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-3 border-t border-white/10 bg-black/20 backdrop-blur-md rounded-b-lg">
                <div className="flex flex-col gap-1">
                  <a href="#mission" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Our Mission
                    </button>
                  </a>
                  <a href="#programs" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Programs
                    </button>
                  </a>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Donate
                    </button>
                  </a>
                  <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 mt-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-lg shadow-emerald-600/30">
                      Apply Now
                    </button>
                  </Link>

                  {/* Portal Links - Secondary */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="px-4 text-xs text-white/60 mb-2 uppercase tracking-wider">Portals</p>
                    <Link to="/student" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left">
                        Student Portal
                      </button>
                    </Link>
                    <Link to="/teacher" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left">
                        Teacher Portal
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Centered Hero Content with Slider and CTA */}
        <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto w-full text-center">
            {/* Quote Slider */}
            <div className="mb-6 md:mb-10">
              <p className="text-emerald-400 font-semibold text-xs md:text-lg mb-2 md:mb-3 font-arabic">
                قال رسول الله ﷺ
              </p>
              <p className="text-lg md:text-2xl lg:text-4xl text-white mb-3 md:mb-4 font-serif leading-tight md:leading-relaxed px-2 md:px-4">
                "{quotes[currentQuote].text}"
              </p>
              <p className="text-xs md:text-base text-gray-200 font-light mb-4 md:mb-6">
                {quotes[currentQuote].source}
              </p>

              {/* Navigation Controls - Minimal Progress Bar */}
              <div className="flex justify-center items-center mb-6 md:mb-8">
                <div className="flex gap-1.5 md:gap-2">
                  {quotes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuote(idx)}
                      className="group relative"
                      aria-label={`Go to quote ${idx + 1}`}
                    >
                      <div className={`h-0.5 md:h-1 w-12 md:w-16 rounded-full transition-all duration-500 ${
                        idx === currentQuote
                          ? 'bg-white'
                          : 'bg-white/20 group-hover:bg-white/40'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div>
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-3 md:mb-10">
                Authentic Islamic Education
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 max-w-3xl mx-auto leading-snug md:leading-normal">
                Master Arabic and Islamic sciences through flexible one-on-one online instruction
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 justify-center">
                <Link to="/apply">
                  <Button variant="primary" size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto text-white">
                    Apply Now
                  </Button>
                </Link>
                <a href="#programs">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto backdrop-blur-sm">
                    View Programs
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Gradient Transition */}
      <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-b from-black via-gray-900/50 to-white"></div>

      {/* Our Mission Section */}
      <section id="mission" className="bg-white py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-16">
            Our Mission
          </h2>

          <div className="space-y-6 text-justify">
            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
              Today, only a small percentage of Muslims worldwide can understand the Arabic language of the Qur'an. While many can recite the words, true comprehension remains out of reach—and as this gap widens, our connection with the divine guidance of the Qur'an and Sunnah weakens.
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
              Traditionally, developing expertise in Qur'anic understanding requires years of dedicated study. In countries like New Zealand and across the Western world, busy lifestyles make such long-term commitments challenging. We need a better solution—one that's both accessible and transformative.
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
             Through years of teaching and mentoring Muslim students in Palmerston North and Tauranga, I've witnessed something remarkable: young learners who can read the Qur'an can understand it when equipped with the right knowledge and skills.
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
              At Al-Falaah Academy, our mission is to bridge this gap. We combine Islamic scholarship with modern technology to deliver carefully curated learning programs that empower Muslims in New Zealand to move beyond basic recitation to genuine understanding. Our goal is clear: to help you engage directly with the Qur'an in Arabic, with minimal reliance on translations.
            </p>
          </div>

          {/* Founder Quote Box */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-emerald-50 to-gray-50 rounded-2xl p-8 sm:p-10 shadow-sm border border-emerald-100">
              {/* Quote Mark */}
              <div className="absolute top-6 left-6 text-6xl font-serif text-emerald-600 opacity-20 leading-none">
                "
              </div>

              <div className="relative">
                {/* Quote Text */}
                <blockquote className="text-xl sm:text-2xl font-light text-gray-800 mb-8 sm:mb-10 leading-relaxed pl-6">
                  This is our purpose, and we ask Allah ('azza wa jalla) to grant us success in helping Muslims reconnect with their faith through authentic, accessible education.
                </blockquote>

                {/* Founder Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pl-6">
                  <img
                    src="/placeholder-founder.svg"
                    alt="Dr Abdulquadri Alaka"
                    className="w-24 h-24 rounded-full object-cover bg-gray-200 ring-4 ring-white shadow-md"
                  />
                  <div className="flex-1">
                    <p className="text-xl">
                      <a
                      href="https://www.linkedin.com/in/aalaka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center font-semibold text-gray-900 mb-1 hover:text-emerald-800 transition-colors group"
                      >
                      Ustadh Abdulquadri Alaka, PhD
                      </a> 
                      </p>
                    <p className="text-base text-gray-600 mb-3">
                      Founder, Al-Falaah Academy
                      </p>
                    {/* <a
                      href="https://www.linkedin.com/in/aalaka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors group"
                    >
                      <span>View LinkedIn</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Help us make authentic Islamic education accessible to all
            </p>
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                <Heart className="h-5 w-5" />
                Support Our Mission
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 text-center mb-16">
            Our Approach
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                01
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Flexible & Personalized Learning
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every student progresses at their own pace. When beneficial, we may group family members or students with similar backgrounds into cohort learning for enhanced engagement and support.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                02
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Islamic Values at the Core
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Beyond teaching Arabic language, we cultivate Islamic character and values. Our curriculum integrates spiritual development with linguistic mastery.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                03
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Accessible Online Delivery
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All classes are conducted via video conferencing, making quality Islamic education accessible wherever you are in New Zealand.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                04
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Grounded in Classical Tradition
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our learning materials are drawn from authentic, time-tested texts from Islamic scholarship. Students actively engage through note-taking and traditional learning methods that have proven effective for centuries.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                05
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Progress Through Assessment
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Regular evaluations throughout your learning journey ensure knowledge retention and help identify areas for growth, solidifying your understanding at each stage.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                06
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Holistic Mentorship
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We don't just teach—we mentor. Our support extends beyond the classroom to guide students in both their spiritual journey and daily life challenges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Programs Section - Mobile-Friendly Accordion */}
      <section id="programs" className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-12 sm:mb-16">
            Our Programs
          </h2>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* EAIS Program Card */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all">
              {/* Always Visible Header */}
              <div className="p-5 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Essential Arabic & Islamic Studies (EAIS)
                </h3>
                <p className="text-sm sm:text-base text-emerald-700 mb-1" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.8'}}>
                  العربية والدراسات الإسلامية الأساسية
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Al-'Arabiyyah wal-Dirāsāt al-Islāmiyyah al-Asāsiyyah
                </p>

                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
                  Equip yourself with intermediate Arabic proficiency and foundational Islamic knowledge in creed, manners, and jurisprudence through comprehensive study of classical texts.
                </p>

                {/* Key Info - Always Visible */}
                <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-emerald-800 font-medium mb-1">Duration</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-900">2 years</p>
                      <p className="text-xs text-emerald-700">104 weeks total</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-800 font-medium mb-1">Investment</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-900">$25 NZD/mo</p>
                      <p className="text-xs text-emerald-700">or $275/year</p>
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'eais' ? null : 'eais')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-emerald-600 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors mb-4"
                >
                  <span>{expandedProgram === 'eais' ? 'Hide Details' : 'View Full Curriculum'}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${expandedProgram === 'eais' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'eais' && (
                  <div className="border-t border-gray-200 pt-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Objectives</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Equip students with intermediate proficiency in Arabic language to enhance their understanding of the Qur'an and Sunnah</li>
                        <li>Build sound Islamic knowledge in creed ('aqīdah), manners (ādāb), and jurisprudence (fiqh)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Structure</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">Two comprehensive courses, each covering multiple integrated subjects:</p>

                      <div className="space-y-3 ml-2 sm:ml-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Course 1: <span style={{fontFamily: 'Traditional Arabic, serif'}}>العربية</span> | Al-'Arabiyyah</p>
                          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>النحو</span> | An-Naḥw (Grammar)</li>
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>الصرف</span> | Aṣ-Ṣarf (Morphology)</li>
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>الإملاء</span> | Al-Imlā' (Spelling & Dictation)</li>
                          </ul>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Course 2: <span style={{fontFamily: 'Traditional Arabic, serif'}}>الإسلامية</span> | Al-Islāmiyyah</p>
                          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>العقيدة</span> | Al-'Aqīdah (Creed)</li>
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>الفقه</span> | Al-Fiqh (Jurisprudence)</li>
                            <li><span style={{fontFamily: 'Traditional Arabic, serif'}}>الآداب</span> | Al-Ādāb (Islamic Manners & Ethics)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Primary Texts</h4>
                      <ul className="text-xs text-gray-600 space-y-1.5">
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>ألفية ابن مالك</span> | Alfiyyat Ibn Mālik</li>
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>النحو الواضح</span> | An-Naḥw al-Wāḍiḥ</li>
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>المنهاج المختصر</span> | Al-Minhāj al-Mukhtaṣar</li>
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>مجموع عقيدة أهل السنة</span> | Majmū' 'Aqīdat</li>
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>الدرر البهية</span> | Ad-Durar al-Bahiyyah</li>
                        <li>• <span style={{fontFamily: 'Traditional Arabic, serif'}}>من آداب الإسلام</span> | Min Ādāb al-Islām</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Class Schedule</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Two sessions per week</li>
                        <li>Long session: 2 hours (primary instruction)</li>
                        <li>Short session: 30 minutes (assessment & homework review)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Must be able to read the Qur'an or Arabic text with ḥarakāt (vowel markings) fluently
                      </p>
                    </div>
                  </div>
                )}

                {/* Enroll Button */}
                <Link to="/apply">
                  <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                    Enroll in EAIS
                  </Button>
                </Link>
              </div>
            </div>

            {/* TMP Program Card */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all">
              {/* Always Visible Header */}
              <div className="p-5 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Tajweed Mastery Program (TMP)
                </h3>
                <p className="text-sm sm:text-base text-emerald-700 mb-1" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.8'}}>
                  برنامج إتقان التجويد
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Barnāmij Itqān at-Tajwīd
                </p>

                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
                  Perfect your Qur'anic recitation through intensive study of tajweed rules, articulation points, and introduction to Qur'anic sciences.
                </p>

                {/* Key Info - Always Visible */}
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-purple-800 font-medium mb-1">Duration</p>
                      <p className="text-base sm:text-lg font-bold text-purple-900">6 months</p>
                      <p className="text-xs text-purple-700">24 weeks total</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-800 font-medium mb-1">Investment</p>
                      <p className="text-base sm:text-lg font-bold text-purple-900">$120 NZD</p>
                      <p className="text-xs text-purple-700">One-time payment</p>
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedProgram(expandedProgram === 'tmp' ? null : 'tmp')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-purple-600 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors mb-4"
                >
                  <span>{expandedProgram === 'tmp' ? 'Hide Details' : 'View Full Curriculum'}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${expandedProgram === 'tmp' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Details */}
                {expandedProgram === 'tmp' && (
                  <div className="border-t border-gray-200 pt-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Program Objectives</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Develop intermediate proficiency in Tajweed (Qur'anic recitation rules)</li>
                        <li> Learn introductory knowledge of Qur'anic Sciences <span style={{fontFamily: 'Traditional Arabic, serif'}}>علوم القرآن</span> | 'Ulūm al-Qur'ān</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Course</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span style={{fontFamily: 'Traditional Arabic, serif'}}>التجويد</span> | At-Tajwīd (Perfecting Qur'anic Recitation)
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Primary Text</h4>
                      <p className="text-xs text-gray-600">
                        <span style={{fontFamily: 'Traditional Arabic, serif'}}>تيسير الرحمن في تجويد القرآن</span> | Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān by Su'ād 'Abdul-Ḥamīd
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Class Schedule</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Two sessions per week</li>
                        <li>Long session: 2 hours (primary instruction)</li>
                        <li>Short session: 30 minutes (assessment & homework review)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Must be able to read the Qur'an but lack knowledge or application of tajweed rules
                      </p>
                    </div>
                  </div>
                )}

                {/* Enroll Button */}
                <Link to="/apply">
                  <Button variant="outline" size="md" className="w-full border-purple-600 text-purple-700 hover:bg-purple-50 mt-4">
                    Enroll in TMP
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Admission Works Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 text-center mb-16">
            How Admission Works
          </h2>

          {/* Mobile: Vertical Layout */}
          <div className="md:hidden space-y-6">
            {/* Step 1 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                1. Apply
              </h3>
              <p className="text-sm text-gray-700">
                Submit your application for one of our programs through our online form.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 2 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                2. Application Review
              </h3>
              <p className="text-sm text-gray-700">
                Our team will review your application and notify you of the outcome within 1-2 weeks. Review may require a short phone interview.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 3 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                3. Secure Your Place
              </h3>
              <p className="text-sm text-gray-700">
                Once approved, complete your enrollment by processing payment securely through Stripe.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 4 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                4. Get Started
              </h3>
              <p className="text-sm text-gray-700">
                You'll be assigned a dedicated tutor, receive your student ID, and gain access to our learning platform with your login credentials.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 5 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                5. Learn & Grow
              </h3>
              <p className="text-sm text-gray-700">
                Attend classes and complete regular assessments as you progress through your program.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 6 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                6. Graduate
              </h3>
              <p className="text-sm text-gray-700">
                Successfully complete your final lesson and graduate from the program.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 7 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                7. Join Our Community
              </h3>
              <p className="text-sm text-gray-700">
                Receive your certificate of completion and become part of the Al-Falaah Academy alumni network.
              </p>
            </div>
          </div>

          {/* Tablet/Desktop: 3-Row Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Row 1: Steps 1-3 */}
            {/* Step 1 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Apply
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Submit your application for one of our programs through our online form.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Application Review
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our team will review your application and notify you of the outcome within 1-2 weeks. Review may require a short phone interview.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Secure Your Place
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Once approved, complete your enrollment by processing payment securely through Stripe.
              </p>
            </div>

            {/* Row 2: Steps 4-6 */}
            {/* Step 4 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Get Started
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You'll be assigned a dedicated tutor, receive your student ID, and gain access to our learning platform with your login credentials.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                5
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Learn & Grow
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Attend classes and complete regular assessments as you progress through your program.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                6
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Graduate
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Successfully complete your final lesson and graduate from the program.
              </p>
            </div>

            {/* Row 3: Step 7 (centered) */}
            {/* Step 7 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm md:col-start-2">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                7
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Join Our Community
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Receive your certificate of completion and become part of the Al-Falaah Academy alumni network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Find answers to common questions about our programs
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === idx ? (
                    <Minus className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Begin Your Learning Journey
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join students worldwide in authentic Islamic education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply">
              <Button variant="secondary" size="lg" className="bg-white text-emerald-700 hover:bg-gray-50 w-full sm:w-auto">
                Apply Now
              </Button>
            </Link>
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Support Us
              </Button>
            </a>
            <Link to="/student">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Student Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
                  <div className="text-lg font-semibold">Al-Falaah Academy</div>
                  {/* <div className="text-xs text-gray-400 font-arabic">الفلاح</div> */}
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
                <li><a href="#mission" className="text-gray-400 hover:text-white">Our Mission</a></li>
                <li><a href="#programs" className="text-gray-400 hover:text-white">Programs</a></li>
                <li><Link to="/apply" className="text-gray-400 hover:text-white">Apply Now</Link></li>
                <li>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Support Our Mission
                  </a>
                </li>
                <li><Link to="/vacancies" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li className="pt-2 border-t border-gray-800">
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
              <p className="text-gray-400 text-sm mb-2">
                Questions about our programs?
              </p>
              <a href="mailto:info@alfalaah-academy.nz" className="text-emerald-400 hover:text-emerald-300 text-sm">
                info@alfalaah-academy.nz 
              </a><br />
              <a href="tel:+64272131486" className="text-emerald-400 hover:text-emerald-300 text-sm">
                +6427 213 1486
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Al-Falaah Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
