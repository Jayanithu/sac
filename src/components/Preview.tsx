"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stroke, getBounds, strokeLength, totalDurationMs } from "../lib/pathUtils";

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
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-3 rounded-lg p-2 sm:p-3 bg-white/70 dark:bg-zinc-900/50 ring-1 ring-black/5 dark:ring-white/10">
        <button className="px-4 py-2 rounded-md bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onPlay} disabled={!strokes.length || playing}>Play</button>
        <button className="px-4 py-2 rounded-md bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onPause} disabled={!strokes.length || !playing}>Pause</button>
        <button className="px-4 py-2 rounded-md bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 shadow-sm ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50" onClick={onRestart} disabled={!strokes.length}>Restart</button>
      </div>
      <div className={`rounded-xl ${isWhite ? "border-gray-700 bg-black" : "border-transparent bg-white/70 dark:bg-zinc-900/60"} ring-1 ring-black/10 dark:ring-white/10 shadow-lg`}>
        <div className="h-[46vh] sm:h-[360px]">
          <svg key={key} ref={svgRef} className="w-full h-full" viewBox={`${b.minX} ${b.minY} ${b.width} ${b.height}`} preserveAspectRatio="xMidYMid meet">
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
              <path key={idx} d={d} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len}>
                <animate attributeName="stroke-dashoffset" values={values} keyTimes={keyTimes} dur={`${totalDur}ms`} calcMode="linear" fill="freeze" />
              </path>
            );
          })}
          </svg>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">Playback matches your drawing speed. Use the controls to preview before exporting.</p>
    </div>
  );
}