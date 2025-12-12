"use client";
import type { Stroke } from "../../types";

type Props = {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
};

export default function StrokeEditor({ strokes, setStrokes }: Props) {
  if (strokes.length === 0) return null;

  return (
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
  );
}

