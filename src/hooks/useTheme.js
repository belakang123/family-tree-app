import { useState, useEffect, useCallback, useMemo } from 'react';

const THEME_STORAGE_KEY = 'theme';

export function useTheme() {
  const [themePref, setThemePref] = useState('light');

  const isDarkEffective = useMemo(() => themePref === 'dark', [themePref]);

  const applyThemeClass = useCallback((shouldBeDark) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const initial = saved === 'light' || saved === 'dark' ? saved : systemDark ? 'dark' : 'light';

    setThemePref(initial);
    applyThemeClass(initial === 'dark');

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        const sysDark = mq?.matches ?? false;
        setThemePref(sysDark ? 'dark' : 'light');
        applyThemeClass(sysDark);
      }
    };

    if (mq?.addEventListener) mq.addEventListener('change', onChange);
    else mq?.addListener?.(onChange);

    return () => {
      if (mq?.removeEventListener) mq.removeEventListener('change', onChange);
      else mq?.removeListener?.(onChange);
    };
  }, [applyThemeClass]);

  const cycleTheme = useCallback(() => {
    setThemePref((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      const shouldBeDark = next === 'dark';
      document.documentElement.classList.toggle('dark', shouldBeDark);
      return next;
    });
  }, []);

  return { isDarkEffective, themePref, cycleTheme };
}
