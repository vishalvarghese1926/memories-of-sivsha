"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Milestone } from "@/types";

interface ScenePlaceholderProps {
  milestone: Milestone;
  localProgress: number;
  positionZ: number;
}

export default function ScenePlaceholder({
  milestone,
  localProgress,
  positionZ,
}: ScenePlaceholderProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  // Subtle floating ring & gentle beacon for future scene anchor
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.2;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.8) * 0.05;
      ringRef.current.position.y = 1.6 + Math.sin(t * 1.5) * 0.08;
    }
    if (glowLightRef.current) {
      // Glow peaks when camera is centered on this milestone (localProgress ~ 0.5)
      const proximityAlpha = Math.sin(localProgress * Math.PI);
      glowLightRef.current.intensity = 0.5 + proximityAlpha * 1.5;
    }
  });

  return (
    <group position={[0, 0, positionZ]}>
      {/* Neutral subtle ring marker */}
      <mesh ref={ringRef} position={[0, 1.6, 0]}>
        <torusGeometry args={[1.2, 0.015, 16, 64]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#7c3aed"
          emissiveIntensity={0.6}
          roughness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Gentle center glow */}
      <pointLight
        ref={glowLightRef}
        position={[0, 1.6, 0]}
        color="#fb7185"
        intensity={1.2}
        distance={12}
      />
    </group>
  );
}
