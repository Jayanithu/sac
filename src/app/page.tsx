"use client";
import { useState } from "react";
import CanvasSign from "../components/canvas/CanvasSign";
import Preview from "../components/preview/Preview";
import ExportButtons from "../components/export/ExportButtons";
import Landing from "../components/landing/Landing";
import type { Stroke } from "../types";
import { normalizeTimes } from "../lib/pathUtils";
import { useTheme } from "../hooks/useTheme";

export default function Page() {
  const [showLanding, setShowLanding] = useState(true);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const normalized = normalizeTimes(strokes);
  const { theme, toggleTheme } = useTheme();

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-black dark:to-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-3">
                <h1 
                  className="text-7xl sm:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent tracking-tight cursor-pointer hover:opacity-80 transition-opacity animate-gradient"
                  onClick={() => setShowLanding(true)}
                  style={{ backgroundSize: '200% auto' }}
                >
                  sac
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Create stunning animated signatures. Draw, preview, and export in multiple formats.
                </p>
              </div>
              <button 
                aria-label="Toggle theme" 
                onClick={toggleTheme} 
                className="group relative inline-flex h-12 w-24 items-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 backdrop-blur-sm ring-2 ring-indigo-200/50 dark:ring-indigo-800/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span 
                  className="absolute left-1 h-10 w-10 rounded-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-xl ring-2 ring-white/50 dark:ring-slate-600/50 transition-all duration-300 flex items-center justify-center" 
                  style={{ transform: theme === 'dark' ? 'translateX(52px)' : 'translateX(0px)' }}
                >
                  <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                </span>
                <span className="sr-only">Toggle theme</span>
              </button>
            </div>
          </header>

          <section className="space-y-8 lg:space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1.5 w-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Canvas</h2>
                </div>
                <CanvasSign onChange={setStrokes} />
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1.5 w-16 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Preview</h2>
                </div>
                <Preview strokes={normalized} />
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1.5 w-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">Export</h2>
              </div>
              <ExportButtons strokes={normalized} />
            </div>
          </section>

          <footer className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm ring-1 ring-indigo-200/50 dark:ring-indigo-800/50 shadow-xl">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Pro Tips
              </h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-1 text-lg">•</span>
                  <span>Use touch or mouse to draw. Experiment with different colors and stroke widths for unique effects.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-500 dark:text-purple-400 mt-1 text-lg">•</span>
                  <span>Playback speed matches your original drawing tempo for authentic signature animations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-500 dark:text-pink-400 mt-1 text-lg">•</span>
                  <span>Export in SVG for web, MP4 for video, or Lottie JSON for cross-platform animations.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2025{" "}
                <a 
                  href="https://github.com/Jayanithu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-indigo-500/50 hover:decoration-indigo-500 transition-all"
                >
                  @jayanithu/sac
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
