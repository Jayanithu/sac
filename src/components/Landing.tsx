"use client";
import { useEffect, useState, type KeyboardEvent } from "react";
import { BlurredStagger } from "./ui/blurred-stagger-text";

type Props = { onEnter: () => void };

export default function Landing({ onEnter }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    onEnter();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div 
      className={`min-h-screen bg-white dark:bg-black flex flex-col transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className="flex-1 flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label="Enter application"
      >
        <div className="text-center px-4 max-w-2xl mx-auto">
          <div className="mb-6">
            <BlurredStagger 
              text="sac" 
              className="text-7xl sm:text-8xl lg:text-9xl font-bold text-slate-900 dark:text-white tracking-tight inline-block"
            />
          </div>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Create stunning animated signatures with ease.
          </p>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
            Click anywhere to continue
          </p>
        </div>
      </div>
      
      <footer className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2025{" "}
              <a 
                href="https://github.com/Jayanithu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-slate-900 dark:hover:text-slate-200 underline transition-colors"
              >
                @jayanithu/sac
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

