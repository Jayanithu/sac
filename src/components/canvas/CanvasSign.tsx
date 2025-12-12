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
  const [trackpadMode, setTrackpadMode] = useState(false);
  const [trackpadCountdown, setTrackpadCountdown] = useState<number | null>(null);
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(10);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const [autoStopExpired, setAutoStopExpired] = useState(false);
  const palette = COLOR_PALETTE;
  const startRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const trackpadMoveCountRef = useRef<number>(0);
  const trackpadStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackpadCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activePointerIdsRef = useRef<Set<number>>(new Set());
  const autoStopExpiredRef = useRef<boolean>(false);

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
    return () => {
      if (trackpadCountdownIntervalRef.current) {
        clearInterval(trackpadCountdownIntervalRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      if (autoStopIntervalRef.current) {
        clearInterval(autoStopIntervalRef.current);
      }
    };
  }, []);

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
        activePointerIdsRef.current.add(e.pointerId);
        applyEraseAt(x, y, zoom);
        return;
      }

      // Reset expired flag when user explicitly clicks to start drawing
      if (autoStopExpiredRef.current) {
        autoStopExpiredRef.current = false;
        setAutoStopExpired(false);
      }

      canvas.setPointerCapture(e.pointerId);
      activePointerIdsRef.current.add(e.pointerId);
      setDrawing(true);
      if (startRef.current == null) startRef.current = performance.now();
      const t0 = performance.now() - (startRef.current ?? 0);
      const s: Stroke = { points: [{ x, y, t: t0 }], color, width };
      currentStrokeRef.current = s;
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, width * (e.pressure || 1)) * scale; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(x * scale + pan.x * dpr, y * scale + pan.y * dpr);
      
      if (autoStopEnabled && !autoStopTimerRef.current) {
        setRecordingTimeLeft(recordingDuration);
        autoStopTimerRef.current = setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
            // Release all active pointer captures
            activePointerIdsRef.current.forEach(pointerId => {
              try {
                canvas.releasePointerCapture(pointerId);
              } catch (e) {
                // Ignore errors if pointer is already released
              }
            });
            activePointerIdsRef.current.clear();
          }
          
          if (currentStrokeRef.current) {
            const s = currentStrokeRef.current;
            currentStrokeRef.current = null;
            setDrawing(false);
            setUndone([]);
            setStrokes(prev => [...prev, s]);
          }
          if (autoStopIntervalRef.current) {
            clearInterval(autoStopIntervalRef.current);
            autoStopIntervalRef.current = null;
          }
          autoStopTimerRef.current = null;
          setRecordingTimeLeft(null);
          autoStopExpiredRef.current = true; // Mark as expired to prevent auto-restart
          setAutoStopExpired(true); // Update state for UI
        }, recordingDuration * 1000);
        
        autoStopIntervalRef.current = setInterval(() => {
          setRecordingTimeLeft(prev => {
            if (prev === null || prev <= 1) {
              if (autoStopIntervalRef.current) {
                clearInterval(autoStopIntervalRef.current);
                autoStopIntervalRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };
    const onMove = (e: PointerEvent) => {
      // If auto-stop timer has expired, prevent drawing
      if (autoStopExpiredRef.current) {
        return;
      }
      
      if (mode === 'erase') {
        const { x, y } = getPos(e);
        applyEraseAt(x, y, zoom);
        return;
      }
      
      const now = performance.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;
      lastMoveTimeRef.current = now;
      
      if (trackpadMode && trackpadCountdown === null && !drawing && e.pointerType === 'mouse' && !autoStopExpiredRef.current) {
        if (timeSinceLastMove < 150 || trackpadMoveCountRef.current > 0) {
          trackpadMoveCountRef.current += 1;
          if (trackpadMoveCountRef.current >= 1) {
            if (trackpadStartTimeoutRef.current) {
              clearTimeout(trackpadStartTimeoutRef.current);
              trackpadStartTimeoutRef.current = null;
            }
            const dpr = window.devicePixelRatio || 1;
            const scale = dpr * zoom;
            const { x, y } = getPos(e);
            setDrawing(true);
            if (startRef.current == null) startRef.current = performance.now();
            const t0 = performance.now() - (startRef.current ?? 0);
            const s: Stroke = { points: [{ x, y, t: t0 }], color, width };
            currentStrokeRef.current = s;
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, width) * scale;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(x * scale + pan.x * dpr, y * scale + pan.y * dpr);
            
            if (autoStopEnabled && !autoStopTimerRef.current) {
              autoStopExpiredRef.current = false; // Reset expired flag when starting new drawing
              setAutoStopExpired(false); // Reset state for UI
              setRecordingTimeLeft(recordingDuration);
              autoStopTimerRef.current = setTimeout(() => {
                const canvas = canvasRef.current;
                if (canvas) {
                  // Release all active pointer captures
                  activePointerIdsRef.current.forEach(pointerId => {
                    try {
                      canvas.releasePointerCapture(pointerId);
                    } catch (e) {
                      // Ignore errors if pointer is already released
                    }
                  });
                  activePointerIdsRef.current.clear();
                }
                
                if (currentStrokeRef.current) {
                  const s = currentStrokeRef.current;
                  currentStrokeRef.current = null;
                  setDrawing(false);
                  setUndone([]);
                  setStrokes(prev => [...prev, s]);
                }
                if (autoStopIntervalRef.current) {
                  clearInterval(autoStopIntervalRef.current);
                  autoStopIntervalRef.current = null;
                }
                autoStopTimerRef.current = null;
                setRecordingTimeLeft(null);
                autoStopExpiredRef.current = true; // Mark as expired to prevent auto-restart
                setAutoStopExpired(true); // Update state for UI
              }, recordingDuration * 1000);
              
              autoStopIntervalRef.current = setInterval(() => {
                setRecordingTimeLeft(prev => {
                  if (prev === null || prev <= 1) {
                    if (autoStopIntervalRef.current) {
                      clearInterval(autoStopIntervalRef.current);
                      autoStopIntervalRef.current = null;
                    }
                    return null;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
            return;
          }
        } else {
          trackpadMoveCountRef.current = 0;
        }
      } else if (!trackpadMode) {
        trackpadMoveCountRef.current = 0;
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
      if (!currentStrokeRef.current) {
        // Don't reset expired flag here - user needs to explicitly start new drawing
        return;
      }
      const s = currentStrokeRef.current;
      currentStrokeRef.current = null;
      setDrawing(false);
      trackpadMoveCountRef.current = 0;
      activePointerIdsRef.current.clear();
      if (trackpadStartTimeoutRef.current) {
        clearTimeout(trackpadStartTimeoutRef.current);
        trackpadStartTimeoutRef.current = null;
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      if (autoStopIntervalRef.current) {
        clearInterval(autoStopIntervalRef.current);
        autoStopIntervalRef.current = null;
      }
      setRecordingTimeLeft(null);
      setUndone([]);
      setStrokes(prev => [...prev, s]);
      // Reset expired flag when stroke ends normally (not from timer)
      if (!autoStopExpiredRef.current) {
        autoStopExpiredRef.current = false;
        setAutoStopExpired(false);
      }
    };
    const onUp = () => endStroke();
    const onLeave = () => {
      if (trackpadMode && drawing) {
        endStroke();
      } else {
        endStroke();
      }
    };
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
  }, [color, width, drawing, zoom, pan, shiftDown, mode, trackpadMode]);

  const clearAll = () => { setStrokes([]); setUndone([]); startRef.current = null; };
  const undo = () => setStrokes(prev => { if (!prev.length) return prev; const next = [...prev]; const last = next.pop()!; setUndone(u => [last, ...u]); return next; });
  const redo = () => setUndone(u => { if (!u.length) return u; const [first, ...rest] = u; setStrokes(s => [...s, first]); return rest; });

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-white/90 via-white/80 to-indigo-50/30 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-indigo-950/30 backdrop-blur-xl rounded-2xl xs:rounded-3xl p-3 xs:p-4 sm:p-5 md:p-7 shadow-2xl ring-1 ring-indigo-200/30 dark:ring-indigo-800/30 mb-4 xs:mb-5 sm:mb-6 border border-white/20 dark:border-slate-700/20">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          <div className="flex flex-wrap items-center gap-3 xs:gap-4">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 w-full xs:w-auto">
              <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Colors</span>
              <div className="flex items-center gap-2 xs:gap-2.5 pl-0 xs:pl-3 border-l-0 xs:border-l-2 border-gradient-to-b from-indigo-300 to-purple-300 dark:from-indigo-700 dark:to-purple-700 flex-wrap">
                {palette.map(c => (
                  <button 
                    key={c} 
                    aria-label={c} 
                    className={`h-8 w-8 xs:h-9 xs:w-9 rounded-full ring-2 transition-all duration-300 hover:scale-125 active:scale-110 touch-manipulation ${
                      color === c 
                        ? 'ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-xl scale-110' 
                        : 'ring-slate-300 dark:ring-slate-600 hover:ring-indigo-400 dark:hover:ring-indigo-500 shadow-md hover:shadow-lg'
                    }`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg xs:rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 ring-1 ring-indigo-200 dark:ring-indigo-800 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-all hover:shadow-lg cursor-pointer touch-manipulation">
              <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent whitespace-nowrap">Custom</span>
              <input className="h-7 w-12 xs:h-8 xs:w-14 rounded-lg cursor-pointer ring-2 ring-indigo-200 dark:ring-indigo-800" type="color" value={color} onChange={e => setColor(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 xs:gap-4">
            <label className="flex items-center gap-2 xs:gap-3 flex-1 min-w-[160px] xs:min-w-[200px]">
              <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent whitespace-nowrap">Width</span>
              <input 
                className="h-2.5 xs:h-3 flex-1 rounded-lg appearance-none cursor-pointer touch-manipulation" 
                type="range" 
                min={1} 
                max={20} 
                value={width} 
                onChange={e => setWidth(Number(e.target.value))} 
              />
              <span className="text-xs xs:text-sm font-semibold text-purple-600 dark:text-purple-400 w-9 xs:w-10 text-right px-1.5 xs:px-2 py-1 bg-purple-50 dark:bg-purple-950/30 rounded-lg">{width}px</span>
            </label>
            
            <div className="flex items-center gap-1 xs:gap-1.5 p-1 xs:p-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-lg xs:rounded-xl shadow-inner w-full xs:w-auto">
              <button 
                className={`flex-1 xs:flex-none px-4 xs:px-5 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-xs xs:text-sm font-semibold transition-all duration-300 touch-manipulation ${
                  mode === 'draw'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg ring-2 ring-white/50 scale-105' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 active:scale-95'
                }`} 
                onClick={() => setMode('draw')}
              >
                ✏️ Draw
              </button>
              <button 
                className={`flex-1 xs:flex-none px-4 xs:px-5 py-2 xs:py-2.5 rounded-md xs:rounded-lg text-xs xs:text-sm font-semibold transition-all duration-300 touch-manipulation ${
                  mode === 'erase'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-white/50 scale-105' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 active:scale-95'
                }`} 
                onClick={() => setMode('erase')}
              >
                🗑️ Erase
              </button>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 xs:gap-4 w-full xs:w-auto">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 flex-1 p-2 xs:p-3 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg xs:rounded-xl ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                <div className="flex items-center gap-2 xs:gap-3 flex-1">
                  <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent whitespace-nowrap">Trackpad Mode</span>
                  {autoStopExpired && autoStopEnabled && (
                    <span className="text-[10px] xs:text-xs font-semibold text-amber-600 dark:text-amber-400 px-2 xs:px-2.5 py-0.5 xs:py-1 bg-amber-100 dark:bg-amber-950/40 rounded-full animate-pulse">
                      ⏸️ Timer stopped - Toggle to resume
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      className={`relative flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-semibold transition-all duration-300 touch-manipulation min-w-[70px] xs:min-w-[80px] ${
                        trackpadMode && trackpadCountdown === null
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-300/50 dark:ring-emerald-700/50 hover:from-emerald-600 hover:to-teal-600'
                          : trackpadCountdown !== null
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ring-2 ring-amber-300/50 dark:ring-amber-700/50 animate-pulse'
                          : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-500 ring-1 ring-slate-300 dark:ring-slate-600'
                      }`}
                      onClick={() => {
                        if (trackpadMode) {
                          setTrackpadMode(false);
                          setTrackpadCountdown(null);
                          if (trackpadCountdownIntervalRef.current) {
                            clearInterval(trackpadCountdownIntervalRef.current);
                            trackpadCountdownIntervalRef.current = null;
                          }
                          if (drawing && currentStrokeRef.current) {
                            const s = currentStrokeRef.current;
                            currentStrokeRef.current = null;
                            setDrawing(false);
                            trackpadMoveCountRef.current = 0;
                            if (trackpadStartTimeoutRef.current) {
                              clearTimeout(trackpadStartTimeoutRef.current);
                              trackpadStartTimeoutRef.current = null;
                            }
                            setUndone([]);
                            setStrokes(prev => [...prev, s]);
                          }
                        } else {
                          // Reset expired flag when toggling trackpad mode on
                          if (autoStopExpiredRef.current) {
                            autoStopExpiredRef.current = false;
                            setAutoStopExpired(false);
                          }
                          setTrackpadCountdown(5);
                          if (trackpadCountdownIntervalRef.current) {
                            clearInterval(trackpadCountdownIntervalRef.current);
                          }
                          trackpadCountdownIntervalRef.current = setInterval(() => {
                            setTrackpadCountdown(prev => {
                              if (prev === null || prev <= 1) {
                                if (trackpadCountdownIntervalRef.current) {
                                  clearInterval(trackpadCountdownIntervalRef.current);
                                  trackpadCountdownIntervalRef.current = null;
                                }
                                setTrackpadMode(true);
                                return null;
                              }
                              return prev - 1;
                            });
                          }, 1000);
                        }
                      }}
                      title={trackpadCountdown !== null ? `Activating in ${trackpadCountdown}s...` : trackpadMode ? "Trackpad mode active - click to disable" : "Enable trackpad mode - draw by moving mouse/trackpad without clicking"}
                    >
                      <div className={`relative w-8 xs:w-10 h-4 xs:h-5 rounded-full transition-all duration-300 ${
                        trackpadMode && trackpadCountdown === null
                          ? 'bg-white/30'
                          : trackpadCountdown !== null
                          ? 'bg-white/30'
                          : 'bg-slate-400 dark:bg-slate-500'
                      }`}>
                        <div className={`absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-3 xs:w-4 h-3 xs:h-4 rounded-full bg-white shadow-lg transition-all duration-300 transform ${
                          trackpadMode && trackpadCountdown === null
                            ? 'translate-x-4 xs:translate-x-5'
                            : trackpadCountdown !== null
                            ? 'translate-x-4 xs:translate-x-5'
                            : 'translate-x-0'
                        }`} />
                      </div>
                      <span className="text-[10px] xs:text-xs">{trackpadCountdown !== null ? `${trackpadCountdown}s` : trackpadMode ? 'On' : 'Off'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 flex-1 p-2 xs:p-3 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg xs:rounded-xl ring-1 ring-amber-200/50 dark:ring-amber-800/50">
                <div className="flex items-center gap-2 xs:gap-3 flex-1">
                  <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent whitespace-nowrap">Auto-Stop Timer</span>
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      className={`relative flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-semibold transition-all duration-300 touch-manipulation min-w-[70px] xs:min-w-[80px] ${
                        autoStopEnabled
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ring-2 ring-amber-300/50 dark:ring-amber-700/50 hover:from-amber-600 hover:to-orange-600'
                          : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-500 ring-1 ring-slate-300 dark:ring-slate-600'
                      }`}
                      onClick={() => {
                        setAutoStopEnabled(!autoStopEnabled);
                        if (autoStopEnabled) {
                          if (autoStopTimerRef.current) {
                            clearTimeout(autoStopTimerRef.current);
                            autoStopTimerRef.current = null;
                          }
                          if (autoStopIntervalRef.current) {
                            clearInterval(autoStopIntervalRef.current);
                            autoStopIntervalRef.current = null;
                          }
                          setRecordingTimeLeft(null);
                          autoStopExpiredRef.current = false; // Reset expired flag when disabling
                          setAutoStopExpired(false); // Reset state for UI
                        }
                      }}
                      title={autoStopEnabled ? "Auto-stop timer enabled - drawing will stop automatically after set duration" : "Enable auto-stop timer - automatically stops drawing after set duration"}
                    >
                      <div className={`relative w-8 xs:w-10 h-4 xs:h-5 rounded-full transition-all duration-300 ${
                        autoStopEnabled
                          ? 'bg-white/30'
                          : 'bg-slate-400 dark:bg-slate-500'
                      }`}>
                        <div className={`absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-3 xs:w-4 h-3 xs:h-4 rounded-full bg-white shadow-lg transition-all duration-300 transform ${
                          autoStopEnabled
                            ? 'translate-x-4 xs:translate-x-5'
                            : 'translate-x-0'
                        }`} />
                      </div>
                      <span className="text-[10px] xs:text-xs">{autoStopEnabled ? 'On' : 'Off'}</span>
                    </button>
                    {autoStopEnabled && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={recordingDuration}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(300, Number(e.target.value)));
                            setRecordingDuration(val);
                          }}
                          className="w-12 xs:w-16 px-2 xs:px-3 py-1 xs:py-1.5 text-xs xs:text-sm font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-amber-300 dark:ring-amber-700 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 outline-none"
                          disabled={drawing}
                        />
                        <span className="text-xs xs:text-sm font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">seconds</span>
                      </>
                    )}
                  </div>
                </div>
                {recordingTimeLeft !== null && recordingTimeLeft > 0 && (
                  <div className="flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ring-2 ring-amber-300/50 dark:ring-amber-700/50">
                    <span className="text-xs xs:text-sm font-bold animate-pulse">⏱️</span>
                    <span className="text-xs xs:text-sm font-bold">Stops in: {recordingTimeLeft}s</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xs:gap-3 w-full xs:w-auto">
              <span className="text-xs xs:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Zoom</span>
              <input 
                className="h-2.5 xs:h-3 w-20 xs:w-28 rounded-lg appearance-none cursor-pointer touch-manipulation" 
                type="range" 
                min={0.5} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={e => setZoom(Number(e.target.value))} 
              />
              <span className="text-xs xs:text-sm font-semibold text-emerald-600 dark:text-emerald-400 w-12 xs:w-14 text-center px-1.5 xs:px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">{Math.round(zoom * 100)}%</span>
              <button 
                className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all touch-manipulation" 
                onClick={() => { setZoom(1); setPan({x:0,y:0}); }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xs:gap-3 pt-3 xs:pt-4 border-t border-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800">
            <button 
              className="flex-1 xs:flex-none min-w-[80px] px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 touch-manipulation" 
              onClick={undo} 
              disabled={!strokes.length}
            >
              <span>↶</span> Undo
            </button>
            <button 
              className="flex-1 xs:flex-none min-w-[80px] px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 touch-manipulation" 
              onClick={redo} 
              disabled={!undone.length}
            >
              <span>↷</span> Redo
            </button>
            <button 
              className="w-full xs:w-auto xs:flex-none px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 touch-manipulation" 
              onClick={clearAll} 
              disabled={!strokes.length}
            >
              <span>🗑️</span> Clear All
            </button>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl xs:rounded-3xl overflow-hidden shadow-2xl ring-2 ${
        isWhite 
          ? "bg-slate-900 ring-slate-700" 
          : "bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/90 backdrop-blur-xl ring-indigo-200/40 dark:ring-indigo-800/40"
      }`}>
        <div className="relative h-[40vh] xs:h-[45vh] sm:h-[50vh] md:h-[400px] lg:h-[600px]">
          <div className={`absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 z-10 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-full text-[10px] xs:text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 xs:gap-2 ${
            drawing 
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-xl ring-2 ring-red-300/50 animate-pulse' 
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 shadow-lg'
          }`}>
            {drawing ? <><span className="animate-pulse text-xs xs:text-sm">●</span> <span className="hidden xs:inline">Recording</span><span className="xs:hidden">Rec</span></> : <><span className="text-xs xs:text-sm">○</span> Idle</>}
          </div>
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" style={{ touchAction: "none" }} />
        </div>
      </div>

      {strokes.length > 0 && (
        <div className="mt-4 xs:mt-5 sm:mt-6 bg-gradient-to-br from-white/90 via-purple-50/40 to-pink-50/40 dark:from-slate-900/90 dark:via-purple-950/20 dark:to-pink-950/20 backdrop-blur-xl rounded-2xl xs:rounded-3xl p-3 xs:p-4 sm:p-5 md:p-7 shadow-2xl ring-1 ring-purple-200/30 dark:ring-purple-800/30 border border-white/20 dark:border-slate-700/20">
          <div className="flex items-center gap-1.5 xs:gap-2 mb-3 xs:mb-4">
            <span className="text-lg xs:text-xl">🎨</span>
            <h3 className="text-xs xs:text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Edit Strokes</h3>
            <span className="text-[10px] xs:text-xs font-semibold text-purple-600 dark:text-purple-400 ml-auto px-2 xs:px-3 py-0.5 xs:py-1 bg-purple-100 dark:bg-purple-950/40 rounded-full">({strokes.length})</span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex items-center gap-2 xs:gap-3 min-w-max">
              {strokes.map((s, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 sm:px-5 py-3 xs:py-4 rounded-xl xs:rounded-2xl bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800/80 dark:to-purple-950/30 ring-1 ring-purple-200 dark:ring-purple-800 hover:ring-purple-300 dark:hover:ring-purple-700 hover:shadow-xl transition-all min-w-[200px] xs:min-w-[240px]"
                >
                  <span className="text-[10px] xs:text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2 xs:px-3 py-1 xs:py-1.5 rounded-md xs:rounded-lg shadow-lg flex-shrink-0">#{i+1}</span>
                  <input 
                    type="color" 
                    value={s.color} 
                    onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, color: e.target.value } : ss))}
                    className="h-8 w-11 xs:h-9 xs:w-14 rounded-lg cursor-pointer ring-2 ring-purple-200 dark:ring-purple-800 hover:ring-purple-300 dark:hover:ring-purple-700 transition-all flex-shrink-0 touch-manipulation"
                  />
                  <div className="flex items-center gap-1.5 xs:gap-2 flex-1 min-w-0">
                    <input 
                      type="range" 
                      min={1} 
                      max={20} 
                      value={s.width} 
                      onChange={e => setStrokes(prev => prev.map((ss, idx) => idx===i ? { ...ss, width: Number(e.target.value) } : ss))}
                      className="h-2.5 xs:h-3 flex-1 rounded-lg appearance-none cursor-pointer touch-manipulation"
                    />
                    <span className="text-[10px] xs:text-xs font-semibold text-purple-600 dark:text-purple-400 w-7 xs:w-8 px-1 xs:px-2 py-0.5 xs:py-1 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center flex-shrink-0">{s.width}</span>
                  </div>
                  <button 
                    className="px-2 xs:px-3 py-1.5 xs:py-2 text-xs font-semibold rounded-lg xs:rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all flex-shrink-0 touch-manipulation" 
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