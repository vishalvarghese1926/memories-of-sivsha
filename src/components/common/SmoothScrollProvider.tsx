"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  onScroll?: (progress: number, velocity: number) => void;
}

export default function SmoothScrollProvider({
  children,
  onScroll,
}: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  useEffect(() => {
    // Detect mobile touch device
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // Immediate, direct mobile touch responsiveness + snappy desktop wheel
    const lenis = new Lenis({
      duration: isTouch ? 0.2 : 0.65,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;
    if (typeof window !== "undefined") {
      (window as any).__lenis = lenis;
    }

    // Connect Lenis to GSAP ScrollTrigger and forward progress + velocity
    lenis.on("scroll", (e: { progress: number; velocity: number }) => {
      ScrollTrigger.update();
      if (onScrollRef.current) {
        onScrollRef.current(e.progress, e.velocity);
      }
    });

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      if (typeof window !== "undefined" && (window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <div className="w-full relative pointer-events-none">{children}</div>;
}
