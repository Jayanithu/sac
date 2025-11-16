"use client";
import React, { useMemo, useState } from "react";
import { Stroke, getBounds, totalDurationMs } from "../lib/pathUtils";
import { buildAnimatedSVG, buildLottieJSON, recordAnimationToVideo } from "../lib/exportUtils";

type Props = { strokes: Stroke[] };

const download = (name: string, data: Blob | string, type?: string) => {
  const blob = typeof data === "string" ? new Blob([data], { type: type ?? "application/octet-stream" }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ExportButtons({ strokes }: Props) {
  const [loading, setLoading] = useState<{ svg?: boolean; video?: boolean; lottie?: boolean }>({});
  const b = useMemo(() => getBounds(strokes), [strokes]);
  const durMs = useMemo(() => totalDurationMs(strokes) || 1, [strokes]);

  const onExportSVG = () => {
    setLoading(s => ({ ...s, svg: true }));
    const svg = buildAnimatedSVG(strokes);
    download("signature.svg", svg, "image/svg+xml");
    setLoading(s => ({ ...s, svg: false }));
  };

  const onExportVideo = async () => {
    setLoading(s => ({ ...s, video: true }));
    try {
      const w = Math.max(1, Math.round(b.width));
      const h = Math.max(1, Math.round(b.height));
      const blob = await recordAnimationToVideo(strokes, w, h);
      download("signature.mp4", blob);
    } catch (e: any) {
      alert(e?.message || "Recording failed. Your browser may not support MediaRecorder.");
    } finally { setLoading(s => ({ ...s, video: false })); }
  };

  const onExportLottie = () => {
    setLoading(s => ({ ...s, lottie: true }));
    const json = buildLottieJSON(strokes);
    download("signature.json", JSON.stringify(json), "application/json");
    setLoading(s => ({ ...s, lottie: false }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button className="w-full sm:w-auto px-4 py-2 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onExportSVG} disabled={!strokes.length || !!loading.svg}>{loading.svg ? "Exporting SVG..." : "Export SVG"}</button>
        <button className="w-full sm:w-auto px-4 py-2 rounded-md bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onExportVideo} disabled={!strokes.length || !!loading.video}>{loading.video ? "Exporting Video..." : "Export MP4"}</button>
        <button className="w-full sm:w-auto px-4 py-2 rounded-md bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onExportLottie} disabled={!strokes.length || !!loading.lottie}>{loading.lottie ? "Exporting Lottie..." : "Export Lottie JSON"}</button>
        <span className="w-full text-center sm:text-left text-sm text-gray-700">Duration: {(durMs / 1000).toFixed(2)}s • Size: {Math.round(b.width)}×{Math.round(b.height)}</span>
      </div>
      <p className="mt-2 text-sm text-gray-700">Preview before exporting. Video uses browser encoder and may fall back to WebM depending on support.</p>
    </div>
  );
}