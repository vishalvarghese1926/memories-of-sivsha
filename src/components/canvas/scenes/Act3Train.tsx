"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act3TrainProps {
  localProgress: number;
}

export default function Act3Train({ localProgress }: Act3TrainProps) {
  const trainRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);
  const tracksRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Carriage gentle rhythmic sway
    if (trainRef.current) {
      trainRef.current.rotation.z = Math.sin(t * 8) * 0.015;
      trainRef.current.position.y = Math.sin(t * 16) * 0.01;
    }
    // Track illusion speed blur
    if (tracksRef.current) {
      tracksRef.current.position.z = (t * 24) % 10;
    }
  });

  return (
    <group position={[0, 0, -185]}>
      {/* Sunset Horizon Light */}
      <pointLight position={[-15, 6, -30]} color="#f97316" intensity={2.8} distance={60} />
      <directionalLight position={[-10, 4, -10]} color="#fdba74" intensity={1.5} />

      {/* Train Carriage Interior Structure */}
      <group ref={trainRef} position={[2, 0, 0]}>
        {/* Floor */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.4, 14]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>

        {/* Ceiling */}
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[3.2, 0.3, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* Closed Wall (Right side) */}
        <mesh position={[1.5, 1.8, 0]}>
          <boxGeometry args={[0.2, 3.0, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Left Side: Open Carriage Doorway */}
        {/* Wall segments flanking open door */}
        <mesh position={[-1.5, 1.8, 3.5]}>
          <boxGeometry args={[0.2, 3.0, 7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[-1.5, 1.8, -4.5]}>
          <boxGeometry args={[0.2, 3.0, 5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Doorway safety grab bars (chrome) */}
        <mesh position={[-1.4, 1.6, -1.2]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[-1.4, 1.6, 0.2]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Both Characters safely standing near open train door */}
        {/* Boy (Vishal) holding door frame grab bar */}
        <group position={[-1.0, 0.4, -0.6]}>
          <CharacterBoy
            pose="idle"
            scale={0.95}
            rotation={[0, Math.PI / 2 + 0.3, 0]}
            lookAtTarget={[-0.8, 1.7, -0.1]}
            windIntensity={0.6}
          />
        </group>

        {/* Girl (Sivani) enjoying evening wind by the doorway */}
        <group position={[-0.9, 0.4, 0.0]}>
          <CharacterGirl
            pose="idle"
            scale={0.95}
            rotation={[0, Math.PI / 2 - 0.2, 0]}
            lookAtTarget={[-1.0, 1.7, -0.6]}
            windIntensity={0.75}
          />
        </group>

        {/* Doorway ground contact shadow */}
        <ContactShadows
          position={[-1.0, 0.41, -0.3]}
          opacity={0.7}
          scale={3.5}
          blur={1.8}
          far={2}
          frames={1}
        />

        {/* Warm incandescent interior light */}
        <pointLight position={[0, 3.0, -0.2]} color="#fef08a" intensity={1.2} distance={8} />

        {/* Milestone 6: Kozhikode Train Journey Floating Media Frame */}
        <FloatingMediaFrame
          milestoneId="m-6"
          position={[0.2, 2.0, 2.2]}
          rotation={[0, -0.35, 0]}
          scale={0.88}
        />
      </group>

      {/* Railway Tracks & Ballast ground running beneath */}
      <group ref={tracksRef} position={[0, -0.8, 0]}>
        {/* Ground */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 30]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.9} />
        </mesh>
        {/* Steel Rails */}
        <mesh position={[0.8, 0.15, 0]}>
          <boxGeometry args={[0.08, 0.12, 30]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[2.4, 0.15, 0]}>
          <boxGeometry args={[0.08, 0.12, 30]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
