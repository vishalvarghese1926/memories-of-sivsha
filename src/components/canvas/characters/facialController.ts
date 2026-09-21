"use client";

import * as THREE from "three";
import { CharacterFacialConfig } from "@/types/character";

/**
 * Standard morph target names supported on high-fidelity GLTF humanoid heads
 * (Compatible with ARKit, Ready Player Me, and standard Blender character shape keys).
 */
const MORPH_TARGET_NAMES = {
  blinkLeft: ["eyeBlinkLeft", "blink_left", "Blink_L", "eyesClosed_L", "blink"],
  blinkRight: ["eyeBlinkRight", "blink_right", "Blink_R", "eyesClosed_R", "blink"],
  smileLeft: ["mouthSmileLeft", "smile_left", "Smile_L", "mouthSmile"],
  smileRight: ["mouthSmileRight", "smile_right", "Smile_R", "mouthSmile"],
  browInnerUp: ["browInnerUp", "browsUp", "Brow_Inner_Up"],
};

/**
 * Finds the index of a morph target by testing candidate naming conventions.
 */
function findMorphIndex(mesh: THREE.Mesh, candidates: string[]): number {
  if (!mesh.morphTargetDictionary) return -1;
  for (const name of candidates) {
    if (name in mesh.morphTargetDictionary) {
      return mesh.morphTargetDictionary[name];
    }
  }
  return -1;
}

export interface FacialControllerState {
  blinkTimer: number;
  isBlinking: boolean;
  blinkProgress: number;
}

/**
 * Updates subtle human-like facial expressions:
 * - Natural involuntary eye blinks (every 3 to 5 seconds, lasting ~150ms)
 * - Subtle warm smiles and emotional expressions
 * - Zero emoji/cartoon exaggeration
 */
export function updateFacialBlendshapes({
  mesh,
  config,
  state,
  delta,
}: {
  mesh: THREE.Mesh | null;
  config?: CharacterFacialConfig;
  state: FacialControllerState;
  delta: number;
}) {
  if (!mesh || !mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;

  const autoBlink = config?.autoBlink ?? true;
  const smileIntensity = config?.smileIntensity ?? (config?.expression === "smile" ? 0.7 : 0.15);

  // 1. Natural Involuntary Eye Blinking
  if (autoBlink) {
    state.blinkTimer += delta;

    // Trigger blink every ~3.8 seconds with slight randomized jitter
    if (!state.isBlinking && state.blinkTimer > 3.8) {
      state.isBlinking = true;
      state.blinkTimer = 0;
      state.blinkProgress = 0;
    }

    if (state.isBlinking) {
      // 150ms quick human blink cycle: close then reopen
      const blinkDuration = 0.16;
      state.blinkProgress += delta / blinkDuration;

      let blinkWeight = 0;
      if (state.blinkProgress <= 0.5) {
        blinkWeight = state.blinkProgress * 2; // close
      } else if (state.blinkProgress <= 1.0) {
        blinkWeight = (1.0 - state.blinkProgress) * 2; // reopen
      } else {
        state.isBlinking = false;
        blinkWeight = 0;
      }

      const idxL = findMorphIndex(mesh, MORPH_TARGET_NAMES.blinkLeft);
      const idxR = findMorphIndex(mesh, MORPH_TARGET_NAMES.blinkRight);
      if (idxL !== -1) mesh.morphTargetInfluences[idxL] = blinkWeight;
      if (idxR !== -1) mesh.morphTargetInfluences[idxR] = blinkWeight;
    }
  }

  // 2. Subtle Warm Smile
  const smileL = findMorphIndex(mesh, MORPH_TARGET_NAMES.smileLeft);
  const smileR = findMorphIndex(mesh, MORPH_TARGET_NAMES.smileRight);

  if (smileL !== -1) {
    mesh.morphTargetInfluences[smileL] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[smileL],
      smileIntensity,
      Math.min(1, delta * 3)
    );
  }
  if (smileR !== -1) {
    mesh.morphTargetInfluences[smileR] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[smileR],
      smileIntensity,
      Math.min(1, delta * 3)
    );
  }
}
