"use client";
import { useMemo, useState } from "react";
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
    <div className="w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Export Your Signature</h3>
          <p className="text-slate-600 dark:text-slate-400">Choose your preferred format for web, video, or cross-platform use.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button 
            className="group relative px-6 py-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl ring-1 ring-emerald-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden" 
            onClick={onExportSVG} 
            disabled={!strokes.length || !!loading.svg}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-semibold">{loading.svg ? "Exporting..." : "Export SVG"}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button 
            className="group relative px-6 py-4 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-medium shadow-lg hover:shadow-xl ring-1 ring-fuchsia-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden" 
            onClick={onExportVideo} 
            disabled={!strokes.length || !!loading.video}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🎬</span>
              <span className="text-sm font-semibold">{loading.video ? "Exporting..." : "Export MP4"}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button 
            className="group relative px-6 py-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl ring-1 ring-blue-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden" 
            onClick={onExportLottie} 
            disabled={!strokes.length || !!loading.lottie}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🎨</span>
              <span className="text-sm font-semibold">{loading.lottie ? "Exporting..." : "Export Lottie"}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {strokes.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{(durMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Dimensions:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.round(b.width)} × {Math.round(b.height)}px</span>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <span>Video export uses your browser's encoder. Some browsers may export as WebM format instead of MP4.</span>
        </p>
      </div>
    </div>
  );
}