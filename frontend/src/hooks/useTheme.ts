import { useCallback, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'snaplink-theme';

const readStored = (): ThemeChoice => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Private mode or blocked storage: fall back to system.
  }
  return 'system';
};

const prefersDark = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

const apply = (choice: ThemeChoice) => {
  const dark = choice === 'dark' || (choice === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
};

/**
 * Three-state theme persisted in localStorage and applied as a class on <html>,
 * per PROJECT_MASTER.md section 7. There is no backend representation of theme,
 * which is why it lives here and inside Profile rather than on its own route.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(readStored);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  // Follow the OS while the choice is "system".
  useEffect(() => {
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((choice: ThemeChoice) => {
    setThemeState(choice);
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Persisting is best-effort; the session still themes correctly.
    }
  }, []);

  return { theme, setTheme };
}

/**
 * Applies the stored theme before React mounts, so a dark-mode user does not
 * see a white flash on first paint.
 */
export const initTheme = () => apply(readStored());
