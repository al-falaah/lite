import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart, ChevronDown, ArrowUp, Rocket, ArrowRight, Mail, Phone, MessageCircle, ShoppingBag, Newspaper, Clock, Infinity as InfinityIcon, Search, Facebook, Instagram } from 'lucide-react';
import Button from '../components/common/Button';
import DiagonalSeam from '../components/common/DiagonalSeam';
import { storage } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openApproachCard, setOpenApproachCard] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [drillPreviewStep, setDrillPreviewStep] = useState(0);
  const [showCertPreview, setShowCertPreview] = useState(false);

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

  useEffect(() => {
    // Manual navigation still works; we just don't auto-rotate for users
    // who prefer reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Back to top button visibility, scroll indicator hiding, and navbar color change
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowBackToTop(scrollY > 500);
      // Hide scroll indicator after scrolling 200px (when they've started exploring)
      setShowScrollIndicator(scrollY < 200);
      // Change navbar to white after scrolling just a bit (50px)
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch latest blog articles
  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const url = `${supabaseUrl}/rest/v1/blog_posts?status=eq.published&select=id,title,slug,excerpt,featured_image,published_at,author_name,category&order=published_at.desc&limit=3`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLatestArticles(data);
        }
      } catch (error) {
        console.error('Error fetching latest articles:', error);
      }
    };

    fetchLatestArticles();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drill preview animation cycle
  useEffect(() => {
    const t = setInterval(() => setDrillPreviewStep(s => (s + 1) % 3), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      <Helmet><title>The FastTrack Madrasah | Learn Quran Online</title></Helmet>
      {/* Navigation - Clean professional design */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors pb-3 ${
        isScrolled
          ? 'bg-white border-b border-gray-200'
          : 'bg-transparent'
      }`}>
        <div className={`px-3 sm:px-6 lg:px-8 ${!isScrolled ? 'bg-transparent' : ''}`}>
            <div className={`flex justify-between items-center h-14 lg:h-16 ${!isScrolled ? 'bg-transparent' : ''}`}>
              {/* Logo only on mobile, Logo + Brand name on desktop */}
              <Link to="/" className="flex items-center gap-2.5">
                <img
                  src={isScrolled ? "/favicon.svg" : "/favicon-white.svg"}
                  alt="The FastTrack Madrasah Logo"
                  className="h-7 w-7 lg:h-9 lg:w-9 transition-all duration-300"
                />
                {/* Brand name - hidden on mobile, shown on desktop */}
                <div className="hidden lg:flex flex-col justify-center leading-tight">
                  <span className={`text-sm font-brand font-semibold transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`} style={{letterSpacing: "0.005em"}}>The FastTrack</span>
                  <span className={`text-sm font-brand font-semibold transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`} style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
              </Link>

              {/* Desktop Navigation - all links on the right */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Navigation links - hover changes text color to emerald-600 */}
                <Link to="/mission">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Our Mission
                  </button>
                </Link>
                 <Link to="/programs#our-programs" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Programs
                  </button>
                </Link>
                <Link to="/blog">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Blog
                  </button>
                </Link>
                <Link to="/tools">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Tools
                  </button>
                </Link>
                <Link to="/store">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Store
                  </button>
                </Link>
                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Donate
                  </button>
                </a>
                <Link to="/login">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Login
                  </button>
                </Link>
                <Link to="/apply">
                  <button className="px-5 py-2 ml-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors">
                    Apply Now
                  </button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  isScrolled
                    ? 'text-gray-900 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-emerald-800/50 bg-emerald-950 mt-3">
                <div className="flex flex-col gap-1 py-3 px-3">
                  {/* Brand name - shown in mobile menu with larger font */}
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mb-2 pb-3 border-b border-white/10">
                    <div className="flex flex-col leading-none -space-y-1 px-4">
                      <span className="text-lg font-brand font-semibold text-white" style={{letterSpacing: "0.005em"}}>The FastTrack</span>
                      <span className="text-lg font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                    </div>
                  </Link>

                  <Link to="/mission" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Our Mission
                    </button>
                  </Link>
                  <Link to="/programs" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Programs
                    </button>
                  </Link>
                  <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Blog
                    </button>
                  </Link>
                  <Link to="/tools" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Tools
                    </button>
                  </Link>
                  <Link to="/faqs" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      FAQs
                    </button>
                  </Link>
                  <Link to="/store" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Store
                    </button>
                  </Link>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Support Our Mission
                    </button>
                  </a>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Login
                    </button>
                  </Link>
                  <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 mt-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors">
                      Apply Now
                    </button>
                  </Link>

                  {/* Portal Links - Secondary */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="px-4 text-xs text-white/60 mb-2 uppercase tracking-wider">Portals</p>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left">
                        Sign In
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
          {/* Simple dark overlay with alpha to show background */}
          <div className="absolute inset-0"></div>
          {/* Diagonal gradient: light top-left to dark bottom-right */}
          <div className="absolute inset-0 bg-gradient-to-bl from-black/100 via-black/95 to-black/40"></div>
        </div>

        {/* Centered Hero Content with CTA (hadith slider lives in the floating card below) */}
        <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto w-full text-center">
            {/* Hero Content */}
            <div>
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-3 md:mb-10 tracking-tight">
                Learn What Truly Matters in the Time You Have
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 max-w-3xl mx-auto leading-snug md:leading-normal">
                From reading the Qur'an accurately to understanding Arabic and Islamic sciences—
                <span className="text-emerald-400 font-semibold">structured programs</span> for
                <span className="text-emerald-400 font-semibold"> everyone</span> ready to connect with the Book of Allah.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 justify-center">
                <Link to="/apply">
                  <Button variant="emerald" size="lg" className="w-full sm:w-auto">
                    Apply Now
                  </Button>
                </Link>
                <Link to="/programs">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/20 w-full sm:w-auto">
                    View Programs
                  </Button>
                </Link>
              </div>

              {/* Latest Articles Link - Animated */}
              {latestArticles.length > 0 && (
                <div className="mt-8 md:mt-10">
                  <Link
                    to="/blog"
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Newspaper className="h-5 w-5 text-emerald-400 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                      </div>
                      <span className="text-white font-medium text-sm md:text-base">
                        Latest Articles & Insights
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Scroll Indicator - Visible only at top of page */}
        {showScrollIndicator && (
          <a
            href="#experience"
            className="fixed right-4 sm:right-8 bottom-8 z-40 flex flex-col items-center gap-2 group cursor-pointer animate-bounce-slow transition-opacity duration-300"
            aria-label="Scroll down to learn more"
          >
            {/* Vertical Line */}
            <div className="w-0.5 h-12 sm:h-16 bg-emerald-400/30"></div>

            {/* Animated Chevron */}
            <div className="bg-emerald-500 rounded-full p-2 group-hover:bg-emerald-400 transition-colors">
              <ChevronDown className="h-4 w-4 text-white" />
            </div>

            {/* Optional text hint - hidden on very small screens */}
            <span className="hidden sm:block text-[10px] font-medium text-white/80 group-hover:text-white transition-colors tracking-widest uppercase rotate-90 origin-center mt-8">
              Scroll
            </span>
          </a>
        )}
      </section>

      {/* Transition: dark band with diagonal bottom edge + floating hadith card */}
      <div className="relative bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-emerald-950"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 92%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 sm:p-10">
            <div className="sm:flex items-center gap-8 lg:gap-10">
              {/* Arch-cropped image with dotted accent */}
              <div className="relative hidden sm:block flex-shrink-0">
                <div
                  aria-hidden="true"
                  className="absolute -top-4 -left-4 w-20 h-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgb(5 150 105 / 0.35) 1.5px, transparent 1.5px)',
                    backgroundSize: '11px 11px',
                  }}
                />
                <img
                  src={bgImageUrl}
                  alt=""
                  loading="lazy"
                  className="relative w-40 h-56 object-cover rounded-t-full rounded-b-xl shadow-lg"
                />
              </div>

              {/* Quote slider */}
              <div className="text-center sm:text-left min-w-0">
                <p className="text-emerald-700 font-semibold text-sm sm:text-base mb-2 font-arabic">
                  قال رسول الله ﷺ
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-900 font-serif leading-relaxed mb-3">
                  "{quotes[currentQuote].text}"
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-5">
                  {quotes[currentQuote].source}
                </p>
                <div className="flex justify-center sm:justify-start items-center">
                  <div className="flex gap-1.5 md:gap-2">
                    {quotes.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuote(idx)}
                        className="group relative"
                        aria-label={`Go to quote ${idx + 1}`}
                      >
                        <div className={`h-1 w-10 md:w-14 rounded-full transition-all duration-500 ${
                          idx === currentQuote
                            ? 'bg-emerald-600'
                            : 'bg-gray-200 group-hover:bg-gray-300'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Experience Preview Section */}
      <section id="experience" className="bg-white py-10 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Your Student Experience
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A modern platform with everything you need to master the Qur'an
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* HERO — Recitation Practice: the teacher feedback loop */}
            <div className="lg:col-span-2 lg:row-span-2 bg-gray-950 rounded-2xl p-6 sm:p-10 relative overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8 items-center h-full">
                <div className="text-center md:text-left">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide mb-4">
                    Teacher feedback
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                    Recite. A real teacher listens.
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    Record your recitation and send it straight to your teacher. You get graded,
                    personal feedback on your tajweed every week — not just at exam time.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Recording</p>
                  <p dir="rtl" className="text-lg sm:text-xl font-arabic text-white text-center mb-6 leading-relaxed px-2">
                    ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
                  </p>
                  {/* Waveform bars */}
                  <div className="flex items-center justify-center gap-[3px] mb-6 h-10">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="w-[3px] bg-emerald-500 rounded-full h-full"
                        style={{ animation: `waveform-bar ${0.8 + (i % 4) * 0.2}s ease-in-out ${i * 0.08}s infinite`, transformOrigin: 'center' }} />
                    ))}
                  </div>
                  {/* Record button */}
                  <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center"
                    style={{ animation: 'record-pulse 2s ease-in-out infinite' }}>
                    <div className="w-5 h-5 bg-white rounded-sm" />
                  </div>
                  <p className="text-gray-500 text-xs mt-3 font-mono">0:12 / 5:00</p>
                </div>
              </div>
            </div>

            {/* Tile — Daily practice drills */}
            <div className="grid" style={{ gridTemplateRows: '1fr auto' }}>
              <div className="bg-gray-950 rounded-2xl p-5 sm:p-6 relative overflow-hidden min-h-[280px] flex flex-col">
                {/* Flash overlay */}
                {drillPreviewStep === 1 && (
                  <div className="absolute inset-0 bg-emerald-500/10 animate-drill-flash z-10 pointer-events-none rounded-2xl" />
                )}
                {/* Mode tabs */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Tajweed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-500 border border-gray-700">Arabiyyah</span>
                  <div className="ml-auto flex items-center gap-1">
                    <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide">Endless</span>
                  </div>
                </div>
                {/* Arabic Text */}
                <div className="bg-gray-800/60 rounded-xl p-3 mb-3">
                  <p dir="rtl" className="text-base sm:text-lg font-arabic text-white text-center leading-relaxed">
                    سَمِيعٌۢ <span className="bg-amber-500/30 text-amber-300 px-1 rounded border-b-2 border-amber-500/60">بَ</span>صِيرٌ
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 text-center mb-3">What rule applies to the tanween before ب?</p>
                {/* Options */}
                <div className="space-y-1.5">
                  {['Idghaam', 'Ikhfa', 'Iqlab', 'Izhar'].map((opt, i) => {
                    const LETTERS = ['A', 'B', 'C', 'D'];
                    const isCorrectOpt = i === 2;
                    let optStyle = 'border-gray-700 text-gray-400';
                    if (drillPreviewStep >= 1 && isCorrectOpt) optStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                    else if (drillPreviewStep >= 1) optStyle = 'border-gray-800 text-gray-600';
                    return (
                      <div key={i} className={`py-1.5 px-3 rounded-lg border text-xs flex items-center gap-2 transition-all duration-300 ${optStyle}`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                          drillPreviewStep >= 1 && isCorrectOpt ? 'bg-emerald-500/30 text-emerald-300'
                          : drillPreviewStep >= 1 ? 'bg-gray-800/30 text-gray-600'
                          : 'bg-gray-700/50 text-gray-500'
                        }`}>{LETTERS[i]}</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Floating XP */}
                {drillPreviewStep === 2 && (
                  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-xp-float pointer-events-none z-20">
                    <span className="text-2xl font-black text-amber-400">+10 XP</span>
                  </div>
                )}
              </div>
              <div className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Drills</h3>
                <p className="text-sm text-gray-600">Curated and endless auto-generated drills for Tajweed and Arabiyyah. Earn XP, build combos, and compete on the leaderboard.</p>
              </div>
            </div>

            {/* Tile — Tests → verifiable certificate */}
            <div className="grid" style={{ gridTemplateRows: '1fr auto' }}>
              <button onClick={() => setShowCertPreview(true)} className="w-full text-left group">
                <div className="rounded-2xl relative overflow-hidden min-h-[280px] h-full flex items-center justify-center cursor-pointer" style={{ background: '#fffdf7', border: '1px solid #d4a574' }}>
                  {/* Shine sweep */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      style={{ animation: 'cert-shine 5s ease-in-out infinite' }} />
                  </div>
                  {/* SAMPLE watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-5xl sm:text-6xl font-black text-gray-300/20 uppercase tracking-[0.2em] -rotate-12 select-none">SAMPLE</span>
                  </div>
                  {/* Borders matching real template */}
                  <div className="absolute" style={{ inset: '6px', border: '2px solid #059669', borderRadius: '2px' }} />
                  <div className="absolute" style={{ inset: '10px', border: '1px solid #a7f3d0', borderRadius: '2px' }} />
                  {/* Certificate content matching real template */}
                  <div className="text-center relative z-20 py-4 px-3">
                    <img src="/favicon.svg" alt="" className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-[9px] font-brand font-semibold text-emerald-800" style={{ letterSpacing: '0.02em' }}>The FastTrack Madrasah</p>
                    <p className="text-[7px] text-gray-400 uppercase tracking-[0.15em] mb-2">New Zealand</p>
                    <h4 className="text-sm sm:text-base font-serif font-bold uppercase text-emerald-800 tracking-wide mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>Certificate of Completion</h4>
                    <p className="text-[8px] uppercase tracking-[0.12em] text-gray-400 mb-3">Tajweed Mastery Program</p>
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 mb-1">This is to certify that</p>
                    <p className="text-sm font-serif font-semibold italic text-emerald-800 mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>Aminah Rahman</p>
                    <p className="text-[8px] text-gray-500 mb-2">has successfully completed the</p>
                    <p className="text-[9px] font-serif font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>TMP — Tajweed Mastery Program</p>
                    <p dir="rtl" className="text-[10px] font-arabic text-gray-400 mt-0.5 mb-2">برنامج إتقان التجويد</p>
                    {/* Scores */}
                    <div className="flex justify-center gap-4 mb-2">
                      {[{ l: 'Milestones', v: '82.5%' }, { l: 'Final Exam', v: '88.0%' }, { l: 'Total', v: '85.3%' }].map(s => (
                        <div key={s.l} className="text-center">
                          <p className="text-[6px] uppercase tracking-wide text-gray-400">{s.l}</p>
                          <p className="text-xs font-serif font-bold text-emerald-600" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</p>
                        </div>
                      ))}
                    </div>
                    {/* Signatures */}
                    <div className="flex justify-center gap-8">
                      {['Program Director', 'Instructor'].map(t => (
                        <div key={t} className="text-center">
                          <div className="w-12 border-b border-gray-300 mb-0.5 mx-auto" />
                          <p className="text-[6px] text-gray-400">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Click hint */}
                  <div className="absolute bottom-2 right-2 bg-gray-900/70 text-white text-[8px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30">Click to preview</div>
                </div>
              </button>
              <div className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tests & Certificates</h3>
                <p className="text-sm text-gray-600">Milestone tests and a final exam lead to a verifiable Certificate of Completion for every program you finish.</p>
              </div>
            </div>

            {/* Free tools strip */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="lg:flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase">Free</span>
                  <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1">Study tools, free for everyone</h3>
                  <p className="text-sm text-gray-600">No account needed — open to every student of the Qur'an.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/tools/examples" className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all">
                    <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Shawaahid</p>
                      <p className="text-xs text-gray-500 truncate">Qur'anic Examples Finder</p>
                    </div>
                  </a>
                  <a href="/tools/roots" className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all">
                    <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Tasreef</p>
                      <p className="text-xs text-gray-500 truncate">Root Word Explorer</p>
                    </div>
                  </a>
                  <a href="/tools" className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors whitespace-nowrap">
                    All tools <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Section CTA */}
          <div className="mt-10 sm:mt-14 text-center">
            <p className="text-base sm:text-lg text-gray-600 mb-5">This is what your first week looks like.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/apply">
                <Button variant="emerald" size="lg" className="w-full sm:w-auto">Apply Now</Button>
              </Link>
              <Link to="/programs">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">View Programs</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Full Preview Modal */}
      {showCertPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCertPreview(false)}>
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-[900px] w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sample Certificate Preview</h3>
              <button onClick={() => setShowCertPreview(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Full certificate matching CertificateTemplate */}
            <div className="relative overflow-hidden mx-auto" style={{ background: '#fffdf7', maxWidth: '800px', aspectRatio: '1122/793' }}>
              {/* SAMPLE watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <span className="text-7xl sm:text-8xl font-black text-red-400/15 uppercase tracking-[0.25em] -rotate-12 select-none">SAMPLE</span>
              </div>
              {/* Borders */}
              <div className="absolute" style={{ inset: '8px', border: '2px solid #059669', borderRadius: '2px' }} />
              <div className="absolute" style={{ inset: '14px', border: '1px solid #a7f3d0', borderRadius: '2px' }} />
              {/* Watermark logo */}
              <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03 }}>
                <img src="/favicon.svg" alt="" className="w-48 h-48" />
              </div>
              {/* Content */}
              <div className="absolute flex flex-col items-center justify-center text-center p-8" style={{ inset: '30px' }}>
                <img src="/favicon.svg" alt="" className="w-10 h-10 mb-1" />
                <p className="text-xs font-brand font-semibold text-emerald-800 mb-0.5" style={{ letterSpacing: '0.02em' }}>The FastTrack Madrasah</p>
                <p className="text-[8px] text-gray-400 uppercase tracking-[0.15em] mb-4">New Zealand</p>
                <h4 className="text-xl sm:text-2xl font-bold uppercase text-emerald-800 tracking-wider mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Certificate of Completion</h4>
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-400 mb-5">Tajweed Mastery Program</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">This is to certify that</p>
                <p className="text-2xl font-semibold italic text-emerald-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Aminah Rahman</p>
                <p className="text-xs text-gray-500 mb-1">has successfully completed the</p>
                <p className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>TMP — Tajweed Mastery Program</p>
                <p dir="rtl" className="text-base font-arabic text-gray-400 mt-1 mb-4">برنامج إتقان التجويد</p>
                {/* Scores */}
                <div className="flex gap-8 mb-5">
                  {[{ l: 'Milestone Average', v: '82.5%' }, { l: 'Final Exam', v: '88.0%' }, { l: 'Weighted Total', v: '85.3%' }].map(s => (
                    <div key={s.l} className="text-center">
                      <p className="text-[7px] uppercase tracking-wider text-gray-400">{s.l}</p>
                      <p className="text-lg font-bold text-emerald-600" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {/* Signatures */}
                <div className="flex gap-16">
                  {[{ name: 'Dr Abdulquadri Alaka', title: 'Program Director' }, { name: 'Ustadh Ibrahim', title: 'Instructor' }].map(sig => (
                    <div key={sig.title} className="text-center min-w-[120px]">
                      <p className="text-lg text-emerald-800" style={{ fontFamily: "'Great Vibes', cursive" }}>{sig.name}</p>
                      <div className="w-28 border-b border-gray-300 mb-1 mx-auto" />
                      <p className="text-[9px] font-semibold tracking-wider">{sig.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-[8px] text-gray-400">Issued: 15 March 2026</p>
                <p className="text-[7px] text-gray-300">Verification ID: TMP-2026-00042 · Verify at thefasttrackmadrasah.com/verify</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">This is a sample certificate. Actual certificates are issued upon program completion.</p>
          </div>
        </div>
      )}

      {/* Diagonal seam into Who We Serve */}
      <DiagonalSeam from="bg-white" to="bg-gray-50" direction="up" />

      {/* Who We Serve - Target Audience Cards */}
      <section className="bg-gray-50 pb-10 pt-4 sm:pb-24 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Who We Serve
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our programs are designed for Muslims at every stage of their Qur'anic journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Absolute Beginners & New Muslims */}
            <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-emerald-600/15 group-hover:text-emerald-600/30 transition-colors select-none mb-3">
                    01
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Absolute Beginners</h3>
                  <p className="text-sm text-gray-500 font-medium">& New Muslims</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Never read Arabic before? Our <span className="font-semibold text-gray-900">QARI program</span> takes you from zero to fluent Qur'an reading in {PROGRAMS[PROGRAM_IDS.QARI].duration.display}.
                </p>
                <Link to="/programs#qari" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <span>Learn about QARI</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Can Read but No Tajweed */}
            <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-emerald-600/15 group-hover:text-emerald-600/30 transition-colors select-none mb-3">
                    02
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Can Read</h3>
                  <p className="text-sm text-gray-500 font-medium">But Don't Know Tajweed</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Completed Qur'an but can't apply proper rules? Our <span className="font-semibold text-gray-900">Tajweed Mastery Program</span> perfects your recitation in {PROGRAMS[PROGRAM_IDS.TAJWEED].duration.display}.
                </p>
                <Link to="/programs#tajweed" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <span>Learn about TMP</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Want to Understand */}
            <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-emerald-600/15 group-hover:text-emerald-600/30 transition-colors select-none mb-3">
                    03
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Want to Understand</h3>
                  <p className="text-sm text-gray-500 font-medium">What You're Reading</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Bridge the gap between reading and understanding. Our <span className="font-semibold text-gray-900">EASI program</span> teaches Arabic grammar and Islamic sciences in {PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.display}.
                </p>
                <Link to="/programs#easi" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <span>Learn about EASI</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Parents & Children */}
            <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-emerald-600/15 group-hover:text-emerald-600/30 transition-colors select-none mb-3">
                    04
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Parents & Children</h3>
                  <p className="text-sm text-gray-500 font-medium">Learning Together</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  For children who can read Qur'an, combining <span className="font-semibold text-gray-900">Tajweed + EASI</span> deepens their understanding and connection with what they recite.
                </p>
                <Link to="/programs" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <span>View all programs</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* CTA with Application and Contact Info */}
          <div className="mt-12 sm:mt-16">
            <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                Ready to Begin Your Journey?
              </h3>
              <p className="text-gray-600 mb-4">
                Reclaim your connection to the Qur'an and Sunnah through a structured, time-bound methodology that meets you where you are.
              </p>
              <p className="text-gray-600 mb-6 text-sm">
                Not sure which program is right for you? We're here to help.
              </p>
              <div className="flex flex-col gap-4">
                 <Link to="/apply#select-your-program" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors text-sm mx-auto">
                    <span>Start Your Application</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Have questions?</p>
                  <a href="mailto:salam@tftmadrasah.nz" className="text-gray-700 font-medium hover:text-emerald-600 flex items-center gap-2 transition-colors text-sm">
                    <Mail className="h-4 w-4" />
                    salam@tftmadrasah.nz
                  </a>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <a href="tel:+64272131486" className="text-gray-700 font-medium hover:text-emerald-600 flex items-center gap-2 transition-colors text-sm">
                    <Phone className="h-4 w-4" />
                    +6427 213 1486
                  </a>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-medium hover:text-emerald-600 flex items-center gap-2 transition-colors text-sm">
                    <MessageCircle className="h-4 w-4" />
                    +6422 465 3509
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-white py-10 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-8 sm:mb-16">
            Our Approach
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 0 ? null : 0)}
                className="w-full p-6 text-left md:cursor-default"
              >
                <div>
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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      Everyone learns at their own pace. We adapt to your schedule and pace, whether you're studying solo or with family members. When it makes sense, we group students with similar backgrounds to build peer support while keeping you accountable.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 1 ? null : 1)}
                className="w-full p-6 text-left md:cursor-default"
              >

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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      We don't just teach Arabic - we cultivate Islamic character rooted in the Qur'an and Sunnah. You'll learn to read, understand, and embody what you're learning through proper Islamic manners and devotion.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 2 ? null : 2)}
                className="w-full p-6 text-left md:cursor-default"
              >

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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      We use authentic Islamic texts that have educated students for centuries. During Arabic and Tajweed classes, teachers write on the board live and students take physical notes. This traditional method develops your Arabic handwriting and helps knowledge stick better than passive learning.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 3 ? null : 3)}
                className="w-full p-6 text-left md:cursor-default"
              >

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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      All classes run online via secure video conferencing. Whether you're in Auckland, Wellington, or anywhere in New Zealand, quality Islamic education is just a click away. No geographical barriers, no compromising on traditional standards.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 4 ? null : 4)}
                className="w-full p-6 text-left md:cursor-default"
              >

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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      Regular milestone tests and a final exam ensure you truly grasp what you're learning. Our platform tracks your scores, weighted totals, and progress — giving you and your teacher clear visibility. Pass all assessments to earn a verifiable program certificate.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <button
                onClick={() => setOpenApproachCard(openApproachCard === 5 ? null : 5)}
                className="w-full p-6 text-left md:cursor-default"
              >

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
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                      You get a dedicated mentor who follows up with you personally, supports your learning, and helps you navigate life's challenges through an Islamic lens. We're in this with you beyond just the classroom.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Diagonal seam into The Path to Mastery */}
      <DiagonalSeam from="bg-white" to="bg-gray-50" direction="down" />

      {/* How Admission Works Section */}
      <section className="bg-gray-50 pb-10 pt-4 sm:pb-24 sm:pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-8 sm:mb-16">
            The Path to Mastery
          </h2>

          {/* Mobile: Timeline Layout */}
          <div className="md:hidden relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-200"></div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">1</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Online Application</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Submit your details through our streamlined portal to begin the selection process.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">2</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Evaluation & Interview</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Our team reviews your background and conducts a brief interview to discuss your goals.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">3</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Selection & Enrollment</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Receive your offer and secure your place through our secure payment gateway.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">4</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Onboarding & Mentorship</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Get your Student ID and be matched with an expert mentor for guidance.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">5</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Guided Execution</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Engage in intensive instruction and regular assessments with consistent follow-up.</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">6</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Final Validation</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Complete your final evaluation to demonstrate mastery of the program objectives.</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">7</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Certification & Alumni</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">Graduate with a Certificate of Completion and join our alumni network.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Clean Grid Layout */}
          <div className="hidden md:block">
            {/* Row 1: Steps 1-4 */}
            <div className="grid grid-cols-4 gap-6 lg:gap-8 mb-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Online Application</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Submit your details through our streamlined portal.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Evaluation & Interview</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Our team reviews your background and discusses your goals.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Selection & Enrollment</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Receive your offer and secure your place.</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Onboarding & Mentorship</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Get your Student ID and be matched with an expert mentor.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Steps 5-7 */}
            <div className="grid grid-cols-4 gap-6 lg:gap-8">
              {/* Step 5 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Guided Execution</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Engage in intensive instruction and regular assessments.</p>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Final Validation</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Complete your final evaluation to demonstrate mastery.</p>
                  </div>
                </div>
              </div>

              {/* Step 7 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">7</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Certification & Alumni</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">Graduate with a Certificate and join our alumni network.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flexible Learning for Every Lifestyle */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-10 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Designed for Your Life
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're working full-time, raising children, studying, or retired—our programs adapt to your schedule and commitments
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Working Professionals */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Evening & Weekend Classes</h3>
                <p className="text-xs text-gray-500">For Working Professionals</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Classes scheduled outside work hours so you can pursue Qur'anic education without compromising your career. Learn at your own pace with dedicated mentorship.
              </p>
            </div>

            {/* Parents & Homemakers */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Daytime Sessions</h3>
                <p className="text-xs text-gray-500">For Parents & Homemakers</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Morning and afternoon options while children are at school or napping. Learn alongside your family and guide them with confidence in their own Qur'anic journey.
              </p>
            </div>

            {/* Seniors & Beginners */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Patient Instruction</h3>
                <p className="text-xs text-gray-500">For Seniors & Beginners</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                It's never too late to start. Our teachers provide age-appropriate, patient guidance with small class sizes ensuring personal attention at a comfortable pace.
              </p>
            </div>

            {/* Students & Youth */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Structured Timelines</h3>
                <p className="text-xs text-gray-500">For Students & Youth</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Clear goals and accountability to keep you on track between lectures and assignments. Online format fits seamlessly into your digital lifestyle with mentorship support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link Section */}
      <section className="py-10 md:py-24 bg-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Have Questions?
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Check out our comprehensive FAQ page for answers about programs, admission process, materials, and more
            </p>
             <Link to="/faqs#frequently-asked-questions" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-emerald-600 group-hover:gap-3 transition-all">
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors">
                <span>View FAQs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Diagonal seam into the closing CTA */}
      <DiagonalSeam from="bg-gray-100" to="bg-emerald-900" direction="up" height="h-12 sm:h-20" />

      <section className="py-12 md:py-24 bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Begin Your Learning Journey
          </h2>
          <p className="text-lg text-emerald-200 mb-8 max-w-2xl mx-auto">
            Join students worldwide in authentic Islamic education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply">
              <Button variant="secondary" size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 w-full sm:w-auto">
                Apply Now
              </Button>
            </Link>
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-emerald-800 hover:border-white w-full sm:w-auto flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Support Us
              </Button>
            </a>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-emerald-800 hover:border-white w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
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
                    <span className="text-sm font-brand font-semibold text-white" style={{letterSpacing: "0.005em"}}>The FastTrack</span>
                    <span className="text-sm font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
                  {/* <div className="text-xs text-gray-400 font-arabic">الفلاح</div> */}
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Flexible. Structured. Tailored.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.facebook.com/share/1BLq4A9uWp/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-emerald-800 text-gray-300 hover:text-white hover:border-emerald-700 hover:bg-emerald-900 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/the.fasttrack.madrasah?igsh=MWN1dGE1bzc1Nms4dg%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-emerald-800 text-gray-300 hover:text-white hover:border-emerald-700 hover:bg-emerald-900 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/mission" className="text-gray-400 hover:text-white">Our Mission</Link></li>
                <li><a href="/programs" className="text-gray-400 hover:text-white">Programs</a></li>
                <li><Link to="/apply" className="text-gray-400 hover:text-white">Apply Now</Link></li>
                <li>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Support Our Mission
                  </a>
                </li>
                <li><Link to="/vacancies" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li className="pt-2 border-t border-emerald-900">
                  <Link to="/login" className="text-gray-500 hover:text-gray-300 text-xs">Sign In</Link>
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

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full border border-emerald-700 transition-colors"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
