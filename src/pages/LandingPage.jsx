import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart, ChevronDown, ArrowUp, Rocket, ArrowRight, Mail, Phone, MessageCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openApproachCard, setOpenApproachCard] = useState(null);

  // Background image URL from Supabase with fallback to iStock
  const bgImageUrl = storage.getPublicUrl('payment-documents', 'public/landing-bg.jpg');

  // Stripe donation link from environment variable
  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/dRm28t3WQ4Jacmj6gocAo00.com';

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
      question: "Who is this program designed for?",
      subQuestion: "Is this program suitable for absolute beginners?",
      answer: "Our tracks are designed for students who can already read the Arabic script fluently with ḥarakāt (vowel markings). If you can read the Qur'an but lack understanding of the grammar or Tajweed rules, our slated curriculum is specifically engineered to accelerate you toward intermediate mastery."
    },
        {
      question: "Program Enrollment Strategy",
      subQuestion: "Can I enroll in both tracks simultaneously?",
      answer: "To ensure the highest level of mastery and retention, we strongly encourage students to focus on one track at a time. Our methodology is intensive and slated for deep progress; attempting both simultaneously can dilute your focus. For most students, we recommend starting with the Tajweed Mastery Program (TMP). Laying this strong foundational connection with the Qur'anic text provides the ideal spiritual and linguistic springboard for the 2-year Essential Arabic & Islamic Studies (EAIS) track.",
      isRecommended: true
    },
    {
      question: "The \"Accelerator\" Methodology",
      subQuestion: "What makes the \"FastTrack\" methodology different from traditional classes?",
      answer: "Unlike open-ended classes, we utilize a slated curriculum with defined timelines (24 weeks for TMP and 104 weeks for EAIS). By combining effective teaching with mandatory 30-minute assessment blocks and expert mentoring, we ensure consistent progress and high accountability that traditional self-paced learning often lacks."
    },
    {
      question: "Time Commitment",
      subQuestion: "How much time do I need to commit each week?",
      answer: "Students should attend two live sessions per week: one 2-hour primary instruction session and one 30-minute mentoring/assessment session. Additionally, we recommend 2–3 hours of independent study to master the slated objectives for that week."
    },
    {
      question: "Commitment & Accountability",
      subQuestion: "What happens if I struggle to maintain my commitment to the program?",
      answer: "We understand that life can be unpredictable. However, due to the slated nature of our curriculum, consistent attendance and engagement are crucial. If you find yourself falling behind, we encourage open communication with your tutor (mentor) to explore options for support or adjustments."
    },
    {
      question: "Selective Admission",
      subQuestion: "Why do you require a phone interview for admission?",
      answer: "Because our programs move at a structured pace, we use the interview to verify prerequisites and ensure that every student is placed in the track that best serves their goals. This helps us maintain a high-performance environment for all participants."
    },
    {
      question: "Learning Materials & Methodology",
      subQuestion: "Do I need to purchase my own classical texts and materials?",
      answer: "For Islamic Studies, we provide comprehensive digital learning materials. However, for Arabic and Tajweed, we utilize a traditional \"Live Board\" method. Your teacher will write directly on the board during sessions, and you will be required to take physical notes. This deliberate practice is designed to develop your Arabic handwriting and spelling skills. During onboarding, your mentor will provide a list of the specific notebooks and pens recommended for this high-engagement learning style."
    },
    {
      question: "Mentoring & Support",
      subQuestion: "What does \"Dedicated Follow-up\" actually look like?",
      answer: "You aren't just a face in a Zoom gallery. Our team monitors your assessment results weekly. If you struggle with a concept, your mentor provides dedicated follow-up during the short sessions to address gaps in understanding before we move to the next slated module."
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
      {/* Navigation - Fixed for sticky positioning */}
      <nav className="sticky top-0 left-0 right-0 z-50 backdrop-blur-sm bg-black/30 transition-all duration-300 pb-3">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
                <img
                  src="/favicon-white.svg"
                  alt="The FastTrack Madrasah Logo"
                  className="h-7 w-7 md:h-10 md:w-10"
                />
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
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
                <Link to="/blog">
                  <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg">
                    Blog
                  </button>
                </Link>
                <Link to="/store">
                  <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Store
                  </button>
                </Link>
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
              <div className="md:hidden border-t border-white/10 bg-black/20 backdrop-blur-md rounded-b-lg mt-3">
                <div className="flex flex-col gap-1 py-3 px-3">
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
                  <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Blog
                    </button>
                  </Link>
                  <Link to="/store" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Store
                    </button>
                  </Link>
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

        {/* Centered Hero Content with Slider and CTA */}
        <div className="relative flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 md:pt-32">
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
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-3 md:mb-10 tracking-tight">
                Accelerate Your Mastery of Islamic Knowledge
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 max-w-3xl mx-auto leading-snug md:leading-normal">
                Master the foundations of our Deen through 
                <span className="text-emerald-400 font-semibold"> effective teaching</span> of a 
                <span className="text-emerald-400 font-semibold"> slated curriculum</span>, 
                reinforced by expert mentoring, regular assessment, and dedicated follow-up.
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

              {/* Scroll Down Indicator */}
              <div className="mt-8 md:mt-16 flex justify-center animate-bounce">
                <a
                  href="#mission"
                  className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors group"
                  aria-label="Scroll down to learn more"
                >
                  <span className="text-sm font-medium hidden sm:block">Scroll Down</span>
                  <ChevronDown className="h-8 w-8 group-hover:scale-110 transition-transform" />
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
              Today, while millions can recite the Qur’an, a profound gap remains between recitation and true comprehension. Traditionally, bridging this divide required years of academic study—a commitment often incompatible with the pace of modern life in the West. As this gap widens, our direct connection to the divine guidance of the Qur’an and Sunnah is frequently filtered through translations. We believe that understanding the Word of Allah should not be a distant luxury, but an accessible reality for every believer.
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
              <span className="font-brand font-bold text-gray-900">The FastTrack Madrasah</span> was established to provide a sophisticated solution to this challenge through a streamlined and highly effective curriculum. By fusing traditional scholarship with modern instructional design, we've created an accelerator that optimizes the way the Qur'an is studied. Our mission is to empower students to move beyond the surface of the text, facilitating a focused transition to intermediate Arabic proficiency so they can engage with Revelation in its original tongue—with little to no reliance on translation.
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12 pl-6">
                  <div className="flex-shrink-0">
                    <img
                      src="/founder.jpeg"
                      alt="Dr Abdulquadri Alaka"
                      className="w-24 h-24 rounded-full object-cover scale-150 bg-gray-200 ring-4 ring-white shadow-md"
                    />
                  </div>
                  <div className="flex-1 sm:ml-4">
                    <p className="text-xl">
                      <a
                      href=""
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center font-semibold text-gray-900 mb-1 hover:text-emerald-800 transition-colors group"
                      >
                      Dr Abdulquadri Alaka
                      </a>
                      </p>
                    <p className="text-base text-gray-600 mb-3">
                      Founder, The FastTrack Madrasah
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
          <div className="mt-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-12 border border-blue-100 shadow-sm">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Ready to Begin Your Journey?
              </h3>
              <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed">
                Reclaim your connection to the Qur'an and Sunnah through a structured, time-bound methodology designed for busy Muslims in the modern world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/apply">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                    <Rocket className="h-5 w-5" />
                    Start Your Application
                  </button>
                </Link>

                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                    <Heart className="h-5 w-5" />
                    Support Our Mission
                  </button>
                </a>
              </div>
            </div>
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
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 0 ? null : 0)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  01
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Flexible & Personalized Learning
                    </h3>
                    {/* Mobile toggle icon */}
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 0 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Content - hidden on mobile unless expanded, always visible on desktop */}
                  <div className={`${openApproachCard === 0 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      Every student progresses at their own pace within our slated curriculum framework. We recognize that each learner brings unique strengths and challenges to their educational journey.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      When beneficial, we strategically group family members or students with similar backgrounds into cohort learning, fostering peer support and collaborative growth while maintaining individual accountability.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 1 ? null : 1)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  02
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Islamic Values at the Core
                    </h3>
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 1 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className={`${openApproachCard === 1 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      Beyond teaching Arabic language and grammar, we cultivate Islamic character rooted in the Qur'an and Sunnah. Our curriculum seamlessly integrates spiritual development with linguistic mastery.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      Students learn not just how to read and understand revelation, but how to embody its timeless principles in their daily lives through proper manners and devotion.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 2 ? null : 2)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  03
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Classical Script & Traditional Pedagogy
                    </h3>
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 2 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className={`${openApproachCard === 2 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      Our curriculum is grounded in authentic, time-tested texts of Islamic scholarship that have educated generations of students for centuries.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      We prioritize traditional knowledge transmission through live board-writing during Arabic and Tajweed sessions, requiring students to take physical notes. This active engagement develops Arabic penmanship while ensuring deep cognitive retention through centuries-proven methods.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 4 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 3 ? null : 3)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  04
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Anywhere, Anytime Accessibility
                    </h3>
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 3 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className={`${openApproachCard === 3 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      All classes are conducted via secure video conferencing platforms, eliminating geographical barriers to authentic Islamic education. Whether you're in Auckland, Wellington, or Christchurch, quality instruction is just a click away.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      This digital approach combines convenience with consistency, allowing students throughout New Zealand to access the same high-caliber teaching without compromising on traditional standards.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 5 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 4 ? null : 4)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  05
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Rigorous Assessment Framework
                    </h3>
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 4 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className={`${openApproachCard === 4 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      Regular evaluations throughout your learning journey ensure genuine knowledge retention and mastery, not just superficial familiarity with concepts.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      Our systematic assessment approach helps identify areas for growth early, allowing for targeted intervention and support to solidify your understanding before advancing to the next slated module.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 6 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all relative">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 5 ? null : 5)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div className="absolute top-4 left-4 text-7xl font-bold text-emerald-600 opacity-10">
                  06
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Holistic Mentorship
                    </h3>
                    <div className="md:hidden flex-shrink-0 mt-1">
                      {openApproachCard === 5 ? (
                        <Minus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className={`${openApproachCard === 5 ? 'block' : 'hidden'} md:block`}>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify mb-3">
                      We don't just teach—we mentor. Each student is paired with an experienced guide who provides dedicated follow-up and personalized academic support throughout their journey.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      Our mentorship extends beyond the virtual classroom to support students in their spiritual development and help them navigate daily life challenges through an Islamic lens.
                    </p>
                  </div>
                </div>
              </button>
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

          {/* Quick Comparison - At a Glance */}
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 text-center">
                <div className="p-3 border-r border-gray-200 bg-gray-100">
                  <p className="text-xs font-medium text-gray-600">Track</p>
                </div>
                <div className="p-3 border-r border-gray-200 bg-purple-50">
                  <p className="text-xs font-semibold text-purple-900">TMP</p>
                </div>
                <div className="p-3 bg-emerald-50">
                  <p className="text-xs font-semibold text-emerald-900">EAIS</p>
                </div>
              </div>

              <div className="grid grid-cols-3 text-center border-t border-gray-200">
                <div className="p-3 border-r border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600">Duration</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-sm font-bold text-gray-900">6 months</p>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900">2 years</p>
                </div>
              </div>

              <div className="grid grid-cols-3 text-center border-t border-gray-200">
                <div className="p-3 border-r border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600">Cost</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-sm font-bold text-gray-900">$120</p>
                  <p className="text-xs text-gray-500">one-time</p>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900">$35/mo</p>
                  <p className="text-xs text-gray-500">or $375/yr</p>
                </div>
              </div>

              <div className="grid grid-cols-3 text-center border-t border-gray-200">
                <div className="p-3 border-r border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-600">Focus</p>
                </div>
                <div className="p-3 border-r border-gray-200">
                  <p className="text-xs text-gray-700">Tajweed & Qur'an</p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-700">Arabic & Islamic Studies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* TMP Program Card */}
            <div className="bg-white border-2 border-purple-200 rounded-xl overflow-hidden transition-all shadow-sm">
              {/* Subtle gradient header */}
              <div className="bg-gradient-to-r from-purple-50 to-white px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Track 1: Tajweed Mastery Program (TMP)
                </h3>
                <p className="text-sm sm:text-base text-emerald-700 mb-1" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.8'}}>
                  برنامج إتقان التجويد
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="italic font-serif tracking-wide">Barnāmij Itqān at-Tajwīd</span>
                </p>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 text-justify">
                  An intensive 24-week sprint to transform basic reading into expert-level precision. Through a slated curriculum, we focus on mastering Tajweed rules through immediate oral application and rigorous precision drills.

                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 text-justify">
                  <span className="font-semibold">Our Edge:</span> We go beyond rules by integrating a vital introduction to the Sciences of the Qur'an (<span className="italic font-serif tracking-wide">&lsquo;Ulūm al-Qur&rsquo;ān</span>), grounding your recitation in authentic scholarly and historical context.
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
                        <li> <span className="font-semibold">Mastery from A to Z:</span> Complete command over Tajweed rules through effective, focused instruction.</li>
                        <li> <span className="font-semibold">Scholarly Foundation:</span> Attain essential knowledge of <span className="italic font-serif tracking-wide">&lsquo;Ulūm al-Qur&rsquo;ān</span>.</li>
                        <li> <span className="font-semibold">Primary Text:</span> <span style={{fontFamily: 'Traditional Arabic, serif'}}>تيسير الرحمن في تجويد القرآن</span> | <span className="italic font-serif tracking-wide">Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān</span> (Su'ād 'Abdul-Ḥamīd).</li>
                      </ul>
                    </div>

                    {/* <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Course</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span style={{fontFamily: 'Traditional Arabic, serif'}}>التجويد</span> | At-Tajwīd (Perfecting Qur'anic Recitation)
                      </p>
                    </div> */}

                    {/* <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Primary Text</h4>
                      <p className="text-xs text-gray-600">
                        <span style={{fontFamily: 'Traditional Arabic, serif'}}>تيسير الرحمن في تجويد القرآن</span> | Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān by Su'ād 'Abdul-Ḥamīd
                      </p>
                    </div> */}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Precision Schedule (Weekly)</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Session 1 (2 Hours): </span> Primary Instruction & Intensive Drill.</li>
                        <li> <span className="font-semibold">Session 2 (30 mins): </span> Dedicated Follow-up, Oral Assessment, and Mentoring.</li>
                      </ul>
                    </div>

                    {/* <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Must be at least 14 years old and able to read the Qur'an but lack knowledge or application of tajweed rules
                      </p>
                    </div> */}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prerequisites</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li> <span className="font-semibold">Age: </span> 14+ years old</li>
                        <li> <span className="font-semibold">Proficiency: </span> Must be able to read the Qur'anic script fluently but currently lacks the technical knowledge or practical application of Tajweed rules.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Enroll Button */}
                <Link to="/apply">
                  <Button variant="outline" size="md" className="w-full border-purple-600 text-purple-700 hover:bg-purple-50 mt-4">
                    Apply for the 24-Week Sprint
                  </Button>
                </Link>
              </div>
            </div>

            {/* EAIS Program Card */}
            <div className="bg-white border-2 border-emerald-200 rounded-xl overflow-hidden transition-all shadow-sm">
              {/* Subtle gradient header */}
              <div className="bg-gradient-to-r from-emerald-50 to-white px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                 Track 2: Essential Arabic & Islamic Studies (EAIS)
                </h3>
                 <p className="text-sm sm:text-base text-emerald-700 mb-1" style={{fontFamily: 'Traditional Arabic, serif', direction: 'rtl', lineHeight: '1.8'}}>
                  الدراسات الأساسية في اللغة العربية والعلوم الإسلامية
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="italic font-serif tracking-wide">Ad-Dirāsāt al-Asāsiyyah fīl-Lughah al-ʿArabiyyah wal-ʿUlūm al-Islāmiyyah</span>
                </p>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 text-justify">
                  A comprehensive 2-year accelerator designed for students ready to bridge the gap between reading script and true comprehension. Our slated curriculum delivers a rigorous foundation in Arabic linguistics—Grammar, Morphology, and Spelling—paired with essential Islamic sciences to build lasting scholarly depth.

                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 text-justify">
                  <span className="font-semibold">Our Edge:</span> We move beyond isolated language study by integrating Creed (<span className="italic font-serif tracking-wide">&lsquo;Aqīdah</span>), Jurisprudence (<span className="italic font-serif tracking-wide">Fiqh</span>), and Ethics (<span className="italic font-serif tracking-wide">Ādāb</span>). Through expert mentoring and systematic textual study, we equip you with the linguistic and spiritual infrastructure to engage directly with the Qur'an and Sunnah.
                </p>
                {/* <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
                  Equip yourself with intermediate Arabic proficiency and foundational Islamic knowledge in creed, manners, and jurisprudence through comprehensive study of classical texts.
                </p> */}

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
                      <p className="text-base sm:text-lg font-bold text-emerald-900">$35 NZD/mo</p>
                      <p className="text-xs text-emerald-700">or $375/year</p>
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

                {/* Enroll Button */}
                <Link to="/apply">
                  <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                    Begin Your 2-Year Mastery Path
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          {/* Recommended Learning Path Visual */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-2xl p-8 sm:p-10 border-2 border-emerald-200 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-semibold text-sm mb-4">
                  <CheckCircle className="h-4 w-4" />
                  Recommended Learning Path
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
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
                  <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-bold text-purple-600">01</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        6 months
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Tajweed Mastery Program
                    </h4>
                    <p className="text-sm text-gray-600 text-justify">
                      Build a strong foundation with the Qur'an through precision recitation
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-8 w-8 text-emerald-600 flex-shrink-0" />

                {/* Step 2: EAIS */}
                <div className="flex-1 max-w-xs">
                  <div className="bg-white rounded-xl p-6 border-2 border-emerald-300 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-bold text-emerald-600">02</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        2 years
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Essential Arabic & Islamic Studies
                    </h4>
                    <p className="text-sm text-gray-600 text-justify">
                      Master Arabic linguistics and Islamic sciences for direct comprehension
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Vertical Flow */}
              <div className="md:hidden space-y-4 mb-8">
                {/* Step 1: TMP */}
                <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-bold text-purple-600">01</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      6 months
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Tajweed Mastery Program
                  </h4>
                  <p className="text-sm text-gray-600">
                    Build a strong foundation with the Qur'an through precision recitation
                  </p>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="h-8 w-0.5 bg-emerald-600"></div>
                </div>

                {/* Step 2: EAIS */}
                <div className="bg-white rounded-xl p-6 border-2 border-emerald-300 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-bold text-emerald-600">02</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      2 years
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Essential Arabic & Islamic Studies
                  </h4>
                  <p className="text-sm text-gray-600">
                    Master Arabic linguistics and Islamic sciences for direct comprehension
                  </p>
                </div>
              </div>

              {/* Why This Path */}
              <div className="bg-white/60 rounded-xl p-6 border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Why This Progression Works
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed text-justify">
                  Starting with TMP establishes your spiritual connection to the Qur'an through perfected recitation. This 6-month foundation primes your mind and heart for the intensive 2-year EAIS journey, where you'll gain the linguistic tools to engage directly with Revelation. This sequential approach maximizes retention and prevents cognitive overload.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Admission Works Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 text-center mb-16">
            The Path to Mastery
          </h2>

          {/* Mobile: Vertical Layout */}
          <div className="md:hidden space-y-6">
            {/* Step 1 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                01 | Online Application
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Submit your details through our streamlined portal to begin the selection process for your chosen track.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 2 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                02 | Evaluation & Interview
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Our academic team reviews your background to ensure alignment with the program's prerequisites. This stage typically includes a brief phone interview to discuss your goals.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 3 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                03 | Selection & Enrollment
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Successful applicants will receive a formal offer. Secure your place in the upcoming cohort by processing your enrollment through our secure payment gateway.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 4 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                04 | Onboarding & Mentorship
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Receive your Student ID and access to the learning platform. You will be matched with an expert mentor who will guide your transition into the slated curriculum.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 5 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                05 | Guided Execution
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Engage in intensive instruction and regular assessments. Our methodology ensures you hit every academic milestone with precision through consistent follow-up.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 6 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                06 | Final Validation
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Complete your final comprehensive evaluation to demonstrate mastery of the program's core competencies and slated objectives.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-8"></div>

            {/* Step 7 */}
            <div className="bg-white border-l-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <h3 className="text-base font-bold text-emerald-600 mb-2">
                07 | Certification & Alumni Network
              </h3>
              <p className="text-sm text-gray-700 text-justify">
                Graduate with a formal Certificate of Completion and join an elite network of students committed to lifelong learning and traditional scholarship.
              </p>
            </div>
          </div>

          {/* Tablet/Desktop: 3-Row Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Row 1: Steps 1-3 */}
            {/* Step 1 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Online Application
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Submit your details through our streamlined portal to begin the selection process for your chosen track.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Evaluation & Interview
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Our academic team reviews your background to ensure alignment with the program's prerequisites. This stage typically includes a brief phone interview to discuss your goals.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Selection & Enrollment
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Successful applicants will receive a formal offer. Secure your place in the upcoming cohort by processing your enrollment through our secure payment gateway.
              </p>
            </div>

            {/* Row 2: Steps 4-6 */}
            {/* Step 4 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                04
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Onboarding & Mentorship
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Receive your Student ID and access to the learning platform. You will be matched with an expert mentor who will guide your transition into the slated curriculum.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                05
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Guided Execution
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Engage in intensive instruction and regular assessments. Our methodology ensures you hit every academic milestone with precision through consistent follow-up.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                06
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Final Validation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Complete your final comprehensive evaluation to demonstrate mastery of the program's core competencies and slated objectives.
              </p>
            </div>

            {/* Row 3: Step 7 (centered) */}
            {/* Step 7 */}
            <div className="bg-white border-t-4 border-emerald-600 p-6 rounded-lg shadow-sm md:col-start-2">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 text-white font-bold rounded-full mb-4 text-lg">
                07
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Certification & Alumni Network
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Graduate with a formal Certificate of Completion and join an elite network of students committed to lifelong learning and traditional scholarship.
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
              <div key={idx} className={`bg-white rounded-lg border-2 ${faq.isRecommended ? 'border-emerald-500 shadow-md' : 'border-gray-200'}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{faq.question}</span>
                      {faq.isRecommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Recommended Path
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{faq.subQuestion}</span>
                  </div>
                  {openFaq === idx ? (
                    <Minus className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed text-justify">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-6">
              If you're unsure which track is right for you, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <a href="mailto:salam@tftmadrasah.nz" className="text-emerald-700 font-bold hover:text-emerald-800 underline flex items-center gap-2">
                <Mail className="h-4 w-4" />
                salam@tftmadrasah.nz
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="tel:+64272131486" className="text-emerald-700 font-bold hover:text-emerald-800 underline flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +6427 213 1486
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:text-emerald-800 underline flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                +6422 465 3509
              </a>
            </div>
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
                  <div className="flex flex-col leading-none -space-y-1">
                    <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                    <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
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
                                <li>
                  <Link to="/admin" className="text-gray-500 hover:text-gray-300 text-xs">Admin</Link>
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
                <a href="mailto:salam@tftmadrasah.nz" className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  salam@tftmadrasah.nz
                </a>
                <a href="tel:+64272131486" className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +6427 213 1486
                </a>
                <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  +6422 465 3509
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.</p>
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
