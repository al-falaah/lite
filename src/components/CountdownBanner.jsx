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

  // Launch date: April 4, 2025 (After Ramadan 1447 A.H.)
  const launchDate = new Date('2025-04-04T00:00:00').getTime();

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
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white py-3 px-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-sm sm:text-base">
              Launching After Ramadan 1447 A.H. | April 4, 2025
            </span>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg sm:text-xl">{timeLeft.days}</span>
              <span className="text-[10px] sm:text-xs text-emerald-100">Days</span>
            </div>
            <span className="text-white/50">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg sm:text-xl">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] sm:text-xs text-emerald-100">Hours</span>
            </div>
            <span className="text-white/50">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg sm:text-xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] sm:text-xs text-emerald-100">Mins</span>
            </div>
            <span className="text-white/50 hidden sm:inline">:</span>
            <div className="flex-col items-center hidden sm:flex">
              <span className="font-bold text-lg sm:text-xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] sm:text-xs text-emerald-100">Secs</span>
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
