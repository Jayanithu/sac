"use client";
import React, { useEffect, useRef, useState } from "react";
import { Stroke, Point } from "../lib/pathUtils";

type Props = { onChange?: (strokes: Stroke[]) => void };

export default function CanvasSign({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undone, setUndone] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<'draw'|'erase'>('draw');
  const [color, setColor] = useState("#111827");
  const isWhite = (color || "").toLowerCase() === "#ffffff" || (color || "").toLowerCase() === "#fff";
  const [width, setWidth] = useState(4);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{x:number;y:number}>({ x: 0, y: 0 });
  const [shiftDown, setShiftDown] = useState(false);
  const palette = ["#111827","#ef4444","#10b981","#3b82f6","#f59e0b","#ffffff","#000000"];
  const startRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const hitStroke = (s: Stroke, x: number, y: number, tol: number) => {
    if (!s.points.length) return false;
    if (s.points.length === 1) return Math.hypot(s.points[0].x - x, s.points[0].y - y) <= tol;
    let min = Infinity;
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1], b = s.points[i];
      const vx = b.x - a.x, vy = b.y - a.y;
      const wx = x - a.x, wy = y - a.y;
      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      const t = c2 ? Math.max(0, Math.min(1, c1 / c2)) : 0;
      const px = a.x + vx * t, py = a.y + vy * t;
      const d = Math.hypot(px - x, py - y);
      if (d < min) min = d;
    }
    return min <= (s.width / 2 + tol);
  };

  const splitStrokeByErase = (s: Stroke, x: number, y: number, r: number): Stroke[] => {
    const out: Stroke[] = [];
    const pts = s.points;
    if (pts.length < 2) return Math.hypot(pts[0]?.x - x || 0, pts[0]?.y - y || 0) > r ? [s] : [];
    let cur: Point[] = [ { ...pts[0] } ];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const vx = b.x - a.x, vy = b.y - a.y;
      const wx = x - a.x, wy = y - a.y;
      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      const t = c2 ? Math.max(0, Math.min(1, c1 / c2)) : 0;
      const px = a.x + vx * t, py = a.y + vy * t;
      const d = Math.hypot(px - x, py - y);
      if (d <= r) {
        const tt = a.t + (b.t - a.t) * t;
        const inter: Point = { x: px, y: py, t: tt };
        cur.push(inter);
        if (cur.length > 1) out.push({ points: cur, color: s.color, width: s.width });
        cur = [ { ...b } ];
      } else {
        cur.push({ ...b });
      }
    }
    if (cur.length > 1) out.push({ points: cur, color: s.color, width: s.width });
    return out;
  };

  const applyEraseAt = (x: number, y: number, zoom: number) => {
    const r = 6 / Math.max(0.001, zoom);
    setUndone([]);
    setStrokes(prev => {
      let changed = false;
      const next: Stroke[] = [];
      for (const s of prev) {
        if (hitStroke(s, x, y, r)) {
          const parts = splitStrokeByErase(s, x, y, r);
          for (const p of parts) if (p.points.length > 1) next.push(p);
          changed = true;
        } else {
          next.push(s);
        }
      }
      return changed ? next : prev;
    });
  };

  useEffect(() => { onChange?.(strokes); }, [strokes, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setShiftDown(e.shiftKey);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scaleCanvas = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor((rect.height || rect.width * 0.5) * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = (rect.height || rect.width * 0.5) + "px";
      redraw();
    };
    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      const scale = dpr * zoom;
      const tx = pan.x * dpr, ty = pan.y * dpr;
      // grid
      const step = 24 * scale;
      ctx.strokeStyle = isWhite ? "#444" : "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = (tx % step + step) % step; gx < canvas.width; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); }
      for (let gy = (ty % step + step) % step; gy < canvas.height; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); }
      ctx.stroke();
      // strokes
      for (const s of strokes) {
        if (!s.points.length) continue;
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width * scale; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(s.points[0].x * scale + tx, s.points[0].y * scale + ty);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x * scale + tx, s.points[i].y * scale + ty);
        ctx.stroke();
      }
    };
    scaleCanvas();
    const ro = new ResizeObserver(scaleCanvas);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [strokes]);

  const getPos = (e: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = (cx - pan.x) / Math.max(0.001, zoom);
    const y = (cy - pan.y) / Math.max(0.001, zoom);
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const dpr = window.devicePixelRatio || 1;
      const scale = dpr * zoom;
      const { x, y } = getPos(e);
      if (mode === 'erase') {
        canvas.setPointerCapture(e.pointerId);
        applyEraseAt(x, y, zoom);
        return;
      }

      canvas.setPointerCapture(e.pointerId);
      setDrawing(true);
      if (startRef.current == null) startRef.current = performance.now();
      const t0 = performance.now() - (startRef.current ?? 0);
      const s: Stroke = { points: [{ x, y, t: t0 }], color, width };
      currentStrokeRef.current = s;
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, width * (e.pressure || 1)) * scale; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(x * scale + pan.x * dpr, y * scale + pan.y * dpr);
    };
    const onMove = (e: PointerEvent) => {
      if (mode === 'erase') {
        const { x, y } = getPos(e);
        applyEraseAt(x, y, zoom);
        return;
      }
      if (!drawing || !currentStrokeRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const scale = dpr * zoom;
      let { x, y } = getPos(e);
      const last = currentStrokeRef.current.points.at(-1);
      if (shiftDown && last) {
        const dx = x - last.x, dy = y - last.y;
        if (Math.abs(dx) > Math.abs(dy)) y = last.y; else x = last.x;
      }
      const t = performance.now() - (startRef.current ?? 0);
      const p: Point = { x, y, t };
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1) currentStrokeRef.current.points.push(p);
      ctx.lineWidth = Math.max(1, width * (e.pressure || 1)) * scale;
      ctx.lineTo(x * scale + pan.x * dpr, y * scale + pan.y * dpr); ctx.stroke();
    };
    const endStroke = () => {
      if (!currentStrokeRef.current) return;
      const s = currentStrokeRef.current;
      currentStrokeRef.current = null;
      setDrawing(false);
      setUndone([]);
      setStrokes(prev => [...prev, s]);
    };
    const onUp = () => endStroke();
    const onLeave = () => endStroke();
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [color, width, drawing, strokes, zoom, pan, shiftDown]);

  const clearAll = () => { setStrokes([]); setUndone([]); startRef.current = null; };
  const undo = () => setStrokes(prev => { if (!prev.length) return prev; const next = [...prev]; const last = next.pop()!; setUndone(u => [last, ...u]); return next; });
  const redo = () => setUndone(u => { if (!u.length) return u; const [first, ...rest] = u; setStrokes(s => [...s, first]); return rest; });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 rounded-lg p-2 sm:p-3 bg-white/70 dark:bg-zinc-900/50 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-2 order-1">
          {palette.map(c => (
            <button key={c} aria-label={c} className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <label className="flex items-center gap-2 w-full sm:w-auto order-2"><span className="text-sm text-gray-700">Color</span><input className="h-8 w-12 rounded" type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        <label className="flex items-center gap-2 flex-1 min-w-0 order-3"><span className="text-sm text-gray-700">Width</span><input className="h-2 w-full sm:w-40" type="range" min={1} max={20} value={width} onChange={e => setWidth(Number(e.target.value))} /></label>
        <div className="flex items-center gap-2 order-4">
          <button className={`px-3 py-1.5 rounded-md text-sm ${mode==='draw'?'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-black/10':'bg-gradient-to-b from-white to-gray-100 text-gray-900 ring-1 ring-black/10'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`} onClick={() => setMode('draw')}>Draw</button>
          <button className={`px-3 py-1.5 rounded-md text-sm ${mode==='erase'?'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-black/10':'bg-gradient-to-b from-white to-gray-100 text-gray-900 ring-1 ring-black/10'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`} onClick={() => setMode('erase')}>Erase</button>
        </div>
        <div className="flex items-center gap-2 order-5 w-full sm:w-auto">
          <span className="text-sm text-gray-700">Zoom</span>
          <input className="h-2 w-full sm:w-32" type="range" min={0.5} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
          <button className="px-2 py-1 rounded-md text-sm bg-white text-gray-900 ring-1 ring-black/10" onClick={() => { setZoom(1); setPan({x:0,y:0}); }}>Reset View</button>
        </div>
        <button className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 shadow-sm ring-1 ring-black/10 disabled:opacity-50 order-6" onClick={undo} disabled={!strokes.length}>Undo</button>
        <button className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 shadow-sm ring-1 ring-black/10 disabled:opacity-50 order-7" onClick={redo} disabled={!undone.length}>Redo</button>
        <button className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 shadow-sm ring-1 ring-black/10 disabled:opacity-50 order-8" onClick={clearAll} disabled={!strokes.length}>Clear</button>

      </div>
      <div className={`rounded-xl ${isWhite ? "border-gray-700 bg-black" : "border-transparent bg-white/70 dark:bg-zinc-900/60"} ring-1 ring-black/10 dark:ring-white/10 shadow-lg`}>
        <div className="relative h-[46vh] sm:h-[360px]">
          <button className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs ${drawing ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm ring-1 ring-black/10' : 'bg-gradient-to-b from-white to-gray-100 text-gray-900 ring-1 ring-black/10'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`}>{drawing ? 'Recording' : 'Idle'}</button>
          <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: "none" }} />
        </div>
      </div>
      <div className="mt-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {strokes.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/70 dark:bg-zinc-900/60 ring-1 ring-black/10">
              <span className="text-xs text-gray-700">#{i+1}</span>
              <input type="color" value={s.color} onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, color: e.target.value } : ss))} />
              <input type="range" min={1} max={20} value={s.width} onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, width: Number(e.target.value) } : ss))} />
              <button className="px-2 py-1 text-xs rounded-md bg-white ring-1 ring-black/10" onClick={() => setStrokes(prev => prev.filter((_, idx) => idx !== i))}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">Draw your signature. Use color and width controls. Use modes for erase/pick, Undo/Redo for history, and per-stroke edits below.</p>
    </div>
  );
}