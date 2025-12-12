"use client";
import type { DrawingMode } from "../../types";
import { COLOR_PALETTE } from "../../constants";

type Props = {
  color: string;
  setColor: (color: string) => void;
  width: number;
  setWidth: (width: number) => void;
  mode: DrawingMode;
  setMode: (mode: DrawingMode) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  trackpadMode: boolean;
  setTrackpadMode: (enabled: boolean) => void;
  trackpadTimerEnabled: boolean;
  setTrackpadTimerEnabled: (enabled: boolean) => void;
  trackpadTimerDuration: number;
  setTrackpadTimerDuration: (duration: number) => void;
  trackpadTimerLeft: number | null;
  trackpadTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  trackpadTimerIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setTrackpadTimerLeft: (left: number | null) => void;
  drawing: boolean;
  currentStrokeRef: React.MutableRefObject<any>;
  setDrawing: (drawing: boolean) => void;
  trackpadMoveCountRef: React.MutableRefObject<number>;
  trackpadStartTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setStrokes: React.Dispatch<React.SetStateAction<any[]>>;
  setUndone: (undone: any[] | ((prev: any[]) => any[])) => void;
  autoStopExpiredRef: React.MutableRefObject<boolean>;
  setAutoStopExpired: (expired: boolean) => void;
  autoStopEnabled: boolean;
  setAutoStopEnabled: (enabled: boolean) => void;
  recordingDuration: number;
  setRecordingDuration: (duration: number) => void;
  recordingTimeLeft: number | null;
  autoStopTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  autoStopIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setRecordingTimeLeft: (left: number | null) => void;
  autoStopExpired: boolean;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  strokesLength: number;
  undoneLength: number;
};

export default function CanvasControls({
  color,
  setColor,
  width,
  setWidth,
  mode,
  setMode,
  zoom,
  setZoom,
  pan,
  setPan,
  trackpadMode,
  setTrackpadMode,
  trackpadTimerEnabled,
  setTrackpadTimerEnabled,
  trackpadTimerDuration,
  setTrackpadTimerDuration,
  trackpadTimerLeft,
  trackpadTimerRef,
  trackpadTimerIntervalRef,
  setTrackpadTimerLeft,
  drawing,
  currentStrokeRef,
  setDrawing,
  trackpadMoveCountRef,
  trackpadStartTimeoutRef,
  setStrokes,
  setUndone,
  autoStopExpiredRef,
  setAutoStopExpired,
  autoStopEnabled,
  setAutoStopEnabled,
  recordingDuration,
  setRecordingDuration,
  recordingTimeLeft,
  autoStopTimerRef,
  autoStopIntervalRef,
  setRecordingTimeLeft,
  autoStopExpired,
  undo,
  redo,
  clearAll,
  strokesLength,
  undoneLength,
}: Props) {
  const palette = COLOR_PALETTE;

  return (
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
                      trackpadMode
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-300/50 dark:ring-emerald-700/50 hover:from-emerald-600 hover:to-teal-600'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-500 ring-1 ring-slate-300 dark:ring-slate-600'
                    }`}
                    onClick={() => {
                      if (trackpadMode) {
                        setTrackpadMode(false);
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
                        if (trackpadTimerRef.current) {
                          clearTimeout(trackpadTimerRef.current);
                          trackpadTimerRef.current = null;
                        }
                        if (trackpadTimerIntervalRef.current) {
                          clearInterval(trackpadTimerIntervalRef.current);
                          trackpadTimerIntervalRef.current = null;
                        }
                        setTrackpadTimerLeft(null);
                      } else {
                        // Reset expired flag when toggling trackpad mode on
                        if (autoStopExpiredRef.current) {
                          autoStopExpiredRef.current = false;
                          setAutoStopExpired(false);
                        }
                        setTrackpadMode(true);
                      }
                    }}
                    title={trackpadMode ? "Trackpad mode active - click to disable" : "Enable trackpad mode - draw by moving mouse/trackpad without clicking"}
                  >
                    <div className={`relative w-8 xs:w-10 h-4 xs:h-5 rounded-full transition-all duration-300 ${
                      trackpadMode
                        ? 'bg-white/30'
                        : 'bg-slate-400 dark:bg-slate-500'
                    }`}>
                      <div className={`absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-3 xs:w-4 h-3 xs:h-4 rounded-full bg-white shadow-lg transition-all duration-300 transform ${
                        trackpadMode
                          ? 'translate-x-4 xs:translate-x-5'
                          : 'translate-x-0'
                      }`} />
                    </div>
                    <span className="text-[10px] xs:text-xs">{trackpadMode ? 'On' : 'Off'}</span>
                  </button>
                </div>
              </div>
              {trackpadMode && (
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 w-full mt-2 xs:mt-0">
                  <div className="flex items-center gap-2 xs:gap-3 flex-1">
                    <span className="text-[10px] xs:text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent whitespace-nowrap">Trackpad Timer</span>
                    <div className="flex items-center gap-2">
                      <button
                        className={`relative flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-[10px] xs:text-xs font-semibold transition-all duration-300 touch-manipulation min-w-[60px] xs:min-w-[70px] ${
                          trackpadTimerEnabled
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-300/50 dark:ring-emerald-700/50 hover:from-emerald-600 hover:to-teal-600'
                            : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-500 ring-1 ring-slate-300 dark:ring-slate-600'
                        }`}
                        onClick={() => {
                          setTrackpadTimerEnabled(!trackpadTimerEnabled);
                          if (trackpadTimerEnabled) {
                            if (trackpadTimerRef.current) {
                              clearTimeout(trackpadTimerRef.current);
                              trackpadTimerRef.current = null;
                            }
                            if (trackpadTimerIntervalRef.current) {
                              clearInterval(trackpadTimerIntervalRef.current);
                              trackpadTimerIntervalRef.current = null;
                            }
                            setTrackpadTimerLeft(null);
                          }
                        }}
                        title={trackpadTimerEnabled ? "Trackpad timer enabled" : "Enable trackpad timer"}
                      >
                        <div className={`relative w-6 xs:w-8 h-3 xs:h-4 rounded-full transition-all duration-300 ${
                          trackpadTimerEnabled
                            ? 'bg-white/30'
                            : 'bg-slate-400 dark:bg-slate-500'
                        }`}>
                          <div className={`absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-2 xs:w-3 h-2 xs:h-3 rounded-full bg-white shadow-lg transition-all duration-300 transform ${
                            trackpadTimerEnabled
                              ? 'translate-x-3 xs:translate-x-4'
                              : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="text-[9px] xs:text-[10px]">{trackpadTimerEnabled ? 'On' : 'Off'}</span>
                      </button>
                      {trackpadTimerEnabled && (
                        <>
                          <input
                            type="number"
                            min={1}
                            max={300}
                            value={trackpadTimerDuration}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(300, Number(e.target.value)));
                              setTrackpadTimerDuration(val);
                            }}
                            className="w-10 xs:w-14 px-1.5 xs:px-2 py-1 xs:py-1.5 text-[10px] xs:text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-emerald-300 dark:ring-emerald-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none"
                            disabled={drawing}
                          />
                          <span className="text-[10px] xs:text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">s</span>
                        </>
                      )}
                    </div>
                  </div>
                  {trackpadTimerLeft !== null && trackpadTimerLeft > 0 && (
                    <div className="flex items-center gap-2 px-2 xs:px-3 py-1 xs:py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-300/50 dark:ring-emerald-700/50">
                      <span className="text-[10px] xs:text-xs font-bold animate-pulse">⏱️</span>
                      <span className="text-[10px] xs:text-xs font-bold">Stops in: {trackpadTimerLeft}s</span>
                    </div>
                  )}
                </div>
              )}
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
            disabled={!strokesLength}
          >
            <span>↶</span> Undo
          </button>
          <button 
            className="flex-1 xs:flex-none min-w-[80px] px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 touch-manipulation" 
            onClick={redo} 
            disabled={!undoneLength}
          >
            <span>↷</span> Redo
          </button>
          <button 
            className="w-full xs:w-auto xs:flex-none px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-xs xs:text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 active:scale-95 shadow-lg hover:shadow-xl ring-1 ring-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 touch-manipulation" 
            onClick={clearAll} 
            disabled={!strokesLength}
          >
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

