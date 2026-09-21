"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act3BeachProps {
  localProgress: number;
}

export default function Act3Beach({ localProgress }: Act3BeachProps) {
  const waterRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);

  // Dynamic vertex wave simulation
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(36, 30, 48, 48), []);
  const initialPositions = useMemo(
    () => waterGeometry.attributes.position.array.slice() as Float32Array,
    [waterGeometry]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (waterRef.current) {
      waterRef.current.position.y = -0.04 + Math.sin(t * 1.5) * 0.015;

      // Organic gentle wave undulations
      const positions = waterGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = initialPositions[i];
        const y = initialPositions[i + 1];
        positions[i + 2] = Math.sin(x * 0.5 + t * 2.2) * 0.06 + Math.cos(y * 0.4 + t * 1.8) * 0.04;
      }
      waterGeometry.attributes.position.needsUpdate = true;
    }
    if (sunRef.current) {
      sunRef.current.position.y = 3.5 + Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group position={[0, 0, -235]}>
      {/* Sunset Coastal Sun Orb */}
      <mesh ref={sunRef} position={[0, 4.0, -28]}>
        <sphereGeometry args={[4.2, 32, 32]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>

      {/* Sun glow halo */}
      <pointLight position={[0, 4.0, -26]} color="#fb923c" intensity={2.5} distance={45} />

      {/* Wet Sandy Shore Plane */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 30]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Reflective Shallow Water Plane with wave undulations */}
      <mesh ref={waterRef} geometry={waterGeometry} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial
          color="#0b132b"
          transmission={0.82}
          roughness={0.06}
          metalness={0.15}
          ior={1.333}
          transparent
          opacity={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Characters Ground Contact Shadows on the wet sand */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.7}
        scale={8}
        blur={2.0}
        far={3.5}
        frames={1}
      />

      {/* Characters walking hand in hand through the shallow waves */}
      <group position={[-0.8, 0.02, 0]}>
        <CharacterBoy
          pose="walking"
          scale={0.95}
          rotation={[0, 0.2, 0]}
          lookAtTarget={[0.7, 1.5, 0.2]}
        />
      </group>

      <group position={[0.7, 0.02, 0.1]}>
        <CharacterGirl
          pose="walking"
          scale={0.95}
          rotation={[0, -0.2, 0]}
          lookAtTarget={[-0.8, 1.6, 0]}
          windIntensity={0.5}
        />
      </group>

      {/* Milestone 7: Kozhikode Beach Shore Floating Media Frame */}
      <FloatingMediaFrame
        milestoneId="m-7"
        position={[2.8, 2.2, -4.0]}
        rotation={[-0.05, -0.25, 0.02]}
        scale={0.95}
      />
    </group>
  );
}
