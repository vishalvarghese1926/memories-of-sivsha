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

  // Varied organic frequencies so motions never appear mechanical or looping
  const breathFreq = isBoy ? 1.7 : 1.9;
  const breathCycle = Math.sin(t * breathFreq);
  const breathCos = Math.cos(t * breathFreq);

  // Slow weight shift cycle (shifts weight between left and right foot every ~7 seconds)
  const shiftFreq = isBoy ? 0.45 : 0.52;
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
      // Natural locomotion cycle with leg alternating stride and arm counter-swing
      const walkSpeed = 3.6;
      const stride = Math.sin(t * walkSpeed);
      const strideCos = Math.cos(t * walkSpeed);

      out.rootY = Math.abs(strideCos) * 0.024;
      out.rootX = stride * 0.008;

      out.leftLegRotX = stride * 0.42;
      out.rightLegRotX = -stride * 0.42;

      // Arms swing opposite to legs
      out.leftArmRotX = -stride * 0.35;
      out.rightArmRotX = stride * 0.35;

      // Slight torso counter-rotation
      out.spineRotY = -stride * 0.06;
      out.spineRotX = 0.04;
      break;
    }

    case "sitting": {
      // Calm, grounded posture with relaxed upper body and subtle breathing
      out.rootY = -0.38;
      out.spineRotX = -0.08 + breathCycle * 0.008;
      out.leftLegRotX = 1.45;
      out.rightLegRotX = 1.45;
      out.leftArmRotX = 0.55;
      out.rightArmRotX = 0.55;
      out.leftArmRotZ = -0.22;
      out.rightArmRotZ = 0.22;
      break;
    }

    case "biker": {
      // Riding motorcycle: hands forward on handlebars, body leaning into wind
      out.rootY = 0.04;
      out.spineRotX = 0.28 + Math.sin(t * 12) * 0.004; // subtle road vibration
      out.leftArmRotX = 0.95;
      out.rightArmRotX = 0.95;
      out.leftArmRotZ = -0.28;
      out.rightArmRotZ = 0.28;
      out.headRotX = -0.12; // Looking ahead at the horizon
      break;
    }

    case "bikerPillion": {
      // Riding pillion: leaning forward holding waist, gentle road vibration
      out.rootY = 0.06;
      out.spineRotX = 0.38 + Math.sin(t * 12 + 0.5) * 0.005;
      out.leftArmRotX = 0.85;
      out.rightArmRotX = 0.85;
      out.leftArmRotZ = -0.15;
      out.rightArmRotZ = 0.15;
      out.headRotX = -0.18;
      break;
    }

    case "emotional": {
      // Emotional moments: Stillness and slow, intimate micro-presence
      const slowBreath = Math.sin(t * 1.2);
      out.rootY = slowBreath * 0.004;
      out.spineRotX = slowBreath * 0.006;
      out.spineRotZ = weightShift * 0.008;
      break;
    }

    case "idle":
    case "breathing":
    case "talking":
    default: {
      // Gentle organic standing posture with contrapposto balance
      out.rootY = breathCycle * 0.006;
      out.rootX = weightShift * 0.01;

      // Spine contrapposto: pelvis tilts slightly with weight, torso compensates
      out.spineRotZ = -weightShift * 0.012;
      out.spineRotX = breathCos * 0.008;

      // Gentle arm micro-sway
      out.leftArmRotX = Math.sin(t * 0.8) * 0.03;
      out.rightArmRotX = Math.cos(t * 0.75) * 0.03;
      break;
    }
  }

  // Reach progression (offering pen, reaching hand toward each other)
  if (reach > 0) {
    const r = Math.min(1, Math.max(0, reach));
    out.rightArmRotX = THREE.MathUtils.lerp(out.rightArmRotX, 0.85, r);
    out.rightArmRotZ = THREE.MathUtils.lerp(out.rightArmRotZ, -0.18, r);
  }

  // Gaze / Look-At Tracking toward the other character
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
      const clampedYaw = THREE.MathUtils.clamp(targetYaw, -0.75, 0.75);

      // Pitch (vertical angle)
      const dist = Math.sqrt(
        LOOK_DIR_SCRATCH.x * LOOK_DIR_SCRATCH.x + LOOK_DIR_SCRATCH.z * LOOK_DIR_SCRATCH.z
      );
      const targetPitch = -Math.atan2(LOOK_DIR_SCRATCH.y - 1.4, dist);
      const clampedPitch = THREE.MathUtils.clamp(targetPitch, -0.35, 0.35);

      // Head takes 65% of gaze angle, spine takes 35% follow-through
      out.headRotY += clampedYaw * 0.65;
      out.headRotX += clampedPitch * 0.65;
      out.spineRotY += clampedYaw * 0.35;
    }
  }
}
