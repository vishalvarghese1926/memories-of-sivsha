import * as THREE from "three";

/**
 * Standard Animation States supported across the Sivsha 3D storytelling world.
 */
export type CharacterPose =
  | "idle"
  | "walk"
  | "walking" // Backwards-compatible alias for walk
  | "stand"
  | "standing"
  | "sit"
  | "sitting"
  | "look"
  | "reach"
  | "reaching"
  | "offeringPen" // Semantic alias for Sivani in Phase 5C
  | "interact"
  | "interacting"
  | "biker"
  | "bikerPillion";

/**
 * Facial emotion presets supported via blendshapes/morph targets.
 */
export type CharacterFacialExpression =
  | "neutral"
  | "smile"
  | "surprised"
  | "subtleSmile"
  | "focused";

/**
 * Reusable configuration for look-at tracking.
 */
export interface CharacterLookAtConfig {
  target?: [number, number, number] | THREE.Vector3;
  weight?: number; // 0 to 1 (influence of head/neck turn)
  bodyTurnThreshold?: number; // angle threshold before body aligns
  clampPitch?: [number, number]; // [minRad, maxRad] (e.g. [-0.5, 0.5])
  clampYaw?: [number, number]; // [minRad, maxRad] (e.g. [-1.2, 1.2])
  slerpSpeed?: number; // damping factor in useFrame (default ~ 4.5)
}

/**
 * Reusable configuration for hand/arm inverse kinematics or reaching targets.
 */
export interface CharacterReachConfig {
  active?: boolean;
  target?: [number, number, number] | THREE.Vector3;
  hand?: "right" | "left";
  progress?: number; // 0 (rest) to 1 (contact/reach)
  elbowBend?: number;
}

/**
 * Facial morph target configuration (eyelid blinks, smiles, brows).
 */
export interface CharacterFacialConfig {
  expression?: CharacterFacialExpression;
  blinkRate?: number; // Blinks per minute (default ~ 14)
  blinkDuration?: number; // Duration in seconds (default ~ 0.15)
  smileIntensity?: number; // 0 to 1
  autoBlink?: boolean;
}

/**
 * Unified props interface for rigged GLTF character components.
 */
export interface CharacterControllerProps {
  // World Placement
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;

  // Animation State
  pose?: CharacterPose;
  previousPose?: CharacterPose;
  crossfadeDuration?: number; // Seconds to blend between clips (default: 0.35s)
  playbackSpeed?: number;

  // Story Scroll Reactive Velocity
  scrollVelocity?: number;

  // External GLB Asset Path (optional - will fall back to procedural if unsupplied or failed)
  modelUrl?: string;

  // Kinematic / IK Targets
  lookAtTarget?: [number, number, number] | THREE.Vector3;
  lookAtConfig?: CharacterLookAtConfig;

  // Hand Reach & Interaction Targets
  reachProgress?: number; // Direct 0 -> 1 progress
  reachConfig?: CharacterReachConfig;

  // Offering Pen progress (Phase 5C alias)
  offerProgress?: number;

  // Environmental Physics (hair & cloth wind)
  windIntensity?: number;

  // Facial Animation & Morph Targets
  facialConfig?: CharacterFacialConfig;

  // Character Identity & Model Mode
  isHero?: boolean; // Defaults to true for hero characters (loads real GLB). Set false for background actors.
  useFallback?: boolean; // When true, forces the stylized procedural mesh

  // Visual Quality & Optimization
  castShadow?: boolean;
  receiveShadow?: boolean;
  visible?: boolean;
}
