"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useSceneLifecycle } from "../SceneTransitionWrapper";
import { canvasStore } from "@/context/StoryContext";

export default function Act0Entry() {
  const lifecycle = useSceneLifecycle();
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1200;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color("#fb7185"), // Rose
      new THREE.Color("#c084fc"), // Lavender
      new THREE.Color("#facc15"), // Gold
      new THREE.Color("#ffffff"), // Pure white star
    ];

    for (let i = 0; i < count; i++) {
      // Cylinder vortex around z-axis: 0 to 25
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.pow(Math.random(), 2) * 6;
      const z = Math.random() * 26 - 2;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;

      const chosen = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = chosen.r;
      col[i * 3 + 1] = chosen.g;
      col[i * 3 + 2] = chosen.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (lifecycle.current.state === "dormant" || canvasStore.isStoryPaused) return;
    if (pointsRef.current) {
      pointsRef.current.rotation.z += delta * 0.35;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Gentle center glow */}
      <pointLight position={[0, 0, 8]} intensity={3} color="#f43f5e" distance={15} />
    </group>
  );
}
