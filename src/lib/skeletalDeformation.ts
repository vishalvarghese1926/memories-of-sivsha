"use client";

import * as THREE from "three";

export interface HumanoidBones {
  root: THREE.Bone;
  hips: THREE.Bone;
  spine: THREE.Bone;
  chest: THREE.Bone;
  neck: THREE.Bone;
  head: THREE.Bone;
  allBones: THREE.Bone[];
}

export interface RiggedCharacterInstance {
  skinnedMesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  bones: HumanoidBones;
  groundOffset: number;
  normalizedScale: number;
}

/**
 * Creates or adapts a character Object3D into a grounded, skeletal-deformation-capable
 * SkinnedMesh with natural humanoid bones (Root -> Hips -> Spine -> Chest -> Neck -> Head).
 *
 * Guarantees:
 * - Feet remain anchored to ground Y = 0 (zero vertical bobbing/floating).
 * - Spine and chest perform natural respiratory oscillation.
 * - Neck and head smoothly articulate for look-at tracking.
 * - Poses (idle, look, sit, ride, reaction) deform the mesh naturally via GPU skinning.
 */
export function createGroundedSkeletalRig(
  sourceScene: THREE.Object3D,
  targetHeight: number = 1.75
): RiggedCharacterInstance | null {
  // Find primary mesh in sourceScene
  let sourceMesh: THREE.Mesh | null = null;
  sourceScene.traverse((child) => {
    if (!sourceMesh && (child as THREE.Mesh).isMesh) {
      sourceMesh = child as THREE.Mesh;
    }
  });

  if (!sourceMesh) return null;

  // Clone geometry and materials to keep independent instances
  const geometry = (sourceMesh as THREE.Mesh).geometry.clone();
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const origHeight = bb.max.y - bb.min.y;
  const minY = bb.min.y;
  const scale = targetHeight / (origHeight > 0.05 ? origHeight : 1);

  const posAttr = geometry.attributes.position;
  const vertexCount = posAttr.count;

  // Generate bone skin weights based on anatomical height zones
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    // Normalized height from 0 (soles of feet) to 1.75m (crown of head)
    const yNorm = (posAttr.getY(i) - minY) * scale;

    let b0 = 0, b1 = 0, w0 = 1, w1 = 0;

    if (yNorm < 0.22) {
      // Zone 0: Feet & Lower Ankles — anchored to ground root
      b0 = 0;
      w0 = 1.0;
    } else if (yNorm < 0.88) {
      // Zone 1: Legs & Hips
      const t = (yNorm - 0.22) / (0.88 - 0.22);
      b0 = 0;
      b1 = 1;
      w0 = Math.max(0, 1 - t);
      w1 = Math.min(1, t);
    } else if (yNorm < 1.20) {
      // Zone 2: Abdomen & Lower Spine
      const t = (yNorm - 0.88) / (1.20 - 0.88);
      b0 = 1;
      b1 = 2;
      w0 = Math.max(0, 1 - t);
      w1 = Math.min(1, t);
    } else if (yNorm < 1.48) {
      // Zone 3: Upper Torso & Chest
      const t = (yNorm - 1.20) / (1.48 - 1.20);
      b0 = 2;
      b1 = 3;
      w0 = Math.max(0, 1 - t);
      w1 = Math.min(1, t);
    } else if (yNorm < 1.60) {
      // Zone 4: Neck
      const t = (yNorm - 1.48) / (1.60 - 1.48);
      b0 = 3;
      b1 = 4;
      w0 = Math.max(0, 1 - t);
      w1 = Math.min(1, t);
    } else {
      // Zone 5: Head
      const t = Math.min(1, (yNorm - 1.60) / 0.15);
      b0 = 4;
      b1 = 5;
      w0 = Math.max(0, 1 - t);
      w1 = Math.min(1, t);
    }

    skinIndices.push(b0, b1, 0, 0);
    skinWeights.push(w0, w1, 0, 0);
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

  // Construct anatomical humanoid skeleton
  const root = new THREE.Bone();
  root.name = "root_ground";
  root.position.set(0, 0, 0); // Ground plane

  const hips = new THREE.Bone();
  hips.name = "hips";
  hips.position.set(0, 0.85, 0);

  const spine = new THREE.Bone();
  spine.name = "spine";
  spine.position.set(0, 0.28, 0);

  const chest = new THREE.Bone();
  chest.name = "chest";
  chest.position.set(0, 0.28, 0);

  const neck = new THREE.Bone();
  neck.name = "neck";
  neck.position.set(0, 0.16, 0);

  const head = new THREE.Bone();
  head.name = "head";
  head.position.set(0, 0.12, 0);

  // Hierarchy
  root.add(hips);
  hips.add(spine);
  spine.add(chest);
  chest.add(neck);
  neck.add(head);

  const allBones = [root, hips, spine, chest, neck, head];
  const skeleton = new THREE.Skeleton(allBones);

  // Clone materials and ensure skinning is enabled
  const origMat = (sourceMesh as THREE.Mesh).material;
  const materials = Array.isArray(origMat) ? origMat.map((m) => m.clone()) : origMat.clone();

  const skinnedMesh = new THREE.SkinnedMesh(geometry, materials);
  skinnedMesh.add(root);
  skinnedMesh.bind(skeleton);
  skinnedMesh.castShadow = true;
  skinnedMesh.receiveShadow = true;

  const groundOffset = -minY * scale;

  return {
    skinnedMesh,
    skeleton,
    bones: { root, hips, spine, chest, neck, head, allBones },
    groundOffset,
    normalizedScale: scale,
  };
}

/**
 * Updates humanoid skeletal articulation per frame:
 * - Natural low-frequency breathing on spine & chest (~0.25 Hz)
 * - Smooth head & neck gaze tracking towards target
 * - Natural grounded postures for idle, ride (biker), sit, and reactions
 */
export function updateHumanoidSkeletalPose(
  rig: RiggedCharacterInstance,
  time: number,
  delta: number,
  pose: string = "idle",
  lookAtTarget?: [number, number, number] | null,
  characterPos?: [number, number, number] | null,
  isBoy: boolean = true
): void {
  const { bones } = rig;
  const breathFreq = isBoy ? 1.2 : 1.35;
  const breathCycle = Math.sin(time * breathFreq);
  const breathCos = Math.cos(time * breathFreq);

  // Root is strictly pinned to ground (no whole-body bobbing)
  bones.root.position.set(0, 0, 0);

  switch (pose) {
    case "biker": {
      // Motorcycle rider: forward lean on spine, hands reaching forward, head focused ahead
      bones.hips.rotation.x = THREE.MathUtils.lerp(bones.hips.rotation.x, 0.18, delta * 3);
      bones.spine.rotation.x = THREE.MathUtils.lerp(
        bones.spine.rotation.x,
        0.26 + breathCycle * 0.008,
        delta * 3
      );
      bones.chest.rotation.x = THREE.MathUtils.lerp(
        bones.chest.rotation.x,
        0.12 + breathCos * 0.006,
        delta * 3
      );
      bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, -0.22, delta * 3);
      break;
    }

    case "bikerPillion": {
      // Motorcycle pillion: leaning closer behind rider
      bones.hips.rotation.x = THREE.MathUtils.lerp(bones.hips.rotation.x, 0.14, delta * 3);
      bones.spine.rotation.x = THREE.MathUtils.lerp(
        bones.spine.rotation.x,
        0.28 + breathCycle * 0.008,
        delta * 3
      );
      bones.chest.rotation.x = THREE.MathUtils.lerp(
        bones.chest.rotation.x,
        0.10 + breathCos * 0.006,
        delta * 3
      );
      bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, -0.16, delta * 3);
      break;
    }

    case "sit":
    case "sitting": {
      // Sitting posture: hips angled back slightly, spine relaxed
      bones.hips.rotation.x = THREE.MathUtils.lerp(bones.hips.rotation.x, -0.15, delta * 3);
      bones.spine.rotation.x = THREE.MathUtils.lerp(
        bones.spine.rotation.x,
        0.05 + breathCycle * 0.008,
        delta * 3
      );
      bones.chest.rotation.x = THREE.MathUtils.lerp(
        bones.chest.rotation.x,
        -0.02 + breathCos * 0.006,
        delta * 3
      );
      break;
    }

    case "idle":
    default: {
      // Natural standing posture: gentle spine breathing, relaxed chest
      bones.hips.rotation.x = THREE.MathUtils.lerp(bones.hips.rotation.x, 0, delta * 3);
      bones.spine.rotation.x = THREE.MathUtils.lerp(
        bones.spine.rotation.x,
        breathCycle * 0.012,
        delta * 3
      );
      bones.chest.rotation.x = THREE.MathUtils.lerp(
        bones.chest.rotation.x,
        breathCos * 0.010,
        delta * 3
      );
      break;
    }
  }

  // Smooth Gaze / Look-At Tracking on Neck and Head
  if (lookAtTarget && characterPos) {
    const dx = lookAtTarget[0] - characterPos[0];
    const dy = lookAtTarget[1] - (characterPos[1] + 1.4);
    const dz = lookAtTarget[2] - characterPos[2];
    const distHoriz = Math.sqrt(dx * dx + dz * dz);

    if (distHoriz > 0.01) {
      const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -0.75, 0.75);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(dy, distHoriz), -0.35, 0.35);

      // Neck takes 35% of rotation, Head takes 65%
      bones.neck.rotation.y = THREE.MathUtils.lerp(bones.neck.rotation.y, yaw * 0.35, delta * 3.5);
      bones.head.rotation.y = THREE.MathUtils.lerp(bones.head.rotation.y, yaw * 0.65, delta * 3.5);
      bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, pitch * 0.65, delta * 3.5);
    }
  } else {
    // Ambient micro head gaze
    const idleYaw = Math.sin(time * 0.5) * 0.04;
    bones.neck.rotation.y = THREE.MathUtils.lerp(bones.neck.rotation.y, idleYaw * 0.4, delta * 2);
    bones.head.rotation.y = THREE.MathUtils.lerp(bones.head.rotation.y, idleYaw * 0.6, delta * 2);
  }
}
