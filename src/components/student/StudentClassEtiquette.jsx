import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StudentClassEtiquette = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-gray-800">
          📖 Ādāb al-Ṭālib — Class Etiquette
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-sm text-gray-600 leading-relaxed">
          <p className="mb-3 text-gray-500 text-xs">A few reminders to help you get the most out of every class, in shā Allāh.</p>

          <p className="font-medium text-gray-700 mb-1.5">Before class</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Make wuḍū if you can — it's a beautiful way to honour the knowledge you're about to receive.</li>
            <li>Find a quiet, clean spot and have your Qurʾān, notebook, and pen ready.</li>
            <li>
              Be on time. The Prophet ﷺ said: <em>"Whoever travels a path in search of knowledge, Allāh will make easy for him a path to Paradise."</em>
              <span className="text-gray-400"> — Ṣaḥīḥ Muslim 2699</span>
            </li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">During class</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Start with <em>Bismillāh</em> and greet your teacher with Salām.</li>
            <li>Camera on, mic muted when you're not speaking.</li>
            <li>Stay focused — no other tabs, apps, or games.</li>
            <li>Raise your hand before speaking and don't interrupt.</li>
            <li>Call your teacher <em>Ustādh</em> (male) or <em>Ustādha</em> (female).</li>
            <li>Ask questions — there's no shame in wanting to learn.</li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">After class</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>
              Thank your teacher and make duʿā for them — even a simple <em>"Jazākumullāhu khayran"</em> goes a long way.
              The Prophet ﷺ said: <em>"Whoever does not thank people has not thanked Allāh."</em>
              <span className="text-gray-400"> — Sunan al-Tirmidhī 1954</span>
            </li>
            <li>Revise what you learned and practise before the next class.</li>
            <li>Finish any homework on time.</li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">General</p>
          <ul className="space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Be kind and patient — we're all learning together.</li>
            <li>Don't share class links or recordings without permission.</li>
            <li>If you can't make it, let your teacher know at least 24 hours before.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentClassEtiquette;
