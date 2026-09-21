"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { CharacterPose } from "@/types/character";

/**
 * Standard Animation Clip Name mappings to normalize variations in external GLTF files.
 */
const POSE_TO_CLIP_MAP: Record<string, string[]> = {
  idle: ["Idle", "idle", "IDLE", "Neutral"],
  walk: ["Walk", "walk", "WALK", "Walking", "walking"],
  walking: ["Walk", "walk", "WALK", "Walking", "walking"],
  stand: ["Stand", "stand", "STAND", "Standing", "standing", "Idle"],
  standing: ["Stand", "stand", "STAND", "Standing", "standing", "Idle"],
  sit: ["Sit", "sit", "SIT", "Sitting", "sitting", "Seated"],
  sitting: ["Sit", "sit", "SIT", "Sitting", "sitting", "Seated"],
  look: ["Look", "look", "LOOK", "Looking", "looking", "Idle"],
  reach: ["Reach", "reach", "REACH", "Reaching", "reaching", "Interact"],
  reaching: ["Reach", "reach", "REACH", "Reaching", "reaching", "Interact"],
  offeringPen: ["Reach", "reach", "REACH", "Reaching", "reaching", "Interact", "Idle"],
  interact: ["Interact", "interact", "INTERACT", "Interacting", "Reach"],
  interacting: ["Interact", "interact", "INTERACT", "Interacting", "Reach"],
  biker: ["Biker", "biker", "Ride", "ride", "Sitting", "sit"],
  bikerPillion: ["BikerPillion", "bikerPillion", "Pillion", "pillion", "Sitting", "sit"],
};

export interface UseCharacterAnimationControllerProps {
  mixer: THREE.AnimationMixer | null;
  actions: Record<string, THREE.AnimationAction | null>;
  currentPose?: CharacterPose;
  crossfadeDuration?: number;
  playbackSpeed?: number;
  scrollVelocity?: number;
}

/**
 * Reusable Animation Controller that manages seamless crossfading, loop modes,
 * and time-scale speed between clips in an R3F SkinnedMesh model.
 */
export function useCharacterAnimationController({
  mixer,
  actions,
  currentPose = "idle",
  crossfadeDuration = 0.35,
  playbackSpeed = 1.0,
  scrollVelocity = 0,
}: UseCharacterAnimationControllerProps) {
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const activeClipNameRef = useRef<string | null>(null);

  // Find matching action from the available clips
  const matchedAction = useMemo(() => {
    if (!actions || Object.keys(actions).length === 0) return null;

    const candidates = POSE_TO_CLIP_MAP[currentPose] || [currentPose];
    for (const name of candidates) {
      if (actions[name]) {
        return { action: actions[name], name };
      }
    }

    // Fallback to first available clip or Idle
    const firstKey = Object.keys(actions)[0];
    if (firstKey && actions[firstKey]) {
      return { action: actions[firstKey], name: firstKey };
    }

    return null;
  }, [actions, currentPose]);

  // Execute smooth crossfading when matched action changes
  useEffect(() => {
    if (!matchedAction || !matchedAction.action) return;

    const nextAction = matchedAction.action;
    const nextName = matchedAction.name;
    const prevAction = currentActionRef.current;

    // Set configuration for next clip
    nextAction.setEffectiveTimeScale(playbackSpeed);
    nextAction.setEffectiveWeight(1.0);

    if (prevAction && prevAction !== nextAction) {
      nextAction.reset();
      nextAction.play();
      prevAction.crossFadeTo(nextAction, crossfadeDuration, true);
    } else {
      nextAction.play();
    }

    currentActionRef.current = nextAction;
    activeClipNameRef.current = nextName;
  }, [matchedAction, crossfadeDuration, playbackSpeed]);

  // Dynamically adapt walk cycle speed to scroll velocity when moving
  useEffect(() => {
    if (!currentActionRef.current) return;

    if (currentPose === "walk" || currentPose === "walking") {
      const dynamicSpeed = Math.max(0.6, Math.min(2.0, 1.0 + Math.abs(scrollVelocity) * 1.5));
      currentActionRef.current.setEffectiveTimeScale(dynamicSpeed);
    } else {
      currentActionRef.current.setEffectiveTimeScale(playbackSpeed);
    }
  }, [scrollVelocity, currentPose, playbackSpeed]);

  return {
    activeClipName: activeClipNameRef.current,
    currentAction: currentActionRef.current,
    mixer,
  };
}
