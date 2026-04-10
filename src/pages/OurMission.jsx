import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, X } from 'lucide-react';

const OurMission = () => {
  const [founderBioExpanded, setFounderBioExpanded] = useState(false);

  const donationLink = import.meta.env.VITE_STRIPE_DONATION_LINK || 'https://donate.stripe.com/dRm28t3WQ4Jacmj6gocAo00.com';

  return (
    <div className="min-h-screen bg-white">
      <Helmet><title>Our Mission | The FastTrack Madrasah</title></Helmet>

      <section className="bg-white py-20 sm:py-28">
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
            <div className="lg:col-span-2 space-y-8">
              <p className="text-gray-800 leading-relaxed text-lg text-justify">
                Today, many Muslims can't read the Qur'an accurately. Those who can often don't understand what they're reciting. This gap has become generational - passed from parents to children - and it shouldn't continue.
              </p>

              <p className="text-gray-800 leading-relaxed text-lg text-justify">
                That's why we founded <span className="font-semibold text-gray-900">The FastTrack Madrasah</span>: to help you learn what truly matters through structured, time-bound programs that build a solid foundation you can carry for life.
              </p>

              <p className="text-gray-800 leading-relaxed text-lg text-justify">
                Whether you're an absolute beginner, need to master Tajweed, or want to understand Arabic and Islamic sciences - we meet you where you are. With flexible scheduling and patient instruction, we accommodate everyone: working adults, parents, students, and retirees.
              </p>

              <p className="text-xl font-medium text-gray-900 mt-10 pt-8 border-t border-gray-200 text-justify">
                Our mission: help every Muslim develop a genuine connection with the Qur'an.
              </p>

              <p className="text-sm text-gray-500 italic text-justify">
                May Allah accept this effort and make it a means of bringing His servants closer to His Book. Ameen.
              </p>
            </div>

            {/* Right Column - Founder Card (Emphasized) */}
            <div className="lg:col-span-1 flex justify-center lg:justify-start">
              <div className="bg-white border border-gray-200 p-6 sm:p-8 sticky top-24 transition-all duration-300 hover:border-gray-300 hover:shadow-sm group">
                {/* Founder Image - Large and Centered */}
                <div className="flex justify-center mb-6 overflow-hidden">
                  <img
                    src="/founder.jpeg"
                    alt="Dr Abdulquadri Alaka"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Founder Info - Centered */}
                <div className="text-center mb-4">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 transition-colors duration-300 group-hover:text-gray-700">
                    Dr Abdulquadri Alaka
                  </h3>
                  <p className="text-sm text-gray-600">
                    Founder & Director
                  </p>
                </div>

                {/* Quote */}
                <p className="text-sm text-gray-600 leading-relaxed text-center mb-4">
                  "Teaching the Qur'an and Islamic knowledge is the most honorable work. My goal is to make this accessible to every Muslim."
                </p>

                {/* Bio Preview & Modal Trigger */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => setFounderBioExpanded(true)}
                    className="text-sm text-gray-900 hover:text-gray-700 font-medium flex items-center gap-1 mx-auto transition-all duration-300 group-hover:gap-2"
                  >
                    <span>Read biography</span>
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
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
                  className="relative bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setFounderBioExpanded(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Modal Header with Portrait */}
                  <div className="relative">
                    <img
                      src="/founder.jpeg"
                      alt="Dr Abdulquadri Alaka"
                      className="w-full h-64 object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-3xl font-bold mb-1">
                        Dr Abdulquadri Alaka
                      </h3>
                      <p className="text-lg">
                        Founder & Director
                      </p>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 space-y-4 text-gray-700 leading-relaxed text-justify">
                    <p>
                      Dr. Abdulquadri Alaka's journey in Islamic education began at a young age, learning from prominent local scholars of Ahlus Sunnah wal Jama'ah in South West, Nigeria. His dedication to preserving and transmitting authentic Islamic knowledge has been the cornerstone of his life's work.
                    </p>

                    <p>
                      He earned his Higher School Certificate in Arabic and Islamic Sciences and is currently pursuing Advanced Studies to further deepen his knowledge in classical Islamic texts. His scholarly focus remains on making the Qur'an and Sunnah accessible through sound methodology and patient instruction.
                    </p>

                    <p>
                      During his doctoral studies at Massey University, New Zealand, Dr. Abdulquadri served as both General Secretary (2022) and President (2023) of the Massey Muslim Society in Palmerston North. During this tenure, he became a pillar of the community - leading weekly Jumu'ah khutbahs on campus and in the city, while teaching Qur'an and Islamic Studies to students and community members.
                    </p>

                    <p>
                      Today, Dr. Abdulquadri is based in Tauranga, where he remains dedicated to da'wah and Islamic education. His vision for FastTrack Madrasah stems from a deep conviction that every Muslim deserves access to quality Qur'anic education, regardless of their starting point.
                    </p>

                    <blockquote className="border-l-2 border-gray-900 pl-6 italic text-gray-600 my-8">
                      "I founded FastTrack Madrasah because I believe that learning the Qur'an and understanding our Deen should not remain out of reach for any Muslim. With the right methodology and Allah's help, anyone can master what they once thought impossible."
                    </blockquote>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sadaqah Jaariyah CTA */}
          <div className="max-w-2xl mx-auto mt-16 pt-12 border-t border-gray-200">
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Be Part of Sadaqah Jaariyah
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Support our mission to make Qur'anic education accessible to every Muslim. Your contribution helps subsidize students who cannot afford fees and ensures this knowledge continues to benefit the Ummah—a charity whose rewards never cease.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a href={donationLink} target="_blank" rel="noopener noreferrer">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>Support our Mission</span>
                  </button>
                </a>

                <Link to="/programs#our-programs" onClick={() => window.scrollTo(0, 0)}>
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors">
                    <span>Our Programs</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurMission;
