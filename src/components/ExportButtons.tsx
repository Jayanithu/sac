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
        <button className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50" onClick={onExportSVG} disabled={!strokes.length || !!loading.svg}>{loading.svg ? "Exporting SVG..." : "Export SVG"}</button>
        <button className="px-4 py-2 rounded-md bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm disabled:opacity-50" onClick={onExportVideo} disabled={!strokes.length || !!loading.video}>{loading.video ? "Exporting Video..." : "Export MP4"}</button>
        <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50" onClick={onExportLottie} disabled={!strokes.length || !!loading.lottie}>{loading.lottie ? "Exporting Lottie..." : "Export Lottie JSON"}</button>
        <span className="text-sm text-gray-600">Duration: {(durMs / 1000).toFixed(2)}s • Size: {Math.round(b.width)}×{Math.round(b.height)}</span>
      </div>
      <p className="mt-2 text-sm text-gray-600">Preview before exporting. Video uses browser encoder and may fall back to WebM depending on support.</p>
    </div>
  );
}