"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useStory } from "@/context/StoryContext";
import { calculateLocalProgress } from "@/components/canvas/StorySceneManager";

// Scene negative-space safe zones to keep 3D characters, motorcycles, and photos unobstructed
const MILESTONE_SAFE_ZONES: Record<
  string,
  "bottom-left" | "bottom-right" | "top-right" | "lower-third"
> = {
  "m-0": "lower-third",  // Entry: centered lower third
  "m-1": "bottom-left",   // Before We Met: Sivani walking on right, text on lower left
  "m-2": "bottom-left",   // College Hall: crowd on right, text on left
  "m-3": "bottom-right",  // Pen Moment: table and hands in center-left, text on right
  "m-4": "bottom-left",   // Classroom: blackboard on right, text on left
  "m-5": "bottom-left",   // Friend Group: staircase on right, text on left
  "m-6": "bottom-left",   // Train: carriage doorway on right, text on left
  "m-7": "lower-third",  // Beach: open horizontal seascape, compact centered bottom
  "m-8": "bottom-left",   // Late Night Talks: balcony on right, text on left
  "m-9": "bottom-left",   // August 31: mountain overlook on right, text on left
  "m-10": "bottom-left",  // Classic 350: bike center-right, text on left safe area
  "m-11": "bottom-left",  // Himalayan 450: road right, text on lower left
  "m-12": "bottom-left",  // Home / Tea: portrait right, text on left
  "m-13": "lower-third",  // Finale: pedestal centered, subtle lower third
};

export default function StoryCaption() {
  const { milestones, activeMilestoneIndex, scrollProgress, activeLightboxPhoto } = useStory();
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

  // Local progress within active milestone
  const { localProgress, opacity } = useMemo(() => {
    if (!currentMilestone) return { localProgress: 0, opacity: 0 };
    const start = currentMilestone.custom3DConfig?.splineProgressStart ?? 0;
    const end = currentMilestone.custom3DConfig?.splineProgressEnd ?? 1;
    const lp = calculateLocalProgress(scrollProgress, start, end);

    let alpha = 1.0;
    const fadeSpan = 0.12;
    if (lp < fadeSpan) {
      alpha = lp / fadeSpan;
    } else if (lp > 1.0 - fadeSpan) {
      alpha = (1.0 - lp) / fadeSpan;
    }

    return { localProgress: lp, opacity: Math.max(0, Math.min(1, alpha)) };
  }, [currentMilestone, scrollProgress]);

  // Determine active caption line
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

  // Hide caption when photo lightbox is open
  if (!currentMilestone || activeLightboxPhoto) return null;

  // Mobile-first streamlined positioning classes: compact footprint without covering the scene
  let containerClasses = "bottom-7 left-4 max-w-[275px] sm:max-w-sm sm:bottom-10 sm:left-12 text-left items-start";
  if (safeZone === "bottom-right") {
    containerClasses = "bottom-7 right-4 max-w-[275px] sm:max-w-sm sm:bottom-10 sm:right-12 text-right items-end";
  } else if (safeZone === "top-right") {
    containerClasses = "top-16 right-4 max-w-[275px] sm:max-w-sm sm:top-20 sm:right-12 text-right items-end";
  } else if (safeZone === "lower-third") {
    containerClasses = "bottom-7 left-1/2 -translate-x-1/2 max-w-[310px] sm:max-w-md sm:bottom-10 text-center items-center";
  }

  return (
    <aside
      className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden"
      aria-live="polite"
      aria-label="Story narrative"
    >
      <div
        className={`absolute flex flex-col space-y-1 pb-safe transition-all ${containerClasses} ${
          reducedMotion ? "duration-100" : "duration-400 ease-out"
        }`}
        style={{
          opacity,
          transform: reducedMotion
            ? "none"
            : `translateY(${(1 - opacity) * 8}px)`,
        }}
      >
        {/* Subtle Champagne Gold Eyebrow with sequence & title */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#e2c275] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          <span>{String(currentMilestone.sequence + 1).padStart(2, "0")}</span>
          <span className="text-white/30">·</span>
          <span>{currentMilestone.title}</span>
        </div>

        {/* Dynamic Narrative Body (Compact, refined editorial sans, zero bulky opaque box) */}
        {activeCaption && (
          <p
            key={activeCaption}
            className="text-xs sm:text-sm font-sans font-light tracking-wide text-[#fcfbf7] leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
          >
            &ldquo;{activeCaption}&rdquo;
          </p>
        )}

        {/* Minimal Champagne Accent Line */}
        <div className="w-6 h-[1.5px] bg-[#e2c275]/70 rounded-full mt-1 shadow-[0_0_8px_rgba(226,194,117,0.3)]" />
      </div>
    </aside>
  );
}
