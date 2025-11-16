import { Stroke, getBounds, svgPathFromStrokes, strokeLength, totalDurationMs, totalLength, cumulativeLengthTimeline, partialStrokesUpToLength } from "./pathUtils";

export const buildAnimatedSVG = (strokes: Stroke[]) => {
  const b = getBounds(strokes);
  const totalDur = totalDurationMs(strokes) || 1;
  const svgParts: string[] = [];
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.minX} ${b.minY} ${b.width} ${b.height}">`);
  for (const s of strokes) {
    if (!s.points.length) continue;
    const d = svgPathFromStrokes([s]);
    const len = strokeLength(s);
    const times = s.points.map(p => Math.min(1, Math.max(0, p.t / totalDur)));
    const vals = s.points.map((p, i) => String(len - (i === 0 ? 0 : s.points.slice(1, i + 1).reduce((acc, _, j) => acc + Math.hypot(s.points[j + 1].x - s.points[j].x, s.points[j + 1].y - s.points[j].y), 0))));
    const keyTimes = [0, ...times].join(";");
    const values = [String(len), ...vals].join(";");
    svgParts.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}">`);
    svgParts.push(`<animate attributeName="stroke-dashoffset" values="${values}" keyTimes="${keyTimes}" dur="${totalDur}ms" calcMode="linear" fill="freeze" />`);
    svgParts.push(`</path>`);
  }
  svgParts.push(`</svg>`);
  return svgParts.join("");
};

export const buildLottieJSON = (strokes: Stroke[], fps = 60) => {
  const b = getBounds(strokes);
  const durMs = totalDurationMs(strokes) || 1;
  const totalFrames = Math.round((durMs / 1000) * fps);
  const groupItems: any[] = [];
  for (const s of strokes) {
    const v = s.points.map(p => [p.x - b.minX, p.y - b.minY]);
    const i = s.points.map(_ => [0, 0]);
    const o = s.points.map(_ => [0, 0]);
    groupItems.push({ ty: "sh", d: 1, ks: { a: 0, k: { i, o, v, c: false } }, nm: "Path", hd: false });
  }
  groupItems.push({ ty: "st", c: { a: 0, k: [0, 0, 0, 1] }, w: { a: 0, k: Math.max(...strokes.map(s => s.width)) }, lc: 2, lj: 2, nm: "Stroke", hd: false });
  groupItems.push({ ty: "tm", s: { a: 0, k: 0 }, e: { a: 1, k: [{ t: 0, s: 0 }, { t: totalFrames, s: 100 }] }, o: { a: 0, k: 0 }, m: 1, nm: "Trim", hd: false });
  const json: any = {
    v: "5.7.4",
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: Math.round(b.width),
    h: Math.round(b.height),
    nm: "Signature",
    ddd: 0,
    assets: [],
    layers: [
      { ty: 4, nm: "Stroke", ip: 0, op: totalFrames, st: 0,
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [0, 0, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
        shapes: [ { ty: "gr", it: groupItems, nm: "Group" } ] }
    ]
  };
  return json;
};

export const recordAnimationToVideo = async (strokes: Stroke[], width: number, height: number, fps = 60, mimePreferred = "video/mp4") => {
  if (!strokes.length) throw new Error("Nothing to record");
  if (typeof window === "undefined" || !("MediaRecorder" in window)) throw new Error("MediaRecorder not supported");
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported(mimePreferred) ? mimePreferred : (MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4");
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: BlobPart[] = [];
  const promise = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
    recorder.onerror = e => reject(new Error((e as any).error?.message || "Recording error"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });
  const b = getBounds(strokes);
  const offsetX = -b.minX; const offsetY = -b.minY;
  const durMs = totalDurationMs(strokes) || 1;
  const totalLen = totalLength(strokes);
  const timeline = cumulativeLengthTimeline(strokes);
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
    const partial = partialStrokesUpToLength(strokes, targetLen);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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