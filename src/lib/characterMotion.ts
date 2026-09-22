/**
 * Memories of Sivsha — Living Character Motion & Kinematics Engine
 *
 * Implements intentional humanoid body mechanics:
 * 1. Low-frequency natural respiratory cycles (breathing)
 * 2. Contrapposto weight shift (pelvis/torso counterbalance)
 * 3. Gaze & upper-body orientation tracking (looking at each other)
 * 4. Scene-driven motion states: idle, walking, sitting, emotional, biker, bikerPillion
 * 5. Zero-allocation per-frame evaluation using reusable scratch vectors
 */

import * as THREE from "three";

export type CharacterMotionState =
  | "idle"
  | "breathing"
  | "walking"
  | "sitting"
  | "biker"
  | "bikerPillion"
  | "emotional"
  | "talking";

export interface KinematicsOutput {
  rootY: number;
  rootX: number;
  spineRotX: number;
  spineRotY: number;
  spineRotZ: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
}

// Pre-allocated static scratch objects to guarantee zero GC pressure
const LOOK_DIR_SCRATCH = new THREE.Vector3();
const CHAR_POS_SCRATCH = new THREE.Vector3();

export function computeCharacterKinematics(
  t: number,
  delta: number,
  state: CharacterMotionState,
  options: {
    lookAtTarget?: [number, number, number] | null;
    characterPos?: [number, number, number];
    windIntensity?: number;
    isBoy?: boolean;
    reachProgress?: number;
  },
  out: KinematicsOutput
): void {
  const isBoy = options.isBoy ?? false;
  const wind = options.windIntensity ?? 0;
  const reach = options.reachProgress ?? 0;

  // Low-frequency natural respiration (~0.2 Hz, ~5 second period)
  // Amplitudes are kept extremely subtle (<0.004) to eliminate any trembling/wobble
  const breathFreq = isBoy ? 1.25 : 1.35; // ~0.2 Hz
  const breathCycle = Math.sin(t * breathFreq);
  const breathCos = Math.cos(t * breathFreq);

  // Slow, smooth weight shift cycle (shifts weight gently every ~8 seconds)
  const shiftFreq = isBoy ? 0.38 : 0.42;
  const weightShift = Math.sin(t * shiftFreq);

  // Default neutral rest values
  out.rootY = 0;
  out.rootX = 0;
  out.spineRotX = 0;
  out.spineRotY = 0;
  out.spineRotZ = 0;
  out.headRotX = 0;
  out.headRotY = 0;
  out.headRotZ = 0;
  out.leftArmRotX = 0;
  out.leftArmRotZ = isBoy ? -0.12 : -0.08;
  out.rightArmRotX = 0;
  out.rightArmRotZ = isBoy ? 0.12 : 0.08;
  out.leftLegRotX = 0;
  out.rightLegRotX = 0;

  switch (state) {
    case "walking": {
      // Natural walking stride for articulated limbs; root stays grounded and steady without shaking
      const walkSpeed = 2.4;
      const stride = Math.sin(t * walkSpeed);

      // Limbs swing for procedural models
      out.leftLegRotX = stride * 0.38;
      out.rightLegRotX = -stride * 0.38;
      out.leftArmRotX = -stride * 0.28;
      out.rightArmRotX = stride * 0.28;

      // Extremely calm root motion (no violent vertical wobble)
      out.rootY = Math.abs(Math.cos(t * walkSpeed)) * 0.005;
      out.spineRotX = 0.02;
      break;
    }

    case "sitting": {
      // Calm, grounded posture with relaxed upper body and serene low-frequency respiration
      out.rootY = -0.36;
      out.spineRotX = -0.05 + breathCycle * 0.003;
      out.leftLegRotX = 1.45;
      out.rightLegRotX = 1.45;
      out.leftArmRotX = 0.45;
      out.rightArmRotX = 0.45;
      out.leftArmRotZ = -0.18;
      out.rightArmRotZ = 0.18;
      break;
    }

    case "biker": {
      // Riding motorcycle: hands forward on handlebars, steady forward lean, zero artificial shaking
      out.rootY = 0.02;
      out.spineRotX = 0.24 + breathCycle * 0.002;
      out.leftArmRotX = 0.92;
      out.rightArmRotX = 0.92;
      out.leftArmRotZ = -0.25;
      out.rightArmRotZ = 0.25;
      out.headRotX = -0.10; // Eyes focused on the road ahead
      break;
    }

    case "bikerPillion": {
      // Riding pillion: leaning forward holding waist, steady and calm
      out.rootY = 0.04;
      out.spineRotX = 0.32 + breathCycle * 0.002;
      out.leftArmRotX = 0.82;
      out.rightArmRotX = 0.82;
      out.leftArmRotZ = -0.14;
      out.rightArmRotZ = 0.14;
      out.headRotX = -0.12;
      break;
    }

    case "emotional": {
      // Emotional moments: profound stillness and gentle, slow micro-presence
      const slowBreath = Math.sin(t * 0.9);
      out.rootY = slowBreath * 0.002;
      out.spineRotX = slowBreath * 0.003;
      out.spineRotZ = weightShift * 0.003;
      break;
    }

    case "idle":
    case "breathing":
    case "talking":
    default: {
      // Gentle organic standing posture: subtle 0.2Hz vertical respiration and slight balance shift
      out.rootY = breathCycle * 0.003;
      out.rootX = weightShift * 0.003;

      // Torso counterbalance (very subtle, no trembling)
      out.spineRotZ = -weightShift * 0.004;
      out.spineRotX = breathCos * 0.003;

      // Subtle resting arm drape
      out.leftArmRotX = Math.sin(t * 0.6) * 0.015;
      out.rightArmRotX = Math.cos(t * 0.55) * 0.015;
      break;
    }
  }

  // Reach progression (offering pen, reaching hand toward each other)
  if (reach > 0) {
    const r = Math.min(1, Math.max(0, reach));
    out.rightArmRotX = THREE.MathUtils.lerp(out.rightArmRotX, 0.85, r);
    out.rightArmRotZ = THREE.MathUtils.lerp(out.rightArmRotZ, -0.18, r);
  }

  // Smooth Gaze / Look-At Tracking toward the other character
  if (options.lookAtTarget && options.characterPos) {
    CHAR_POS_SCRATCH.set(
      options.characterPos[0],
      options.characterPos[1],
      options.characterPos[2]
    );
    LOOK_DIR_SCRATCH.set(
      options.lookAtTarget[0],
      options.lookAtTarget[1],
      options.lookAtTarget[2]
    ).sub(CHAR_POS_SCRATCH);

    if (LOOK_DIR_SCRATCH.lengthSq() > 0.001) {
      // Calculate horizontal yaw angle
      const targetYaw = Math.atan2(LOOK_DIR_SCRATCH.x, LOOK_DIR_SCRATCH.z);
      // Clamp gaze to natural humanoid range (-45 to +45 deg)
      const clampedYaw = THREE.MathUtils.clamp(targetYaw, -0.70, 0.70);

      // Pitch (vertical angle)
      const dist = Math.sqrt(
        LOOK_DIR_SCRATCH.x * LOOK_DIR_SCRATCH.x + LOOK_DIR_SCRATCH.z * LOOK_DIR_SCRATCH.z
      );
      const targetPitch = -Math.atan2(LOOK_DIR_SCRATCH.y - 1.4, dist);
      const clampedPitch = THREE.MathUtils.clamp(targetPitch, -0.30, 0.30);

      // Head takes 65% of gaze angle, spine takes 35% follow-through
      out.headRotY += clampedYaw * 0.65;
      out.headRotX += clampedPitch * 0.65;
      out.spineRotY += clampedYaw * 0.35;
    }
  }
}
