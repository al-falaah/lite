import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TeacherClassGuidelines = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-gray-800">
          Ādāb al-Muʿallim — Teaching Guidelines
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-sm text-gray-600 leading-relaxed">
          <p className="mb-3 text-gray-500 text-xs">A few reminders to help you deliver the best experience for your students, in shā Allāh.</p>

          <p className="font-medium text-gray-700 mb-1.5">Preparation</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Prepare your lesson plan before class.</li>
            <li>Start and end on time — respect your students' schedules.</li>
            <li>Begin each class with <em>Bismillāh</em>, Ṣalāt upon the Prophet ﷺ, and a brief duʿā for knowledge.</li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">During class</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Be patient and encouraging, especially with younger or struggling students.</li>
            <li>Praise effort, not just results.</li>
            <li>Speak clearly and check that everyone is following along.</li>
            <li>Keep things engaging — vary your methods where you can.</li>
            <li>Leave room for questions and make it safe to ask.</li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">Working with students</p>
          <ul className="mb-3 space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Give equal attention to all students.</li>
            <li>Correct mistakes gently — the Prophet ﷺ was the kindest of teachers.</li>
            <li>Never embarrass a student.</li>
            <li>Communicate any concerns to parents or guardians respectfully.</li>
          </ul>

          <p className="font-medium text-gray-700 mb-1.5">Professionalism</p>
          <ul className="space-y-1 pl-4 list-disc marker:text-gray-300">
            <li>Keep class recordings and student information confidential.</li>
            <li>Maintain appropriate boundaries at all times.</li>
            <li>Report any concerns to the madrasah administration promptly.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeacherClassGuidelines;
