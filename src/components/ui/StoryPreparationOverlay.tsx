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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07050d] select-none transition-opacity duration-1000 ease-out ${
        opacity === 0 ? "pointer-events-none" : "pointer-events-auto"
      }`}
      style={{ opacity }}
      aria-live="polite"
    >
      <div className="flex flex-col items-center space-y-6 max-w-sm px-6 text-center">
        {/* Subtle ambient warm vignette */}
        <div className="absolute w-72 h-72 rounded-full bg-[#831843]/10 blur-[100px] pointer-events-none" />
        <div className="absolute w-60 h-60 rounded-full bg-[#e2c275]/5 blur-[90px] pointer-events-none" />

        {/* Luxury Editorial Header */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-[#e2c275] font-light">
            A Continuous Interactive Film
          </span>
          <h1 className="text-xl sm:text-2xl font-serif tracking-[0.18em] uppercase text-[#fcfbf7] font-normal">
            MEMORIES OF SIVSHA
          </h1>
        </div>

        {/* Refined Hairline Champagne Indicator */}
        <div className="w-44 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#831843] via-[#e2c275] to-[#f5ebd4] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Poetic Understated Status */}
        <p className="text-[11px] font-sans font-light tracking-[0.2em] uppercase text-[#a8a29e] transition-opacity duration-500">
          {statusText}
        </p>
      </div>
    </div>
  );
}
