"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows, Text } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import ExternalAsset from "../environment/ExternalAsset";

interface Act3CarProps {
  localProgress: number;
}

export default function Act3Car({ localProgress }: Act3CarProps) {
  const carGroupRef = useRef<THREE.Group>(null);
  const roadLinesRef = useRef<THREE.Group>(null);
  const streetlampsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Road speed motion
    if (roadLinesRef.current) {
      roadLinesRef.current.position.z = (t * 22) % 6;
    }

    // Passing highway light poles
    if (streetlampsRef.current) {
      streetlampsRef.current.position.z = (t * 18) % 20;
    }

    // Smooth, cinematic highway cruising motion
    if (carGroupRef.current) {
      carGroupRef.current.position.y = Math.sin(t * 6) * 0.003;
      carGroupRef.current.rotation.z = Math.sin(t * 2) * 0.002;
    }
  });

  return (
    <group position={[0, 0, -345]}>
      {/* Night Highway / Road with softened outer borders */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 36]} />
        <meshStandardMaterial color="#09090b" roughness={0.85} />
      </mesh>
      {/* Soft Highway Edge Curbs */}
      <mesh position={[-6.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>
      <mesh position={[6.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>

      {/* Car Ground Contact Shadow */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.88}
        scale={9}
        blur={2.0}
        far={3.5}
        frames={1}
      />

      {/* Moving Highway Dashed Center Lines */}
      <group ref={roadLinesRef}>
        {[-10, -6, -2, 2, 6, 10].map((z, idx) => (
          <mesh key={idx} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 2.2]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        ))}
      </group>

      {/* Passing Highway Streetlamp Poles */}
      <group ref={streetlampsRef}>
        {[-12, 0, 12].map((sz, idx) => (
          <group key={idx} position={[-4.5, 0, sz]}>
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 5.0, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.4, 4.8, 0]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
            <pointLight position={[0.8, 4.8, 0]} color="#fed7aa" intensity={0.65} distance={8} />
          </group>
        ))}
      </group>

      {/* Physically Grounded Car Cabin & Passengers (Grounded at Y=0) */}
      <group ref={carGroupRef} position={[0, 0, 0]}>
        {/* Car Lower Chassis & Cabin Floor (y = 0.18) */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.22, 4.2]} />
          <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* 4 Grounded Wheels touching road at y=0 */}
        {[
          [-1.05, 0.28, -1.3],
          [1.05, 0.28, -1.3],
          [-1.05, 0.28, 1.3],
          [1.05, 0.28, 1.3],
        ].map((wpos, widx) => (
          <mesh key={`wheel-${widx}`} position={[wpos[0], wpos[1], wpos[2]]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        ))}

        {/* Dashboard and Windshield Cowl */}
        <mesh position={[0, 0.72, -1.25]} castShadow>
          <boxGeometry args={[2.0, 0.38, 0.6]} />
          <meshStandardMaterial color="#1f2937" roughness={0.5} />
        </mesh>

        {/* Transparent Slanted Windshield (No opaque roof clipping) */}
        <mesh position={[0, 1.05, -1.1]} rotation={[0.42, 0, 0]}>
          <planeGeometry args={[1.9, 0.75]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            roughness={0.1}
            transmission={0.8}
            thickness={0.2}
          />
        </mesh>

        {/* Soft dashboard instrumental lights */}
        <pointLight position={[0, 0.82, -1.05]} color="#38bdf8" intensity={0.45} distance={2.5} />

        {/* Milestone Inscription on Dashboard */}
        <Text
          position={[0, 0.88, -0.98]}
          rotation={[-0.35, 0, 0]}
          fontSize={0.07}
          color="#fbcfe8"
          anchorX="center"
          anchorY="middle"
        >
          31 AUGUST 2025 · THE DAY WE BECAME US
        </Text>

        {/* ========================================================================= */}
        {/* EXACT SEATING ARRANGEMENT:                                                */}
        {/* Front row: Parvathi Left (x: -0.52), Jofin Driver Right (x: 0.52, z: -0.65) */}
        {/* ========================================================================= */}
        {/* Front Left: Parvathi (Passenger) */}
        <group position={[-0.52, 0.18, -0.65]}>
          {/* Seat */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[0.52, 0.48, 0.52]} />
            <meshStandardMaterial color="#27272a" roughness={0.7} />
          </mesh>
          {/* Character */}
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.48, 12]} />
            <meshStandardMaterial color="#831843" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.92, 0]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* Front Right: Jofin (Driver) */}
        <group position={[0.52, 0.18, -0.65]}>
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[0.52, 0.48, 0.52]} />
            <meshStandardMaterial color="#27272a" roughness={0.7} />
          </mesh>
          {/* Steering wheel */}
          <mesh position={[0, 0.65, -0.32]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.15, 0.02, 8, 20]} />
            <meshStandardMaterial color="#18181b" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.5, 12]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.94, 0]} castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* ========================================================================= */}
        {/* Rear row: Sivani Left (x: -0.60), Vishal Middle (x: 0.0), Midhun Right (x: 0.60) */}
        {/* ========================================================================= */}
        {/* Rear Bench Seat */}
        <mesh position={[0, 0.32, 0.55]} castShadow>
          <boxGeometry args={[1.9, 0.48, 0.55]} />
          <meshStandardMaterial color="#27272a" roughness={0.7} />
        </mesh>

        {/* Sivani (Back Left Window) */}
        <group position={[-0.60, 0.22, 0.55]}>
          <CharacterGirl
            pose="sitting"
            scale={0.84}
            rotation={[0, 0.22, 0]}
            lookAtTarget={[0, 1.15, 0.55]}
          />
        </group>

        {/* You / Vishal (Back Middle) */}
        <group position={[0, 0.22, 0.55]}>
          <CharacterBoy
            pose="sitting"
            scale={0.86}
            rotation={[0, -0.22, 0]}
            lookAtTarget={[-0.60, 1.1, 0.55]}
          />
        </group>

        {/* Midhun (Back Right Window) */}
        <group position={[0.60, 0.18, 0.55]}>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.19, 0.5, 12]} />
            <meshStandardMaterial color="#155e75" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>

        {/* Ambient interior cabin twilight */}
        <pointLight position={[0, 1.2, 0]} color="#fde047" intensity={0.4} distance={4} />
        <pointLight position={[-0.3, 0.95, 0.55]} color="#fda4af" intensity={0.4} distance={2.5} />

        {/* Milestone 9: 31 August 2025 Floating Milestone Frame */}
        <FloatingMediaFrame
          milestoneId="m-9"
          position={[0, 1.85, -2.4]}
          rotation={[-0.1, 0, 0]}
          scale={0.95}
        />
      </group>
    </group>
  );
}
