"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { canvasStore } from "@/context/StoryContext";

export function useSceneProgress(milestoneId: string, fallbackProgress: number = 0) {
  const bounds = useMemo(() => {
    const milestone = canvasStore.milestones.find((m) => m.id === milestoneId);
    return {
      start: milestone?.custom3DConfig?.splineProgressStart ?? 0,
      end: milestone?.custom3DConfig?.splineProgressEnd ?? 1,
    };
  }, [milestoneId]);

  /**
   * Sample the exact 0..1 progress for this scene inside useFrame without triggering React renders.
   */
  const getProgress = (): number => {
    const current = canvasStore.scrollProgressRef?.current ?? fallbackProgress;
    if (bounds.end <= bounds.start) return fallbackProgress;
    return THREE.MathUtils.clamp(
      (current - bounds.start) / (bounds.end - bounds.start),
      0,
      1
    );
  };

  return { getProgress, start: bounds.start, end: bounds.end };
}
