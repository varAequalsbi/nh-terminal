import React, { useEffect, useRef, useState } from 'react';

export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => reject(new Error('Unable to load bot verification'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function Turnstile({ action, onToken, resetKey }) {
  const container = useRef(null);
  const callback = useRef(onToken);
  const [error, setError] = useState('');
  callback.current = onToken;

  useEffect(() => {
    if (!turnstileSiteKey) return undefined;
    let removed = false;
    let widgetId;
    loadTurnstile()
      .then((turnstile) => {
        if (removed || !container.current) return;
        widgetId = turnstile.render(container.current, {
          sitekey: turnstileSiteKey,
          action,
          theme: 'dark',
          callback: (token) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => {
            callback.current('');
            setError('Bot verification failed to load. Refresh the page and try again.');
          },
        });
      })
      .catch(() => setError('Bot verification is unavailable. Refresh the page and try again.'));
    return () => {
      removed = true;
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, resetKey]);

  if (!turnstileSiteKey) return null;
  return (
    <div className="turnstile-area">
      <div ref={container} />
      {error && <small className="form-error">{error}</small>}
    </div>
  );
}
