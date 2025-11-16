"use client";
import React, { useState } from "react";
import CanvasSign from "../components/CanvasSign";
import Preview from "../components/Preview";
import ExportButtons from "../components/ExportButtons";
import { Stroke, normalizeTimes } from "../lib/pathUtils";

export default function Page() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const normalized = normalizeTimes(strokes);
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Signature Animation Creator</h1>
          <p className="text-gray-600 dark:text-zinc-400">Draw your signature, preview the animated reveal, and export as SVG, MP4, or Lottie JSON.</p>
        </header>
        <section className="space-y-6">
          <CanvasSign onChange={setStrokes} />
          <Preview strokes={normalized} />
          <ExportButtons strokes={normalized} />
        </section>
        <footer className="mt-8 text-sm text-gray-600 dark:text-zinc-400">
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
