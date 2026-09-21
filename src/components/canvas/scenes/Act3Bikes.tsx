"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act3BikesProps {
  milestoneId: string; // "m-10" (Classic 350) or "m-11" (Himalayan 450)
  localProgress: number;
}

export default function Act3Bikes({ milestoneId, localProgress }: Act3BikesProps) {
  const wheelsRef = useRef<THREE.Group>(null);
  const roadRef = useRef<THREE.Group>(null);
  const bikeGroupRef = useRef<THREE.Group>(null);

  const isClassic = milestoneId === "m-10";
  // Classic 350 is Signals Desert/Storm Green (#2d3a24), Himalayan 450 is Kaza Brown / Sand (#8c6239)
  const bikeTankColor = isClassic ? "#2e3b26" : "#8c6239";
  const zPosition = isClassic ? -450 : -570;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Road speed motion
    if (roadRef.current) {
      roadRef.current.position.z = (t * (isClassic ? 18 : 12)) % 6;
    }

    // Engine thump vibration & motorcycle dynamics
    if (bikeGroupRef.current) {
      const thumpFreq = isClassic ? 14 : 20;
      bikeGroupRef.current.position.y = 0.05 + Math.sin(t * thumpFreq) * 0.006;
      bikeGroupRef.current.rotation.z = Math.sin(t * 2.5) * 0.02; // subtle cornering lean
    }

    // Wheel rotation
    if (wheelsRef.current) {
      wheelsRef.current.children.forEach((wheel) => {
        wheel.rotation.x += delta * 15;
      });
    }
  });

  return (
    <group position={[0, 0, zPosition]}>
      {/* Lighting for the scene */}
      {isClassic ? (
        // Coastal sunset warm rim light for Classic 350
        <>
          <directionalLight position={[-8, 6, -10]} color="#f97316" intensity={2.2} />
          <pointLight position={[3, 2, -2]} color="#fed7aa" intensity={1.5} distance={20} />
        </>
      ) : (
        // Misty mountain atmospheric light for Himalayan 450
        <>
          <directionalLight position={[6, 8, -10]} color="#94a3b8" intensity={1.8} />
          <pointLight position={[-2, 3, -1]} color="#fde68a" intensity={1.2} distance={25} />
        </>
      )}

      {/* Road / Mountain Path */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 36]} />
        <meshStandardMaterial
          color={isClassic ? "#1e1b18" : "#292524"}
          roughness={isClassic ? 0.7 : 0.9}
        />
      </mesh>

      {/* Realistic Ground Contact Shadow under tires */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.78}
        scale={6}
        blur={1.8}
        far={3}
        frames={1}
      />

      {/* Road Speed Lines / Terrain markers */}
      <group ref={roadRef}>
        {[-12, -6, 0, 6, 12].map((z, idx) => (
          <mesh key={idx} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 2.2]} />
            <meshBasicMaterial color={isClassic ? "#fef08a" : "#cbd5e1"} />
          </mesh>
        ))}
      </group>

      {/* Mountain Mist / Background Hills (for Himalayan 450) */}
      {!isClassic && (
        <group position={[0, 0, -18]}>
          <mesh position={[-8, 4, 0]}>
            <coneGeometry args={[10, 12, 5]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
          <mesh position={[7, 5, -5]}>
            <coneGeometry args={[12, 14, 5]} />
            <meshStandardMaterial color="#0c0a09" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* THE MOTORCYCLE RIG */}
      <group ref={bikeGroupRef} position={[0, 0.45, 0]}>
        {/* Wheels */}
        <group ref={wheelsRef}>
          {/* Front Wheel */}
          <group position={[0, 0.1, -1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.42, 0.08, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* Rear Wheel */}
          <group position={[0, 0.1, 1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.42, 0.09, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* Chassis / Engine Block */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.38, 0.45, 1.1]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Chrome / Matte Exhaust Pipe */}
        <mesh position={[0.22, 0.18, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 1.4, 16]} />
          <meshStandardMaterial
            color={isClassic ? "#e2e8f0" : "#1e293b"}
            metalness={isClassic ? 0.95 : 0.5}
            roughness={0.2}
          />
        </mesh>

        {/* Distinctive Fuel Tank */}
        {isClassic ? (
          // Classic 350 Teardrop Tank: Military Semi-Matte Signals Green
          <mesh position={[0, 0.68, -0.35]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshPhysicalMaterial
              color="#2d3a24"
              roughness={0.45}
              metalness={0.25}
              clearcoat={0.3}
              clearcoatRoughness={0.4}
            />
          </mesh>
        ) : (
          // Himalayan 450 Adventure Sculpted Tank: Satin Kaza Brown with clearcoat reflections
          <group position={[0, 0.72, -0.35]}>
            <mesh>
              <boxGeometry args={[0.42, 0.32, 0.65]} />
              <meshPhysicalMaterial
                color="#8c6239"
                roughness={0.35}
                metalness={0.2}
                clearcoat={0.8}
                clearcoatRoughness={0.15}
              />
            </mesh>
            {/* Crash Guard Bars */}
            <mesh position={[-0.24, 0, 0]}>
              <boxGeometry args={[0.04, 0.4, 0.7]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.24, 0, 0]}>
              <boxGeometry args={[0.04, 0.4, 0.7]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* Long Dual Riding Seat */}
        <mesh position={[0, 0.62, 0.3]} rotation={[-0.05, 0, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.9]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>

        {/* Handlebars */}
        <group position={[0, 0.95, -0.75]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.75, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Round Headlamp */}
          <mesh position={[0, -0.05, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.1, 0.12, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} />
          </mesh>
          {/* Headlamp beam */}
          <pointLight position={[0, -0.05, -0.3]} color="#fef08a" intensity={1.8} distance={12} />
        </group>

        {/* 3D CHARACTER AVATARS POSITIONED ON BIKE */}
        {/* Vishal (Boy Rider) in biker pose */}
        <CharacterBoy
          position={[0, 0.35, 0.0]}
          rotation={[0, Math.PI, 0]}
          pose="biker"
          scale={0.92}
          windIntensity={isClassic ? 0.75 : 0.9}
        />

        {/* Sivani (Girl Pillion Rider) holding on behind */}
        <CharacterGirl
          position={[0, 0.42, 0.52]}
          rotation={[0, Math.PI, 0]}
          pose="bikerPillion"
          scale={0.9}
          windIntensity={isClassic ? 0.8 : 0.95}
        />
      </group>

      {/* Floating Motorcycle Milestone Frame */}
      <FloatingMediaFrame
        milestoneId={milestoneId}
        position={[2.4, 2.3, -2.5]}
        rotation={[-0.05, -0.3, 0.02]}
        scale={0.92}
      />
    </group>
  );
}
