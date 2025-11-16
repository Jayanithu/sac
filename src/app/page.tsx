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
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Signature Animation Creator</h1>
            <p className="text-gray-700 dark:text-zinc-300">Draw your signature, preview the animated reveal, and export as SVG, MP4, or Lottie JSON.</p>
          </div>
          <button aria-label="Toggle theme" onClick={toggleTheme} className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-300 dark:bg-zinc-700 transition">
            <span className="absolute left-1 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform" style={{ transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(0px)' }} />
            <span className="sr-only">Theme</span>
          </button>
        </header>
        <section className="space-y-6">
          <CanvasSign onChange={setStrokes} />
          <Preview strokes={normalized} />
          <ExportButtons strokes={normalized} />
        </section>
        <footer className="mt-8 text-sm text-gray-700 dark:text-zinc-300">
          <p>Tips:</p>
          <ul className="list-disc ml-5">
            <li>Use touch or mouse to draw. Adjust color and width to experiment.</li>
            <li>Playback matches your original drawing speed.</li>
            <li>Export formats are suitable for web, video, and cross-platform animation.</li>
          </ul>
        </footer>
      </div>
    </main>
  );
}
