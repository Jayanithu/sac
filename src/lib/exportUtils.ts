import type { Stroke } from '../types';
import { getBounds, svgPathFromStrokes, strokeLength, totalDurationMs, cumulativeLengthTimeline, partialStrokesUpToLength } from "./pathUtils";
import { DEFAULT_FPS, LOTTIE_VERSION, VIDEO_BITRATE, MAX_VIDEO_WIDTH, MAX_VIDEO_HEIGHT } from '../constants';

export const buildAnimatedSVG = (strokes: Stroke[]) => {
  if (!strokes.length) return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
  const b = getBounds(strokes);
  const totalDur = totalDurationMs(strokes) || 1;
  const svgParts: string[] = [];
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.minX} ${b.minY} ${b.width} ${b.height}">`);
  for (const s of strokes) {
    if (!s.points.length) continue;
    const d = svgPathFromStrokes([s]);
    const len = strokeLength(s);
    if (len === 0) continue;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const times = s.points.map(p => clamp(p.t / totalDur));
    let acc = 0;
    const vals: string[] = s.points.map((_, i) => {
      if (i === 0) return String(len);
      acc += Math.hypot(s.points[i].x - s.points[i - 1].x, s.points[i].y - s.points[i - 1].y);
      return String(len - acc);
    });
    const last = vals.at(-1) ?? String(len);
    const keyTimes = [0, ...times, 1].join(";");
    const values = [String(len), ...vals, last].join(";");
    svgParts.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}">`);
    svgParts.push(`<animate attributeName="stroke-dashoffset" values="${values}" keyTimes="${keyTimes}" dur="${totalDur}ms" calcMode="linear" fill="freeze" />`);
    svgParts.push(`</path>`);
  }
  svgParts.push(`</svg>`);
  return svgParts.join("");
};

export const buildLottieJSON = (strokes: Stroke[], fps = DEFAULT_FPS) => {
  const validStrokes = strokes.filter(s => s.points.length > 0);
  if (!validStrokes.length) {
    return {
      v: LOTTIE_VERSION,
      fr: fps,
      ip: 0,
      op: 0,
      w: 100,
      h: 100,
      nm: "Signature",
      ddd: 0,
      assets: [],
      layers: []
    };
  }
  
  const b = getBounds(validStrokes);
  const durMs = totalDurationMs(validStrokes) || 1;
  const totalFrames = Math.round((durMs / 1000) * fps);
  
  const layers: any[] = [];
  
  for (const s of validStrokes) {
    const v = s.points.map(p => [p.x - b.minX, p.y - b.minY]);
    const i = s.points.map(_ => [0, 0]);
    const o = s.points.map(_ => [0, 0]);
    
    const hex = s.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b_val = parseInt(hex.substring(4, 6), 16) / 255;
    
    const strokeLen = strokeLength(s);
    const startFrame = Math.round((s.points[0]?.t || 0) / 1000 * fps);
    const endFrame = Math.round((s.points[s.points.length - 1]?.t || durMs) / 1000 * fps);
    
    const groupItems: any[] = [
      { ty: "sh", d: 1, ks: { a: 0, k: { i, o, v, c: false } }, nm: "Path", hd: false },
      { ty: "st", c: { a: 0, k: [r, g, b_val, 1] }, w: { a: 0, k: s.width }, lc: 2, lj: 2, nm: "Stroke", hd: false },
      { ty: "tm", s: { a: 0, k: 0 }, e: { a: 1, k: [{ t: 0, s: 0 }, { t: endFrame - startFrame, s: 100 }] }, o: { a: 0, k: 0 }, m: 1, nm: "Trim", hd: false }
    ];
    
    layers.push({
      ty: 4,
      nm: `Stroke ${layers.length + 1}`,
      ip: startFrame,
      op: endFrame,
      st: startFrame,
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [0, 0, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
      shapes: [{ ty: "gr", it: groupItems, nm: "Group" }]
    });
  }
  
  const json: any = {
    v: LOTTIE_VERSION,
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: Math.round(b.width),
    h: Math.round(b.height),
    nm: "Signature",
    ddd: 0,
    assets: [],
    layers
  };
  return json;
};

export const recordAnimationToVideo = async (strokes: Stroke[], width: number, height: number, fps = DEFAULT_FPS, mimePreferred = "video/mp4") => {
  const validStrokes = strokes.filter(s => s.points.length > 0);
  if (!validStrokes.length) throw new Error("Nothing to record");
  if (typeof window === "undefined" || !("MediaRecorder" in window)) throw new Error("MediaRecorder not supported");
  
  let finalWidth = Math.max(1, Math.round(width));
  let finalHeight = Math.max(1, Math.round(height));
  
  if (finalWidth > MAX_VIDEO_WIDTH || finalHeight > MAX_VIDEO_HEIGHT) {
    const scale = Math.min(MAX_VIDEO_WIDTH / finalWidth, MAX_VIDEO_HEIGHT / finalHeight);
    finalWidth = Math.round(finalWidth * scale);
    finalHeight = Math.round(finalHeight * scale);
  }
  
  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");
  
  const scaleX = finalWidth / width;
  const scaleY = finalHeight / height;
  
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported(mimePreferred) ? mimePreferred : (MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4");
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: VIDEO_BITRATE });
  const chunks: BlobPart[] = [];
  const promise = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
    recorder.onerror = e => reject(new Error((e as any).error?.message || "Recording error"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });
  
  const b = getBounds(validStrokes);
  const offsetX = -b.minX; const offsetY = -b.minY;
  const durMs = totalDurationMs(validStrokes) || 1;
  const timeline = cumulativeLengthTimeline(validStrokes);
  
  ctx.scale(scaleX, scaleY);
  
  const lengthAt = (t: number) => {
    if (!timeline.length) return 0;
    if (t <= timeline[0].timeMs) return 0;
    for (let i = 0; i < timeline.length - 1; i++) {
      const a = timeline[i], b2 = timeline[i + 1];
      if (t >= a.timeMs && t <= b2.timeMs) {
        const r = (t - a.timeMs) / Math.max(1, (b2.timeMs - a.timeMs));
        return a.length + r * (b2.length - a.length);
      }
    }
    return timeline[timeline.length - 1].length;
  };
  
  let start = performance.now();
  recorder.start(200);
  const drawFrame = () => {
    const now = performance.now();
    const elapsed = Math.min(durMs, now - start);
    const targetLen = lengthAt(elapsed);
    const partial = partialStrokesUpToLength(validStrokes, targetLen);
    ctx.clearRect(0, 0, width, height);
    for (const s of partial) {
      if (!s.points.length) continue;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x + offsetX, s.points[0].y + offsetY);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x + offsetX, s.points[i].y + offsetY);
      ctx.stroke();
    }
    if (elapsed < durMs) requestAnimationFrame(drawFrame);
    else setTimeout(() => recorder.stop(), 100);
  };
  requestAnimationFrame(drawFrame);
  return promise;
};