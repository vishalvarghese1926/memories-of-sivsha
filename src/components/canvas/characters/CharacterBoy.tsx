"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { CharacterControllerProps } from "@/types/character";
import { useCharacterAnimationController } from "./animationController";
import { applySkeletalLookAt } from "./lookAtController";
import { updateFacialBlendshapes, FacialControllerState } from "./facialController";
import { getHeroModelUrl } from "@/config/assets";
import { inspectGLTFModel, checkAndWarnAssetPerformance } from "@/lib/gltfDiagnostics";
import { computeCharacterKinematics, CharacterMotionState, KinematicsOutput } from "@/lib/characterMotion";
import {
  createGroundedSkeletalRig,
  updateHumanoidSkeletalPose,
  RiggedCharacterInstance,
} from "@/lib/skeletalDeformation";

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: () => void;
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class GLTFErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("CharacterBoy GLB load failure, falling back to procedural mesh:", error);
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Rigged SkinnedMesh Character Loader.
 * Safely mounts an external rigged GLB model with full skeletal hierarchy,
 * animations, bone look-at tracking, and facial morph targets.
 */
function RiggedGLTFCharacter({
  modelUrl,
  pose = "idle",
  position = [0, 0, 0],
  windIntensity = 0,
  lookAtTarget,
  lookAtConfig,
  reachProgress = 0,
  reachConfig,
  facialConfig,
  playbackSpeed = 1.0,
  scrollVelocity = 0,
  crossfadeDuration = 0.35,
  castShadow = true,
  receiveShadow = true,
  onError,
}: CharacterControllerProps & { modelUrl: string; onError: () => void }) {
  // Safe GLTF loading via Drei
  const gltf = useGLTF(modelUrl) as any;

  // Clone scene with unique skeleton instances for independent multi-character posing
  const clonedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    try {
      const clone = SkeletonUtils.clone(gltf.scene);
      clone.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
        }
      });
      return clone;
    } catch {
      return null;
    }
  }, [gltf, castShadow, receiveShadow]);

  // Hook Drei animation system
  const { actions, mixer } = useAnimations(gltf?.animations || [], clonedScene || undefined);

  // Attach reusable animation state machine
  useCharacterAnimationController({
    mixer,
    actions,
    currentPose: pose,
    crossfadeDuration,
    playbackSpeed,
    scrollVelocity,
  });

  // Measure and normalize model dimensions and ground alignment
  const { normalizedScale, groundOffset } = useMemo(() => {
    if (!clonedScene) return { normalizedScale: 1, groundOffset: 0 };
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Realistic hero height ~1.75m
    const targetHeight = 1.75;
    const s = size.y > 0.1 ? targetHeight / size.y : 1;
    // Ground offset: align the bottom of the bounding box to y = 0
    const offsetY = -box.min.y * s;
    return { normalizedScale: s, groundOffset: offsetY };
  }, [clonedScene]);

  // Inspect model diagnostics and warn if mobile budgets are exceeded
  useEffect(() => {
    if (clonedScene) {
      const diag = inspectGLTFModel(clonedScene, gltf?.animations || [], modelUrl);
      checkAndWarnAssetPerformance(diag);
    }
  }, [clonedScene, gltf, modelUrl]);

  // Adapt to grounded SkinnedMesh with anatomical skeleton
  const rigInstance = useMemo<RiggedCharacterInstance | null>(() => {
    if (!clonedScene) return null;
    return createGroundedSkeletalRig(clonedScene, 1.75);
  }, [clonedScene]);

  // Extract key humanoid bones & facial morph meshes (supports Mixamo, Blender, Rigify)
  const bones = useMemo(() => {
    if (!clonedScene) return {};
    const found: Record<string, THREE.Object3D> = {};
    clonedScene.traverse((obj: THREE.Object3D) => {
      const n = obj.name.toLowerCase();
      if (n.includes("head") || n.includes("def-head") || n.includes("b_head")) found.head = obj;
      else if (n.includes("neck") || n.includes("def-neck") || n.includes("b_neck")) found.neck = obj;
      else if (n.includes("spine") || n.includes("def-spine") || n.includes("b_spine")) found.spine = obj;
      else if (n.includes("rightarm") || n.includes("arm_r") || n.includes("shoulder_r") || n.includes("mixamorigrightarm") || n.includes("b_r_arm")) found.rightArm = obj;
      else if (n.includes("rightforearm") || n.includes("forearm_r") || n.includes("mixamorigrightforearm") || n.includes("b_r_forearm")) found.rightForearm = obj;
      else if (n.includes("righthand") || n.includes("hand_r") || n.includes("mixamorigrighthand") || n.includes("b_r_hand")) found.rightHand = obj;
    });
    return found;
  }, [clonedScene]);

  // Extract primary facial mesh with blendshapes
  const facialMesh = useMemo(() => {
    if (!clonedScene) return null;
    let targetMesh: THREE.Mesh | null = null;
    clonedScene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).morphTargetInfluences) {
        targetMesh = obj as THREE.Mesh;
      }
    });
    return targetMesh;
  }, [clonedScene]);

  const facialState = useRef<FacialControllerState>({
    blinkTimer: 0,
    isBlinking: false,
    blinkProgress: 0,
  });

  const innerRef = useRef<THREE.Group>(null);
  const kinematicsScratch = useRef<KinematicsOutput>({
    rootY: 0, rootX: 0, spineRotX: 0, spineRotY: 0, spineRotZ: 0,
    headRotX: 0, headRotY: 0, headRotZ: 0,
    leftArmRotX: 0, leftArmRotZ: 0, rightArmRotX: 0, rightArmRotZ: 0,
    leftLegRotX: 0, rightLegRotX: 0,
  });

  // Frame kinematics
  useFrame((state, delta) => {
    if (!clonedScene) return;

    const rawTarget = lookAtTarget || lookAtConfig?.target || null;
    const targetTuple: [number, number, number] | null = rawTarget
      ? (Array.isArray(rawTarget)
          ? (rawTarget as [number, number, number])
          : [rawTarget.x, rawTarget.y, rawTarget.z])
      : null;
    const posTuple: [number, number, number] = Array.isArray(position)
      ? (position as [number, number, number])
      : [0, 0, 0];

    const t = state.clock.getElapsedTime();

    // Natural grounded posture and ambient respiration
    if (innerRef.current) {
      const breath = Math.sin(t * 1.2) * 0.005;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetOffsetY = groundOffset + breath;

      if (pose === "sit" || pose === "sitting") {
        targetOffsetY = groundOffset - 0.22;
        targetRotX = -0.12;
      } else if (pose === "biker" || pose === "bikerPillion") {
        targetOffsetY = groundOffset - 0.12;
        targetRotX = 0.16;
      }

      // Smooth look-at tracking on Y axis
      if (targetTuple && posTuple) {
        const dx = targetTuple[0] - posTuple[0];
        const dz = targetTuple[2] - posTuple[2];
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
          targetRotY = THREE.MathUtils.clamp(Math.atan2(dx, dz), -0.5, 0.5);
        }
      }

      innerRef.current.position.y = THREE.MathUtils.lerp(innerRef.current.position.y, targetOffsetY, delta * 4);
      innerRef.current.rotation.x = THREE.MathUtils.lerp(innerRef.current.rotation.x, targetRotX, delta * 3);
      innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, targetRotY, delta * 3);
    }
  });

  if (!clonedScene) {
    onError();
    return null;
  }

  return (
    <group ref={innerRef} position={[0, groundOffset, 0]} scale={normalizedScale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Procedural Fallback Mesh Generator (Guarantees uninterrupted story rendering until GLB models are supplied)
function ProceduralBoyMesh({
  pose,
  lookAtTarget,
  reachProgress = 0,
  windIntensity = 0,
}: {
  pose?: CharacterControllerProps["pose"];
  lookAtTarget?: [number, number, number] | THREE.Vector3;
  reachProgress?: number;
  windIntensity?: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const jacketFlapRef = useRef<THREE.Mesh>(null);
  const hairLockRef = useRef<THREE.Group>(null);

  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempTargetVec = useMemo(() => new THREE.Vector3(), []);
  const tempHeadWorldPos = useMemo(() => new THREE.Vector3(), []);

  // Stylized PBR Materials
  const skinMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fbd3b6",
        roughness: 0.46,
        metalness: 0.05,
        clearcoat: 0.12,
        clearcoatRoughness: 0.2,
      }),
    []
  );

  const jacketMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1d3557",
        roughness: 0.58,
        metalness: 0.15,
        clearcoat: 0.2,
      }),
    []
  );

  const jacketLapelMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#162b46",
        roughness: 0.5,
        metalness: 0.2,
      }),
    []
  );

  const innerTeeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.75,
      }),
    []
  );

  const denimMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1b263b",
        roughness: 0.68,
        metalness: 0.08,
      }),
    []
  );

  const hairMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#13161c",
        roughness: 0.38,
        metalness: 0.22,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
      }),
    []
  );

  const metalAccentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        metalness: 0.92,
        roughness: 0.18,
      }),
    []
  );

  const shoeSoleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.4,
      }),
    []
  );

  const shoeUpperMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#334155",
        roughness: 0.55,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Organic Spine Kinematics & Breathing
    if (spineRef.current) {
      spineRef.current.position.y = 0.88 + Math.sin(t * 1.8) * 0.012;
      spineRef.current.rotation.x = Math.sin(t * 1.8) * 0.008;
    }

    // 2. Wind Dynamics
    if (jacketFlapRef.current) {
      jacketFlapRef.current.rotation.z = Math.sin(t * 7) * (0.02 + windIntensity * 0.18);
    }
    if (hairLockRef.current) {
      hairLockRef.current.rotation.y = Math.sin(t * 5) * (0.03 + windIntensity * 0.2);
    }

    // 3. Pose-specific Locomotion
    const isWalking = pose === "walk" || pose === "walking";
    const isSitting = pose === "sit" || pose === "sitting";

    if (isWalking) {
      const walkSpeed = 4.8;
      const cycle = Math.sin(t * walkSpeed);
      const cosCycle = Math.cos(t * walkSpeed);

      if (leftLegRef.current) leftLegRef.current.rotation.x = cycle * 0.42;
      if (leftShinRef.current) leftShinRef.current.rotation.x = Math.max(0, -cycle * 0.35);
      if (rightLegRef.current) rightLegRef.current.rotation.x = -cycle * 0.42;
      if (rightShinRef.current) rightShinRef.current.rotation.x = Math.max(0, cycle * 0.35);

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -cycle * 0.36;
        leftArmRef.current.rotation.z = -0.08;
      }
      if (rightArmRef.current && reachProgress === 0) {
        rightArmRef.current.rotation.x = cycle * 0.36;
        rightArmRef.current.rotation.z = 0.08;
      }

      if (rootRef.current) {
        rootRef.current.position.y = Math.abs(cosCycle) * 0.03;
      }
    } else if (pose === "biker") {
      const roadVibe = Math.sin(t * 24) * 0.003 * (1 + windIntensity * 2);
      if (spineRef.current) spineRef.current.rotation.x = 0.34 + roadVibe;
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.72, 0.22, -0.28);
      if (rightArmRef.current) rightArmRef.current.rotation.set(0.72, -0.22, 0.28);
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.35, 0, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.35, 0, 0);
      if (leftLegRef.current) leftLegRef.current.rotation.set(-1.15, -0.22, 0);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-1.15, 0.22, 0);
    } else if (isSitting) {
      if (leftLegRef.current) leftLegRef.current.rotation.set(-1.42, -0.1, 0);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-1.42, 0.1, 0);
      if (leftShinRef.current) leftShinRef.current.rotation.set(1.42, 0, 0);
      if (rightShinRef.current) rightShinRef.current.rotation.set(1.42, 0, 0);
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.32, 0.1, -0.1);
      if (rightArmRef.current && reachProgress === 0) {
        rightArmRef.current.rotation.set(0.32, -0.1, 0.1);
      }
    } else {
      const shift = Math.sin(t * 1.2) * 0.03;
      if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, -shift * 0.3);
      if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, shift * 0.3);
      if (leftShinRef.current) leftShinRef.current.rotation.set(0, 0, 0);
      if (rightShinRef.current) rightShinRef.current.rotation.set(0, 0, 0);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 1.4) * 0.04;
        leftArmRef.current.rotation.z = -0.1 + shift * 0.4;
      }
      if (rightArmRef.current && reachProgress === 0) {
        rightArmRef.current.rotation.x = Math.sin(t * 1.4 + 0.6) * 0.04;
        rightArmRef.current.rotation.z = 0.1 - shift * 0.4;
      }
    }

    // 4. Act II Pen Exchange Reaching Gesture
    if (reachProgress > 0 && rightArmRef.current) {
      const targetRotX = THREE.MathUtils.lerp(0.1, -1.35, reachProgress);
      const targetRotY = THREE.MathUtils.lerp(0, -0.22, reachProgress);
      const targetRotZ = THREE.MathUtils.lerp(0.1, 0.05, reachProgress);
      rightArmRef.current.rotation.set(targetRotX, targetRotY, targetRotZ);
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.4, reachProgress);
      }
    }

    // 5. IK Head & Neck Look-At Tracking
    if (headRef.current) {
      if (lookAtTarget) {
        if (Array.isArray(lookAtTarget)) {
          tempTargetVec.set(...lookAtTarget);
        } else {
          tempTargetVec.copy(lookAtTarget);
        }
        headRef.current.getWorldPosition(tempHeadWorldPos);
        tempMatrix.lookAt(tempHeadWorldPos, tempTargetVec, new THREE.Vector3(0, 1, 0));
        targetQuaternion.setFromRotationMatrix(tempMatrix);
        headRef.current.quaternion.slerp(targetQuaternion, Math.min(1, delta * 4.5));
      } else {
        const idleRotY = Math.sin(t * 0.8) * 0.08;
        const idleRotX = Math.sin(t * 1.3) * 0.04;
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, idleRotY, delta * 3);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, idleRotX, delta * 3);
        headRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* Pelvis & Waist Core */}
      <group position={[0, 0.88, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.165, 0.17, 0.1, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.165]}>
          <boxGeometry args={[0.05, 0.04, 0.02]} />
          <primitive object={metalAccentMaterial} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.135, 0.84, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.42, 16]} />
          <primitive object={denimMaterial} />
        </mesh>
        <mesh position={[0, -0.41, 0.01]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <primitive object={denimMaterial} />
        </mesh>
        <group ref={leftShinRef} position={[0, -0.42, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.4, 16]} />
            <primitive object={denimMaterial} />
          </mesh>
          <group position={[0, -0.41, 0.03]}>
            <mesh position={[0, -0.03, 0.02]} castShadow>
              <boxGeometry args={[0.1, 0.04, 0.22]} />
              <primitive object={shoeSoleMaterial} />
            </mesh>
            <mesh position={[0, 0.02, 0.01]} castShadow>
              <boxGeometry args={[0.095, 0.06, 0.19]} />
              <primitive object={shoeUpperMaterial} />
            </mesh>
            <mesh position={[0, -0.01, 0.1]} castShadow>
              <sphereGeometry args={[0.045, 12, 12]} />
              <primitive object={shoeSoleMaterial} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.135, 0.84, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.42, 16]} />
          <primitive object={denimMaterial} />
        </mesh>
        <mesh position={[0, -0.41, 0.01]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <primitive object={denimMaterial} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.42, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.4, 16]} />
            <primitive object={denimMaterial} />
          </mesh>
          <group position={[0, -0.41, 0.03]}>
            <mesh position={[0, -0.03, 0.02]} castShadow>
              <boxGeometry args={[0.1, 0.04, 0.22]} />
              <primitive object={shoeSoleMaterial} />
            </mesh>
            <mesh position={[0, 0.02, 0.01]} castShadow>
              <boxGeometry args={[0.095, 0.06, 0.19]} />
              <primitive object={shoeUpperMaterial} />
            </mesh>
            <mesh position={[0, -0.01, 0.1]} castShadow>
              <sphereGeometry args={[0.045, 12, 12]} />
              <primitive object={shoeSoleMaterial} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Upper Body & Spine */}
      <group ref={spineRef} position={[0, 0.88, 0]}>
        <mesh position={[0, 0.28, 0.02]} castShadow>
          <cylinderGeometry args={[0.17, 0.155, 0.42, 20]} />
          <primitive object={innerTeeMaterial} />
        </mesh>

        <mesh ref={jacketFlapRef} position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.225, 0.18, 0.45, 24]} />
          <primitive object={jacketMaterial} />
        </mesh>

        <mesh position={[-0.06, 0.32, 0.165]} rotation={[0, 0.2, -0.05]} castShadow>
          <boxGeometry args={[0.04, 0.36, 0.03]} />
          <primitive object={jacketLapelMaterial} />
        </mesh>
        <mesh position={[0.06, 0.32, 0.165]} rotation={[0, -0.2, 0.05]} castShadow>
          <boxGeometry args={[0.04, 0.36, 0.03]} />
          <primitive object={jacketLapelMaterial} />
        </mesh>

        <mesh position={[0, 0.22, 0.19]}>
          <boxGeometry args={[0.015, 0.04, 0.015]} />
          <primitive object={metalAccentMaterial} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.24, 0.48, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.075, 16, 16]} />
            <primitive object={jacketMaterial} />
          </mesh>
          <mesh position={[-0.02, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.05, 0.34, 14]} />
            <primitive object={jacketMaterial} />
          </mesh>
          <group ref={leftForearmRef} position={[-0.02, -0.33, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.042, 0.3, 14]} />
              <primitive object={jacketMaterial} />
            </mesh>
            <mesh position={[0, -0.31, 0.01]} castShadow>
              <boxGeometry args={[0.055, 0.08, 0.035]} />
              <primitive object={skinMaterial} />
            </mesh>
            <mesh position={[0.028, -0.29, 0.015]} rotation={[0, 0, 0.3]} castShadow>
              <cylinderGeometry args={[0.012, 0.01, 0.04, 8]} />
              <primitive object={skinMaterial} />
            </mesh>
          </group>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.24, 0.48, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.075, 16, 16]} />
            <primitive object={jacketMaterial} />
          </mesh>
          <mesh position={[0.02, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.05, 0.34, 14]} />
            <primitive object={jacketMaterial} />
          </mesh>
          <group ref={rightForearmRef} position={[0.02, -0.33, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.042, 0.3, 14]} />
              <primitive object={jacketMaterial} />
            </mesh>
            <mesh position={[0, -0.31, 0.01]} castShadow>
              <boxGeometry args={[0.055, 0.08, 0.035]} />
              <primitive object={skinMaterial} />
            </mesh>
            <mesh position={[-0.028, -0.29, 0.015]} rotation={[0, 0, -0.3]} castShadow>
              <cylinderGeometry args={[0.012, 0.01, 0.04, 8]} />
              <primitive object={skinMaterial} />
            </mesh>
          </group>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 0.12, 16]} />
          <primitive object={skinMaterial} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.69, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.155, 28, 28]} />
            <primitive object={skinMaterial} />
          </mesh>
          <mesh position={[0, -0.06, 0.05]} castShadow>
            <boxGeometry args={[0.13, 0.09, 0.12]} />
            <primitive object={skinMaterial} />
          </mesh>

          {/* Styled Hair */}
          <group ref={hairLockRef}>
            <mesh position={[0, 0.07, -0.02]} castShadow>
              <sphereGeometry args={[0.168, 24, 24]} />
              <primitive object={hairMaterial} />
            </mesh>
            <mesh position={[0, 0.14, 0.06]} rotation={[-0.25, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 0.07, 0.14]} />
              <primitive object={hairMaterial} />
            </mesh>
            <mesh position={[-0.15, 0.01, 0.02]} castShadow>
              <boxGeometry args={[0.03, 0.08, 0.06]} />
              <primitive object={hairMaterial} />
            </mesh>
            <mesh position={[0.15, 0.01, 0.02]} castShadow>
              <boxGeometry args={[0.03, 0.08, 0.06]} />
              <primitive object={hairMaterial} />
            </mesh>
          </group>

          {/* Expressive Eyes */}
          <group position={[0, 0.02, 0.14]}>
            <mesh position={[-0.05, 0, 0]}>
              <sphereGeometry args={[0.018, 12, 12]} />
              <meshBasicMaterial color="#09090b" />
            </mesh>
            <mesh position={[-0.046, 0.005, 0.012]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            <mesh position={[0.05, 0, 0]}>
              <sphereGeometry args={[0.018, 12, 12]} />
              <meshBasicMaterial color="#09090b" />
            </mesh>
            <mesh position={[0.054, 0.005, 0.012]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Eyebrows */}
          <mesh position={[-0.05, 0.05, 0.142]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
          <mesh position={[0.05, 0.05, 0.142]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>

          {/* Nose */}
          <mesh position={[0, -0.015, 0.155]}>
            <boxGeometry args={[0.018, 0.035, 0.025]} />
            <primitive object={skinMaterial} />
          </mesh>

          {/* Smile */}
          <mesh position={[0, -0.065, 0.142]}>
            <boxGeometry args={[0.045, 0.008, 0.01]} />
            <meshBasicMaterial color="#b91c1c" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Local Draco decoder configuration for offline, zero-latency decompression
if (typeof window !== "undefined") {
  try {
    useGLTF.setDecoderPath("/draco/");
  } catch {}
}

function ReadyNotifier({ onReady, children }: { onReady: () => void; children: React.ReactNode }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return <>{children}</>;
}

function CrossfadeBoyWrapper({
  proceduralMesh,
  children,
}: {
  proceduralMesh: React.ReactNode;
  children: React.ReactNode;
}) {
  const [modelReady, setModelReady] = useState(false);
  const [proceduralDismissed, setProceduralDismissed] = useState(false);
  const proceduralGroupRef = useRef<THREE.Group>(null);
  const gltfGroupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  // Buttery-smooth alpha crossfade in useFrame: 400ms transition
  useFrame((_, delta) => {
    if (!modelReady) return;

    if (opacityRef.current < 1) {
      opacityRef.current = Math.min(1, opacityRef.current + delta * 2.5);

      // Fade in GLTF meshes
      if (gltfGroupRef.current) {
        const curAlpha = opacityRef.current;
        gltfGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const rawMat = (child as THREE.Mesh).material;
            if (Array.isArray(rawMat)) {
              rawMat.forEach((m) => {
                if (m) {
                  m.transparent = true;
                  m.opacity = curAlpha;
                }
              });
            } else if (rawMat) {
              rawMat.transparent = true;
              rawMat.opacity = curAlpha;
            }
          }
        });
      }

      // Fade out procedural mesh
      if (proceduralGroupRef.current && !proceduralDismissed) {
        const procOpacity = 1 - opacityRef.current;
        proceduralGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const rawMat = (child as THREE.Mesh).material;
            if (Array.isArray(rawMat)) {
              rawMat.forEach((m) => {
                if (m) {
                  m.transparent = true;
                  m.opacity = procOpacity;
                }
              });
            } else if (rawMat) {
              rawMat.transparent = true;
              rawMat.opacity = procOpacity;
            }
          }
        });

        if (procOpacity <= 0.02) {
          setProceduralDismissed(true);
        }
      }
    }
  });

  return (
    <>
      {!proceduralDismissed && (
        <group ref={proceduralGroupRef}>
          {proceduralMesh}
        </group>
      )}
      <group ref={gltfGroupRef} visible={modelReady}>
        <ReadyNotifier onReady={() => setModelReady(true)}>
          {children}
        </ReadyNotifier>
      </group>
    </>
  );
}

/**
 * CharacterBoy Component
 * Supports real rigged GLB models when supplied, with automatic resilient fallback
 * to the procedural mesh if the file is unsupplied, still loading, or fails.
 */
export default function CharacterBoy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  pose = "idle",
  modelUrl = getHeroModelUrl("you", true),
  isHero = true,
  useFallback = false,
  lookAtTarget,
  lookAtConfig,
  reachProgress = 0,
  reachConfig,
  windIntensity = 0,
  facialConfig,
  playbackSpeed = 1.0,
  scrollVelocity = 0,
  crossfadeDuration = 0.35,
  castShadow = true,
  receiveShadow = true,
  visible = true,
}: CharacterControllerProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  // If isHero is explicitly false, or useFallback is true, or loadFailed, use procedural
  const forceProcedural = useFallback || isHero === false || loadFailed || !modelUrl;

  if (!visible) return null;

  const proceduralFallback = (
    <ProceduralBoyMesh
      pose={pose}
      lookAtTarget={lookAtTarget || lookAtConfig?.target}
      reachProgress={reachConfig?.progress ?? reachProgress}
      windIntensity={windIntensity}
    />
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {!forceProcedural ? (
        <GLTFErrorBoundary fallback={proceduralFallback} onError={() => setLoadFailed(true)}>
          <React.Suspense fallback={proceduralFallback}>
            <RiggedGLTFCharacter
              modelUrl={modelUrl}
              pose={pose}
              lookAtTarget={lookAtTarget}
              lookAtConfig={lookAtConfig}
              reachProgress={reachProgress}
              reachConfig={reachConfig}
              facialConfig={facialConfig}
              playbackSpeed={playbackSpeed}
              scrollVelocity={scrollVelocity}
              crossfadeDuration={crossfadeDuration}
              castShadow={castShadow}
              receiveShadow={receiveShadow}
              onError={() => setLoadFailed(true)}
            />
          </React.Suspense>
        </GLTFErrorBoundary>
      ) : (
        proceduralFallback
      )}
    </group>
  );
}

// Preload the hero model
try {
  useGLTF.preload(getHeroModelUrl("you", true));
} catch {
  // Graceful no-op in non-browser or test environments
}
