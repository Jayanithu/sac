export type Point = { x: number; y: number; t: number };
export type Stroke = { points: Point[]; color: string; width: number };

export const normalizeTimes = (strokes: Stroke[]) => {
  if (!strokes.length) return strokes;
  const firstT = strokes[0]?.points[0]?.t ?? 0;
  return strokes.map(s => ({
    ...s,
    points: s.points.map(p => ({ ...p, t: p.t - firstT }))
  }));
};

export const getBounds = (strokes: Stroke[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) for (const p of s.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  const pad = 16;
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2
  };
};

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

export const strokeLength = (s: Stroke) => {
  let len = 0;
  for (let i = 1; i < s.points.length; i++) len += dist(s.points[i - 1], s.points[i]);
  return len;
};

export const totalLength = (strokes: Stroke[]) => strokes.reduce((sum, s) => sum + strokeLength(s), 0);

export const totalDurationMs = (strokes: Stroke[]) => {
  const last = strokes.at(-1);
  const t = last?.points.at(-1)?.t ?? 0;
  return t;
};

export const svgPathFromStrokes = (strokes: Stroke[]) => {
  let d = "";
  for (const s of strokes) {
    if (!s.points.length) continue;
    const [p0, ...rest] = s.points;
    d += `M ${p0.x} ${p0.y}`;
    for (const p of rest) d += ` L ${p.x} ${p.y}`;
  }
  return d.trim();
};

export type LengthTime = { timeMs: number; length: number };

export const cumulativeLengthTimeline = (strokes: Stroke[]): LengthTime[] => {
  const list: LengthTime[] = [];
  let acc = 0;
  for (const s of strokes) {
    if (!s.points.length) continue;
    list.push({ timeMs: s.points[0].t, length: acc });
    for (let i = 1; i < s.points.length; i++) {
      acc += dist(s.points[i - 1], s.points[i]);
      list.push({ timeMs: s.points[i].t, length: acc });
    }
  }
  return list;
};

export const keyTimesAndValues = (strokes: Stroke[]) => {
  const tl = cumulativeLengthTimeline(strokes);
  const duration = totalDurationMs(strokes) || 1;
  const keyTimes = tl.map(x => Math.min(1, Math.max(0, x.timeMs / duration)));
  const values = tl.map(x => String(totalLength(strokes) - x.length));
  return { keyTimes, values, duration };
};

export const partialStrokesUpToLength = (strokes: Stroke[], target: number): Stroke[] => {
  const out: Stroke[] = [];
  let remaining = target;
  for (const s of strokes) {
    const len = strokeLength(s);
    if (remaining <= 0) break;
    if (remaining >= len) {
      out.push(s);
      remaining -= len;
    } else {
      const pts: Point[] = [];
      if (s.points.length) pts.push({ ...s.points[0] });
      let used = 0;
      for (let i = 1; i < s.points.length; i++) {
        const a = s.points[i - 1];
        const b = s.points[i];
        const seg = dist(a, b);
        if (used + seg <= remaining) {
          pts.push({ ...b });
          used += seg;
        } else {
          const need = remaining - used;
          const r = need / seg;
          const x = a.x + (b.x - a.x) * r;
          const y = a.y + (b.y - a.y) * r;
          const t = a.t + (b.t - a.t) * r;
          pts.push({ x, y, t });
          break;
        }
      }
      out.push({ points: pts, color: s.color, width: s.width });
      break;
    }
  }
  return out;
};