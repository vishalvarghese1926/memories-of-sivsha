"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act3CarProps {
  localProgress: number;
}

export default function Act3Car({ localProgress }: Act3CarProps) {
  const carGroupRef = useRef<THREE.Group>(null);
  const roadLinesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Road speed motion
    if (roadLinesRef.current) {
      roadLinesRef.current.position.z = (t * 22) % 6;
    }
    // Subtle car cabin vibration
    if (carGroupRef.current) {
      carGroupRef.current.position.y = Math.sin(t * 18) * 0.008;
      carGroupRef.current.rotation.z = Math.sin(t * 4) * 0.005;
    }
  });

  return (
    <group position={[0, 0, -345]}>
      {/* Night Highway / Road */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 28]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>

      {/* Realistic Car Ground Contact Shadow */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.8}
        scale={8}
        blur={2.0}
        far={3.5}
        frames={1}
      />

      {/* Moving Highway Dashed Lines */}
      <group ref={roadLinesRef}>
        {[-8, -4, 0, 4, 8].map((z, idx) => (
          <mesh key={idx} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 2.0]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        ))}
      </group>

      {/* Car Interior Perspective Cabin */}
      <group ref={carGroupRef} position={[0, 0.4, 0]}>
        {/* Chassis / Cabin Shell */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.5, 1.2, 4.0]} />
          <meshStandardMaterial color="#1e1b24" roughness={0.6} />
        </mesh>

        {/* Dashboard and Windshield */}
        <mesh position={[0, 1.0, -1.5]}>
          <boxGeometry args={[2.3, 0.35, 0.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} />
        </mesh>
        {/* Soft dashboard instrumental lights */}
        <pointLight position={[0, 1.1, -1.3]} color="#38bdf8" intensity={0.5} distance={2.5} />

        {/* ========================================================================= */}
        {/* EXACT SEATING ARRANGEMENT:                                                */}
        {/* Front row: Parvathi Left (x: -0.6), Jofin Driver Right (x: 0.6, z: -0.8) */}
        {/* ========================================================================= */}
        {/* Front Left: Parvathi */}
        <group position={[-0.6, 0.4, -0.8]}>
          {/* Seat */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.55, 0.7, 0.55]} />
            <meshStandardMaterial color="#27272a" roughness={0.7} />
          </mesh>
          {/* Avatar */}
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.5, 12]} />
            <meshStandardMaterial color="#831843" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* Front Right: Jofin (Driver) */}
        <group position={[0.6, 0.4, -0.8]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.55, 0.7, 0.55]} />
            <meshStandardMaterial color="#27272a" roughness={0.7} />
          </mesh>
          {/* Steering wheel */}
          <mesh position={[0, 0.75, -0.32]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.16, 0.02, 8, 20]} />
            <meshStandardMaterial color="#18181b" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.52, 12]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.04, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* ========================================================================= */}
        {/* Rear row: Sivani Left (x: -0.7), Me Middle (x: 0.0), Midhun Right (x: 0.7)*/}
        {/* ========================================================================= */}
        {/* Rear Seat Bench */}
        <mesh position={[0, 0.4, 0.7]}>
          <boxGeometry args={[2.2, 0.7, 0.6]} />
          <meshStandardMaterial color="#27272a" roughness={0.7} />
        </mesh>

        {/* Sivani (Left) */}
        <group position={[-0.65, 0.4, 0.65]}>
          <CharacterGirl
            pose="sitting"
            scale={0.88}
            rotation={[0, 0.15, 0]}
            lookAtTarget={[0, 1.3, 0.65]}
          />
        </group>

        {/* Me / Vishal (Middle) */}
        <group position={[0, 0.4, 0.65]}>
          <CharacterBoy
            pose="sitting"
            scale={0.9}
            rotation={[0, -0.15, 0]}
            lookAtTarget={[-0.65, 1.25, 0.65]}
          />
        </group>

        {/* Midhun (Right) */}
        <group position={[0.65, 0.4, 0.65]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.55, 12]} />
            <meshStandardMaterial color="#155e75" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* Ambient interior cabin twilight */}
        <pointLight position={[0, 1.4, 0]} color="#fde047" intensity={0.4} distance={4} />

        {/* Milestone 9: 31 August 2025 Floating Milestone Frame */}
        <FloatingMediaFrame
          milestoneId="m-9"
          position={[0, 1.8, -2.8]}
          rotation={[-0.1, 0, 0]}
          scale={0.9}
        />
      </group>
    </group>
  );
}
