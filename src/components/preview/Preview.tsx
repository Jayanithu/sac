"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Stroke } from "../../types";
import { getBounds, strokeLength, totalDurationMs } from "../../lib/pathUtils";

type Props = { strokes: Stroke[] };

export default function Preview({ strokes }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0);

  const b = useMemo(() => getBounds(strokes), [strokes]);
  const totalDur = useMemo(() => totalDurationMs(strokes) || 1, [strokes]);
  const isWhite = useMemo(() => strokes.some(s => {
    const c = (s.color || "").toLowerCase();
    return c === "#ffffff" || c === "#fff";
  }), [strokes]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setCurrentTime(0);
    svg.pauseAnimations();
    setPlaying(false);
  }, [key, strokes]);

  const onPlay = () => { svgRef.current?.unpauseAnimations(); setPlaying(true); };
  const onPause = () => { svgRef.current?.pauseAnimations(); setPlaying(false); };
  const onRestart = () => { setKey(v => v + 1); };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-white/90 via-white/80 to-purple-50/30 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-purple-950/30 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-2xl ring-1 ring-purple-200/30 dark:ring-purple-800/30 mb-6 border border-white/20 dark:border-slate-700/20">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-xl hover:shadow-2xl ring-2 ring-white/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-xl flex items-center gap-2 hover:scale-105" 
            onClick={onPlay} 
            disabled={!strokes.length || playing}
          >
            <span className="text-xl">▶️</span>
            <span>Play</span>
          </button>
          <button 
            className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-semibold shadow-xl hover:shadow-2xl ring-2 ring-white/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-xl flex items-center gap-2 hover:scale-105" 
            onClick={onPause} 
            disabled={!strokes.length || !playing}
          >
            <span className="text-xl">⏸️</span>
            <span>Pause</span>
          </button>
          <button 
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 font-semibold shadow-lg hover:shadow-xl ring-1 ring-slate-300 dark:ring-slate-600 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center gap-2 hover:scale-105" 
            onClick={onRestart} 
            disabled={!strokes.length}
          >
            <span className="text-xl">⏮️</span>
            <span>Restart</span>
          </button>
          {strokes.length > 0 && (
            <div className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-800 shadow-lg">
              <span className="text-sm font-semibold">Duration:</span>
              <span className="text-sm font-bold">{(totalDur / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-3xl overflow-hidden shadow-2xl ring-2 ${
        isWhite 
          ? "bg-slate-900 ring-slate-700" 
          : "bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-slate-900/90 dark:to-purple-950/90 backdrop-blur-xl ring-purple-200/40 dark:ring-purple-800/40"
      }`}>
        <div className="h-[50vh] sm:h-[400px] lg:h-[600px] relative">
          {!strokes.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 px-4">
                <div className="text-7xl mb-6 animate-float">✍️</div>
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Draw a signature to see the preview</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your animated signature will appear here</p>
              </div>
            </div>
          )}
          <svg 
            key={key} 
            ref={svgRef} 
            className="w-full h-full" 
            viewBox={`${b.minX} ${b.minY} ${b.width} ${b.height}`} 
            preserveAspectRatio="xMidYMid meet"
          >
            {strokes.map((s, idx) => {
              const len = strokeLength(s);
              const clamp = (v: number) => Math.min(1, Math.max(0, v));
              const times = s.points.map(p => clamp(p.t / totalDur));
              let acc = 0; const vals: string[] = s.points.map((_, i) => {
                if (i === 0) return String(len);
                acc += Math.hypot(s.points[i].x - s.points[i - 1].x, s.points[i].y - s.points[i - 1].y);
                return String(len - acc);
              });
              const last = vals.at(-1) ?? String(len);
              const keyTimes = [0, ...times, 1].join(";");
              const values = [String(len), ...vals, last].join(";");
              const d = `M ${s.points[0]?.x ?? 0} ${s.points[0]?.y ?? 0}` + s.points.slice(1).map(p => ` L ${p.x} ${p.y}`).join("");
              return (
                <path 
                  key={idx} 
                  d={d} 
                  fill="none" 
                  stroke={s.color} 
                  strokeWidth={s.width} 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeDasharray={len} 
                  strokeDashoffset={len}
                >
                  <animate 
                    attributeName="stroke-dashoffset" 
                    values={values} 
                    keyTimes={keyTimes} 
                    dur={`${totalDur}ms`} 
                    calcMode="linear" 
                    fill="freeze" 
                  />
                </path>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}