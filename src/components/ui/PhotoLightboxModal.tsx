"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import { useStory } from "@/context/StoryContext";

export default function PhotoLightboxModal() {
  const { activeLightboxPhoto, closePhotoLightbox } = useStory();

  const handleClose = useCallback(() => {
    closePhotoLightbox();
  }, [closePhotoLightbox]);

  // Handle Escape key and prevent background scrolling
  useEffect(() => {
    if (!activeLightboxPhoto) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Keyboard Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Browser back button handling via history state
    const handlePopState = () => {
      handleClose();
    };
    window.history.pushState({ photoLightbox: true }, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeLightboxPhoto, handleClose]);

  if (!activeLightboxPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeLightboxPhoto.sceneTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#07050d]/92 backdrop-blur-md transition-opacity duration-300 select-none animate-fadeIn"
      onClick={(e) => {
        // Tap backdrop to close
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Close button with >= 48px touch target */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close memory photograph"
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-[#e0f2fe] border border-[#22d3ee]/30 shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#22d3ee]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main Photograph Frame */}
      <div
        className="relative max-w-4xl w-full max-h-[88vh] flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-[#0e0c18] border border-[#22d3ee]/25 shadow-[0_15px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(34,211,238,0.15)] transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Cyan Header Ribbon */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 mb-1 border-b border-white/5 text-[11px] font-mono tracking-widest text-[#22d3ee]/80 uppercase">
          <span>{activeLightboxPhoto.sceneTitle}</span>
          {activeLightboxPhoto.date && (
            <span className="text-white/40">{activeLightboxPhoto.date}</span>
          )}
          {activeLightboxPhoto.location && !activeLightboxPhoto.date && (
            <span className="text-white/40">{activeLightboxPhoto.location}</span>
          )}
        </div>

        {/* High-Resolution Image Container */}
        <div className="relative w-full max-h-[72vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
          <Image
            src={activeLightboxPhoto.highResUrl}
            alt={activeLightboxPhoto.caption || activeLightboxPhoto.sceneTitle}
            width={1600}
            height={Math.round(1600 / (activeLightboxPhoto.aspectRatio || 1.7778))}
            quality={90}
            priority
            className="w-auto h-auto max-w-full max-h-[72vh] object-contain rounded-lg shadow-inner pointer-events-auto"
          />
        </div>

        {/* Emotionally Intimate Caption */}
        {activeLightboxPhoto.caption && (
          <div className="w-full px-4 pt-2.5 pb-1 text-center">
            <p className="text-xs sm:text-sm font-sans font-light tracking-wide text-rose-100/90 leading-relaxed italic">
              &ldquo;{activeLightboxPhoto.caption}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
