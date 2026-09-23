"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useStory } from "@/context/StoryContext";
import { Heart, RotateCcw, X, ZoomIn } from "lucide-react";
import confetti from "canvas-confetti";

export default function LetterModal() {
  const { isLetterModalOpen, setIsLetterModalOpen, letter, setScrollProgress, openPhotoLightbox } = useStory();
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti when the wax seal breaks and modal opens
  useEffect(() => {
    if (isLetterModalOpen) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#fda4af", "#fb7185", "#f43f5e", "#fde047", "#ffffff"],
        });
      } catch {
        // Safe fallback if canvas-confetti context is blocked
      }
    }
  }, [isLetterModalOpen]);

  if (!isLetterModalOpen) return null;

  const handleRevisit = () => {
    setIsLetterModalOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setScrollProgress(0);
  };

  const handleClose = () => {
    setIsLetterModalOpen(false);
  };

  const handleLetterPhotoClick = () => {
    openPhotoLightbox("letter-seal");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-[#040208]/85 backdrop-blur-md animate-fade-in pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Parchment Document Frame */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#fdfcf9] text-[#1c1917] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-[#e8dcc8] overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(#f4ede0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Close button with >= 44px touch target */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] p-2.5 rounded-full bg-[#1c1917]/5 hover:bg-[#1c1917]/10 text-[#78716c] hover:text-[#1c1917] transition-colors z-20 flex items-center justify-center cursor-pointer"
          aria-label="Close letter"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Parchment Body */}
        <div className="overflow-y-auto px-5 sm:px-12 py-8 sm:py-10 space-y-7 select-text font-serif">
          {/* Header Seal Badge */}
          <div className="flex flex-col items-center text-center space-y-2 pb-5 border-b border-[#e7dac8]">
            <div className="w-10 h-10 rounded-full bg-[#831843]/10 border border-[#831843]/30 flex items-center justify-center mb-1">
              <span className="text-base text-[#831843] font-serif font-bold">S</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#831843] font-sans font-semibold">
              The Private Final Chapter &bull; August 31, 2025
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2d121c] leading-tight font-serif tracking-tight">
              {letter.headline}
            </h2>
          </div>

          {/* Dedicated Authentic Handwritten Letter Centerpiece */}
          <div className="my-2 p-3 sm:p-4 rounded-2xl bg-[#f7f2e8] border border-[#e5d8c3] shadow-sm">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[#785b42]">
                Original Letter Document
              </span>
              <button
                type="button"
                onClick={handleLetterPhotoClick}
                className="inline-flex items-center gap-1.5 text-[11px] font-sans text-[#831843] hover:text-[#4c0519] font-medium transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>View High-Res</span>
              </button>
            </div>

            <div
              onClick={handleLetterPhotoClick}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#dfceb6] bg-[#0c0914] flex items-center justify-center max-h-[380px] sm:max-h-[440px] shadow-inner transition-transform duration-300 hover:scale-[1.008]"
            >
              <Image
                src="/media/photos/letter_seal_full.webp"
                alt="Original Handwritten Letter for Sivani"
                width={768}
                height={1260}
                className="w-auto h-auto max-h-[380px] sm:max-h-[440px] object-contain mx-auto transition-opacity group-hover:opacity-95"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                <span className="text-xs font-sans text-white/95 font-medium px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                  Tap to expand full screen
                </span>
              </div>
            </div>
          </div>

          {/* Letter Narrative Body (Refined Editorial Typography) */}
          <div className="space-y-5 text-[15px] sm:text-[17px] leading-relaxed text-[#2c2725]">
            {letter.paragraphs.map((p, idx) => (
              <p key={idx} className="indent-4 sm:indent-6 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Signature Block */}
          <div className="pt-6 border-t border-[#e7dac8] flex flex-col items-end">
            <p className="italic text-base text-[#831843] font-serif">{letter.signature}</p>
            <p className="text-xl font-bold tracking-wide text-[#2d121c] font-serif mt-1">
              Vishal
            </p>
          </div>
        </div>

        {/* Sleek Action Footer */}
        <div className="p-4 sm:p-6 bg-[#f5efe4] border-t border-[#e7dac8] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Revisit Our Story Button */}
          <button
            onClick={handleRevisit}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-white hover:bg-[#faf5ec] border border-[#d8c8b2] text-[#4a3b32] font-sans font-medium text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#831843]" />
            <span>Revisit Our Story</span>
          </button>

          {/* Keep In My Heart Close Button */}
          <button
            onClick={handleClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] hover:to-[#701a3c] text-white font-sans font-medium text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Keep Close To Heart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
