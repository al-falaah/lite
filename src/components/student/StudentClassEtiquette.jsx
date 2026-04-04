import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Star, Heart } from 'lucide-react';

const StudentClassEtiquette = () => {
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
            Ādāb al-Ṭālib — Class Etiquette & Rules
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
          {/* Before Class */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              Before Class
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Make wuḍū before class (if you can) as a sign of respect for seeking sacred knowledge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Find a quiet, clean space free from distractions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Have your materials ready — Qurʾān, notebook, and pen.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>
                  Join the class on time. The Prophet ﷺ said: <em>"Whoever travels a path in search of knowledge, Allāh will make easy for him a path to Paradise."</em>
                  <span className="text-xs text-gray-500 ml-1">(Ṣaḥīḥ Muslim 2699)</span>
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
                <span>Begin with <em>Bismillāh</em> and greet your teacher with Salām.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Keep your camera on unless your teacher says otherwise.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Mute your microphone when not speaking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Listen attentively — do not browse other tabs, apps, or games.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Raise your hand (virtually) before speaking; do not interrupt.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Address your teacher respectfully — say <em>"Ustādh"</em> (male teacher) or <em>"Ustādha"</em> (female teacher).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Ask questions politely; there is no shame in asking to learn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Do not eat during class; water is fine.</span>
              </li>
            </ul>
          </div>

          {/* After Class */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              After Class
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>
                  Thank your teacher and pray for them. You can simply say: <em>"Jazākumullāhu khayran."</em> The Prophet ﷺ said: <em>"Whoever does not thank people has not thanked Allāh."</em>
                  <span className="text-xs text-gray-500 ml-1">(Sunan al-Tirmidhī 1954)</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Review what you learned and practise before the next class.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Complete any homework on time.</span>
              </li>
            </ul>
          </div>

          {/* General Conduct */}
          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Heart className="h-3 w-3" />
              General Conduct
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Be kind and patient in class — we are all learning together.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Do not share class links or recordings without permission.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>If you will be absent, inform your teacher in advance (at least 24 hours before).</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassEtiquette;
