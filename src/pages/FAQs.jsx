import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Mail } from 'lucide-react';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const FAQs = () => {
  const [openFaq, setOpenFaq] = useState(null);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            Everything you need to know about our programs, admission process, and learning methodology
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-6">
                    <div className="flex items-start gap-3 mb-1">
                      <span className="font-semibold text-gray-900 text-base leading-relaxed">{faq.question}</span>
                      {faq.isRecommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap flex-shrink-0">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{faq.subQuestion}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-white border border-gray-200 rounded-lg p-8 sm:p-10 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
              We're here to help you find the right program for your learning journey
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/apply" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded transition-colors">
                  Apply Now
                </button>
              </Link>
              <a href="mailto:salam@tftmadrasah.nz" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors inline-flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Us
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
