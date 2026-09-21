"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneTransitionWrapperProps {
  children: React.ReactNode;
  localProgress: number;
  isActive: boolean;
  fadeSpan?: number;
}

export default function SceneTransitionWrapper({
  children,
  localProgress,
  fadeSpan = 0.15,
}: SceneTransitionWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Compute smooth normalized visibility factor (0 to 1)
  let visibilityFactor = 1.0;
  if (localProgress < fadeSpan) {
    visibilityFactor = Math.max(0, localProgress / fadeSpan);
  } else if (localProgress > 1.0 - fadeSpan) {
    visibilityFactor = Math.max(0, (1.0 - localProgress) / fadeSpan);
  }

  // Smooth Hermite interpolation (smoothstep)
  const smoothAlpha = visibilityFactor * visibilityFactor * (3 - 2 * visibilityFactor);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Subtle scale and position shift during transitions
      const targetScale = THREE.MathUtils.lerp(0.98, 1.0, smoothAlpha);
      const targetY = THREE.MathUtils.lerp(-0.1, 0, smoothAlpha);

      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        Math.min(1, delta * 6)
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        Math.min(1, delta * 6)
      );

      // Toggle group visibility if completely outside view
      groupRef.current.visible = smoothAlpha > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}
