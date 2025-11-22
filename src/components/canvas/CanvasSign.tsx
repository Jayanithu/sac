"use client";
import { useEffect, useRef, useState } from "react";
import type { Stroke, Point, DrawingMode } from "../../types";
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_ZOOM, COLOR_PALETTE } from "../../constants";

type Props = { onChange?: (strokes: Stroke[]) => void };

export default function CanvasSign({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undone, setUndone] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<DrawingMode>('draw');
  const [color, setColor] = useState(DEFAULT_STROKE_COLOR);
  const isWhite = (color || "").toLowerCase() === "#ffffff" || (color || "").toLowerCase() === "#fff";
  const [width, setWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState<{x:number;y:number}>({ x: 0, y: 0 });
  const [shiftDown, setShiftDown] = useState(false);
  const palette = COLOR_PALETTE;
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
      const step = 24 * scale;
      ctx.strokeStyle = isWhite ? "#444" : "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = (tx % step + step) % step; gx < canvas.width; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); }
      for (let gy = (ty % step + step) % step; gy < canvas.height; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); }
      ctx.stroke();
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
  }, [color, width, drawing, zoom, pan, shiftDown, mode]);

  const clearAll = () => { setStrokes([]); setUndone([]); startRef.current = null; };
  const undo = () => setStrokes(prev => { if (!prev.length) return prev; const next = [...prev]; const last = next.pop()!; setUndone(u => [last, ...u]); return next; });
  const redo = () => setUndone(u => { if (!u.length) return u; const [first, ...rest] = u; setStrokes(s => [...s, first]); return rest; });

  return (
    <div className="w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 mb-6">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colors</span>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                {palette.map(c => (
                  <button 
                    key={c} 
                    aria-label={c} 
                    className={`h-8 w-8 rounded-full ring-2 transition-all duration-200 hover:scale-110 hover:ring-offset-2 ${
                      color === c 
                        ? 'ring-indigo-500 dark:ring-indigo-400 ring-offset-2 shadow-lg scale-110' 
                        : 'ring-slate-300 dark:ring-slate-600 hover:ring-slate-400 dark:hover:ring-slate-500'
                    }`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600 transition-colors">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom</span>
              <input className="h-8 w-12 rounded cursor-pointer" type="color" value={color} onChange={e => setColor(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Width</span>
              <input 
                className="h-2 flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                type="range" 
                min={1} 
                max={20} 
                value={width} 
                onChange={e => setWidth(Number(e.target.value))} 
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 w-8 text-right">{width}px</span>
            </label>
            
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === 'draw'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`} 
                onClick={() => setMode('draw')}
              >
                ✏️ Draw
              </button>
              <button 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === 'erase'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`} 
                onClick={() => setMode('erase')}
              >
                🗑️ Erase
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom</span>
              <input 
                className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                type="range" 
                min={0.5} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={e => setZoom(Number(e.target.value))} 
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">{Math.round(zoom * 100)}%</span>
              <button 
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700 transition-colors" 
                onClick={() => { setZoom(1); setPan({x:0,y:0}); }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
              onClick={undo} 
              disabled={!strokes.length}
            >
              <span>↶</span> Undo
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
              onClick={redo} 
              disabled={!undone.length}
            >
              <span>↷</span> Redo
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
              onClick={clearAll} 
              disabled={!strokes.length}
            >
              <span>🗑️</span> Clear All
            </button>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl overflow-hidden shadow-xl ring-1 ${
        isWhite 
          ? "bg-slate-900 ring-slate-700" 
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-slate-200/50 dark:ring-slate-800/50"
      }`}>
        <div className="relative h-[50vh] sm:h-[400px] lg:h-[600px]">
          <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
            drawing 
              ? 'bg-red-500/90 text-white shadow-lg ring-2 ring-red-400/50 animate-pulse' 
              : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
          }`}>
            {drawing ? '● Recording' : '○ Idle'}
          </div>
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" style={{ touchAction: "none" }} />
        </div>
      </div>

      {strokes.length > 0 && (
        <div className="mt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎨</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Edit Individual Strokes</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">({strokes.length} stroke{strokes.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-3 min-w-max">
              {strokes.map((s, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">#{i+1}</span>
                  <input 
                    type="color" 
                    value={s.color} 
                    onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, color: e.target.value } : ss))}
                    className="h-8 w-12 rounded cursor-pointer ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min={1} 
                      max={20} 
                      value={s.width} 
                      onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, width: Number(e.target.value) } : ss))}
                      className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-6">{s.width}</span>
                  </div>
                  <button 
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-900 transition-colors" 
                    onClick={() => setStrokes(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}