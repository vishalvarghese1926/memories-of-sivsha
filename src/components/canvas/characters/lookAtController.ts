"use client";

import * as THREE from "three";
import { CharacterLookAtConfig } from "@/types/character";

const tempMatrix = new THREE.Matrix4();
const tempTargetPos = new THREE.Vector3();
const tempBoneWorldPos = new THREE.Vector3();
const targetQuat = new THREE.Quaternion();

/**
 * Applies smooth bone-level look-at tracking to a humanoid skeleton (Head, Neck, Eyes).
 * Preserves natural anatomical constraints (clamping pitch and yaw) so characters don't
 * turn their heads unnaturally like an owl.
 */
export function applySkeletalLookAt({
  headBone,
  neckBone,
  eyeBones,
  target,
  config = {},
  delta,
}: {
  headBone?: THREE.Bone | THREE.Object3D | null;
  neckBone?: THREE.Bone | THREE.Object3D | null;
  eyeBones?: (THREE.Bone | THREE.Object3D | null)[];
  target?: [number, number, number] | THREE.Vector3;
  config?: CharacterLookAtConfig;
  delta: number;
}) {
  if (!headBone || !target) return;

  if (Array.isArray(target)) {
    tempTargetPos.set(target[0], target[1], target[2]);
  } else {
    tempTargetPos.copy(target);
  }

  const slerpSpeed = config.slerpSpeed ?? 4.5;
  const weight = config.weight ?? 0.85;

  headBone.getWorldPosition(tempBoneWorldPos);

  // Direction vector from bone to target
  const dir = tempTargetPos.clone().sub(tempBoneWorldPos);
  if (dir.lengthSq() < 0.0001) return;
  dir.normalize();

  // Create lookAt matrix in world space
  tempMatrix.lookAt(tempBoneWorldPos, tempTargetPos, new THREE.Vector3(0, 1, 0));
  targetQuat.setFromRotationMatrix(tempMatrix);

  // Smoothly blend rotation on head
  const step = Math.min(1, delta * slerpSpeed * weight);
  headBone.quaternion.slerp(targetQuat, step);

  // If neck bone is available, share 30% of rotation with neck for fluid human curvature
  if (neckBone) {
    neckBone.quaternion.slerp(targetQuat, step * 0.35);
  }

  // If micro-eye bones exist, align them directly towards the target
  if (eyeBones && eyeBones.length > 0) {
    eyeBones.forEach((eye) => {
      if (eye) {
        eye.quaternion.slerp(targetQuat, Math.min(1, delta * (slerpSpeed * 1.5)));
      }
    });
  }
}
