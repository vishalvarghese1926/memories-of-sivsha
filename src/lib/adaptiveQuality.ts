"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export type QualityTier = "low" | "medium" | "high";
export type AdaptiveQualityLevel = 0 | 1 | 2 | 3;

export interface QualityProfile {
  tier: QualityTier;
  isMobile: boolean;
  isIOS: boolean;
  isSafari: boolean;
  dpr: number;
  baseDpr: number;
  particleMultiplier: number;
  shadowFrames: number;
  enableContactShadows: boolean;
  enablePostEffects: boolean;
  adaptiveLevel: AdaptiveQualityLevel;
}

export interface PerformanceTelemetry {
  fps: number;
  frameTimeMs: number;
  avgFrameTimeMs: number;
  worstFrameTimeMs: number;
  adaptiveLevel: AdaptiveQualityLevel;
  currentDpr: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

// Global runtime store (zero-allocation access inside useFrame)
export const adaptiveQualityStore = {
  profile: detectQualityProfile(),
  telemetry: {
    fps: 60,
    frameTimeMs: 16.6,
    avgFrameTimeMs: 16.6,
    worstFrameTimeMs: 16.6,
    adaptiveLevel: 0 as AdaptiveQualityLevel,
    currentDpr: 1.25,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
  } as PerformanceTelemetry,
  listeners: new Set<(p: QualityProfile) => void>(),
};

export function detectQualityProfile(): QualityProfile {
  if (typeof window === "undefined") {
    return {
      tier: "high",
      isMobile: false,
      isIOS: false,
      isSafari: false,
      dpr: 1.5,
      baseDpr: 1.5,
      particleMultiplier: 1.0,
      shadowFrames: 1,
      enableContactShadows: true,
      enablePostEffects: true,
      adaptiveLevel: 0,
    };
  }

  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isMobile =
    isIOS ||
    /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    window.innerWidth < 768;
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);

  const rawDpr = window.devicePixelRatio || 1;
  const hardwareConcurrency = window.navigator.hardwareConcurrency || 4;

  // Phase 5 — Mobile DPR: Conservative DPR limits (1.0 - 1.35 on mobile, capped at 1.5 for flagship)
  let dpr = 1.5;
  let tier: QualityTier = "high";

  if (isMobile) {
    // Mobile conservative limit: approximately 1.0–1.5 depending on hardware concurrency
    if (hardwareConcurrency <= 4 || window.innerWidth < 380) {
      tier = "low";
      dpr = Math.min(rawDpr, 1.15);
    } else if (hardwareConcurrency <= 6) {
      tier = "medium";
      dpr = Math.min(rawDpr, 1.25);
    } else {
      tier = "high";
      dpr = Math.min(rawDpr, isIOS || isSafari ? 1.35 : 1.45);
    }
  } else {
    // Desktop: reasonable adaptive DPR
    if (hardwareConcurrency <= 4) {
      tier = "medium";
      dpr = Math.min(rawDpr, 1.5);
    } else {
      tier = "high";
      dpr = Math.min(rawDpr, 1.75);
    }
  }

  const baseDpr = Math.max(1.0, Math.round(dpr * 100) / 100);

  return {
    tier,
    isMobile,
    isIOS,
    isSafari,
    dpr: baseDpr,
    baseDpr,
    particleMultiplier: tier === "low" ? 0.5 : tier === "medium" ? 0.75 : 1.0,
    shadowFrames: 1,
    enableContactShadows: tier !== "low",
    enablePostEffects: tier === "high",
    adaptiveLevel: 0,
  };
}

export function useAdaptiveQuality(): QualityProfile {
  const [profile, setProfile] = useState<QualityProfile>(() => adaptiveQualityStore.profile);

  useEffect(() => {
    const handleUpdate = (updated: QualityProfile) => {
      setProfile({ ...updated });
    };

    adaptiveQualityStore.listeners.add(handleUpdate);

    const onResize = () => {
      const detected = detectQualityProfile();
      adaptiveQualityStore.profile = {
        ...detected,
        adaptiveLevel: adaptiveQualityStore.profile.adaptiveLevel,
      };
      adaptiveQualityStore.listeners.forEach((fn) => fn(adaptiveQualityStore.profile));
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      adaptiveQualityStore.listeners.delete(handleUpdate);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return profile;
}

/**
 * =========================================================================
 * ADAPTIVE QUALITY CONTROLLER (PHASE 4 & 5)
 * =========================================================================
 *
 * Runs inside Canvas render loop:
 * - Samples frame times over a 60-frame rolling window.
 * - DOES NOT react to a single bad frame spike.
 * - Uses sustained hysteresis:
 *     Sustained avg frame time > 22ms (~45fps drop for 90 frames): degrade level
 *     Sustained avg frame time < 16ms (~60fps for 180 frames): recover level
 * - Level 0: Full (base DPR, particles 1.0, shadows enabled)
 * - Level 1: Reduced particles (0.5x multiplier)
 * - Level 2: Reduced DPR (step down by 0.25, min 1.0)
 * - Level 3: Disable nonessential shadows & background effects
 * - NEVER degrades story content, photos, characters, camera, or transitions!
 */
export function AdaptiveQualityController() {
  const { gl, setDpr } = useThree();

  // Pre-allocated frame time ring buffer (60 frames)
  const windowSize = 60;
  const frameTimesRef = useRef<Float32Array>(new Float32Array(windowSize));
  const frameIdxRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const sustainedDegradeCounterRef = useRef<number>(0);
  const sustainedRecoverCounterRef = useRef<number>(0);
  const worstFrameRef = useRef<number>(16.6);
  const lastWorstFrameResetRef = useRef<number>(0);

  useFrame((_, delta) => {
    const dtMs = delta * 1000;
    const idx = frameIdxRef.current;
    frameTimesRef.current[idx] = dtMs;
    frameIdxRef.current = (idx + 1) % windowSize;
    frameCountRef.current = Math.min(windowSize, frameCountRef.current + 1);

    // Track worst frame with 5-second decay
    if (dtMs > worstFrameRef.current) {
      worstFrameRef.current = dtMs;
    }
    const now = performance.now();
    if (now - lastWorstFrameResetRef.current > 5000) {
      worstFrameRef.current = dtMs;
      lastWorstFrameResetRef.current = now;
    }

    // Only evaluate rolling average once ring buffer is filled with valid frames
    if (frameCountRef.current < 20) return;

    let sum = 0;
    const count = frameCountRef.current;
    for (let i = 0; i < count; i++) {
      sum += frameTimesRef.current[i];
    }
    const avg = sum / count;
    const currentFps = dtMs > 0 ? Math.min(120, Math.round(1000 / dtMs)) : 60;

    // Phase 12 Telemetry aggregation (zero garbage collection)
    const t = adaptiveQualityStore.telemetry;
    t.fps = currentFps;
    t.frameTimeMs = Math.round(dtMs * 10) / 10;
    t.avgFrameTimeMs = Math.round(avg * 10) / 10;
    t.worstFrameTimeMs = Math.round(worstFrameRef.current * 10) / 10;
    t.adaptiveLevel = adaptiveQualityStore.profile.adaptiveLevel;
    t.currentDpr = adaptiveQualityStore.profile.dpr;

    if (gl?.info) {
      t.drawCalls = gl.info.render.calls;
      t.triangles = gl.info.render.triangles;
      t.geometries = gl.info.memory.geometries;
      t.textures = gl.info.memory.textures;
    }

    // Hysteresis evaluation:
    // Sustained frame time > 22ms for 90 frames (~1.5s - 2s sustained lag): degrade quality
    // Sustained frame time < 16ms for 180 frames (~3s smooth 60fps): allow gradual recovery
    const currentLevel = adaptiveQualityStore.profile.adaptiveLevel;

    if (avg > 22.0) {
      sustainedDegradeCounterRef.current++;
      sustainedRecoverCounterRef.current = 0;

      if (sustainedDegradeCounterRef.current >= 90 && currentLevel < 3) {
        sustainedDegradeCounterRef.current = 0;
        const newLevel = (currentLevel + 1) as AdaptiveQualityLevel;
        applyQualityLevel(newLevel);
      }
    } else if (avg < 16.0) {
      sustainedRecoverCounterRef.current++;
      sustainedDegradeCounterRef.current = 0;

      if (sustainedRecoverCounterRef.current >= 180 && currentLevel > 0) {
        sustainedRecoverCounterRef.current = 0;
        const newLevel = (currentLevel - 1) as AdaptiveQualityLevel;
        applyQualityLevel(newLevel);
      }
    } else {
      // In comfortable deadband (16ms - 22ms) -> reset degrade counters to avoid spurious changes
      sustainedDegradeCounterRef.current = Math.max(0, sustainedDegradeCounterRef.current - 1);
      sustainedRecoverCounterRef.current = Math.max(0, sustainedRecoverCounterRef.current - 1);
    }
  });

  function applyQualityLevel(level: AdaptiveQualityLevel) {
    const prof = adaptiveQualityStore.profile;
    prof.adaptiveLevel = level;

    // Level 0: Full
    // Level 1: Reduced particles
    // Level 2: Reduced DPR
    // Level 3: Disable nonessential shadows
    switch (level) {
      case 0:
        prof.particleMultiplier = prof.tier === "low" ? 0.5 : 1.0;
        prof.dpr = prof.baseDpr;
        prof.enableContactShadows = prof.tier !== "low";
        break;
      case 1:
        prof.particleMultiplier = 0.45;
        prof.dpr = prof.baseDpr;
        prof.enableContactShadows = prof.tier !== "low";
        break;
      case 2:
        prof.particleMultiplier = 0.4;
        prof.dpr = Math.max(1.0, Math.round((prof.baseDpr - 0.25) * 100) / 100);
        prof.enableContactShadows = prof.tier !== "low";
        break;
      case 3:
        prof.particleMultiplier = 0.3;
        prof.dpr = Math.max(1.0, Math.round((prof.baseDpr - 0.35) * 100) / 100);
        prof.enableContactShadows = false;
        break;
    }

    try {
      setDpr(prof.dpr);
    } catch {
      // Graceful setDpr failover
    }

    // Notify registered listeners
    adaptiveQualityStore.listeners.forEach((fn) => fn(prof));
  }

  return null;
}
