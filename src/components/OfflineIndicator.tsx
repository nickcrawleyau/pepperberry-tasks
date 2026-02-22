'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-amber-900/80 text-amber-200 text-xs text-center py-1.5 px-4">
      You&apos;re offline — viewing cached data
    </div>
  );
}
