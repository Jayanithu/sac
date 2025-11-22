import { useEffect, useState } from 'react';
import type { Theme } from '../types';
import { DEFAULT_THEME } from '../constants';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ls = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const t = (ls === 'dark' || ls === 'light') ? (ls as Theme) : DEFAULT_THEME;
    setTheme(t);
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', next);
  };

  return { theme, toggleTheme, mounted };
}

