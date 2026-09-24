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

  // Milestone-aware cinematic velocity windows per creative director specifications:
  // Before We Met: slow (~75 px/s)
  // College: medium (~140 px/s)
  // Classroom: medium/slower (~105 px/s)
  // Friends: medium (~140 px/s)
  // Train: slow (~75 px/s)
  // Beach: very slow (~50 px/s)
  // August 31: slow/emotional (~60 px/s)
  // Motorcycles: medium (~140 px/s)
  // Home: slow (~75 px/s)
  // Letter / Finale: very slow / near still (~40 px/s, controlled conclusion)

  if (p < 0.08) return 120; // Entry transition
  if (p < 0.18) return 75;  // Before We Met (slow)
  if (p < 0.38) return 140; // College Admission & Paperwork Desk (medium)
  if (p < 0.45) return 105; // Classroom (medium / slower)
  if (p < 0.53) return 140; // Friend Group (medium)
  if (p < 0.61) return 75;  // Train Exterior Camera Pass (slow)
  if (p < 0.68) return 50;  // Beach Sunset & Waves (very slow)
  if (p < 0.80) return 60;  // Late Night Talks & August 31 (slow / emotional)
  if (p < 0.92) return 140; // Motorcycles: Classic 350 & Himalayan 450 (medium)
  if (p < 0.96) return 75;  // Home / Everyday Life (slow)
  return 42;                // Letter Pedestal & Finale (very slow / near still)
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

  // Cinematic Auto-scroll engine synchronized with Lenis driver
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

      // Stop gracefully at the finale or when reaching max scroll
      if (window.scrollY >= maxScroll - 6 || activeMilestoneIndex >= 13) {
        pauseAuto();
        return;
      }

      const currentNorm = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const currentSpeed = getMilestoneAwareSpeed(currentNorm);

      if (dt > 0 && dt < 0.1) {
        const deltaScroll = currentSpeed * dt;
        const lenis = (window as any).__lenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(lenis.scroll + deltaScroll, { immediate: true });
        } else {
          window.scrollBy({ top: deltaScroll, behavior: "auto" });
        }
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
