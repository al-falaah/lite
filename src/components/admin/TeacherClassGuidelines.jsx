import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Star, Heart } from 'lucide-react';

const TeacherClassGuidelines = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-emerald-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">
            Ādāb al-Muʿallim — Teaching Guidelines
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* Preparation */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              Preparation
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Prepare your lesson plan before class.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Start and end class on time — respect your students' schedules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>
                  Begin each class with <em>Bismillāh</em>, Ṣalāt upon the Prophet ﷺ, and a brief duʿā for knowledge.
                </span>
              </li>
            </ul>
          </div>

          {/* During Class */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              During Class
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Be patient and encouraging — especially with younger or struggling students.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Use positive reinforcement; praise effort, not just results.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Speak clearly and at an appropriate pace.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Check in with each student — ensure everyone is following along.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Make the lesson engaging — vary your teaching methods.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Allow time for questions; create a safe space for asking.</span>
              </li>
            </ul>
          </div>

          {/* Student Interaction */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Heart className="h-3 w-3" />
              Student Interaction
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Be fair and equal in attention given to all students.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Correct mistakes gently — the Prophet ﷺ was the best of teachers in kindness.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Never embarrass or humiliate a student.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Communicate concerns to parents/guardians respectfully.</span>
              </li>
            </ul>
          </div>

          {/* Professionalism */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              Professionalism
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Keep class recordings and student information confidential.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Maintain appropriate boundaries at all times.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Report any concerns to the madrasah administration promptly.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassGuidelines;
