"use client";

import React, { createContext, useContext, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type SceneLifecycleState = "dormant" | "warm" | "active";

export interface SceneLifecycleRef {
  state: SceneLifecycleState;
  distZ: number;
}

const defaultLifecycle: React.MutableRefObject<SceneLifecycleRef> = {
  current: { state: "active", distZ: 0 },
};

const SceneLifecycleContext = createContext<React.MutableRefObject<SceneLifecycleRef>>(defaultLifecycle);

/**
 * Access the 3-stage continuous lifecycle of the parent chapter wrapper:
 * - "dormant": Scene is far away. Child useFrame callbacks MUST early-return. 0 CPU, 0 allocations.
 * - "warm": Scene is in the approaching fog buffer. Meshes/textures pre-bound in VRAM. Skip expensive secondary/decorative animations.
 * - "active": Scene is in foreground focus. Full animations run.
 */
export function useSceneLifecycle(): React.MutableRefObject<SceneLifecycleRef> {
  return useContext(SceneLifecycleContext);
}

interface SceneTransitionWrapperProps {
  children: React.ReactNode;
  positionZ: number;
  visibilityRange?: number;
  warmLookahead?: number;
}

/**
 * =========================================================================
 * SCENE TRANSITION WRAPPER — 3-STAGE CONTINUOUS LIFECYCLE (PHASE 7)
 * =========================================================================
 *
 * Implements a 3-Stage GPU Preparation & Rendering Lifecycle:
 *
 * STAGE 1: DORMANT (distZ > warmDistance)
 * - `visible = false` -> 0 draw calls, 0 vertex processing, 0 GPU load.
 * - Child `useFrame` callbacks short-circuit immediately.
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
}: SceneTransitionWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const warmDistance = visibilityRange + warmLookahead;
  const lifecycleRef = useRef<SceneLifecycleRef>({ state: "dormant", distZ: 999 });

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    // Measure travel distance from camera to chapter anchor along the Z-axis
    const distZ = Math.abs(camera.position.z - positionZ);

    // Stage 2 & 3: Visible if inside the warm distance buffer
    const shouldBeMountedInPipeline = distZ <= warmDistance;

    if (groupRef.current.visible !== shouldBeMountedInPipeline) {
      groupRef.current.visible = shouldBeMountedInPipeline;
    }

    const state: SceneLifecycleState = !shouldBeMountedInPipeline
      ? "dormant"
      : distZ <= visibilityRange
      ? "active"
      : "warm";

    lifecycleRef.current.state = state;
    lifecycleRef.current.distZ = distZ;
  });

  return (
    <SceneLifecycleContext.Provider value={lifecycleRef}>
      <group ref={groupRef}>
        {children}
      </group>
    </SceneLifecycleContext.Provider>
  );
}
