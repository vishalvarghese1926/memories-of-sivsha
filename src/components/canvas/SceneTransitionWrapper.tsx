"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneTransitionWrapperProps {
  children: React.ReactNode;
  positionZ: number;
  visibilityRange?: number;
  isActive?: boolean;
}

/**
 * =========================================================================
 * SCENE TRANSITION WRAPPER — CONTINUOUS WORLD LIFECYCLE
 * =========================================================================
 *
 * Keeps all milestone chapters permanently mounted in the scene graph to
 * eliminate React unmount/mount hitches, texture thrashing, and shader compilation.
 *
 * Performs zero-allocation distance-based visibility culling in Three.js:
 * - Hidden scenes (visible = false) cost 0 draw calls and 0 GPU overhead.
 * - Nearby scenes seamlessly activate inside the atmospheric depth fog.
 */
export default function SceneTransitionWrapper({
  children,
  positionZ,
  visibilityRange = 95,
  isActive = false,
}: SceneTransitionWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return;

    // Check distance between camera and scene anchor along the travel axis
    const distZ = Math.abs(camera.position.z - positionZ);
    const shouldBeVisible = distZ <= visibilityRange;

    if (groupRef.current.visible !== shouldBeVisible) {
      groupRef.current.visible = shouldBeVisible;
    }

    if (shouldBeVisible) {
      // Subtle scale settling when in focus
      const targetScale = isActive ? 1.0 : 0.995;
      const currentScale = groupRef.current.scale.x;
      if (Math.abs(currentScale - targetScale) > 0.0005) {
        const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, Math.min(1, delta * 5));
        groupRef.current.scale.setScalar(nextScale);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}
