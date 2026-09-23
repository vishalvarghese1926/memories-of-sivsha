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
    console.warn("CharacterGirl GLB load failure, falling back to procedural mesh:", error);
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Rigged SkinnedMesh Character Loader for Sivani.
 * Supports external GLB character models with skeletal animation,
 * bone look-at tracking, arm reaches, and facial morph targets.
 */
function RiggedGLTFGirlCharacter({
  modelUrl,
  pose = "idle",
  position = [0, 0, 0],
  windIntensity = 0,
  lookAtTarget,
  lookAtConfig,
  offerProgress = 0,
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
  const gltf = useGLTF(modelUrl) as any;

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

  const { actions, mixer } = useAnimations(gltf?.animations || [], clonedScene || undefined);

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

    // Sivani hero target height ~1.65m
    const targetHeight = 1.65;
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
    return createGroundedSkeletalRig(clonedScene, 1.65);
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

    // 1. Skeletal Bone Articulation (GPU skinning with grounded root)
    if (rigInstance) {
      updateHumanoidSkeletalPose(
        rigInstance,
        t,
        delta,
        pose || "idle",
        targetTuple,
        posTuple,
        false
      );
    } else {
      computeCharacterKinematics(
        t,
        delta,
        (pose as CharacterMotionState) || "idle",
        {
          lookAtTarget: targetTuple,
          characterPos: posTuple,
          windIntensity,
          isBoy: false,
          reachProgress: offerProgress || reachProgress || 0,
        },
        kinematicsScratch.current
      );

      // Keep root Y anchored to groundOffset without whole-body bobbing
      if (innerRef.current && (!actions || Object.keys(actions).length === 0)) {
        innerRef.current.position.y = groundOffset;
        innerRef.current.rotation.x = kinematicsScratch.current.spineRotX * 0.4;
        innerRef.current.rotation.y = kinematicsScratch.current.spineRotY * 0.4;
      }
    }

    // 2. Skeletal Head Tracking (if armature is present)
    const activeLookTarget = lookAtTarget || lookAtConfig?.target;
    if (activeLookTarget && bones.head) {
      applySkeletalLookAt({
        headBone: bones.head,
        neckBone: bones.neck,
        target: activeLookTarget,
        config: lookAtConfig,
        delta,
      });
    }

    // 3. Facial Blendshapes
    if (facialMesh) {
      updateFacialBlendshapes({
        mesh: facialMesh,
        config: facialConfig,
        state: facialState.current,
        delta,
      });
    }
  });

  if (!clonedScene) {
    onError();
    return null;
  }

  const activeScale = rigInstance?.normalizedScale ?? normalizedScale;
  const activeOffset = rigInstance?.groundOffset ?? groundOffset;

  return (
    <group ref={innerRef} position={[0, activeOffset, 0]} scale={activeScale}>
      <primitive object={rigInstance?.skinnedMesh ?? clonedScene} />
    </group>
  );
}

// Procedural Sivani Mesh Generator (Resilient Fallback)
function ProceduralGirlMesh({
  pose,
  lookAtTarget,
  offerProgress = 0,
  windIntensity = 0,
}: {
  pose?: CharacterControllerProps["pose"];
  lookAtTarget?: [number, number, number] | THREE.Vector3;
  offerProgress?: number;
  windIntensity?: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const hairGroupRef = useRef<THREE.Group>(null);
  const hairTressesRef = useRef<THREE.Group>(null);
  const dressRef = useRef<THREE.Group>(null);
  const dressHemRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);

  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempTargetVec = useMemo(() => new THREE.Vector3(), []);
  const tempHeadWorldPos = useMemo(() => new THREE.Vector3(), []);

  const skinMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fce0cc",
        roughness: 0.44,
        metalness: 0.04,
        clearcoat: 0.15,
        clearcoatRoughness: 0.18,
      }),
    []
  );

  const dressSilkMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f43f5e",
        roughness: 0.38,
        metalness: 0.12,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
      }),
    []
  );

  const dressBodiceMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fb7185",
        roughness: 0.42,
        metalness: 0.08,
      }),
    []
  );

  const hairMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1a1212",
        roughness: 0.35,
        metalness: 0.2,
        clearcoat: 0.65,
        clearcoatRoughness: 0.12,
      }),
    []
  );

  const goldAccentMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f59e0b",
        metalness: 0.95,
        roughness: 0.15,
        clearcoat: 0.4,
      }),
    []
  );

  const sandalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fb7185",
        roughness: 0.45,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Natural Breathing & Organic Spine Kinematics
    if (spineRef.current) {
      spineRef.current.position.y = 0.82 + Math.sin(t * 2.0) * 0.012;
      spineRef.current.rotation.x = Math.sin(t * 2.0) * 0.008;
    }

    // 2. Flowing Hair Dynamics & Wind Physics
    if (hairGroupRef.current) {
      const windAngleZ = Math.sin(t * 4) * (0.04 + windIntensity * 0.28);
      const windAngleX = -windIntensity * 0.4 + Math.sin(t * 6) * 0.04;
      hairGroupRef.current.rotation.z = THREE.MathUtils.lerp(hairGroupRef.current.rotation.z, windAngleZ, delta * 8);
      hairGroupRef.current.rotation.x = THREE.MathUtils.lerp(hairGroupRef.current.rotation.x, windAngleX, delta * 8);
    }
    if (hairTressesRef.current) {
      hairTressesRef.current.rotation.z = Math.sin(t * 5 + 1) * (0.06 + windIntensity * 0.3);
    }

    // 3. Flowing Dress & Hem Waves
    if (dressHemRef.current) {
      dressHemRef.current.rotation.z = Math.sin(t * 3.8) * (0.03 + windIntensity * 0.15);
      dressHemRef.current.rotation.x = -windIntensity * 0.2 + Math.sin(t * 4.2) * 0.02;
    }

    // 4. Pose-specific Kinematics
    const isWalking = pose === "walk" || pose === "walking";
    const isSitting = pose === "sit" || pose === "sitting";

    if (isWalking) {
      const walkSpeed = 4.8;
      const cycle = Math.sin(t * walkSpeed);
      const cosCycle = Math.cos(t * walkSpeed);

      if (leftLegRef.current) leftLegRef.current.rotation.x = cycle * 0.38;
      if (leftShinRef.current) leftShinRef.current.rotation.x = Math.max(0, -cycle * 0.32);
      if (rightLegRef.current) rightLegRef.current.rotation.x = -cycle * 0.38;
      if (rightShinRef.current) rightShinRef.current.rotation.x = Math.max(0, cycle * 0.32);

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -cycle * 0.32;
        leftArmRef.current.rotation.z = -0.06;
      }
      if (rightArmRef.current && offerProgress === 0) {
        rightArmRef.current.rotation.x = cycle * 0.32;
        rightArmRef.current.rotation.z = 0.06;
      }

      if (rootRef.current) {
        rootRef.current.position.y = Math.abs(cosCycle) * 0.025;
      }
    } else if (pose === "bikerPillion") {
      const roadVibe = Math.sin(t * 24 + 1.2) * 0.003 * (1 + windIntensity * 2);
      if (spineRef.current) spineRef.current.rotation.x = 0.24 + roadVibe;
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.78, 0.42, -0.22);
      if (rightArmRef.current) rightArmRef.current.rotation.set(0.78, -0.42, 0.22);
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.4, 0.2, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.4, -0.2, 0);
      if (leftLegRef.current) leftLegRef.current.rotation.set(-1.22, -0.26, 0);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-1.22, 0.26, 0);
    } else if (isSitting) {
      if (leftLegRef.current) leftLegRef.current.rotation.set(-1.42, -0.1, 0);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-1.42, 0.1, 0);
      if (leftShinRef.current) leftShinRef.current.rotation.set(1.42, 0, 0);
      if (rightShinRef.current) rightShinRef.current.rotation.set(1.42, 0, 0);
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.28, 0.1, -0.08);
      if (rightArmRef.current && offerProgress === 0) {
        rightArmRef.current.rotation.set(0.28, -0.1, 0.08);
      }
    } else {
      const shift = Math.sin(t * 1.3) * 0.025;
      if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, -shift * 0.25);
      if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, shift * 0.25);
      if (leftShinRef.current) leftShinRef.current.rotation.set(0, 0, 0);
      if (rightShinRef.current) rightShinRef.current.rotation.set(0, 0, 0);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.035;
        leftArmRef.current.rotation.z = -0.08 + shift * 0.3;
      }
      if (rightArmRef.current && offerProgress === 0) {
        rightArmRef.current.rotation.x = Math.sin(t * 1.5 + 0.5) * 0.035;
        rightArmRef.current.rotation.z = 0.08 - shift * 0.3;
      }
    }

    // 5. Act II Pen Exchange Gesture: Sivani smoothly offers the pen
    if (offerProgress > 0 && rightArmRef.current) {
      const targetRotX = THREE.MathUtils.lerp(0.08, -1.38, offerProgress);
      const targetRotY = THREE.MathUtils.lerp(0, 0.26, offerProgress);
      const targetRotZ = THREE.MathUtils.lerp(-0.08, -0.05, offerProgress);
      rightArmRef.current.rotation.set(targetRotX, targetRotY, targetRotZ);
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.38, offerProgress);
      }
    }

    // 6. IK Head & Neck Tracking
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
        const idleRotY = Math.sin(t * 0.75 + 1) * 0.09;
        const idleRotX = Math.sin(t * 1.2 + 0.5) * 0.035;
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, idleRotY, delta * 3);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, idleRotX, delta * 3);
        headRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* Pelvis & Waist Core */}
      <group position={[0, 0.82, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 0.08, 24]} />
          <primitive object={dressSilkMaterial} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.115, 0.8, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.052, 0.38, 16]} />
          <primitive object={skinMaterial} />
        </mesh>
        <mesh position={[0, -0.38, 0.01]} castShadow>
          <sphereGeometry args={[0.052, 14, 14]} />
          <primitive object={skinMaterial} />
        </mesh>
        <group ref={leftShinRef} position={[0, -0.38, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.042, 0.38, 16]} />
            <primitive object={skinMaterial} />
          </mesh>
          <group position={[0, -0.39, 0.02]}>
            <mesh position={[0, -0.02, 0.01]} castShadow>
              <boxGeometry args={[0.08, 0.025, 0.19]} />
              <primitive object={sandalMaterial} />
            </mesh>
            <mesh position={[0, 0.04, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.044, 0.008, 8, 16]} />
              <primitive object={goldAccentMaterial} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.115, 0.8, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.052, 0.38, 16]} />
          <primitive object={skinMaterial} />
        </mesh>
        <mesh position={[0, -0.38, 0.01]} castShadow>
          <sphereGeometry args={[0.052, 14, 14]} />
          <primitive object={skinMaterial} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.38, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.042, 0.38, 16]} />
            <primitive object={skinMaterial} />
          </mesh>
          <group position={[0, -0.39, 0.02]}>
            <mesh position={[0, -0.02, 0.01]} castShadow>
              <boxGeometry args={[0.08, 0.025, 0.19]} />
              <primitive object={sandalMaterial} />
            </mesh>
            <mesh position={[0, 0.04, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.044, 0.008, 8, 16]} />
              <primitive object={goldAccentMaterial} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Upper Body & Flowing Dress */}
      <group ref={spineRef} position={[0, 0.82, 0]}>
        <group ref={dressRef}>
          <mesh ref={dressHemRef} position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.32, 0.54, 28]} />
            <primitive object={dressSilkMaterial} />
          </mesh>
          <mesh position={[0, -0.41, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.315, 0.008, 8, 32]} />
            <primitive object={goldAccentMaterial} />
          </mesh>
        </group>

        <mesh position={[0, 0.26, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.14, 0.34, 24]} />
          <primitive object={dressBodiceMaterial} />
        </mesh>

        <mesh position={[0, 0.36, 0.06]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.07, 0.01, 8, 20]} />
          <primitive object={goldAccentMaterial} />
        </mesh>
        <mesh position={[0, 0.28, 0.12]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <primitive object={goldAccentMaterial} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.21, 0.44, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.062, 16, 16]} />
            <primitive object={dressBodiceMaterial} />
          </mesh>
          <mesh position={[-0.015, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.04, 0.32, 14]} />
            <primitive object={dressBodiceMaterial} />
          </mesh>
          <group ref={leftForearmRef} position={[-0.015, -0.31, 0]}>
            <mesh position={[0, -0.13, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.034, 0.28, 14]} />
              <primitive object={skinMaterial} />
            </mesh>
            <mesh position={[0, -0.28, 0.01]} castShadow>
              <boxGeometry args={[0.045, 0.068, 0.028]} />
              <primitive object={skinMaterial} />
            </mesh>
          </group>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.21, 0.44, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.062, 16, 16]} />
            <primitive object={dressBodiceMaterial} />
          </mesh>
          <mesh position={[0.015, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.04, 0.32, 14]} />
            <primitive object={dressBodiceMaterial} />
          </mesh>
          <group ref={rightForearmRef} position={[0.015, -0.31, 0]}>
            <mesh position={[0, -0.13, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.034, 0.28, 14]} />
              <primitive object={skinMaterial} />
            </mesh>
            <mesh position={[0, -0.28, 0.01]} castShadow>
              <boxGeometry args={[0.045, 0.068, 0.028]} />
              <primitive object={skinMaterial} />
            </mesh>
          </group>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.062, 0.12, 16]} />
          <primitive object={skinMaterial} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.66, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.145, 28, 28]} />
            <primitive object={skinMaterial} />
          </mesh>
          <mesh position={[0, -0.055, 0.04]} castShadow>
            <boxGeometry args={[0.11, 0.08, 0.1]} />
            <primitive object={skinMaterial} />
          </mesh>

          {/* Flowing Hair */}
          <group ref={hairGroupRef}>
            <mesh position={[0, 0.06, -0.03]} castShadow>
              <sphereGeometry args={[0.158, 24, 24]} />
              <primitive object={hairMaterial} />
            </mesh>
            <mesh position={[0, 0.12, 0.06]} rotation={[-0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.15, 0.06, 0.12]} />
              <primitive object={hairMaterial} />
            </mesh>
            <group ref={hairTressesRef} position={[0, -0.12, -0.09]}>
              <mesh position={[0, -0.12, 0]} rotation={[0.12, 0, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.18, 0.48, 16]} />
                <primitive object={hairMaterial} />
              </mesh>
              <mesh position={[0, -0.4, 0.04]} rotation={[0.15, 0, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.11, 0.36, 16]} />
                <primitive object={hairMaterial} />
              </mesh>
            </group>
            <mesh position={[-0.14, -0.06, 0.04]} rotation={[0.1, 0, -0.1]} castShadow>
              <cylinderGeometry args={[0.015, 0.01, 0.22, 8]} />
              <primitive object={hairMaterial} />
            </mesh>
            <mesh position={[0.14, -0.06, 0.04]} rotation={[0.1, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.015, 0.01, 0.22, 8]} />
              <primitive object={hairMaterial} />
            </mesh>
          </group>

          {/* Eyes */}
          <group position={[0, 0.018, 0.135]}>
            <mesh position={[-0.046, 0, 0]}>
              <sphereGeometry args={[0.016, 12, 12]} />
              <meshBasicMaterial color="#09090b" />
            </mesh>
            <mesh position={[-0.043, 0.004, 0.011]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            <mesh position={[0.046, 0, 0]}>
              <sphereGeometry args={[0.016, 12, 12]} />
              <meshBasicMaterial color="#09090b" />
            </mesh>
            <mesh position={[0.049, 0.004, 0.011]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Eyebrows */}
          <mesh position={[-0.046, 0.045, 0.136]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.036, 0.006, 0.008]} />
            <meshBasicMaterial color="#1a1212" />
          </mesh>
          <mesh position={[0.046, 0.045, 0.136]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.036, 0.006, 0.008]} />
            <meshBasicMaterial color="#1a1212" />
          </mesh>

          {/* Blush */}
          <mesh position={[-0.065, -0.018, 0.11]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.065, -0.018, 0.11]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.4} />
          </mesh>

          {/* Smile */}
          <mesh position={[0, -0.055, 0.132]}>
            <boxGeometry args={[0.038, 0.007, 0.008]} />
            <meshBasicMaterial color="#e11d48" />
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

function CrossfadeGirlWrapper({
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
 * CharacterGirl Component (Sivani)
 * Supports real rigged GLB models when supplied, with automatic resilient fallback
 * to the procedural mesh if the file is unsupplied, still loading, or fails.
 */
export default function CharacterGirl({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  pose = "idle",
  modelUrl = getHeroModelUrl("sivani", true),
  isHero = true,
  useFallback = false,
  lookAtTarget,
  lookAtConfig,
  offerProgress = 0,
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
    <ProceduralGirlMesh
      pose={pose}
      lookAtTarget={lookAtTarget || lookAtConfig?.target}
      offerProgress={reachConfig?.progress ?? (offerProgress || reachProgress)}
      windIntensity={windIntensity}
    />
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {!forceProcedural ? (
        <GLTFErrorBoundary fallback={proceduralFallback} onError={() => setLoadFailed(true)}>
          <React.Suspense fallback={proceduralFallback}>
            <CrossfadeGirlWrapper proceduralMesh={proceduralFallback}>
              <RiggedGLTFGirlCharacter
                modelUrl={modelUrl}
                pose={pose}
                lookAtTarget={lookAtTarget}
                lookAtConfig={lookAtConfig}
                offerProgress={offerProgress}
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
            </CrossfadeGirlWrapper>
          </React.Suspense>
        </GLTFErrorBoundary>
      ) : (
        proceduralFallback
      )}
    </group>
  );
}

// Preload the optimized hero model
try {
  useGLTF.preload(getHeroModelUrl("sivani", true));
} catch {
  // Graceful no-op in non-browser or test environments
}

