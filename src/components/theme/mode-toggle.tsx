'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const TOGGLE_CLASSES =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:outline-neutral-400';

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggle = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  const icon = resolvedTheme === 'dark' ? '\u{1F31E}' : '\u{1F319}';
  const label = resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  if (!isMounted) {
    return null;
  }
  // dark mode icon toggle button
  return (
    <button type="button" onClick={handleToggle} className={TOGGLE_CLASSES} aria-label={label} title={label}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

