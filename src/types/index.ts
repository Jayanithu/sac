export type Point = { x: number; y: number; t: number };
export type Stroke = { points: Point[]; color: string; width: number };
export type LengthTime = { timeMs: number; length: number };
export type Theme = 'light' | 'dark';
export type DrawingMode = 'draw' | 'erase';
export type BackgroundOption = 'white' | 'black' | 'transparent';
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

