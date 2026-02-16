import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

const CountdownBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Launch date: April 4, 2026 (After Ramadan 1447 A.H.)
  const launchDate = new Date('2026-04-04T00:00:00').getTime();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = launchDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        // Launch date has passed - hide banner automatically
        setIsVisible(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('countdownBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white py-2.5 px-4 fixed top-0 left-0 right-0 z-[60] shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-sm sm:text-base">
              The FastTrack Madrasah is launching After Ramadan 1447 A.H. in shā'a Allāh | April 4, 2026
            </span>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm bg-white/10 px-2 sm:px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base sm:text-xl">{timeLeft.days}</span>
              <span className="text-[9px] sm:text-xs text-emerald-100">Days</span>
            </div>
            <span className="text-white/50 text-sm">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base sm:text-xl">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-xs text-emerald-100">Hrs</span>
            </div>
            <span className="text-white/50 text-sm">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base sm:text-xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-xs text-emerald-100">Min</span>
            </div>
            <span className="text-white/50 text-sm">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base sm:text-xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-xs text-emerald-100">Sec</span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CountdownBanner;
