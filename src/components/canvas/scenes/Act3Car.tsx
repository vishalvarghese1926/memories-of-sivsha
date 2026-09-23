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

      {/* Realistic Car Ground Contact Shadow */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.82}
        scale={8}
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

      {/* Car Interior Perspective Cabin */}
      <group ref={carGroupRef} position={[0, 0.4, 0]}>
        {/* Real Exterior Car Chassis with Procedural Fallback */}
        <ExternalAsset
          assetKey="car"
          position={[0, 0.45, 0]}
          scale={0.95}
          rotation={[0, Math.PI, 0]}
          proceduralFallback={
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[2.5, 1.2, 4.0]} />
              <meshStandardMaterial color="#18181b" roughness={0.6} />
            </mesh>
          }
        />

        {/* Dashboard and Windshield Frame */}
        <mesh position={[0, 1.0, -1.5]}>
          <boxGeometry args={[2.3, 0.35, 0.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} />
        </mesh>

        {/* Soft dashboard instrumental lights */}
        <pointLight position={[0, 1.1, -1.3]} color="#38bdf8" intensity={0.5} distance={2.5} />

        {/* Quiet Milestone Inscription on Dashboard */}
        <Text
          position={[0, 1.18, -1.25]}
          rotation={[-0.4, 0, 0]}
          fontSize={0.075}
          color="#fbcfe8"
          anchorX="center"
          anchorY="middle"
        >
          31 AUGUST 2025 · THE DAY WE BECAME US
        </Text>

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
        {/* Rear row: Sivani Left (x: -0.65), Me Middle (x: 0.0), Midhun Right (x: 0.65)*/}
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

        {/* Ambient interior cabin twilight with Sivani's signature cyan accent */}
        <pointLight position={[0, 1.4, 0]} color="#fde047" intensity={0.35} distance={4} />
        <pointLight position={[-0.3, 1.1, 0.65]} color="#22d3ee" intensity={0.45} distance={2.5} />

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
