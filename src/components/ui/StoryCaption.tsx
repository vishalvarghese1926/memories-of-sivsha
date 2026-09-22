"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useStory } from "@/context/StoryContext";
import { calculateLocalProgress } from "@/components/canvas/StorySceneManager";
import { MapPin, Calendar } from "lucide-react";

// Safe-zone anchor coordinates mapping per milestone to keep characters unobstructed
const MILESTONE_SAFE_ZONES: Record<string, "bottom-left" | "bottom-right" | "lower-third"> = {
  "m-0": "lower-third",  // Entry: centered lower third
  "m-1": "bottom-left",   // Before We Met: Sivani walking on right, text on left safe area
  "m-2": "bottom-left",   // College Hall: crowd on right, text on left
  "m-3": "bottom-right",  // Pen Moment: table and hands in center-left, text on right
  "m-4": "bottom-left",   // Classroom: blackboard on right, text on left
  "m-5": "bottom-left",   // Friend Group: table on right, text on left
  "m-6": "bottom-left",   // Train: carriage doorway on right, golden vista & text on left
  "m-7": "lower-third",  // Beach: spacious open horizon, compact lower third
  "m-8": "bottom-left",   // Late Night Talks: balcony on right, text on left
  "m-9": "bottom-left",   // August 31 (Car): windshield on right, text on left
  "m-10": "bottom-left",  // Classic 350: motorcycle on right, open road on left
  "m-11": "bottom-left",  // Himalayan 450 Fall: roadside on right, text on left
  "m-12": "bottom-left",  // Home / Tea: sofa on right, text on left
  "m-13": "lower-third",  // Finale: pedestal centered, compact lower third
};

export default function StoryCaption() {
  const { milestones, activeMilestoneIndex, scrollProgress } = useStory();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const currentMilestone = milestones[activeMilestoneIndex] || milestones[0];
  const safeZone = currentMilestone
    ? currentMilestone.captionPosition || MILESTONE_SAFE_ZONES[currentMilestone.id] || "bottom-left"
    : "bottom-left";

  // Local progress within the active milestone
  const { localProgress, opacity } = useMemo(() => {
    if (!currentMilestone) return { localProgress: 0, opacity: 0 };
    const start = currentMilestone.custom3DConfig?.splineProgressStart ?? 0;
    const end = currentMilestone.custom3DConfig?.splineProgressEnd ?? 1;
    const lp = calculateLocalProgress(scrollProgress, start, end);

    // Fade in at start (0 -> 0.12), solid in middle (0.12 -> 0.88), fade out at end (0.88 -> 1)
    let alpha = 1.0;
    const fadeSpan = 0.12;
    if (lp < fadeSpan) {
      alpha = lp / fadeSpan;
    } else if (lp > 1.0 - fadeSpan) {
      alpha = (1.0 - lp) / fadeSpan;
    }

    return { localProgress: lp, opacity: Math.max(0, Math.min(1, alpha)) };
  }, [currentMilestone, scrollProgress]);

  // Determine active caption line based on local progress
  const activeCaption = useMemo(() => {
    if (!currentMilestone?.captions || currentMilestone.captions.length === 0) {
      return null;
    }
    const total = currentMilestone.captions.length;
    let index: number;
    if (total === 3) {
      index = localProgress < 0.3 ? 0 : localProgress < 0.65 ? 1 : 2;
    } else if (total === 5 && currentMilestone.sceneType === "act-2-college-pen") {
      if (localProgress < 0.18) index = 0;
      else if (localProgress < 0.34) index = 1;
      else if (localProgress < 0.48) index = 2;
      else if (localProgress < 0.68) index = 3;
      else index = 4;
    } else if (total === 4 && currentMilestone.sceneType === "act-2-tribly-class") {
      if (localProgress < 0.25) index = 0;
      else if (localProgress < 0.55) index = 1;
      else if (localProgress < 0.78) index = 2;
      else index = 3;
    } else if (currentMilestone.id === "m-11" && total === 8) {
      if (localProgress < 0.20) index = 0;
      else if (localProgress < 0.34) index = 1;
      else if (localProgress < 0.48) index = 2;
      else if (localProgress < 0.62) index = 3;
      else if (localProgress < 0.74) index = 4;
      else if (localProgress < 0.84) index = 5;
      else if (localProgress < 0.93) index = 6;
      else index = 7;
    } else {
      index = Math.min(total - 1, Math.floor(localProgress * total));
    }
    return currentMilestone.captions[index];
  }, [currentMilestone, localProgress]);

  if (!currentMilestone) return null;

  // Alignment classes based on scene safe-zone
  let positionClasses = "bottom-6 left-4 right-4 sm:bottom-10 sm:left-12 sm:right-auto sm:max-w-md text-left";
  if (safeZone === "bottom-right") {
    positionClasses = "bottom-6 left-4 right-4 sm:bottom-10 sm:right-12 sm:left-auto sm:max-w-md sm:text-right text-left";
  } else if (safeZone === "lower-third") {
    positionClasses = "bottom-6 left-4 right-4 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg text-center";
  }

  return (
    <aside
      className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden"
      aria-live="polite"
      aria-label="Story narrative"
    >
      {/* 
        Negative-space safe zone container:
        Locked strictly to bottom lower-third / sides so the 3D characters, faces,
        and central actions are NEVER blocked by floating panels on phone or desktop.
      */}
      <div
        className={`absolute ${positionClasses} px-4 py-3 pb-safe transition-all ${
          reducedMotion ? "duration-100" : "duration-500 ease-out"
        }`}
        style={{
          opacity,
          transform: reducedMotion
            ? "none"
            : `translateY(${(1 - opacity) * 12}px)`,
        }}
      >
        {/* Layer 1: Date & Location tags */}
        {(currentMilestone.date || currentMilestone.location) && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07050d]/80 border border-white/10 text-[11px] tracking-wider uppercase text-rose-200/90 font-medium mb-2 backdrop-blur-sm shadow-sm transition-transform duration-700 ease-out ${
              safeZone === "bottom-right" ? "sm:ml-auto" : safeZone === "lower-third" ? "mx-auto" : ""
            }`}
          >
            {currentMilestone.date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#22d3ee]" />
                {currentMilestone.date}
              </span>
            )}
            {currentMilestone.date && currentMilestone.location && (
              <span className="opacity-30">&bull;</span>
            )}
            {currentMilestone.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                {currentMilestone.location}
              </span>
            )}
          </div>
        )}

        {/* Layer 2: Milestone Title */}
        <h2
          key={currentMilestone.id}
          className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-gradient-rose tracking-wide leading-tight drop-shadow-md"
        >
          {currentMilestone.title}
        </h2>

        {/* Milestone Subtitle */}
        {currentMilestone.subtitle && (
          <p className="text-[11px] sm:text-xs font-light tracking-[0.2em] uppercase text-rose-200/70 mt-1 mb-3">
            {currentMilestone.subtitle}
          </p>
        )}

        {/* Layer 3: Dynamic Quote Card (Low profile, never blocks scene) */}
        {activeCaption && (
          <div
            key={activeCaption}
            className="p-3 sm:p-4 rounded-xl bg-[#07050d]/75 border border-[#22d3ee]/20 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all"
          >
            <p className="text-xs sm:text-sm md:text-base text-[#f4edea] font-serif italic leading-relaxed">
              &ldquo;{activeCaption}&rdquo;
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
