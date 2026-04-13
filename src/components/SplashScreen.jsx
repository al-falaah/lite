import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → brand → tagline → hold → exit

  useEffect(() => {
    // Remove the HTML splash now that React has mounted
    const htmlSplash = document.getElementById('html-splash');
    if (htmlSplash) htmlSplash.remove();

    const t1 = setTimeout(() => setPhase('brand'), 800);
    const t2 = setTimeout(() => setPhase('tagline'), 1800);
    const t3 = setTimeout(() => setPhase('exit'), 3800);
    const t4 = setTimeout(onFinish, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
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
        className={`mt-4 text-center transition-all duration-600 ease-out ${
          phase === 'enter' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-lg font-brand font-semibold text-gray-900 tracking-wide" style={{ letterSpacing: '0.02em' }}>
          The FastTrack Madrasah
        </p>
      </div>

      {/* Tagline */}
      <p
        className={`mt-3 text-sm text-gray-500 transition-all duration-600 ease-out ${
          phase === 'tagline' || phase === 'hold' || phase === 'exit' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        Islamic knowledge, made accessible.
      </p>
    </div>
  );
}
