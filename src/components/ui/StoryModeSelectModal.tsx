"use client";

import React, { useState } from "react";
import { useStory, StoryMode } from "@/context/StoryContext";

interface StoryModeSelectModalProps {
  onComplete?: () => void;
}

export default function StoryModeSelectModal({ onComplete }: StoryModeSelectModalProps) {
  const { hasChosenStoryMode, setStoryMode } = useStory();
  const [selected, setSelected] = useState<StoryMode>("manual");
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // If already chosen in this session, do not render
  if (hasChosenStoryMode) return null;

  const handleConfirm = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setStoryMode(selected);
      if (onComplete) onComplete();
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How would you like to experience our story?"
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-[#07050d]/96 backdrop-blur-xl select-none transition-opacity duration-500 overscroll-contain ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
      onTouchMove={(e) => {
        // Prevent background touch scrolling while modal is active
        e.stopPropagation();
      }}
    >
      {/* Subtle ambient warm gold/wine glow in background */}
      <div className="absolute w-96 h-96 rounded-full bg-[#831843]/10 blur-[130px] pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-[#e2c275]/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-lg w-full flex flex-col items-center text-center space-y-8 px-4 py-8 pointer-events-auto">
        {/* Subtle Eyebrow */}
        <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#e2c275] font-light">
          A Cinematic Journey For Sivani
        </span>

        {/* Main Question */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-normal tracking-wide text-[#fcfbf7] leading-snug">
          How would you like to experience our story?
        </h2>

        {/* Two Options */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* MANUAL OPTION */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isFadingOut) setSelected("manual");
            }}
            className={`group relative flex flex-col items-center p-6 rounded-2xl border text-left transition-all duration-300 cursor-pointer touch-manipulation pointer-events-auto ${
              selected === "manual"
                ? "bg-[#140e1e]/90 border-[#e2c275] shadow-[0_4px_30px_rgba(226,194,117,0.18)] scale-[1.02]"
                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] opacity-70"
            }`}
          >
            {/* Radio indicator */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-sm font-sans font-semibold tracking-widest uppercase text-[#fcfbf7]">
                MANUAL
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  selected === "manual"
                    ? "border-[#e2c275] bg-[#e2c275]"
                    : "border-white/30 bg-transparent"
                }`}
              >
                {selected === "manual" && <div className="w-1.5 h-1.5 rounded-full bg-[#07050d]" />}
              </div>
            </div>

            <p className="text-xs text-[#d6d3d1] font-light leading-relaxed">
              Take your time. Scroll through every memory yourself.
            </p>
          </button>

          {/* AUTO OPTION */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isFadingOut) setSelected("auto");
            }}
            className={`group relative flex flex-col items-center p-6 rounded-2xl border text-left transition-all duration-300 cursor-pointer touch-manipulation pointer-events-auto ${
              selected === "auto"
                ? "bg-[#140e1e]/90 border-[#e2c275] shadow-[0_4px_30px_rgba(226,194,117,0.18)] scale-[1.02]"
                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] opacity-70"
            }`}
          >
            {/* Radio indicator */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-sm font-sans font-semibold tracking-widest uppercase text-[#fcfbf7]">
                AUTO
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  selected === "auto"
                    ? "border-[#e2c275] bg-[#e2c275]"
                    : "border-white/30 bg-transparent"
                }`}
              >
                {selected === "auto" && <div className="w-1.5 h-1.5 rounded-full bg-[#07050d]" />}
              </div>
            </div>

            <p className="text-xs text-[#d6d3d1] font-light leading-relaxed">
              Sit back and let our story unfold like a film.
            </p>
          </button>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
          className="mt-6 px-10 py-3.5 rounded-full text-xs font-sans tracking-[0.25em] uppercase font-semibold text-white bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] shadow-[0_4px_25px_rgba(131,24,67,0.4)] active:scale-95 transition-all duration-200 cursor-pointer touch-manipulation pointer-events-auto"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
}
