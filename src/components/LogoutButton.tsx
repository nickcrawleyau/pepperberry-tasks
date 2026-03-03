'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function LogoutButton() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-fw-text/40 hover:text-fw-text/80 transition p-3 -m-1"
        aria-label="Log out"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
      <ConfirmDialog
        open={showConfirm}
        title="Log out?"
        message="Your session will end."
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
