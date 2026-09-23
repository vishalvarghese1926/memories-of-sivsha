"use client";

import React from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { useStory } from "@/context/StoryContext";
import { calculateLocalProgress } from "@/components/canvas/StorySceneManager";

export default function StoryHeader() {
  const { isMuted, toggleAudioMute, scrollProgress, activeMilestoneIndex, milestones } = useStory();

  const isDev = process.env.NODE_ENV !== "production";
  const currentMilestone = milestones[activeMilestoneIndex];
  const start = currentMilestone?.custom3DConfig?.splineProgressStart ?? 0;
  const end = currentMilestone?.custom3DConfig?.splineProgressEnd ?? 1;
  const localProgress = calculateLocalProgress(scrollProgress, start, end);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 pointer-events-none pt-safe">
      {/* Brand Watermark */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="px-3.5 py-1.5 rounded-full border border-[#e2c275]/25 bg-[#07050d]/80 text-xs tracking-widest uppercase font-medium text-[#fcfbf7] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#e2c275]" />
          <span className="font-serif tracking-wider">MEMORIES OF SIVSHA</span>
        </div>
      </div>

      {/* Right Controls: Audio Toggle */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onClick={toggleAudioMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[#07050d]/80 border border-[#e2c275]/25 flex items-center justify-center text-[#d6d3d1] hover:text-[#fcfbf7] hover:border-[#e2c275]/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-pointer transition-all duration-200"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-[#e2c275]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#d6d3d1]" />
          )}
        </button>
      </div>

      {/* Development-only Debug Overlay (hidden in production) */}
      {isDev && (
        <div className="fixed bottom-4 left-4 z-40 px-3 py-2 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-neutral-300 pointer-events-none backdrop-blur-sm space-y-0.5">
          <div>
            <span className="text-rose-400 font-semibold">Progress:</span>{" "}
            {scrollProgress.toFixed(3)}
          </div>
          <div>
            <span className="text-purple-400 font-semibold">Scene:</span>{" "}
            {currentMilestone?.sceneType || "unknown"} ({activeMilestoneIndex + 1}/{milestones.length})
          </div>
          <div>
            <span className="text-amber-400 font-semibold">Local:</span>{" "}
            {localProgress.toFixed(2)}
          </div>
        </div>
      )}
    </header>
  );
}
