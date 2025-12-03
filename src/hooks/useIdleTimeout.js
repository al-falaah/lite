import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle idle timeout and auto-logout
 * @param {Function} onIdle - Callback function to execute when user is idle
 * @param {number} idleTime - Time in milliseconds before user is considered idle (default: 15 minutes)
 * @param {number} warningTime - Time in milliseconds before idle to show warning (default: 1 minute)
 * @param {Function} onWarning - Optional callback for warning before idle timeout
 */
const useIdleTimeout = ({
  onIdle,
  idleTime = 15 * 60 * 1000, // 15 minutes
  warningTime = 1 * 60 * 1000, // 1 minute before idle
  onWarning
}) => {
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const resetTimer = () => {
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Set warning timer (if warning callback is provided)
    if (onWarning && warningTime > 0) {
      const warningDelay = idleTime - warningTime;
      warningTimerRef.current = setTimeout(() => {
        onWarning();
      }, warningDelay);
    }

    // Set idle timer
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, idleTime);
  };

  useEffect(() => {
    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Attach event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      // Clear timers
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [idleTime, warningTime, onIdle, onWarning]);
};

export default useIdleTimeout;
