"use client";

import React, { useEffect } from "react";
import SmoothScrollProvider from "@/components/common/SmoothScrollProvider";
import StoryCanvas from "@/components/canvas/StoryCanvas";
import StoryCaption from "@/components/ui/StoryCaption";
import StoryHeader from "@/components/ui/StoryHeader";
import LetterModal from "@/components/ui/LetterModal";
import StoryDebugOverlay from "@/components/ui/StoryDebugOverlay";
import StoryPreparationOverlay from "@/components/ui/StoryPreparationOverlay";
import PhotoLightboxModal from "@/components/ui/PhotoLightboxModal";
import StoryModeSelectModal from "@/components/ui/StoryModeSelectModal";
import AutoModeControls from "@/components/ui/AutoModeControls";
import { useStory } from "@/context/StoryContext";

export default function StoryEngineClient() {
  const { setScrollProgress } = useStory();

  // Reset scroll to top on first mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      setScrollProgress(0);
    }
  }, [setScrollProgress]);

  const handleScroll = (progress: number, velocity: number = 0) => {
    setScrollProgress(progress, velocity);
  };

  return (
    <div className="relative w-full bg-[#07050d] text-[#f4edea] select-none">
      {/* Fixed Sticky Story Viewport */}
      <div className="fixed inset-0 z-20 w-full h-[100dvh] overflow-hidden bg-[#07050d] pointer-events-none">
        {/* ONE Persistent R3F Canvas */}
        <StoryCanvas />

        {/* DOM Caption Narrative Layer */}
        <StoryCaption />

        {/* Story Navigation Header & Controls */}
        <StoryHeader />

        {/* Interactive Birthday Letter Parchment Modal */}
        <LetterModal />

        {/* Minimal Cinematic Story Preparation Phase */}
        <StoryPreparationOverlay />

        {/* First Story Screen: Manual vs Auto Mode Choice */}
        <StoryModeSelectModal />

        {/* Fullscreen Photo Lightbox for Real Photographs */}
        <PhotoLightboxModal />

        {/* Subtle Auto Mode Pause / Resume HUD */}
        <AutoModeControls />

        {/* Development Diagnostic Overlay */}
        {process.env.NODE_ENV === "development" && <StoryDebugOverlay />}
      </div>

      {/* Smooth Scroll Driver with Lenis & GSAP ScrollTrigger */}
      <SmoothScrollProvider onScroll={handleScroll}>
        {/* Scroll Track: 1400vh provides a cinematic, unhurried pace for all 14 milestones */}
        <div
          className="w-full h-[1400vh] pointer-events-none"
          aria-hidden="true"
        />
      </SmoothScrollProvider>
    </div>
  );
}
