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
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="group px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl ring-1 ring-indigo-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            onClick={onPlay} 
            disabled={!strokes.length || playing}
          >
            <span className="text-lg">▶️</span>
            <span>Play</span>
          </button>
          <button 
            className="group px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl ring-1 ring-indigo-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            onClick={onPause} 
            disabled={!strokes.length || !playing}
          >
            <span className="text-lg">⏸️</span>
            <span>Pause</span>
          </button>
          <button 
            className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium shadow-md hover:shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            onClick={onRestart} 
            disabled={!strokes.length}
          >
            <span className="text-lg">⏮️</span>
            <span>Restart</span>
          </button>
          {strokes.length > 0 && (
            <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900">
              <span className="text-sm font-medium">Duration:</span>
              <span className="text-sm font-semibold">{(totalDur / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl overflow-hidden shadow-xl ring-1 ${
        isWhite 
          ? "bg-slate-900 ring-slate-700" 
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-slate-200/50 dark:ring-slate-800/50"
      }`}>
        <div className="h-[50vh] sm:h-[400px] lg:h-[600px] relative">
          {!strokes.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">✍️</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Draw a signature to see the preview</p>
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