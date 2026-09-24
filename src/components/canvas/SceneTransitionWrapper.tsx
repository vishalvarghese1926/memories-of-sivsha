"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneTransitionWrapperProps {
  children: React.ReactNode;
  positionZ: number;
  visibilityRange?: number;
  warmLookahead?: number;
  isActive?: boolean;
}

/**
 * =========================================================================
 * SCENE TRANSITION WRAPPER — 3-STAGE CONTINUOUS LIFECYCLE
 * =========================================================================
 *
 * Implements a 3-Stage GPU Preparation & Rendering Lifecycle:
 *
 * STAGE 1: DORMANT (distZ > warmDistance)
 * - `visible = false` -> 0 draw calls, 0 vertex processing, 0 GPU load.
 *
 * STAGE 2: WARMED / IN-FOG PREPARATION (visibilityRange < distZ <= warmDistance)
 * - `visible = true` while deeply occluded in the atmospheric background fog.
 * - GPU binds geometry buffers and textures 50-80 meters BEFORE arrival.
 * - Eliminates transition-time compilation hitches and texture upload stutter.
 *
 * STAGE 3: ACTIVE / FOREGROUND FOCUS (distZ <= visibilityRange)
 * - Chapter is ALREADY 100% warm in GPU VRAM.
 * - Smoothly emerges out of the fog with ZERO frame time spikes.
 */
export default function SceneTransitionWrapper({
  children,
  positionZ,
  visibilityRange = 90,
  warmLookahead = 65,
  isActive = false,
}: SceneTransitionWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const warmDistance = visibilityRange + warmLookahead;

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return;

    // Measure travel distance from camera to chapter anchor along the Z-axis
    const distZ = Math.abs(camera.position.z - positionZ);

    // Stage 2 & 3: Visible if inside the warm distance buffer
    const shouldBeMountedInPipeline = distZ <= warmDistance;

    if (groupRef.current.visible !== shouldBeMountedInPipeline) {
      groupRef.current.visible = shouldBeMountedInPipeline;
    }

    if (shouldBeMountedInPipeline) {
      // Subtle scale settling when active in foreground
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

