import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart, ChevronDown, ArrowUp, Rocket, ArrowRight, Mail, Phone, MessageCircle, ShoppingBag, Newspaper, Clock } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openApproachCard, setOpenApproachCard] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [missionExpanded, setMissionExpanded] = useState(false);
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
                  <Link to="/store" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Store
                    </button>
                  </Link>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                      Donate
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
          <div className="absolute inset-0 bg-gradient-to-br from-black/100 via-black/95 to-black/0"></div>
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
                Today, while millions can recite the Qur'an, a profound gap remains between recitation and true comprehension. Traditionally, bridging this divide required years of academic study—a commitment often incompatible with the pace of modern life in the West. As this gap widens, our direct connection to the divine guidance of the Qur'an and Sunnah is frequently filtered through translations. We believe that understanding the Word of Allah should not be a distant luxury, but an accessible reality for every believer.
              </p>

              <p className="text-base sm:text-lg leading-relaxed text-gray-700 text-justify">
                <span className="font-brand font-bold text-gray-900 ">The FastTrack Madrasah</span> was established to provide a sophisticated solution to this challenge through a streamlined and highly effective curriculum. By fusing traditional scholarship with modern instructional design, we've created an accelerator that optimizes the way the Qur'an is studied. Our mission is to empower students to move beyond the surface of the text, facilitating a focused transition to intermediate Arabic proficiency so they can engage with Revelation in its original tongue—with little to no reliance on translation.
              </p>
            </div>

            {/* Right Column - Founder Card (Emphasized) */}
            <div className="lg:col-span-1 shadow-lg rounded-xl">
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow sticky top-24">
                {/* Founder Image - Large and Centered */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src="/founder.jpeg"
                      alt="Dr Abdulquadri Alaka"
                      className="w-48 h-48 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {/* Decorative Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-200 -z-10 scale-110"></div>
                  </div>
                </div>

                {/* Founder Info - Centered */}
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Dr Abdulquadri Alaka
                  </h3>
                  <p className="text-sm sm:text-base text-emerald-700 font-medium mb-4">
                    Founder
                  </p>
                  <div className="w-16 h-1 bg-emerald-600 mx-auto"></div>
                </div>

                {/* Quote */}
                <blockquote className="text-sm sm:text-base text-gray-700 leading-relaxed italic text-center px-4">
                  "That's our purpose, and we ask Allah ('azza wa jalla) to grant us success in achieving such a great mission."
                </blockquote>
              </div>
            </div>
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
      <section className="bg-gray-50 py-10 sm:py-24">
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


      {/* How Admission Works Section */}
      <section className="bg-gray-50 py-10 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-8 sm:mb-16">
            The Path to Mastery
          </h2>

          {/* Mobile: Vertical Layout */}
          <div className="md:hidden space-y-4">
            {/* Step 1 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                01 | Online Application
              </h3>
              <p className="text-xs text-gray-700">
                Submit your details through our streamlined portal to begin the selection process for your chosen track.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 2 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                02 | Evaluation & Interview
              </h3>
              <p className="text-xs text-gray-700">
                Our academic team reviews your background to ensure alignment with the program's prerequisites. This stage typically includes a brief phone interview to discuss your goals.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 3 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                03 | Selection & Enrollment
              </h3>
              <p className="text-xs text-gray-700">
                Successful applicants will receive a formal offer. Secure your place in the upcoming cohort by processing your enrollment through our secure payment gateway.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 4 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                04 | Onboarding & Mentorship
              </h3>
              <p className="text-xs text-gray-700">
                Receive your Student ID and access to the learning platform. You will be matched with an expert mentor who will guide your transition into the slated curriculum.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 5 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                05 | Guided Execution
              </h3>
              <p className="text-xs text-gray-700">
                Engage in intensive instruction and regular assessments. Our methodology ensures you hit every academic milestone with precision through consistent follow-up.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 6 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                06 | Final Validation
              </h3>
              <p className="text-xs text-gray-700">
                Complete your final comprehensive evaluation to demonstrate mastery of the program's core competencies and slated objectives.
              </p>
            </div>

            {/* Connector */}
            <div className="ml-3 border-l-2 border-dotted border-gray-300 h-4"></div>

            {/* Step 7 */}
            <div className="bg-white border-l-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                07 | Certification & Alumni Network
              </h3>
              <p className="text-xs text-gray-700">
                Graduate with a formal Certificate of Completion and join an elite network of students committed to lifelong learning and traditional scholarship.
              </p>
            </div>
          </div>

          {/* Tablet/Desktop: 3-Row Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Row 1: Steps 1-3 */}
            {/* Step 1 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Online Application
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Submit your details through our streamlined portal to begin the selection process for your chosen track.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Evaluation & Interview
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Our academic team reviews your background to ensure alignment with the program's prerequisites. This stage typically includes a brief phone interview to discuss your goals.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Selection & Enrollment
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Successful applicants will receive a formal offer. Secure your place in the upcoming cohort by processing your enrollment through our secure payment gateway.
              </p>
            </div>

            {/* Row 2: Steps 4-6 */}
            {/* Step 4 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                04
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Onboarding & Mentorship
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Receive your Student ID and access to the learning platform. You will be matched with an expert mentor who will guide your transition into the slated curriculum.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                05
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Guided Execution
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Engage in intensive instruction and regular assessments. Our methodology ensures you hit every academic milestone with precision through consistent follow-up.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                06
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Final Validation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                Complete your final comprehensive evaluation to demonstrate mastery of the program's core competencies and slated objectives.
              </p>
            </div>

            {/* Row 3: Step 7 (centered) */}
            {/* Step 7 */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg md:col-start-2">
              <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-4">
                07
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
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
      <section className="py-10 md:py-24 bg-gray-50">
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
      <section className="py-12 md:py-24 bg-emerald-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Begin Your Learning Journey
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join students worldwide in authentic Islamic education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply">
              <Button variant="secondary" size="lg" className="bg-white text-emerald-950 hover:bg-gray-100 w-full sm:w-auto">
                Apply Now
              </Button>
            </Link>
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:border-white/50 hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Support Us
              </Button>
            </a>
            <Link to="/student">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:border-white/50 hover:bg-white/10 w-full sm:w-auto">
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
