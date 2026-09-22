"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";

export function useSceneProgress(milestoneId: string, fallbackProgress: number = 0) {
  const { milestones, scrollProgressRef } = useStory();

  const bounds = useMemo(() => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    return {
      start: milestone?.custom3DConfig?.splineProgressStart ?? 0,
      end: milestone?.custom3DConfig?.splineProgressEnd ?? 1,
    };
  }, [milestones, milestoneId]);

  /**
   * Sample the exact 0..1 progress for this scene inside useFrame without triggering React renders.
   */
  const getProgress = (): number => {
    const current = scrollProgressRef?.current ?? fallbackProgress;
    if (bounds.end <= bounds.start) return fallbackProgress;
    return THREE.MathUtils.clamp(
      (current - bounds.start) / (bounds.end - bounds.start),
      0,
      1
    );
  };

  return { getProgress, start: bounds.start, end: bounds.end };
}
