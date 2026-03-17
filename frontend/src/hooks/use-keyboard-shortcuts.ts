'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = [
      {
        key: 'd',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/'),
        description: 'Go to Dashboard',
      },
      {
        key: 'm',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/members'),
        description: 'Go to Members',
      },
      {
        key: 'a',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/attendance'),
        description: 'Go to Attendance',
      },
      {
        key: 's',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/schedule'),
        description: 'Go to Schedules',
      },
      {
        key: 'r',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/analytics'),
        description: 'Go to Analytics',
      },
      {
        key: 'n',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/members/add'),
        description: 'Add New Member',
      },
      {
        key: 'i',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/attendance/check-in'),
        description: 'Check In',
      },
      {
        key: 'l',
        metaKey: true,
        ctrlKey: true,
        action: () => router.push('/attendance/locations/new'),
        description: 'Add Location',
      },
      {
        key: 'p',
        metaKey: true,
        action: () => router.push('/account'),
        description: 'Go to Profile',
      },
      {
        key: ',',
        metaKey: true,
        action: () => router.push('/organization/settings'),
        description: 'Go to Settings',
      },
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const metaMatch = s.metaKey ? (event.metaKey || event.ctrlKey) : true;
        const ctrlMatch = s.ctrlKey ? event.ctrlKey : true;
        const shiftMatch = s.shiftKey ? event.shiftKey : true;

        return keyMatch && metaMatch && ctrlMatch && shiftMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return null;
}
