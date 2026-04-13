import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → tagline → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo */}
      <img
        src="/favicon.svg"
        alt="The FastTrack Madrasah"
        className={`h-20 w-20 transition-all duration-700 ease-out ${
          phase === 'enter' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
        }`}
      />

      {/* Brand name */}
      <div
        className={`mt-4 text-center transition-all duration-500 ease-out ${
          phase === 'enter' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-lg font-brand font-semibold text-gray-900 tracking-wide" style={{ letterSpacing: '0.02em' }}>
          The FastTrack Madrasah
        </p>
      </div>

      {/* Tagline */}
      <p
        className={`mt-3 text-sm text-gray-500 transition-all duration-500 ease-out ${
          phase === 'tagline' || phase === 'exit' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        Sacred knowledge, made accessible.
      </p>
    </div>
  );
}
