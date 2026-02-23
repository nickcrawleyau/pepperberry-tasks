'use client';

import { useState, useEffect } from 'react';

export default function SessionTimer({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
      setRemaining(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);

  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <span className="text-[10px] text-stone-400">
      {remaining > 0 ? `Session expires in ${label}` : 'Expired'}
    </span>
  );
}
