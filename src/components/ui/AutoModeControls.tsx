"use client";

import React, { useEffect, useRef } from "react";
import { useStory } from "@/context/StoryContext";

export default function AutoModeControls() {
  const {
    storyMode,
    isAutoPlaying,
    pauseAuto,
    resumeAuto,
    activeLightboxPhoto,
    activeMilestoneIndex,
    hasChosenStoryMode,
  } = useStory();

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Auto-scroll engine: advances window scroll at a serene, slow cinematic pace (~40px/s)
  useEffect(() => {
    if (!isAutoPlaying || activeLightboxPhoto) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();
    const speed = 42; // pixels per second for graceful cinematic storytelling

    const step = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      // Stop naturally at the finale or when reaching max scroll
      if (window.scrollY >= maxScroll - 8 || activeMilestoneIndex >= 13) {
        pauseAuto();
        return;
      }

      // Smooth step
      if (dt > 0 && dt < 0.1) {
        window.scrollBy({ top: speed * dt, behavior: "auto" });
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isAutoPlaying, activeLightboxPhoto, activeMilestoneIndex, pauseAuto]);

  // Pause automatically when user manually touches, wheels, or presses keys
  useEffect(() => {
    if (!isAutoPlaying) return;

    const handleUserIntervention = () => {
      pauseAuto();
    };

    window.addEventListener("wheel", handleUserIntervention, { passive: true });
    window.addEventListener("touchstart", handleUserIntervention, { passive: true });
    window.addEventListener("keydown", handleUserIntervention);

    return () => {
      window.removeEventListener("wheel", handleUserIntervention);
      window.removeEventListener("touchstart", handleUserIntervention);
      window.removeEventListener("keydown", handleUserIntervention);
    };
  }, [isAutoPlaying, pauseAuto]);

  // Only display controls once the user has completed the initial mode selection
  if (!hasChosenStoryMode || activeLightboxPhoto) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none pointer-events-auto">
      {isAutoPlaying ? (
        <button
          type="button"
          onClick={pauseAuto}
          aria-label="Pause automatic story progression"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#07050d]/80 hover:bg-[#07050d] text-cyan-200 border border-[#22d3ee]/40 shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase font-medium">
            Ⅱ PAUSE
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={resumeAuto}
          aria-label="Resume automatic story progression"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#07050d]/80 hover:bg-[#07050d] text-[#22d3ee] border border-[#22d3ee]/60 shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <svg
            className="w-3 h-3 fill-current text-[#22d3ee]"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold">
            {storyMode === "auto" ? "RESUME AUTO" : "AUTO MODE"}
          </span>
        </button>
      )}
    </div>
  );
}
