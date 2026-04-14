import { useState, useEffect, useRef } from 'react';

const THRESHOLD = 80;

export function usePullToRefresh(onRefresh = () => window.location.reload()) {
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const active = useRef(false);
  const distRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      }
    };

    const onMove = (e) => {
      if (!active.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        const d = Math.min(delta * 0.5, 120);
        distRef.current = d;
        setPullDistance(d);
      } else {
        distRef.current = 0;
        setPullDistance(0);
      }
    };

    const onEnd = () => {
      if (distRef.current >= THRESHOLD) {
        onRefreshRef.current();
      }
      distRef.current = 0;
      setPullDistance(0);
      active.current = false;
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  return { pullDistance, isPulling: pullDistance >= THRESHOLD };
}

export function PullIndicator({ pullDistance, isPulling }) {
  if (pullDistance <= 5) return null;
  const progress = Math.min(pullDistance / THRESHOLD, 1);
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none"
      style={{ paddingTop: `${Math.max(pullDistance * 0.4, 0)}px`, opacity: progress }}
    >
      <div className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        isPulling ? 'bg-emerald-500' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
      }`}>
        <span
          className={`block text-xs leading-none transition-transform ${isPulling ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}
          style={{ transform: `rotate(${isPulling ? 180 : Math.min(pullDistance * 2, 180)}deg)` }}
        >↓</span>
      </div>
    </div>
  );
}
