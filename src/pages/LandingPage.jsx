import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, Mic, CheckCircle, Menu, X, Heart, ChevronDown, ArrowUp, Rocket, ArrowRight, Mail, Phone, MessageCircle, ShoppingBag, Newspaper, Clock, Infinity as InfinityIcon, Search, Facebook, Instagram, Youtube, Languages } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [latestArticles, setLatestArticles] = useState([]);

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [drillPreviewStep, setDrillPreviewStep] = useState(0);
  const [showCertPreview, setShowCertPreview] = useState(false);

  // Background image URL from Supabase with fallback to iStock
  const bgImageUrl = storage.getPublicUrl('payment-documents', 'public/landing-bg.jpg');
  // Real lightboard teaching photo (a teacher writing tajwīd on the e-glass board)
  const lightboardImageUrl = storage.getPublicUrl('lesson-images', 'public/landing-lightboard.webp');

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
      <Helmet>
        <title>Join our dedicated student body and master Qur'an, Tajwīd, Arabic, & Islamic sciences from anywhere in the world. | The FastTrack Madrasah</title>
        <meta name="description" content="A structured online madrasah that feels like a real physical class — live and self-paced classes, real teachers, and graded assessment. Based in New Zealand, open worldwide." />
        <link rel="canonical" href="https://www.tftmadrasah.nz/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.tftmadrasah.nz/" />
        <meta property="og:title" content="Join our dedicated student body and master Qur'an, Tajwīd, Arabic, & Islamic sciences from anywhere in the world." />
        <meta property="og:description" content="A structured online madrasah that feels like a real physical class — live and self-paced classes, real teachers, and graded assessment. Based in New Zealand, open worldwide." />
        <meta property="og:site_name" content="The FastTrack Madrasah" />
        <meta property="og:locale" content="en_NZ" />
        {/* og:image / twitter:image are the site-wide default in index.html (single source) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Join our dedicated student body and master Qur'an, Tajwīd, Arabic, & Islamic sciences from anywhere in the world." />
        <meta name="twitter:description" content="A structured online madrasah that feels like a real physical class — live and self-paced classes, real teachers, and graded assessment. Based in New Zealand, open worldwide." />
      </Helmet>
      {/* Navigation - Clean professional design */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-shadow pb-3 bg-[#fbf9f4] border-b border-[#e6e0d3] ${
        isScrolled ? 'shadow-sm' : ''
      }`}>
        <div className={`px-3 sm:px-6 lg:px-8 ${!isScrolled ? 'bg-transparent' : ''}`}>
            <div className={`flex justify-between items-center h-14 lg:h-16 ${!isScrolled ? 'bg-transparent' : ''}`}>
              {/* Logo only on mobile, Logo + Brand name on desktop */}
              <Link to="/" className="flex items-center gap-2.5">
                <img
                  src="/favicon-wine.svg"
                  alt="The FastTrack Madrasah Logo"
                  className="h-7 w-7 lg:h-9 lg:w-9 transition-all duration-300"
                />
                {/* Brand name - hidden on mobile, shown on desktop */}
                <div className="hidden lg:flex flex-col justify-center leading-tight">
                  <span className="text-sm font-brand font-semibold text-[#2a1e1a]" style={{letterSpacing: "0.005em"}}>The FastTrack</span>
                  <span className="text-sm font-brand font-semibold text-[#2a1e1a]" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
              </Link>

              {/* Desktop Navigation - all links on the right */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Navigation links - hover changes text color to wine-600 */}
                <Link to="/mission">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Our Mission
                  </button>
                </Link>
                 <Link to="/programs#our-programs" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Programs
                  </button>
                </Link>
                <Link to="/blog">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Blog
                  </button>
                </Link>
                <Link to="/tools">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Tools
                  </button>
                </Link>
                <Link to="/store">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Store
                  </button>
                </Link>
                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Donate
                  </button>
                </a>
                <Link to="/login">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors text-[#3d372e] hover:text-wine-600`}>
                    Login
                  </button>
                </Link>
                <Link to="/apply">
                  <button className="px-5 py-2 ml-2 text-sm font-medium text-white bg-wine-600 hover:bg-wine-700 rounded transition-colors">
                    Apply Now
                  </button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  isScrolled
                    ? 'text-[#2a1e1a] hover:bg-[#efe9dd]'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-wine-800/50 bg-wine-950 mt-3">
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
                    <button className="w-full px-4 py-2.5 mt-2 text-sm font-medium text-white bg-wine-600 hover:bg-wine-700 rounded transition-colors">
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

      {/* Hero — split: a burgundy scripture panel beside the cream welcome. */}
      <section className="relative bg-[#faf6f0] overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[calc(100vh-72px)]">

          {/* Left — burgundy feature panel with the rotating hadith */}
          <div className="relative bg-gradient-to-br from-wine-700 to-wine-900 overflow-hidden flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-0 order-2 lg:order-1">
            {/* faint brand mark watermark */}
            <img src="/tftmadrasah-logo-white.svg" alt="" aria-hidden="true"
                 className="absolute -right-16 top-1/2 -translate-y-1/2 h-[110%] opacity-[0.06] pointer-events-none" />
            <div className="relative max-w-md">
              <img src="/tftmadrasah-logo-white.svg" alt="" className="h-12 sm:h-14 mb-8" />
              <blockquote key={currentQuote} className="animate-[fadeIn_0.6s_ease]">
                <p className="font-display text-xl sm:text-2xl lg:text-[28px] leading-snug text-[#f4d9a8] font-semibold">
                  &ldquo;{quotes[currentQuote].text}&rdquo;
                </p>
                <cite className="not-italic block mt-5 text-[13px] sm:text-sm tracking-[0.12em] uppercase text-[#e6c9cd]">
                  {quotes[currentQuote].source}
                </cite>
              </blockquote>
              {/* rotation dots */}
              <div className="flex gap-2 mt-8">
                {quotes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuote(idx)}
                    aria-label={`Show narration ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${idx === currentQuote ? 'w-7 bg-[#f4d9a8]' : 'w-3 bg-white/25 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — welcome + call to action */}
          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-0 order-1 lg:order-2">
            <div className="max-w-xl">
              <p className="text-xs sm:text-[13px] font-semibold tracking-[0.22em] uppercase text-wine-700 mb-5">
                Online · New Zealand · Worldwide
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#2a1e1a] tracking-tight leading-[1.04] mb-6">
                A real madrasah,<br />wherever you are
              </h1>
              <p className="text-base sm:text-lg text-[#584c44] leading-relaxed mb-8">
                Qur&apos;an, Tajwīd, Arabic, and the Islamic sciences — structured programs
                with real teachers who know your name, live classes and self-paced courses,
                and progress you can see.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/apply">
                  <Button variant="wine" size="lg" className="w-full sm:w-auto">Apply for the next intake</Button>
                </Link>
                <Link to="/programs">
                  <Button variant="wineOutline" size="lg" className="w-full sm:w-auto">See programs</Button>
                </Link>
              </div>
              {/* program chips */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-md">
                {[
                  { t: 'QARI', d: 'Read from zero' },
                  { t: 'Tajwīd', d: 'Recite correctly' },
                  { t: 'Arabic & Islam', d: 'Understand the dīn' },
                ].map((c) => (
                  <Link key={c.t} to="/programs"
                    className="rounded-xl bg-white border border-[#ece3d8] px-3 py-3 hover:border-wine-300 hover:shadow-sm transition-all">
                    <div className="font-semibold text-[#2a1e1a] text-sm leading-tight">{c.t}</div>
                    <div className="text-[#8a7d72] text-xs mt-0.5">{c.d}</div>
                  </Link>
                ))}
              </div>
              {latestArticles.length > 0 && (
                <Link to="/blog" className="group inline-flex items-center gap-2 mt-8 text-sm font-semibold text-wine-700 hover:text-wine-800">
                  <Newspaper className="h-4 w-4" />
                  Latest articles & insights
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Student Experience — opens with the real class, then the tools that carry it */}
      <section id="experience" className="bg-white overflow-hidden">
        {/* Lead: a real class in session */}
        <div className="relative bg-[#4a1d25]">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 items-stretch">
            {/* Copy */}
            <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-20 lg:py-28 flex flex-col justify-center order-2 lg:order-1">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.1] mb-5">
                A real teacher,<br className="hidden sm:block" /> at your own pace
              </h2>
              <p className="text-base sm:text-lg text-[#e8d5d8] leading-relaxed max-w-xl mb-8">
                Every rule is taught in front of you, and a teacher hears you recite and
                corrects you. Join a live class or follow the same lessons at your own pace —
                either way you are known by name, guided, and held to a clear standard.
              </p>
              <ul className="space-y-3.5">
                {[
                  { Icon: Video, text: 'Live classes and self-paced courses — learn the way that fits your week' },
                  { Icon: Users, text: 'Teachers who know your name, hear your recitation, and correct it' },
                  { Icon: CheckCircle, text: 'Graded checkpoints along the way, so you always know where you stand' },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-wine-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm sm:text-base text-[#f0e5e7]">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Photo — shown in full, never cropped; it sits on the section's dark
                ground so the letterbox is invisible and the writing stays readable. */}
            <div className="relative order-1 lg:order-2 min-h-[280px] sm:min-h-[400px] lg:min-h-full flex items-center justify-center py-4 lg:py-8">
              <img
                src={lightboardImageUrl}
                alt="A FastTrack Madrasah teacher writing Arabic rules in glowing marker during a live lesson"
                loading="lazy"
                width="1536"
                height="886"
                className="w-full h-full object-contain animate-lightboard-in"
              />
            </div>
          </div>
        </div>

        {/* What you get — the tools that carry the class, as a clean feature grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-14 sm:mb-16 max-w-2xl mx-auto">
            <p className="text-xs sm:text-[13px] font-semibold tracking-[0.22em] uppercase text-wine-700 mb-4">More than lectures</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#2a1e1a] mb-4">
              Everything you need to keep going
            </h2>
            <p className="text-lg text-[#584c44]">
              Between classes, the practice, feedback, and progress that turn a lesson into real mastery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Mic, title: 'Weekly recitation feedback', body: 'Record your recitation and send it to your teacher. Get graded, personal notes on your tajwīd every week — not only at exam time.' },
              { Icon: InfinityIcon, title: 'Practice drills', body: 'Endless, curated drills for Tajwīd and Arabic. Build streaks, earn points, and see your accuracy climb between lessons.' },
              { Icon: GraduationCap, title: 'Tests & certificates', body: 'Milestone tests and a final exam lead to a verifiable Certificate of Completion for every program you finish.' },
              { Icon: BookOpen, title: 'Free study tools', body: 'A Qur’anic examples finder, root-word explorer, and grammar tools — open to everyone, no account needed.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-[#ece3d8] p-6 hover:shadow-[0_20px_40px_-24px_rgba(74,29,37,0.4)] hover:border-wine-200 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-wine-50 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-wine-700" strokeWidth={1.9} />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#2a1e1a] mb-2 leading-snug">{title}</h3>
                <p className="text-sm text-[#6b6055] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            <Link to="/apply"><Button variant="wine" size="lg" className="w-full sm:w-auto">Apply for the next intake</Button></Link>
            <Link to="/tools"><Button variant="wineOutline" size="lg" className="w-full sm:w-auto">Try the free tools</Button></Link>
          </div>
        </div>
      </section>

      {/* Certificate Full Preview Modal */}
      {showCertPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCertPreview(false)}>
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-[900px] w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#2a1e1a]">Sample Certificate Preview</h3>
              <button onClick={() => setShowCertPreview(false)} className="p-2 text-[#8a8172] hover:text-[#57503f] hover:bg-[#efe9dd] rounded-lg transition-colors">
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
                <img src="/favicon-wine.svg" alt="" className="w-48 h-48" />
              </div>
              {/* Content */}
              <div className="absolute flex flex-col items-center justify-center text-center p-8" style={{ inset: '30px' }}>
                <img src="/favicon-wine.svg" alt="" className="w-10 h-10 mb-1" />
                <p className="text-xs font-brand font-semibold text-wine-800 mb-0.5" style={{ letterSpacing: '0.02em' }}>The FastTrack Madrasah</p>
                <p className="text-[8px] text-[#8a8172] uppercase tracking-[0.15em] mb-4">New Zealand</p>
                <h4 className="text-xl sm:text-2xl font-bold uppercase text-wine-800 tracking-wider mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Certificate of Completion</h4>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8172] mb-5">Tajweed Mastery Program</p>
                <p className="text-[10px] uppercase tracking-wider text-[#8a8172] mb-2">This is to certify that</p>
                <p className="text-2xl font-semibold italic text-wine-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Aminah Rahman</p>
                <p className="text-xs text-[#6b6353] mb-1">has successfully completed the</p>
                <p className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>TMP — Tajweed Mastery Program</p>
                <p dir="rtl" className="text-base font-arabic text-[#8a8172] mt-1 mb-4">برنامج إتقان التجويد</p>
                {/* Scores */}
                <div className="flex gap-8 mb-5">
                  {[{ l: 'Milestone Average', v: '82.5%' }, { l: 'Final Exam', v: '88.0%' }, { l: 'Weighted Total', v: '85.3%' }].map(s => (
                    <div key={s.l} className="text-center">
                      <p className="text-[7px] uppercase tracking-wider text-[#8a8172]">{s.l}</p>
                      <p className="text-lg font-bold text-wine-600" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {/* Signatures */}
                <div className="flex gap-16">
                  {[{ name: 'Dr Abdulquadri Alaka', title: 'Program Director' }, { name: 'Ustadh Ibrahim', title: 'Instructor' }].map(sig => (
                    <div key={sig.title} className="text-center min-w-[120px]">
                      <p className="text-lg text-wine-800" style={{ fontFamily: "'Great Vibes', cursive" }}>{sig.name}</p>
                      <div className="w-28 border-b border-[#d9d2c4] mb-1 mx-auto" />
                      <p className="text-[9px] font-semibold tracking-wider">{sig.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-[8px] text-[#8a8172]">Sample — issued on completion</p>
                <p className="text-[7px] text-[#d9d2c4]">Each certificate carries a verification ID, checkable at tftmadrasah.nz</p>
              </div>
            </div>
            <p className="text-center text-xs text-[#8a8172] mt-4">This is a sample certificate. Actual certificates are issued upon program completion.</p>
          </div>
        </div>
      )}


      {/* Who We Serve — the one deep-green feature band. The brand colour as a
          full-bleed ground reads as a deliberate POV; white cards sit crisply on
          it. Ink inverts to chalk/mint. */}
      <section className="bg-[#57202a] pb-10 pt-4 sm:pb-24 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
              Who We Serve
            </h2>
            <p className="text-lg text-wine-100/80 max-w-3xl mx-auto">
              Programs for every stage — from your first Arabic letters to reading the Qurʾān, understanding the language, and studying the Islamic sciences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Absolute Beginners & New Muslims */}
            <div className="group bg-white border border-[#e6e0d3] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#d9d2c4] transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-[#cfc6b4] group-hover:text-wine-600 transition-colors duration-300 select-none mb-3">
                    01
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a1e1a] mb-1">Absolute Beginners</h3>
                  <p className="text-sm text-[#6b6353] font-medium">& New Muslims</p>
                </div>
                <p className="text-sm text-[#57503f] leading-relaxed mb-6">
                  Never read Arabic before? Our <span className="font-semibold text-[#2a1e1a]">QARI program</span> takes you from zero to fluent Qur'an reading in {PROGRAMS[PROGRAM_IDS.QARI].duration.display}.
                </p>
                <Link to="/programs#qari" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <span>Learn about QARI</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Can Read but No Tajweed */}
            <div className="group bg-white border border-[#e6e0d3] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#d9d2c4] transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-[#cfc6b4] group-hover:text-wine-600 transition-colors duration-300 select-none mb-3">
                    02
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a1e1a] mb-1">Can Read</h3>
                  <p className="text-sm text-[#6b6353] font-medium">But Don't Know Tajweed</p>
                </div>
                <p className="text-sm text-[#57503f] leading-relaxed mb-6">
                  Completed Qur'an but can't apply proper rules? Our <span className="font-semibold text-[#2a1e1a]">Tajweed Mastery Program</span> perfects your recitation in {PROGRAMS[PROGRAM_IDS.TAJWEED].duration.display}.
                </p>
                <Link to="/programs#tajweed" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <span>Learn about TMP</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Want to Understand */}
            <div className="group bg-white border border-[#e6e0d3] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#d9d2c4] transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-[#cfc6b4] group-hover:text-wine-600 transition-colors duration-300 select-none mb-3">
                    03
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a1e1a] mb-1">Want to Understand</h3>
                  <p className="text-sm text-[#6b6353] font-medium">What You're Reading</p>
                </div>
                <p className="text-sm text-[#57503f] leading-relaxed mb-6">
                  Bridge the gap between reading and understanding. Our <span className="font-semibold text-[#2a1e1a]">EASI program</span> teaches Arabic grammar and Islamic sciences in {PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.display}.
                </p>
                <Link to="/programs#easi" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <span>Learn about EASI</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Parents & Children */}
            <div className="group bg-white border border-[#e6e0d3] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#d9d2c4] transition-all duration-300">
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter text-[#cfc6b4] group-hover:text-wine-600 transition-colors duration-300 select-none mb-3">
                    04
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a1e1a] mb-1">Parents & Children</h3>
                  <p className="text-sm text-[#6b6353] font-medium">Learning Together</p>
                </div>
                <p className="text-sm text-[#57503f] leading-relaxed mb-6">
                  For children who can read Qur'an, combining <span className="font-semibold text-[#2a1e1a]">Tajweed + EASI</span> deepens their understanding and connection with what they recite.
                </p>
                <Link to="/programs" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <span>View all programs</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* CTA with Application and Contact Info */}
          <div className="mt-12 sm:mt-16">
            <div className="text-center p-8 bg-white rounded-lg border border-[#e6e0d3]">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#2a1e1a] mb-3">
                Not sure where you fit?
              </h3>
              <p className="text-[#57503f] mb-4">
                Each program has a clear start point and a fixed length, grounded in the Qur'an and Sunnah. Tell us where you are and we'll place you.
              </p>
              <p className="text-[#57503f] mb-6 text-sm">
                Still deciding? Message us and we'll help you choose.
              </p>
              <div className="flex flex-col gap-4">
                 <Link to="/apply#select-your-program" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-wine-600 hover:bg-wine-700 text-white font-medium rounded transition-colors text-sm mx-auto">
                    <span>Start Your Application</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2 border-t border-[#e6e0d3]">
                  <p className="text-sm text-[#6b6353]">Have questions?</p>
                  <a href="mailto:salam@tftmadrasah.nz" className="text-[#3d372e] font-medium hover:text-wine-600 flex items-center gap-2 transition-colors text-sm">
                    <Mail className="h-4 w-4" />
                    salam@tftmadrasah.nz
                  </a>
                  <span className="hidden sm:inline text-[#d9d2c4]">|</span>
                  <a href="tel:+64272131486" className="text-[#3d372e] font-medium hover:text-wine-600 flex items-center gap-2 transition-colors text-sm">
                    <Phone className="h-4 w-4" />
                    +6427 213 1486
                  </a>
                  <span className="hidden sm:inline text-[#d9d2c4]">|</span>
                  <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-[#3d372e] font-medium hover:text-wine-600 flex items-center gap-2 transition-colors text-sm">
                    <MessageCircle className="h-4 w-4" />
                    +6422 465 3509
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How Admission Works Section */}
      <section className="bg-white pb-10 pt-4 sm:pb-24 sm:pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[#2a1e1a] text-center mb-8 sm:mb-16">
            The Path to Mastery
          </h2>

          {/* Mobile: Timeline Layout */}
          <div className="md:hidden relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-wine-200"></div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">1</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Online Application</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Submit your details online to begin the selection process.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">2</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Evaluation & Interview</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Our team reviews your background and conducts a brief interview to discuss your goals.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">3</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Selection & Enrollment</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Receive your offer and secure your place through our secure payment gateway.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">4</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Onboarding & Mentorship</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Get your Student ID and be matched with an expert mentor for guidance.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">5</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Study & Drills</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Attend lectures, work through drills, and sit regular assessments with your mentor following up.</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">6</div>
                <div className="flex-1 pb-2">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Final Exam</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Sit the final exam to complete the program.</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">7</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Certification & Alumni</h3>
                  <p className="text-xs text-[#57503f] leading-relaxed">Graduate with a Certificate of Completion and join our alumni network.</p>
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
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Online Application</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Submit your details online to apply.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Evaluation & Interview</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Our team reviews your background and discusses your goals.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Selection & Enrollment</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Receive your offer and secure your place.</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Onboarding & Mentorship</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Get your Student ID and be matched with an expert mentor.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Steps 5-7 */}
            <div className="grid grid-cols-4 gap-6 lg:gap-8">
              {/* Step 5 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Study & Drills</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Attend lectures, work through drills, and sit regular assessments.</p>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Final Exam</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Sit the final exam to complete the program.</p>
                  </div>
                </div>
              </div>

              {/* Step 7 */}
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-wine-600 text-white rounded-full flex items-center justify-center text-sm font-bold">7</div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-semibold text-[#2a1e1a] mb-1">Certification & Alumni</h3>
                    <p className="text-xs text-[#57503f] leading-relaxed">Graduate with a Certificate and join our alumni network.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ Link Section */}
      <section className="py-10 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-[#e6e0d3] p-8 sm:p-12 text-center shadow-sm">
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-[#2a1e1a] mb-3 sm:mb-4">
              Have Questions?
            </h2>
            <p className="text-sm sm:text-lg text-[#57503f] mb-6 sm:mb-8">
              Answers on programs, admission, fees, and how classes run.
            </p>
             <Link to="/faqs#frequently-asked-questions" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 text-sm font-medium text-[#2a1e1a] hover:text-wine-600 group-hover:gap-3 transition-all">
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-wine-600 hover:bg-wine-700 text-white font-medium rounded transition-colors">
                <span>View FAQs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}

      <section className="py-12 md:py-24 bg-wine-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Apply for the next intake
          </h2>
          <p className="text-lg text-wine-200 mb-8 max-w-2xl mx-auto">
            Submit an application, and we'll match you to the right program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply">
              <Button variant="secondary" size="lg" className="bg-white text-wine-900 hover:bg-wine-50 w-full sm:w-auto">
                Apply Now
              </Button>
            </Link>
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-wine-800 hover:border-white w-full sm:w-auto flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Support Us
              </Button>
            </a>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-wine-800 hover:border-white w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-wine-950 text-white py-12">
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
                  {/* <div className="text-xs text-wine-100/70 font-arabic">الفلاح</div> */}
                </div>
              </div>
              <p className="text-wine-100/70 text-sm mb-4">
                Flexible. Structured. Tailored.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.facebook.com/share/1BLq4A9uWp/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-wine-800 text-wine-50 hover:text-white hover:border-wine-700 hover:bg-wine-900 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/the.fasttrack.madrasah?igsh=MWN1dGE1bzc1Nms4dg%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-wine-800 text-wine-50 hover:text-white hover:border-wine-700 hover:bg-wine-900 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com/@tftmadrasah"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-wine-800 text-wine-50 hover:text-white hover:border-wine-700 hover:bg-wine-900 transition-colors"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/mission" className="text-wine-100/70 hover:text-white">Our Mission</Link></li>
                <li><a href="/programs" className="text-wine-100/70 hover:text-white">Programs</a></li>
                <li><Link to="/apply" className="text-wine-100/70 hover:text-white">Apply Now</Link></li>
                <li>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" className="text-wine-100/70 hover:text-rose-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Support Our Mission
                  </a>
                </li>
                <li><Link to="/vacancies" className="text-wine-100/70 hover:text-white">Careers</Link></li>
                <li className="pt-2 border-t border-wine-900">
                  <Link to="/login" className="text-wine-200/50 hover:text-wine-100 text-xs">Sign In</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-wine-100/70 text-sm mb-4">
                Questions about our programs?
              </p>
              <div className="space-y-2">
                <a href="mailto:salam@tftmadrasah.nz" className="text-wine-50 hover:text-white text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  salam@tftmadrasah.nz
                </a>
                <a href="tel:+64272131486" className="text-wine-50 hover:text-white text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +6427 213 1486
                </a>
                <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-wine-50 hover:text-white text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  +6422 465 3509
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-wine-900 pt-8 text-center text-sm text-wine-200/60">
            <p>© {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-wine-600 hover:bg-wine-700 text-white rounded-full border border-wine-700 transition-colors"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
