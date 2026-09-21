"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useStory } from "@/context/StoryContext";
import { calculateLocalProgress } from "@/components/canvas/StorySceneManager";
import { MapPin, Calendar } from "lucide-react";

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

  // Local progress within the active milestone
  const { localProgress, opacity } = useMemo(() => {
    if (!currentMilestone) return { localProgress: 0, opacity: 0 };
    const start = currentMilestone.custom3DConfig?.splineProgressStart ?? 0;
    const end = currentMilestone.custom3DConfig?.splineProgressEnd ?? 1;
    const lp = calculateLocalProgress(scrollProgress, start, end);

    // Fade in at start (0 -> 0.15), solid in middle (0.15 -> 0.85), fade out at end (0.85 -> 1)
    let alpha = 1.0;
    const fadeSpan = 0.15;
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
      // Precise narrative pacing for Act 1 & 2: 0.00-0.30, 0.30-0.65, 0.65-1.00
      index = localProgress < 0.3 ? 0 : localProgress < 0.65 ? 1 : 2;
    } else if (total === 5 && currentMilestone.sceneType === "act-2-college-pen") {
      // Precise narrative pacing for Phase 5C Pen Moment:
      // 0.00–0.18: "And that was it."
      // 0.18–0.34: "A pen."
      // 0.34–0.48: "A smile."
      // 0.48–0.68: "Two strangers."
      // 0.68–1.00: "Neither of us knew how important that moment would become."
      if (localProgress < 0.18) index = 0;
      else if (localProgress < 0.34) index = 1;
      else if (localProgress < 0.48) index = 2;
      else if (localProgress < 0.68) index = 3;
      else index = 4;
    } else {
      index = Math.min(total - 1, Math.floor(localProgress * total));
    }
    return currentMilestone.captions[index];
  }, [currentMilestone, localProgress]);

  if (!currentMilestone) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 pt-safe pb-safe select-none"
      aria-live="polite"
    >
      {/* Top Header Placeholder (Spacing) */}
      <div className="h-12" />

      {/* Main Narrative Caption Overlay */}
      <div
        className={`w-full max-w-2xl mx-auto text-center px-4 transition-all ${
          reducedMotion ? "duration-100" : "duration-500 ease-out"
        }`}
        style={{
          opacity,
          transform: reducedMotion
            ? "none"
            : `translateY(${(1 - opacity) * 16}px)`,
        }}
      >
        {/* Optional Date / Location Tags */}
        {(currentMilestone.date || currentMilestone.location) && (
          <div className="inline-flex items-center gap-3 px-3.5 py-1 rounded-full glass-pill text-xs tracking-wider uppercase text-rose-300/90 font-medium mb-3 shadow-sm">
            {currentMilestone.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-rose-400" />
                {currentMilestone.date}
              </span>
            )}
            {currentMilestone.date && currentMilestone.location && (
              <span className="opacity-40">&bull;</span>
            )}
            {currentMilestone.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-rose-400" />
                {currentMilestone.location}
              </span>
            )}
          </div>
        )}

        {/* Milestone Title */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-gradient-rose tracking-wide mb-2 leading-tight drop-shadow-md">
          {currentMilestone.title}
        </h2>

        {/* Milestone Subtitle */}
        {currentMilestone.subtitle && (
          <p className="text-xs sm:text-sm md:text-base font-light tracking-widest uppercase text-rose-200/70 mb-4">
            {currentMilestone.subtitle}
          </p>
        )}

        {/* Dynamic Caption Line */}
        {activeCaption && (
          <div className="mt-4 p-4 sm:p-6 rounded-2xl glass-panel max-w-lg mx-auto border border-white/10 backdrop-blur-md shadow-romantic-glow">
            <p className="text-sm sm:text-base md:text-lg text-[#f4edea] font-serif italic leading-relaxed">
              &ldquo;{activeCaption}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-16" />
    </div>
  );
}
