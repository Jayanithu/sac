"use client";
import { useEffect, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { BlurredStagger } from "../ui/blurred-stagger-text";

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
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-black dark:to-purple-950 flex flex-col transition-opacity duration-500 relative overflow-hidden ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 pointer-events-none" />
      <div 
        className="flex-1 flex items-center justify-center cursor-pointer relative py-6 xs:py-8 sm:py-12 touch-manipulation z-10"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label="Enter application"
      >
        <div className="text-center px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
          <motion.div 
            className="mb-5 xs:mb-6 sm:mb-8 md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <BlurredStagger 
              text="sac" 
              className="text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-bold text-black dark:text-indigo-400 tracking-tight inline-block leading-none"
            />
          </motion.div>
          <motion.p 
            className="text-base xs:text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent leading-relaxed px-2 sm:px-0 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Create stunning animated signatures with ease.
          </motion.p>
          <motion.p 
            className="mt-5 xs:mt-6 sm:mt-8 text-xs xs:text-sm sm:text-base text-slate-500 dark:text-slate-400 px-2 sm:px-0 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <span className="inline-block animate-pulse">✨</span>
            Click anywhere to continue
            <span className="inline-block animate-pulse">✨</span>
          </motion.p>
        </div>
      </div>
      
      <footer className="px-4 sm:px-6 lg:px-8 py-5 xs:py-6 sm:py-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 text-center">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              © 2025{" "}
              <a 
                href="https://github.com/Jayanithu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-indigo-500/50 hover:decoration-indigo-500 transition-all touch-manipulation font-medium"
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