"use client";

import React, { useEffect, useRef, useState } from "react";

interface CinematicUnlockOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function CinematicUnlockOverlay({
  isActive,
  onComplete,
}: CinematicUnlockOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<"hidden" | "warming" | "warping" | "fading" | "done">("hidden");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const phaseRef = useRef<"hidden" | "warming" | "warping" | "fading" | "done">("hidden");

  useEffect(() => {
    if (!isActive || completedRef.current) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      phaseRef.current = "warming";
      setPhase("warming");
      const timer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          phaseRef.current = "done";
          setPhase("done");
          onCompleteRef.current();
        }
      }, 1200);
      return () => clearTimeout(timer);
    }

    phaseRef.current = "warping";
    setPhase("warping");

    // Initialize lightweight canvas particle warp
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Fallback if canvas context fails
      const timer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          phaseRef.current = "done";
          setPhase("done");
          onCompleteRef.current();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    let animationFrameId: number;
    let startTime: number | null = null;
    const duration = 3200; // 3.2 seconds total

    // Resize canvas to display size
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Generate ~140 radial stardust particles
    const particleCount = 140;
    const particles = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(width, height) * 0.7;
      const speed = 0.5 + Math.random() * 1.5;
      const size = 1 + Math.random() * 2;
      // Palette: rose, lavender, soft gold, warm white
      const colors = ["#fb7185", "#c084fc", "#fde047", "#ffffff", "#fed7aa"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        angle,
        dist,
        speed,
        size,
        color,
        origDist: dist,
      };
    });

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Accelerate particle motion exponentially
      const speedMultiplier = 1 + Math.pow(progress, 3) * 22;

      // Dark translucent trail
      ctx.fillStyle = `rgba(7, 7, 13, ${0.18 + progress * 0.25})`;
      ctx.fillRect(0, 0, width, height);

      // Render converging / streaming particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.dist -= p.speed * speedMultiplier;

        // Reset particle if it reaches the vanishing point
        if (p.dist <= 5) {
          p.dist = Math.max(width, height) * (0.6 + Math.random() * 0.4);
          p.angle = Math.random() * Math.PI * 2;
        }

        const x = centerX + Math.cos(p.angle) * p.dist;
        const y = centerY + Math.sin(p.angle) * p.dist;

        // Particle trail towards vanishing center
        const trailLength = (1 - p.dist / (Math.max(width, height) * 0.7)) * 25 * speedMultiplier;
        const tailX = x + Math.cos(p.angle) * trailLength;
        const tailY = y + Math.sin(p.angle) * trailLength;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.min(p.size * (1 + progress * 0.5), 3.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      // At 75% progress, enter fading stage
      if (progress >= 0.75 && phaseRef.current !== "fading") {
        phaseRef.current = "fading";
        setPhase("fading");
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (!completedRef.current) {
          completedRef.current = true;
          phaseRef.current = "done";
          setPhase("done");
          onCompleteRef.current();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Hard fallback timeout: guarantees completion even if rAF is throttled
    const fallbackTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        phaseRef.current = "done";
        setPhase("done");
        onCompleteRef.current();
      }
    }, duration + 500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fallbackTimer);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-hidden bg-[#07070d]"
    >
      <span className="sr-only">Unlocking our story...</span>

      {/* Canvas for particle warp */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
          phase === "fading" ? "opacity-40" : "opacity-100"
        }`}
      />

      {/* Central Luminous Portal Glow */}
      <div
        className={`absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-rose-500/20 via-pink-400/30 to-amber-300/20 blur-3xl transition-all duration-1000 ${
          phase === "warping"
            ? "scale-125 opacity-70"
            : phase === "fading"
            ? "scale-150 opacity-95"
            : "scale-100 opacity-40"
        }`}
      />

      {/* Vignette & Soft Horizon Transition */}
      <div
        className={`absolute inset-0 bg-radial-gradient pointer-events-none transition-opacity duration-1000 ${
          phase === "fading" ? "opacity-90 bg-black/60" : "opacity-30"
        }`}
      />

      {/* Subtle Luminous Brand Text during transition */}
      <div
        className={`relative z-10 text-center transition-all duration-1000 ${
          phase === "warping"
            ? "opacity-80 scale-100"
            : phase === "fading"
            ? "opacity-100 scale-105"
            : "opacity-0 scale-95"
        }`}
      >
        <p className="text-xs uppercase tracking-widest text-rose-300/80 mb-2 font-mono">
          ENTERING ARCHIVE
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif text-gradient-rose font-bold">
          MEMORIES OF SIVSHA
        </h2>
      </div>
    </div>
  );
}
