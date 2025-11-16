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
    <main className="px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Signature Animation Creator</h1>
      <p className="text-gray-600 mb-6">Draw your signature, preview the animated reveal, and export as SVG, MP4, or Lottie JSON.</p>
      <CanvasSign onChange={setStrokes} />
      <Preview strokes={normalized} />
      <ExportButtons strokes={normalized} />
      <div className="mt-6 text-sm text-gray-600">
        <p>Tips:</p>
        <ul className="list-disc ml-5">
          <li>Use touch or mouse to draw. Adjust color and width to experiment.</li>
          <li>Playback matches your original drawing speed.</li>
          <li>Export formats are suitable for web, video, and cross-platform animation.</li>
        </ul>
      </div>
    </main>
  );
}
