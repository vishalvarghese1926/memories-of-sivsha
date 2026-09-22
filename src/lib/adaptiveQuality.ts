"use client";

import { useState, useEffect } from "react";

export type QualityTier = "low" | "medium" | "high";

export interface QualityProfile {
  tier: QualityTier;
  isMobile: boolean;
  isIOS: boolean;
  isSafari: boolean;
  dpr: number;
  particleMultiplier: number;
  shadowFrames: number;
  enableContactShadows: boolean;
  enablePostEffects: boolean;
}

export function detectQualityProfile(): QualityProfile {
  if (typeof window === "undefined") {
    return {
      tier: "high",
      isMobile: false,
      isIOS: false,
      isSafari: false,
      dpr: 1.5,
      particleMultiplier: 1.0,
      shadowFrames: 1,
      enableContactShadows: true,
      enablePostEffects: true,
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

  // On iOS Safari, capping DPR at 1.6 - 1.75 avoids severe GPU memory limits and thermal throttling
  let dpr = Math.min(rawDpr, 2.0);
  let tier: QualityTier = "high";

  if (isMobile) {
    dpr = Math.min(rawDpr, isSafari || isIOS ? 1.65 : 1.75);
    if (hardwareConcurrency <= 4 || window.innerWidth < 380) {
      tier = "low";
      dpr = Math.min(dpr, 1.35);
    } else {
      tier = "medium";
    }
  } else {
    if (hardwareConcurrency <= 4) {
      tier = "medium";
      dpr = Math.min(dpr, 1.75);
    } else {
      tier = "high";
      dpr = Math.min(dpr, 2.0);
    }
  }

  return {
    tier,
    isMobile,
    isIOS,
    isSafari,
    dpr: Math.max(1.0, Math.round(dpr * 100) / 100),
    particleMultiplier: tier === "low" ? 0.45 : tier === "medium" ? 0.75 : 1.0,
    shadowFrames: 1, // Keep static contact shadow frames for zero frame drops
    enableContactShadows: tier !== "low",
    enablePostEffects: tier === "high",
  };
}

export function useAdaptiveQuality(): QualityProfile {
  const [profile, setProfile] = useState<QualityProfile>(() => detectQualityProfile());

  useEffect(() => {
    const updated = detectQualityProfile();
    setProfile(updated);

    const onResize = () => {
      const rechecked = detectQualityProfile();
      setProfile((prev) => (prev.tier !== rechecked.tier || prev.dpr !== rechecked.dpr ? rechecked : prev));
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return profile;
}
