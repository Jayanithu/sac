"use client";
import { useEffect, useRef, useState } from "react";
import type { Stroke, Point, DrawingMode } from "../../types";
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_ZOOM } from "../../constants";
import CanvasControls from "./CanvasControls";
import StrokeEditor from "./StrokeEditor";

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
  const [trackpadTimerEnabled, setTrackpadTimerEnabled] = useState(false);
  const [trackpadTimerDuration, setTrackpadTimerDuration] = useState(10);
  const [trackpadTimerLeft, setTrackpadTimerLeft] = useState<number | null>(null);
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(10);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const [autoStopExpired, setAutoStopExpired] = useState(false);
  const startRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const trackpadMoveCountRef = useRef<number>(0);
  const trackpadStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackpadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trackpadTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      if (trackpadTimerRef.current) {
        clearTimeout(trackpadTimerRef.current);
      }
      if (trackpadTimerIntervalRef.current) {
        clearInterval(trackpadTimerIntervalRef.current);
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
      
      // Start trackpad timer if enabled (for trackpad mode)
      if (trackpadMode && trackpadTimerEnabled && !trackpadTimerRef.current) {
        setTrackpadTimerLeft(trackpadTimerDuration);
        trackpadTimerRef.current = setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
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
          if (trackpadTimerIntervalRef.current) {
            clearInterval(trackpadTimerIntervalRef.current);
            trackpadTimerIntervalRef.current = null;
          }
          trackpadTimerRef.current = null;
          setTrackpadTimerLeft(null);
        }, trackpadTimerDuration * 1000);
        
        trackpadTimerIntervalRef.current = setInterval(() => {
          setTrackpadTimerLeft(prev => {
            if (prev === null || prev <= 1) {
              if (trackpadTimerIntervalRef.current) {
                clearInterval(trackpadTimerIntervalRef.current);
                trackpadTimerIntervalRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
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
      
      if (trackpadMode && !drawing && e.pointerType === 'mouse' && !autoStopExpiredRef.current) {
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
            
            // Start trackpad timer if enabled
            if (trackpadTimerEnabled && !trackpadTimerRef.current) {
              setTrackpadTimerLeft(trackpadTimerDuration);
              trackpadTimerRef.current = setTimeout(() => {
                const canvas = canvasRef.current;
                if (canvas) {
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
                if (trackpadTimerIntervalRef.current) {
                  clearInterval(trackpadTimerIntervalRef.current);
                  trackpadTimerIntervalRef.current = null;
                }
                trackpadTimerRef.current = null;
                setTrackpadTimerLeft(null);
              }, trackpadTimerDuration * 1000);
              
              trackpadTimerIntervalRef.current = setInterval(() => {
                setTrackpadTimerLeft(prev => {
                  if (prev === null || prev <= 1) {
                    if (trackpadTimerIntervalRef.current) {
                      clearInterval(trackpadTimerIntervalRef.current);
                      trackpadTimerIntervalRef.current = null;
                    }
                    return null;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
            
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
      if (trackpadTimerRef.current) {
        clearTimeout(trackpadTimerRef.current);
        trackpadTimerRef.current = null;
      }
      if (trackpadTimerIntervalRef.current) {
        clearInterval(trackpadTimerIntervalRef.current);
        trackpadTimerIntervalRef.current = null;
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      if (autoStopIntervalRef.current) {
        clearInterval(autoStopIntervalRef.current);
        autoStopIntervalRef.current = null;
      }
      setTrackpadTimerLeft(null);
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
      <CanvasControls
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        mode={mode}
        setMode={setMode}
        zoom={zoom}
        setZoom={setZoom}
        pan={pan}
        setPan={setPan}
        trackpadMode={trackpadMode}
        setTrackpadMode={setTrackpadMode}
        trackpadTimerEnabled={trackpadTimerEnabled}
        setTrackpadTimerEnabled={setTrackpadTimerEnabled}
        trackpadTimerDuration={trackpadTimerDuration}
        setTrackpadTimerDuration={setTrackpadTimerDuration}
        trackpadTimerLeft={trackpadTimerLeft}
        trackpadTimerRef={trackpadTimerRef}
        trackpadTimerIntervalRef={trackpadTimerIntervalRef}
        setTrackpadTimerLeft={setTrackpadTimerLeft}
        drawing={drawing}
        currentStrokeRef={currentStrokeRef}
        setDrawing={setDrawing}
        trackpadMoveCountRef={trackpadMoveCountRef}
        trackpadStartTimeoutRef={trackpadStartTimeoutRef}
        setStrokes={setStrokes}
        setUndone={setUndone}
        autoStopExpiredRef={autoStopExpiredRef}
        setAutoStopExpired={setAutoStopExpired}
        autoStopEnabled={autoStopEnabled}
        setAutoStopEnabled={setAutoStopEnabled}
        recordingDuration={recordingDuration}
        setRecordingDuration={setRecordingDuration}
        recordingTimeLeft={recordingTimeLeft}
        autoStopTimerRef={autoStopTimerRef}
        autoStopIntervalRef={autoStopIntervalRef}
        setRecordingTimeLeft={setRecordingTimeLeft}
        autoStopExpired={autoStopExpired}
        undo={undo}
        redo={redo}
        clearAll={clearAll}
        strokesLength={strokes.length}
        undoneLength={undone.length}
      />

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

      <StrokeEditor strokes={strokes} setStrokes={setStrokes} />
    </div>
  );
}