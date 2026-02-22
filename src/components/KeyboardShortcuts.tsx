'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcutsProps {
  role: string;
}

export default function KeyboardShortcuts({ role }: KeyboardShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'n' && role === 'admin' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push('/tasks/new');
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [role, router]);

  return null;
}
