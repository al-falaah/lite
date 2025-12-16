import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Video, Users, GraduationCap, CheckCircle, Menu, X, Plus, Minus, Heart } from 'lucide-react';
import Button from '../components/common/Button';
import { storage } from '../services/supabase';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

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
      question: "What are the program offerings?",
      answer: "We offer two programs: (1) Essential Arabic & Islamic Studies - a comprehensive 2-year program covering Quran, Hadith, Fiqh, Aqeedah, Seerah, and Arabic fundamentals with personalized one-on-one instruction. (2) Tajweed Program - a 6-month intensive course focused on perfecting Quranic recitation."
    },
    {
      question: "How does the class schedule work?",
      answer: "For the 2-Year Essential program, you'll have 2 sessions per week (one 2-hour main session and one 30-minute review session) scheduled at times convenient for you. The Tajweed program also includes 2 weekly sessions (one 1-hour main session and one 30-minute practice session). All classes are one-on-one online via video call."
    },
    {
      question: "What are the fees and payment options?",
      answer: "The 2-Year Essential Arabic & Islamic Studies program costs $25 NZD per month or $275 NZD per year (saving you $25 with annual payment). The Tajweed Program is a one-time payment of $120 NZD for the full 6-month course."
    },
    {
      question: "Who are the instructors?",
      answer: "Our instructors are qualified Islamic scholars with deep knowledge of the Quran, Sunnah, and traditional Islamic sciences. They have experience in teaching and are committed to authentic Islamic education rooted in the understanding of the Salaf."
    },
    {
      question: "Do I need any prerequisites?",
      answer: "For the Essential Arabic & Islamic Studies program, no prerequisites are needed - we welcome students at all levels. For the Tajweed program, students should be able to read Arabic letters, as the focus is on perfecting pronunciation and recitation rules."
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
        <nav className="relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/favicon-white.svg"
                  alt="Al-Falaah Logo"
                  className="h-8 w-8 md:h-10 md:w-10"
                />
                <div className="flex flex-col">
                  <span className="text-md md:text-xl font-semibold text-white">Al-Falaah Academy</span>
                  {/* <span className="text-md text-gray-300">Academy</span> */}
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                <Link to="/student">
                  <button className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5">
                    Student Portal
                  </button>
                </Link>
                <a href="#programs">
                  <button className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5">
                    Programs
                  </button>
                </a>
                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className="px-4 py-2 text-sm font-medium text-white hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5 flex items-center gap-1.5">
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
                className="md:hidden p-2 rounded text-white hover:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/20">
                <div className="flex flex-col gap-2">
                  <Link to="/student" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-medium text-white hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors text-left">
                      Student Portal
                    </button>
                  </Link>
                  <a href="#programs" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-medium text-white hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors text-left">
                      Programs
                    </button>
                  </a>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-medium text-white hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors text-left flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Donate
                    </button>
                  </a>
                  <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-lg shadow-emerald-600/30">
                      Apply Now
                    </button>
                  </Link>
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
                Curated 1-on-1 online programs in Arabic & Islamic sciences for Kiwi Muslims and beyond
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

      {/* Programs Section */}
      <section id="programs" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the program that best fits your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Essentials Program */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <GraduationCap className="h-8 w-8 text-emerald-600" />
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  2 YEARS
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Essential Arabic & Islamic Studies</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive curriculum covering Quran, Hadith, Fiqh, Aqeedah, Seerah, and Arabic fundamentals
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">One-on-one personalized instruction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">2 sessions/week (2 hours + 30 min)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Flexible scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Progress at your own pace</span>
                </li>
              </ul>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">$25 <span className="text-base font-normal text-gray-600">/month</span></p>
                <p className="text-sm text-gray-600 mb-2">Monthly payment option</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xl font-bold text-gray-900">$275 <span className="text-base font-normal text-gray-600">/year</span></p>
                  <p className="text-sm text-gray-600">Annual payment option (save $25)</p>
                </div>
              </div>

              <Link to="/apply">
                <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Enroll Now
                </Button>
              </Link>
            </div>

            {/* Tajweed Program */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="h-8 w-8 text-emerald-600" />
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  6 MONTHS
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tajweed Program</h3>
              <p className="text-gray-600 mb-6">
                Intensive course focused on perfecting Quranic recitation with proper pronunciation and rules
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">One-on-one personalized instruction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">2 sessions/week (1 hour + 30 min)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Master Tajweed rules</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Practice and feedback</span>
                </li>
              </ul>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">$120 <span className="text-base font-normal text-gray-600">NZD</span></p>
                <p className="text-sm text-gray-600">One-time payment for full course</p>
              </div>

              <Link to="/apply">
                <Button variant="outline" size="md" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                  Enroll Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You'll Study
            </h2>
            <p className="text-lg text-gray-600">
              Essential Arabic & Islamic Studies Program Curriculum
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Qur'anic Studies", desc: "Tafseer and understanding" },
              { title: "Hadith Sciences", desc: "Authentication and study" },
              { title: "Fiqh", desc: "Islamic jurisprudence" },
              { title: "Aqeedah", desc: "Creed and theology" },
              { title: "Seerah", desc: "Prophetic biography" },
              { title: "Islamic History", desc: "Understanding our heritage" },
              { title: "Arabic Language", desc: "Essential foundations" },
              { title: "Contemporary Issues", desc: "Modern fiqh matters" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Flexible Schedule</h3>
              <p className="text-gray-600">
                Classes scheduled at times convenient for you across different time zones
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                <Video className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">One-on-One Learning</h3>
              <p className="text-gray-600">
                Personalized instruction adapted to your learning pace and style
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Qualified Instructors</h3>
              <p className="text-gray-600">
                Learn from scholars with authentic Islamic knowledge and teaching experience
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
                <li><Link to="/apply" className="text-gray-400 hover:text-white">Apply Now</Link></li>
                <li><Link to="/student" className="text-gray-400 hover:text-white">Student Portal</Link></li>
                <li><a href="#programs" className="text-gray-400 hover:text-white">Programs</a></li>
                <li>
                  <a href={donationLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Support Our Mission
                  </a>
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
    </div>
  );
};

export default LandingPage;
