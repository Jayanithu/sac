"use client";
import React, { useEffect, useRef, useState } from "react";
import { Stroke, Point } from "../lib/pathUtils";

type Props = { onChange?: (strokes: Stroke[]) => void };

export default function CanvasSign({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#111827");
  const [width, setWidth] = useState(4);
  const startRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);

  useEffect(() => { onChange?.(strokes); }, [strokes, onChange]);

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
      ctx.scale(1, 1);
      for (const s of strokes) {
        if (!s.points.length) continue;
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width * dpr; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(s.points[0].x * dpr, s.points[0].y * dpr);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x * dpr, s.points[i].y * dpr);
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
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    return { x: x / dpr, y: y / dpr };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      setDrawing(true);
      if (startRef.current == null) startRef.current = performance.now();
      const t0 = performance.now() - (startRef.current ?? 0);
      const { x, y } = getPos(e);
      const s: Stroke = { points: [{ x, y, t: t0 }], color, width };
      currentStrokeRef.current = s;
      const dpr = window.devicePixelRatio || 1;
      ctx.strokeStyle = color; ctx.lineWidth = width * dpr; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(x * dpr, y * dpr);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawing || !currentStrokeRef.current) return;
      const { x, y } = getPos(e);
      const t = performance.now() - (startRef.current ?? 0);
      const p: Point = { x, y, t };
      currentStrokeRef.current.points.push(p);
      const dpr = window.devicePixelRatio || 1;
      ctx.lineTo(x * dpr, y * dpr); ctx.stroke();
    };
    const endStroke = () => {
      if (!currentStrokeRef.current) return;
      const s = currentStrokeRef.current;
      currentStrokeRef.current = null;
      setDrawing(false);
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
  }, [color, width, drawing]);

  const clearAll = () => { setStrokes([]); startRef.current = null; };
  const undo = () => setStrokes(prev => prev.slice(0, -1));

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-3">
        <label className="flex items-center gap-2"><span className="text-sm text-gray-700">Color</span><input className="h-8 w-12 rounded" type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        <label className="flex items-center gap-2"><span className="text-sm text-gray-700">Width</span><input className="h-2" type="range" min={1} max={20} value={width} onChange={e => setWidth(Number(e.target.value))} /></label>
        <button className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm disabled:opacity-50" onClick={undo} disabled={!strokes.length}>Undo</button>
        <button className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm disabled:opacity-50" onClick={clearAll} disabled={!strokes.length}>Clear</button>
        <span className={`text-xs ${drawing ? "text-emerald-600" : "text-gray-400"}`}>{drawing ? "Recording…" : "Idle"}</span>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div style={{ height: 360 }}>
          <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: "none" }} />
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">Draw your signature. Use color and width controls. Undo removes the last stroke; Clear resets.</p>
    </div>
  );
}