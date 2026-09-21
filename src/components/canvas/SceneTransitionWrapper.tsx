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
      // Subtle scale transition when becoming the primary active scene
      const targetScale = isActive ? 1.0 : 0.99;

      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        Math.min(1, delta * 6)
      );

      // Crucial: Any scene in the active window MUST remain visible.
      // Three.js distance and fog naturally handle fading in and out across the continuous spline.
      groupRef.current.visible = true;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}
