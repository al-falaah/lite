import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart, ChevronDown, ArrowUp, Rocket, ArrowRight, Mail, Phone, MessageCircle, ShoppingBag, Newspaper, Clock } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openApproachCard, setOpenApproachCard] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [missionExpanded, setMissionExpanded] = useState(false);
  const [founderBioExpanded, setFounderBioExpanded] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

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
      question: "I can't read Arabic at all. Is there a program for me?",
      subQuestion: "What if I'm an absolute beginner?",
      answer: `Yes! Our QARI program is made for absolute beginners. Over ${PROGRAMS[PROGRAM_IDS.QARI].duration.display}, you'll learn the Arabic alphabet, pronunciation, and develop fluent reading skills. Perfect for adult learners, new Muslims, or anyone starting from zero.`,
      isRecommended: true
    },
    {
      question: "Who are the other programs designed for?",
      subQuestion: "What if I can already read Arabic?",
      answer: `If you can read Arabic with vowel markings, you have two options: TMP (${PROGRAMS[PROGRAM_IDS.TAJWEED].duration.display}) is for those who can read but need proper Tajweed rules. EASI (${PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.display}) is for those who already have Tajweed and want to master Arabic grammar and Islamic sciences.`
    },
    {
      question: "Can I enroll in multiple programs at once?",
      subQuestion: "Should I take more than one track?",
      answer: "We strongly recommend focusing on one program at a time. Our methodology is intensive and designed for deep learning. Splitting your attention dilutes your progress. Start with the track that matches your current level and build from there.",
      isRecommended: true
    },
    {
      question: "What makes FastTrack different from traditional classes?",
      subQuestion: "Why is this approach better?",
      answer: `We have fixed timelines (${PROGRAMS[PROGRAM_IDS.QARI].duration.weeks} weeks for ${PROGRAMS[PROGRAM_IDS.QARI].shortName}, ${PROGRAMS[PROGRAM_IDS.TAJWEED].duration.weeks} weeks for ${PROGRAMS[PROGRAM_IDS.TAJWEED].shortName}, ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].duration.weeks} weeks for ${PROGRAMS[PROGRAM_IDS.ESSENTIALS].shortName}) with clear goals each week. Combined with regular assessments and dedicated mentoring, you stay accountable and make consistent progress—unlike open-ended classes where you can drift.`
    },
    {
      question: "How much time do I need each week?",
      subQuestion: "What's the weekly commitment?",
      answer: "Two live sessions per week: one main class (length varies by program) and one 30-minute mentoring session. Plus 2-3 hours of independent study to practice what you learned that week."
    },
    {
      question: "What if I fall behind?",
      subQuestion: "Can I catch up if life gets busy?",
      answer: "Life happens—we get it. But because we move through the curriculum at a set pace, staying on track is important. If you're struggling, talk to your mentor early. We'll work with you to find solutions, but consistent engagement is key."
    },
    {
      question: "Why do you require a phone interview?",
      subQuestion: "What's the admission process?",
      answer: "The interview helps us place you in the right program based on your current level and goals. Since we move at a structured pace, we want to make sure everyone starts where they'll succeed and stay challenged."
    },
    {
      question: "Do I need to buy textbooks?",
      subQuestion: "What materials do I need?",
      answer: "For QARI, you'll need to buy the primary text (Al-Qāʿidah al-Qurʾāniyyah) from our store or elsewhere. For TMP and EASI, teachers write on the board live and you take physical notes—this builds your Arabic handwriting. We also provide online materials to supplement your learning."
    },
    {
      question: "What does mentoring actually include?",
      subQuestion: "Am I just another student in a Zoom room?",
      answer: "No. We track your progress weekly. If you're struggling with something, your mentor gives you one-on-one attention in your follow-up sessions to fix the gaps before moving forward. You're not invisible here."
    }
  ];

  useEffect(() => {
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

  return (
    <div className="min-h-screen">
      {/* Navigation - Clean professional design */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors pb-3 ${
        isScrolled
          ? 'bg-white border-b border-gray-200'
          : 'bg-transparent'
      }`}>
        <div className={`px-3 sm:px-6 lg:px-8 ${!isScrolled ? 'bg-transparent' : ''}`}>
            <div className={`flex justify-between items-center h-14 md:h-16 ${!isScrolled ? 'bg-transparent' : ''}`}>
              {/* Logo only on mobile, Logo + Brand name on desktop */}
              <Link to="/" className="flex items-center gap-2">
                <img
                  src={isScrolled ? "/favicon.svg" : "/favicon-white.svg"}
                  alt="The FastTrack Madrasah Logo"
                  className="h-7 w-7 md:h-10 md:w-10 transition-all duration-300"
                />
                {/* Brand name - hidden on mobile, shown on desktop */}
                <div className="hidden md:flex flex-col leading-none -space-y-1">
                  <span className={`text-xs sm:text-sm md:text-base font-brand font-semibold transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`} style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className={`text-xs sm:text-sm md:text-base font-brand font-semibold transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`} style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
              </Link>

              {/* Desktop Navigation - all links on the right */}
              <div className="hidden md:flex items-center gap-1">
                {/* Navigation links - hover changes text color to emerald-600 */}
                <a href="#mission">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Our Mission
                  </button>
                </a>
                <Link to="/programs">
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
                <Link to="/resources">
                  <button className={`px-3 lg:px-4 py-2 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-emerald-600'
                      : 'text-white/90 hover:text-emerald-600'
                  }`}>
                    Resources
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
                    Admin
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
                className={`md:hidden p-2 rounded-lg transition-colors ${
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
              <div className="md:hidden border-t border-emerald-800/50 bg-emerald-950 mt-3">
                <div className="flex flex-col gap-1 py-3 px-3">
                  {/* Brand name - shown in mobile menu with larger font */}
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mb-2 pb-3 border-b border-white/10">
                    <div className="flex flex-col leading-none -space-y-1 px-4">
                      <span className="text-lg font-brand font-semibold text-white" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                      <span className="text-lg font-brand font-semibold text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                    </div>
                  </Link>

                  <a href="#mission" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Our Mission
                    </button>
                  </a>
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
                  <Link to="/resources" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Resources
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
                      Admin
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
          {/* Simple dark overlay with alpha to show background */}
          <div className="absolute inset-0"></div>
          {/* Diagonal gradient: light top-left to dark bottom-right */}
          <div className="absolute inset-0 bg-gradient-to-bl from-black/100 via-black/95 to-black/40"></div>
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
                Learn What Truly Matters in the Time You Have
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 max-w-3xl mx-auto leading-snug md:leading-normal">
                From reading the Qur'an accurately to understanding Arabic and Islamic sciences—
                <span className="text-emerald-400 font-semibold"> structured programs</span> built especially for 
                <span className="text-emerald-400 font-semibold">  busy Muslims</span> with clear timelines and dedicated mentoring.
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
            href="#mission"
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

      {/* Simple Transition */}
      <div className="relative h-20 sm:h-32 bg-emerald-950"></div>

      {/* Our Mission Section */}
      <section id="mission" className="bg-white py-10 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Our Mission
            </h2>
          </div>

          {/* Main Content Grid - Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-12 sm:mb-16">
            {/* Left Column - Mission Text */}
            <div className="lg:col-span-2 space-y-6">
              <p className="text-base sm:text-lg leading-relaxed text-gray-700 text-justify">
                Today, many Muslims can't read the Qur'an accurately. Many who can read don't understand what they're reciting. This gap has become generational - passed down from parents to children - and it shouldn't continue. For those who genuinely want to learn, life gets in the way. Professional commitments, family responsibilities, and demanding schedules make traditional Islamic education feel impossible. But this shouldn't be a barrier. That's why we founded <span className="font-brand font-bold text-gray-900">The FastTrack Madrasah</span> - to help you learn what truly matters in a focused timeframe, building a solid foundation you can carry for life.
              </p>

              <p className="text-base sm:text-lg leading-relaxed text-gray-700 text-justify">
                We created programs for busy people. <span className="font-semibold text-gray-900">Our QARI program takes complete beginners from zero to fluent reading</span> - whether you've never touched Arabic or can't read accurately. Our Tajweed Mastery Program refines your recitation with proper rules. And <span className="font-semibold text-gray-900">our EASI program opens the door to Arabic grammar, morphology, and Islamic sciences</span> - enabling direct engagement with the Qur'an and Sunnah. With flexible scheduling designed for working adults and parents, we meet you where you are.
              </p>

              <p className="text-base sm:text-lg leading-relaxed text-gray-700 text-justify">
                Our mission is simple: help every Muslim develop a genuine connection with the Qur'an. We're especially passionate about serving those who thought this opportunity had passed them by. Through patient instruction and supportive community, we guide you from wherever you are to wherever you want to be. May Allah accept this effort and make it a means of bringing His servants closer to His Book. Ameen.
              </p>
            </div>

            {/* Right Column - Founder Card (Emphasized) */}
            <div className="lg:col-span-1 flex justify-center lg:justify-start">
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sticky top-24">
                {/* Founder Image - Large and Centered */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/founder.jpeg"
                    alt="Dr Abdulquadri Alaka"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-100 shadow-md"
                  />
                </div>

                {/* Founder Info - Centered */}
                <div className="text-center mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    Dr Abdulquadri Alaka
                  </h3>
                  <p className="text-sm text-emerald-700 font-medium">
                    Founder & Director
                  </p>
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-gray-600 leading-relaxed italic text-center mb-4">
                  "It's not about choosing between professional success and spiritual commitment. It's about showing they can work together."
                </blockquote>

                {/* Bio Preview & Modal Trigger */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed text-center">
                    Bringing together busy life and Islamic learning.
                  </p>

                  <button
                    onClick={() => setFounderBioExpanded(true)}
                    className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mx-auto"
                  >
                    <span>Read full bio</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Founder Bio Modal */}
            {founderBioExpanded && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setFounderBioExpanded(false)}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

                {/* Modal Content */}
                <div
                  className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setFounderBioExpanded(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Modal Header */}
                  <div className="p-6 sm:p-8 pb-0">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <img
                        src="/founder.jpeg"
                        alt="Dr Abdulquadri Alaka"
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100 shadow-md"
                      />
                      <div className="text-center sm:text-left">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                          Dr Abdulquadri Alaka
                        </h3>
                        <p className="text-emerald-700 font-medium">
                          Founder & Director
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 sm:p-8 space-y-4 text-gray-600 leading-relaxed text-justify">
                    <p>
                      Dr. Abdulquadri Alaka's path reflects what FastTrack Madrasah is all about: bringing together professional life and Islamic learning in a way that actually works.
                    </p>

                    <p>
                      His Islamic education started young, learning from prominent local scholars of Ahlus Sunnah wal Jama'ah in South West, Nigeria. He earned his Higher School Certificate in Arabic and Islamic Sciences and is currently pursuing Advanced Studies to further deepen his knowledge.
                    </p>

                    <p>
                      During his doctoral studies at Massey University, New Zealand, Dr. Abdulquadri served as both General Secretary (2022) and President (2023) of the Massey Muslim Society in Palmerston North. During this tenure, he became a pillar of the community - leading weekly Jumu'ah khutbahs on campus and in the city, while teaching Qur'an and Islamic Studies to the next generation.
                    </p>

                    <p>
                      Today, Dr. Abdulquadri is based in Tauranga, where he navigates both worlds daily - managing a corporate career while staying active in local da'wah and Islamic education. For him, it's not about choosing between professional success and spiritual commitment. It's about showing they can work together.
                    </p>

                    <blockquote className="border-l-4 border-emerald-600 pl-4 italic text-gray-700 my-6">
                      "I founded FastTrack Madrasah because I saw too many talented professionals and students sacrificing their Qur'an and Islamic learnings for careers. My goal is to show you that with the right methodology after Allah's help, you can carry the Book of Allah in your heart while you excel in your career."
                    </blockquote>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Support CTA */}
          <div className="bg-gray-50 rounded-lg p-6 sm:p-12 border border-gray-200">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                Ready to Begin Your Journey?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Reclaim your connection to the Qur'an and Sunnah through a structured, time-bound methodology designed for busy Muslims in the modern world.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/apply">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-900 text-white font-medium rounded transition-colors text-sm">
                    <span>Start Your Application</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>

                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium rounded transition-colors text-sm">
                    <Heart className="h-4 w-4" />
                    <span>Support Our Mission</span>
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-emerald-50 py-10 sm:py-24">
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
                      Regular assessments ensure you truly understand what you're learning - not just surface familiarity. We catch gaps early and help you solidify your knowledge before moving forward.
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


      {/* How Admission Works Section */}
      <section className="bg-white py-10 sm:py-24">
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

      {/* FAQ Section */}
      <section className="py-10 md:py-24 bg-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-lg text-gray-600">
              Find answers to common questions about our programs
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                      {faq.isRecommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{faq.subQuestion}</span>
                  </div>
                  {openFaq === idx ? (
                    <Minus className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
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
          <div className="mt-12 text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-6">
              If you're unsure which track is right for you, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <a href="mailto:salam@tftmadrasah.nz" className="text-gray-700 font-medium hover:text-gray-900 underline flex items-center gap-2">
                <Mail className="h-4 w-4" />
                salam@tftmadrasah.nz
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="tel:+64272131486" className="text-gray-700 font-medium hover:text-gray-900 underline flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +6427 213 1486
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="https://wa.me/64224653509" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-medium hover:text-gray-900 underline flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                +6422 465 3509
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              <Button variant="outline" size="lg" className="border-emerald-600 text-white hover:border-emerald-500 hover:bg-emerald-800 w-full sm:w-auto flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Support Us
              </Button>
            </a>
            <Link to="/student">
              <Button variant="outline" size="lg" className="border-emerald-600 text-white hover:border-emerald-500 hover:bg-emerald-800 w-full sm:w-auto">
                Student Portal
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
