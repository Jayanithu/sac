"use client";
import { useMemo, useState } from "react";
import type { Stroke, BackgroundOption } from "../../types";
import { getBounds, totalDurationMs } from "../../lib/pathUtils";
import { buildAnimatedSVG, buildLottieJSON, recordAnimationToVideo } from "../../lib/exportUtils";

type Props = { strokes: Stroke[] };

const download = (name: string, data: Blob | string, type?: string) => {
  const blob = typeof data === "string" ? new Blob([data], { type: type ?? "application/octet-stream" }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ExportButtons({ strokes }: Props) {
  const [loading, setLoading] = useState<{ svg?: boolean; video?: boolean; lottie?: boolean }>({});
  const [bgSvg, setBgSvg] = useState<BackgroundOption>('transparent');
  const [bgVideo, setBgVideo] = useState<BackgroundOption>('transparent');
  const [bgLottie, setBgLottie] = useState<BackgroundOption>('transparent');
  const [showBgSvg, setShowBgSvg] = useState(false);
  const [showBgVideo, setShowBgVideo] = useState(false);
  const [showBgLottie, setShowBgLottie] = useState(false);
  const b = useMemo(() => getBounds(strokes), [strokes]);
  const durMs = useMemo(() => totalDurationMs(strokes) || 1, [strokes]);

  const onExportSVG = () => {
    setLoading(s => ({ ...s, svg: true }));
    const svg = buildAnimatedSVG(strokes, bgSvg);
    download("signature.svg", svg, "image/svg+xml");
    setLoading(s => ({ ...s, svg: false }));
    setShowBgSvg(false);
  };

  const onExportVideo = async () => {
    setLoading(s => ({ ...s, video: true }));
    try {
      const w = Math.max(1, Math.round(b.width));
      const h = Math.max(1, Math.round(b.height));
      const blob = await recordAnimationToVideo(strokes, w, h, undefined, undefined, bgVideo);
      download("signature.mp4", blob);
    } catch (e: any) {
      alert(e?.message || "Recording failed. Your browser may not support MediaRecorder.");
    } finally { 
      setLoading(s => ({ ...s, video: false })); 
      setShowBgVideo(false);
    }
  };

  const onExportLottie = () => {
    setLoading(s => ({ ...s, lottie: true }));
    const json = buildLottieJSON(strokes, undefined, bgLottie);
    download("signature.json", JSON.stringify(json), "application/json");
    setLoading(s => ({ ...s, lottie: false }));
    setShowBgLottie(false);
  };

  const BackgroundSelector = ({ 
    value, 
    onChange, 
    show, 
    onToggle 
  }: { 
    value: BackgroundOption; 
    onChange: (v: BackgroundOption) => void; 
    show: boolean;
    onToggle: () => void;
  }) => (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-all shadow-md hover:shadow-lg"
        disabled={!strokes.length}
      >
        {value === 'white' ? '⚪ White' : value === 'black' ? '⚫ Black' : '🔲 Transparent'}
      </button>
      {show && (
        <>
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 min-w-[150px] ring-1 ring-slate-900/5 dark:ring-white/5">
            {(['white', 'black', 'transparent'] as BackgroundOption[]).map((opt) => (
              <button
                key={opt}
                onClick={(e) => { e.stopPropagation(); onChange(opt); onToggle(); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  value === opt
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70'
                }`}
              >
                {opt === 'white' ? '⚪ White' : opt === 'black' ? '⚫ Black' : '🔲 Transparent'}
              </button>
            ))}
          </div>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/30 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-emerald-950/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-emerald-200/30 dark:ring-emerald-800/30 border border-white/20 dark:border-slate-700/20">
        <div className="mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">Export Your Signature</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Choose your preferred format for web, video, or cross-platform use.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="flex flex-col gap-3">
            <button 
              className="group relative px-6 py-5 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold shadow-2xl hover:shadow-emerald-500/50 ring-2 ring-white/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden hover:scale-105" 
              onClick={onExportSVG} 
              disabled={!strokes.length || !!loading.svg}
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl drop-shadow-lg">📄</span>
                <span className="text-base font-bold tracking-wide">{loading.svg ? "Exporting..." : "Export SVG"}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
            </button>
            <BackgroundSelector value={bgSvg} onChange={setBgSvg} show={showBgSvg} onToggle={() => setShowBgSvg(!showBgSvg)} />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="group relative px-6 py-5 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-fuchsia-600 to-pink-600 hover:from-fuchsia-600 hover:via-fuchsia-700 hover:to-pink-700 text-white font-semibold shadow-2xl hover:shadow-fuchsia-500/50 ring-2 ring-white/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden hover:scale-105" 
              onClick={onExportVideo} 
              disabled={!strokes.length || !!loading.video}
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl drop-shadow-lg">🎬</span>
                <span className="text-base font-bold tracking-wide">{loading.video ? "Exporting..." : "Export MP4"}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-300/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
            </button>
            <BackgroundSelector value={bgVideo} onChange={setBgVideo} show={showBgVideo} onToggle={() => setShowBgVideo(!showBgVideo)} />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="group relative px-6 py-5 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700 text-white font-semibold shadow-2xl hover:shadow-blue-500/50 ring-2 ring-white/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden hover:scale-105" 
              onClick={onExportLottie} 
              disabled={!strokes.length || !!loading.lottie}
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-4xl drop-shadow-lg">🎨</span>
                <span className="text-base font-bold tracking-wide">{loading.lottie ? "Exporting..." : "Export Lottie"}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
            </button>
            <BackgroundSelector value={bgLottie} onChange={setBgLottie} show={showBgLottie} onToggle={() => setShowBgLottie(!showBgLottie)} />
          </div>
        </div>

        {strokes.length > 0 && (
          <div className="pt-6 border-t border-gradient-to-r from-emerald-200 to-cyan-200 dark:from-emerald-800 dark:to-cyan-800">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 ring-1 ring-emerald-200 dark:ring-emerald-800 shadow-lg">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">⏱️ Duration:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{(durMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 ring-1 ring-cyan-200 dark:ring-cyan-800 shadow-lg">
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">📏 Dimensions:</span>
                <span className="font-bold text-cyan-700 dark:text-cyan-300">{Math.round(b.width)} × {Math.round(b.height)}px</span>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 ring-1 ring-blue-200/50 dark:ring-blue-800/50">
          <span className="text-xl">ℹ️</span>
          <span>Video export uses your browser's encoder. Some browsers may export as WebM format instead of MP4.</span>
        </p>
      </div>
    </div>
  );
}
