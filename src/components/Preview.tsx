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
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex items-center gap-3 mb-2">
        <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={onPlay} disabled={!strokes.length || playing}>Play</button>
        <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={onPause} disabled={!strokes.length || !playing}>Pause</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onRestart} disabled={!strokes.length}>Restart</button>
      </div>
      <div className="border rounded-md bg-white/80">
        <svg key={key} ref={svgRef} width={b.width} height={b.height} viewBox={`${b.minX} ${b.minY} ${b.width} ${b.height}`}>
          {strokes.map((s, idx) => {
            const len = strokeLength(s);
            const times = s.points.map(p => Math.min(1, Math.max(0, p.t / totalDur)));
            let acc = 0; const vals: string[] = [String(len)];
            for (let i = 1; i < s.points.length; i++) {
              acc += Math.hypot(s.points[i].x - s.points[i - 1].x, s.points[i].y - s.points[i - 1].y);
              vals.push(String(len - acc));
            }
            const keyTimes = [0, ...times].join(";");
            const values = vals.join(";");
            const d = `M ${s.points[0]?.x ?? 0} ${s.points[0]?.y ?? 0}` + s.points.slice(1).map(p => ` L ${p.x} ${p.y}`).join("");
            return (
              <path key={idx} d={d} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len}>
                <animate attributeName="stroke-dashoffset" values={values} keyTimes={keyTimes} dur={`${totalDur}ms`} calcMode="linear" fill="freeze" />
              </path>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-sm text-gray-600">Playback matches your drawing speed. Use the controls to preview before exporting.</p>
    </div>
  );
}