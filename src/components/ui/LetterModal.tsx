"use client";

import React, { useEffect, useRef } from "react";
import { useStory } from "@/context/StoryContext";
import { useRouter } from "next/navigation";
import { Sparkles, Heart, RotateCcw, Image as ImageIcon, X } from "lucide-react";
import confetti from "canvas-confetti";

export default function LetterModal() {
  const { isLetterModalOpen, setIsLetterModalOpen, letter, setScrollProgress } = useStory();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti when the wax seal breaks and modal opens
  useEffect(() => {
    if (isLetterModalOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
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

  const handleMemoriesGallery = () => {
    setIsLetterModalOpen(false);
    router.push("/memories");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Parchment Document Frame */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#fffdfa] text-[#1c1917] shadow-2xl border-2 border-[#f5d0c5]/50 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(#f8f3eb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setIsLetterModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1c1917]/5 hover:bg-[#1c1917]/10 text-[#78716c] hover:text-[#1c1917] transition-colors z-10"
          aria-label="Close letter"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Parchment Body */}
        <div className="overflow-y-auto px-6 sm:px-12 py-8 sm:py-10 space-y-6 select-text font-serif">
          {/* Header Seal Badge */}
          <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-rose-900/10">
            <div className="w-12 h-12 rounded-full bg-rose-700 flex items-center justify-center text-white shadow-md mb-1">
              <Heart className="w-6 h-6 fill-white text-rose-700" />
            </div>
            <p className="text-xs uppercase tracking-widest text-rose-800/80 font-sans font-medium">
              A Letter For Sivani &bull; {letter.date}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-rose-950 leading-tight">
              {letter.headline}
            </h2>
          </div>

          {/* Letter Body Paragraphs */}
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-[#292524]">
            {letter.paragraphs.map((p, idx) => (
              <p key={idx} className="indent-4 sm:indent-6">
                {p}
              </p>
            ))}
          </div>

          {/* Signature Block */}
          <div className="pt-6 border-t border-rose-900/10 flex flex-col items-end">
            <p className="italic text-base text-rose-900">{letter.signature}</p>
            <p className="text-xl font-bold tracking-wide text-rose-950 font-serif mt-1">
              {letter.senderName}
            </p>
          </div>
        </div>

        {/* Sleek Glassmorphic Action Footer */}
        <div className="p-4 sm:p-6 bg-[#f7f2ea] border-t border-rose-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Revisit Our Story Button */}
          <button
            onClick={handleRevisit}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 font-sans font-medium text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Revisit Our Story</span>
          </button>

          {/* Memories of Sivsha Gallery Button */}
          <button
            onClick={handleMemoriesGallery}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-sans font-medium text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Memories of Sivsha</span>
          </button>
        </div>
      </div>
    </div>
  );
}
