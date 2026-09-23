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
      aria-label="How do you want to experience our story?"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07050d]/96 backdrop-blur-xl select-none transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* Subtle ambient cyan glow in background */}
      <div className="absolute w-96 h-96 rounded-full bg-[#22d3ee]/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-lg w-full flex flex-col items-center text-center space-y-8 px-4 py-8">
        {/* Subtle Eyebrow */}
        <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#22d3ee]/80 font-light">
          A Cinematic Journey For Sivani
        </span>

        {/* Main Question */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-normal tracking-wide text-rose-100/95 leading-snug">
          How do you want to experience our story?
        </h2>

        {/* Two Options */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* MANUAL OPTION */}
          <button
            type="button"
            onClick={() => setSelected("manual")}
            className={`group relative flex flex-col items-center p-6 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
              selected === "manual"
                ? "bg-[#0f172a]/90 border-[#22d3ee] shadow-[0_0_25px_rgba(34,211,238,0.25)] scale-[1.02]"
                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] opacity-70"
            }`}
          >
            {/* Radio indicator */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-sm font-sans font-semibold tracking-widest uppercase text-white">
                MANUAL
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  selected === "manual"
                    ? "border-[#22d3ee] bg-[#22d3ee]"
                    : "border-white/30 bg-transparent"
                }`}
              >
                {selected === "manual" && <div className="w-1.5 h-1.5 rounded-full bg-[#07050d]" />}
              </div>
            </div>

            <p className="text-xs text-neutral-300/80 font-light leading-relaxed">
              Take your time. Scroll through every memory yourself.
            </p>
          </button>

          {/* AUTO OPTION */}
          <button
            type="button"
            onClick={() => setSelected("auto")}
            className={`group relative flex flex-col items-center p-6 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
              selected === "auto"
                ? "bg-[#0f172a]/90 border-[#22d3ee] shadow-[0_0_25px_rgba(34,211,238,0.25)] scale-[1.02]"
                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] opacity-70"
            }`}
          >
            {/* Radio indicator */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-sm font-sans font-semibold tracking-widest uppercase text-white">
                AUTO
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  selected === "auto"
                    ? "border-[#22d3ee] bg-[#22d3ee]"
                    : "border-white/30 bg-transparent"
                }`}
              >
                {selected === "auto" && <div className="w-1.5 h-1.5 rounded-full bg-[#07050d]" />}
              </div>
            </div>

            <p className="text-xs text-neutral-300/80 font-light leading-relaxed">
              Let the story unfold slowly.
            </p>
          </button>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="mt-6 px-10 py-3.5 rounded-full text-xs font-sans tracking-[0.25em] uppercase font-semibold text-[#07050d] bg-gradient-to-r from-[#22d3ee] to-[#38bdf8] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
}
