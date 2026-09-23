"use client";

import React, { useEffect, useRef } from "react";
import { useStory } from "@/context/StoryContext";

/**
 * =========================================================================
 * CINEMATIC AUTO MODE DIRECTOR
 * =========================================================================
 *
 * Implements intelligent milestone-aware pacing:
 * - Faster through transitional corridors (~220-280 px/s)
 * - Serene, contemplative drift during emotional memories & hero photos (~70-95 px/s)
 * - Climax deceleration at August 31, Motorcycles, Home, and the Final Letter
 * - Immediate, interruptible pause on any manual touch/wheel/keyboard input
 */

function getMilestoneAwareSpeed(normalizedProgress: number): number {
  const p = Math.max(0, Math.min(1, normalizedProgress));

  // Hero Emotional Moment focal windows (where the director lingers)
  const heroWindows = [
    { start: 0.05, peak: 0.09, end: 0.15, slowSpeed: 80 },  // Before We Met
    { start: 0.22, peak: 0.28, end: 0.36, slowSpeed: 85 },  // College Corridors & Pen Moment
    { start: 0.39, peak: 0.42, end: 0.45, slowSpeed: 85 },  // Classroom
    { start: 0.46, peak: 0.49, end: 0.53, slowSpeed: 85 },  // Friend Group
    { start: 0.54, peak: 0.57, end: 0.61, slowSpeed: 80 },  // Kozhikode Train Doorway
    { start: 0.62, peak: 0.65, end: 0.68, slowSpeed: 80 },  // Beach Sunset
    { start: 0.69, peak: 0.72, end: 0.75, slowSpeed: 80 },  // Late Night Talks
    { start: 0.75, peak: 0.78, end: 0.81, slowSpeed: 70 },  // 31 August 2025 Car Cabin (Climax)
    { start: 0.81, peak: 0.835, end: 0.86, slowSpeed: 75 }, // Classic 350 Ride
    { start: 0.87, peak: 0.895, end: 0.92, slowSpeed: 70 }, // Himalayan 450 Mountain Fall
    { start: 0.92, peak: 0.94, end: 0.96, slowSpeed: 75 },  // Home Warmth
    { start: 0.96, peak: 0.985, end: 1.00, slowSpeed: 60 }, // Finale Letter Pedestal
  ];

  for (const win of heroWindows) {
    if (p >= win.start && p <= win.end) {
      // Smooth bell curve deceleration
      const distFromPeak = Math.abs(p - win.peak) / Math.max(0.001, (win.end - win.start) / 2);
      const factor = Math.cos(Math.min(Math.PI / 2, distFromPeak * (Math.PI / 2)));
      // Interpolate between fast cruise speed (230px/s) and slow reading speed
      return 230 - (230 - win.slowSpeed) * factor;
    }
  }

  // Fast cruising speed in transitional landscape corridors
  return 240;
}

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

  // Cinematic Auto-scroll engine with milestone-aware director velocity
  useEffect(() => {
    if (!isAutoPlaying || activeLightboxPhoto) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      // Stop naturally at the finale or when reaching max scroll
      if (window.scrollY >= maxScroll - 6 || activeMilestoneIndex >= 13) {
        pauseAuto();
        return;
      }

      const currentNorm = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const currentSpeed = getMilestoneAwareSpeed(currentNorm);

      // Smooth step
      if (dt > 0 && dt < 0.1) {
        window.scrollBy({ top: currentSpeed * dt, behavior: "auto" });
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

  // Pause automatically on any manual user intervention
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

  // Only display controls once the user has chosen their story mode
  if (!hasChosenStoryMode || activeLightboxPhoto) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none pointer-events-auto">
      {isAutoPlaying ? (
        <button
          type="button"
          onClick={pauseAuto}
          aria-label="Pause automatic story progression"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#07050d]/85 hover:bg-[#07050d] text-[#fcfbf7] border border-[#e2c275]/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#e2c275] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase font-medium text-[#f5ebd4]">
            Ⅱ PAUSE
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={resumeAuto}
          aria-label="Resume automatic story progression"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#07050d]/85 hover:bg-[#07050d] text-[#e2c275] border border-[#e2c275]/50 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <svg
            className="w-3 h-3 fill-current text-[#e2c275]"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#f5ebd4]">
            {storyMode === "auto" ? "RESUME AUTO" : "AUTO MODE"}
          </span>
        </button>
      )}
    </div>
  );
}
