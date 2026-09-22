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
  isActive,
}: SceneTransitionWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Subtle scale transition when becoming the primary active scene without Vector3 allocations
      const targetScale = isActive ? 1.0 : 0.99;
      const currentScale = groupRef.current.scale.x;
      if (Math.abs(currentScale - targetScale) > 0.0002) {
        const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, Math.min(1, delta * 6));
        groupRef.current.scale.setScalar(nextScale);
      }
      groupRef.current.visible = true;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}
