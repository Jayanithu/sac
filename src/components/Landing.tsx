"use client";
import React, { useEffect, useState } from "react";

type Props = { onEnter: () => void };

export default function Landing({ onEnter }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    onEnter();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div 
      className={`min-h-screen bg-white dark:bg-black flex items-center justify-center transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label="Enter application"
    >
      <div className="text-center px-4 max-w-2xl mx-auto cursor-pointer">
        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          sac
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
          Create stunning animated signatures with ease. Draw your signature, preview the animated reveal, and export in multiple formats including SVG, MP4, and Lottie JSON for use across web, video, and cross-platform applications.
        </p>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}

