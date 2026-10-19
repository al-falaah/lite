import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

const CHECK_EVERY_MS = 60 * 60 * 1000; // hourly

/**
 * UpdatePrompt — registers the service worker and, when a new version of the
 * app has been downloaded, shows a small "New version — Reload" card. Tapping
 * Reload activates the new service worker and reloads into the latest build,
 * so installed (PWA) users update without reinstalling.
 *
 * Installed apps can stay open for days, so besides the normal check on load
 * it also checks hourly and whenever the app returns to the foreground.
 */
export default function UpdatePrompt() {
  const [reloading, setReloading] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => {
        // Skip while offline or mid-install; a failed check is harmless.
        if (!navigator.onLine || registration.installing) return;
        registration.update().catch(() => {});
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  // Reload once the new worker has taken control (covers browsers where
  // updateServiceWorker's own reload doesn't fire).
  useEffect(() => {
    if (!reloading || !('serviceWorker' in navigator)) return undefined;
    const onChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    const fallback = setTimeout(onChange, 4000);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      clearTimeout(fallback);
    };
  }, [reloading]);

  if (!needRefresh) return null;

  const reload = () => {
    setReloading(true);
    updateServiceWorker(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-[200] flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-2xl bg-[#2a1013] text-white shadow-2xl ring-1 ring-black/10 pl-4 pr-2 py-3">
        <RefreshCw className="h-5 w-5 shrink-0 text-[#f4d9a8]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">A new version is ready</p>
          <p className="text-xs text-white/70 leading-tight mt-0.5">Reload to get the latest updates.</p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={reloading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#f4d9a8] px-3.5 py-2 text-sm font-semibold text-[#2a1013] hover:bg-[#ecc98b] disabled:opacity-70"
        >
          {reloading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reload
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Later"
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
