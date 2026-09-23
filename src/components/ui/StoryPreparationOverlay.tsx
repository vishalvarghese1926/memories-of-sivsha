"use client";

import React, { useEffect, useState } from "react";
import { runStagedPreloader } from "@/lib/storyAssetManifest";

interface StoryPreparationOverlayProps {
  onReady?: () => void;
}

export default function StoryPreparationOverlay({ onReady }: StoryPreparationOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("A few moments...");
  const [isDismissed, setIsDismissed] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let isMounted = true;

    runStagedPreloader((pct, itemName) => {
      if (!isMounted) return;
      setProgress(pct);
      if (pct >= 100) {
        setStatusText("Ready");
      } else if (itemName) {
        setStatusText("A few moments...");
      }
    }).then(() => {
      if (!isMounted) return;
      // Slight hold at 100% so the user perceives a finished, serene preparation
      setTimeout(() => {
        if (!isMounted) return;
        setOpacity(0);
        if (onReady) onReady();
        // Fully unmount from DOM after transition completes
        setTimeout(() => {
          if (isMounted) setIsDismissed(true);
        }, 750);
      }, 350);
    });

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#07050d] select-none transition-opacity duration-700 ease-out ${
        opacity === 0 ? "pointer-events-none" : "pointer-events-auto"
      }`}
      style={{ opacity }}
      aria-live="polite"
    >
      <div className="flex flex-col items-center space-y-6 max-w-xs px-6 text-center">
        {/* Minimal Elegant Typography */}
        <h2 className="text-xs sm:text-sm font-sans tracking-[0.3em] uppercase text-rose-100/90 font-light">
          PREPARING OUR STORY
        </h2>

        {/* Subtle Cyan Glowing Progress Line */}
        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#22d3ee]/40 via-[#22d3ee] to-[#38bdf8] rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(34,211,238,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Emotional Secondary Text */}
        <p className="text-[11px] font-light tracking-widest text-neutral-400/80 transition-opacity duration-500">
          {statusText}
        </p>
      </div>
    </div>
  );
}
