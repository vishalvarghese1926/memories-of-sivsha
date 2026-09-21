"use client";

import * as THREE from "three";
import { CharacterReachConfig } from "@/types/character";

const tempEffectorPos = new THREE.Vector3();
const tempTargetPos = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();

/**
 * Reusable two-bone kinematic reach solver for arms and hands:
 * Supports smooth reaching from shoulder/elbow toward a target object (e.g. Pen exchange).
 */
export function applyHandReach({
  upperArmBone,
  forearmBone,
  handBone,
  reachProgress = 0,
  config,
  delta,
}: {
  upperArmBone?: THREE.Bone | THREE.Object3D | null;
  forearmBone?: THREE.Bone | THREE.Object3D | null;
  handBone?: THREE.Bone | THREE.Object3D | null;
  reachProgress?: number;
  config?: CharacterReachConfig;
  delta: number;
}) {
  if (!upperArmBone) return;

  const progress = THREE.MathUtils.clamp(config?.progress ?? reachProgress, 0, 1);
  if (progress <= 0.001) return;

  // If explicit world target vector supplied:
  if (config?.target) {
    if (Array.isArray(config.target)) {
      tempTargetPos.set(config.target[0], config.target[1], config.target[2]);
    } else {
      tempTargetPos.copy(config.target);
    }

    upperArmBone.getWorldPosition(tempEffectorPos);
    const dir = tempTargetPos.clone().sub(tempEffectorPos).normalize();

    // Orient upper arm forward-pitch toward target
    const targetPitch = Math.asin(-dir.y) * progress;
    const targetYaw = Math.atan2(dir.x, dir.z) * progress;

    tempQuat.setFromEuler(new THREE.Euler(targetPitch, targetYaw, 0, "YXZ"));
    upperArmBone.quaternion.slerp(tempQuat, Math.min(1, delta * 5.0));

    if (forearmBone) {
      forearmBone.rotation.x = THREE.MathUtils.lerp(
        forearmBone.rotation.x,
        0.35 * progress,
        Math.min(1, delta * 5.0)
      );
    }
  } else {
    // Default forward anatomical reach arc
    const targetRotX = THREE.MathUtils.lerp(0.1, -1.35, progress);
    const targetRotY = THREE.MathUtils.lerp(0, -0.22, progress);
    const targetRotZ = THREE.MathUtils.lerp(0.1, 0.05, progress);

    upperArmBone.rotation.x = THREE.MathUtils.lerp(upperArmBone.rotation.x, targetRotX, Math.min(1, delta * 6.0));
    upperArmBone.rotation.y = THREE.MathUtils.lerp(upperArmBone.rotation.y, targetRotY, Math.min(1, delta * 6.0));
    upperArmBone.rotation.z = THREE.MathUtils.lerp(upperArmBone.rotation.z, targetRotZ, Math.min(1, delta * 6.0));

    if (forearmBone) {
      forearmBone.rotation.x = THREE.MathUtils.lerp(
        forearmBone.rotation.x,
        0.4 * progress,
        Math.min(1, delta * 6.0)
      );
    }
  }
}
