"use client";
import React, { useEffect, useState } from "react";
import CanvasSign from "../components/CanvasSign";
import Preview from "../components/Preview";
import ExportButtons from "../components/ExportButtons";
import { Stroke, normalizeTimes } from "../lib/pathUtils";

export default function Page() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const normalized = normalizeTimes(strokes);
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  useEffect(() => {
    const ls = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const sysDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const t = (ls === 'dark' || ls === 'light') ? (ls as 'light'|'dark') : (sysDark ? 'dark' : 'light');
    setTheme(t);
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', next);
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                  Signature Animator
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                  Create stunning animated signatures. Draw, preview, and export in multiple formats.
                </p>
              </div>
              <button 
                aria-label="Toggle theme" 
                onClick={toggleTheme} 
                className="group relative inline-flex h-11 w-20 items-center rounded-full bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm ring-1 ring-slate-300/50 dark:ring-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span 
                  className="absolute left-1.5 inline-block h-8 w-8 rounded-full bg-white dark:bg-slate-700 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-600/50 transition-all duration-300 flex items-center justify-center" 
                  style={{ transform: theme === 'dark' ? 'translateX(44px)' : 'translateX(0px)' }}
                >
                  <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
                </span>
                <span className="sr-only">Toggle theme</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <section className="space-y-8 lg:space-y-10">
            <CanvasSign onChange={setStrokes} />
            <Preview strokes={normalized} />
            <ExportButtons strokes={normalized} />
          </section>

          {/* Footer Tips */}
          <footer className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm ring-1 ring-slate-200/50 dark:ring-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Pro Tips
              </h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-1">•</span>
                  <span>Use touch or mouse to draw. Experiment with different colors and stroke widths for unique effects.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-1">•</span>
                  <span>Playback speed matches your original drawing tempo for authentic signature animations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-1">•</span>
                  <span>Export in SVG for web, MP4 for video, or Lottie JSON for cross-platform animations.</span>
                </li>
              </ul>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
