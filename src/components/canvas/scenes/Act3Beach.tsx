"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import ExternalAsset from "../environment/ExternalAsset";
import { useSceneProgress } from "@/lib/useSceneProgress";

interface Act3BeachProps {
  localProgress: number;
}

export default function Act3Beach({ localProgress }: Act3BeachProps) {
  const { getProgress } = useSceneProgress("m-7", localProgress);
  const waterRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const charactersRef = useRef<THREE.Group>(null);
  const pierRef = useRef<THREE.Group>(null);

  // Performance-optimized low-poly wave grid (28x28 is smooth yet extremely lightweight for mobile)
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(36, 32, 28, 28), []);
  const initialPositions = useMemo(
    () => waterGeometry.attributes.position.array.slice() as Float32Array,
    [waterGeometry]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle breathing wave wash
    if (waterRef.current) {
      waterRef.current.position.y = -0.02 + Math.sin(t * 1.4) * 0.015;

      const positions = waterGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = initialPositions[i];
        const y = initialPositions[i + 1];
        positions[i + 2] =
          Math.sin(x * 0.4 + t * 2.0) * 0.05 +
          Math.cos(y * 0.35 + t * 1.6) * 0.035;
      }
      waterGeometry.attributes.position.needsUpdate = true;
    }

    // Moving shoreline foam wash line
    if (foamRef.current) {
      foamRef.current.position.x = 0.6 + Math.sin(t * 1.4) * 0.35;
      foamRef.current.scale.x = 1.0 + Math.sin(t * 1.4) * 0.1;
    }

    const currentLocal = getProgress();

    // Gentle sun dip matching evening progression
    if (sunRef.current) {
      sunRef.current.position.y = 3.6 - currentLocal * 1.2 + Math.sin(t * 0.4) * 0.05;
    }

    // Synchronized natural shoreline walk movement
    if (charactersRef.current) {
      // Gentle stride glide across the wet sand without rubbery bobbing
      charactersRef.current.position.y = Math.abs(Math.sin(t * 2.0)) * 0.004;
      // Stride position along the beach path based on real-time progress
      charactersRef.current.position.z = (currentLocal - 0.5) * 5;
    }
  });

  return (
    <group position={[0, 0, -235]}>
      {/* ========================================================================= */}
      {/* 1. ATMOSPHERIC SUNSET SKY & HORIZON                                       */}
      {/* ========================================================================= */}
      {/* Glowing Sunset Sun Orb dipping toward sea */}
      <mesh ref={sunRef} position={[2, 3.8, -32]}>
        <sphereGeometry args={[4.4, 32, 32]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>

      {/* Radiant Sunset Horizon Lighting */}
      <directionalLight position={[4, 5, -28]} color="#fdba74" intensity={2.6} />
      <pointLight position={[2, 4, -28]} color="#ea580c" intensity={3.5} distance={65} />
      <ambientLight color="#2a1420" intensity={0.9} />

      {/* Atmospheric Sky Backdrop Plane */}
      <mesh position={[0, 8, -35]}>
        <planeGeometry args={[60, 24]} />
        <meshBasicMaterial color="#1e1022" />
      </mesh>

      {/* Distant Kozhikode Sea Pier & Old Lighthouse Silhouette */}
      <group ref={pierRef} position={[-14, 0, -22]}>
        {/* Pier Deck */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[16, 0.25, 1.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Pier Pilings */}
        {[-6, -3, 0, 3, 6].map((px, idx) => (
          <mesh key={idx} position={[px, 0.4, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 1.6, 8]} />
            <meshStandardMaterial color="#090d16" roughness={0.9} />
          </mesh>
        ))}
        {/* Distant Lighthouse Tower */}
        <group position={[-7, 1.2, 0]}>
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.35, 0.6, 3.6, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.7, 0]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <pointLight position={[0, 3.7, 0]} color="#fde047" intensity={0.8} distance={15} />
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. SHORELINE & WET SAND SURFACE                                           */}
      {/* ========================================================================= */}
      {/* Wet Sandy Shore Plane (Deep dark amber with smooth coastal sheen) */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[38, 34]} />
        <meshStandardMaterial
          color="#381c10"
          roughness={0.5}
          metalness={0.25}
        />
      </mesh>

      {/* Coastal Reflective Shallow Water (ankle-deep, translucent coastal wave) */}
      <mesh
        ref={waterRef}
        geometry={waterGeometry}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshPhysicalMaterial
          color="#0d1b2a"
          transmission={0.8}
          roughness={0.08}
          metalness={0.18}
          ior={1.333}
          transparent
          opacity={0.88}
          clearcoat={0.95}
          clearcoatRoughness={0.06}
        />
      </mesh>

      {/* Subtle Moving Shore Foam Wash Line */}
      <mesh
        ref={foamRef}
        position={[0.6, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.2, 30]} />
        <meshStandardMaterial
          color="#fed7aa"
          transparent
          opacity={0.35}
          roughness={0.3}
        />
      </mesh>

      {/* Coastal Shoreline Rocks — Real Poly Haven Photogrammetry Rocks with Fallback */}
      <ExternalAsset
        assetKey="beachProps"
        position={[-3.8, 0, -2.5]}
        scale={6.0}
        rotation={[0, 0.4, 0]}
        proceduralFallback={
          <mesh position={[-3.8, 0.35, -2.5]}>
            <sphereGeometry args={[0.9, 12, 10]} />
            <meshStandardMaterial color="#292524" roughness={0.8} />
          </mesh>
        }
      />
      <ExternalAsset
        assetKey="beachProps"
        position={[-4.5, 0, 3.8]}
        scale={4.8}
        rotation={[0.2, 1.2, -0.1]}
        proceduralFallback={
          <mesh position={[-4.5, 0.28, 3.8]}>
            <sphereGeometry args={[0.7, 12, 10]} />
            <meshStandardMaterial color="#292524" roughness={0.8} />
          </mesh>
        }
      />

      {/* ========================================================================= */}
      {/* 3. CHARACTERS WALKING HAND IN HAND IN SHALLOW WATER                       */}
      {/* Ankle-deep shallow shoreline walk — completely safe, natural stride      */}
      {/* ========================================================================= */}
      <group ref={charactersRef} position={[0, 0.02, 0]}>
        {/* Soft Contact Shadows on wet reflective sand */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.72}
          scale={5.5}
          blur={1.8}
          far={2.5}
          frames={1}
        />

        {/* Vishal (Boy): Walking along shoreline */}
        <group position={[-0.75, 0, 0]}>
          <CharacterBoy
            pose="walking"
            scale={0.94}
            rotation={[0, 0.15, 0]}
            lookAtTarget={[0.7, 1.5, 0.2]}
            windIntensity={0.55}
          />
        </group>

        {/* Sivani (Girl): Walking beside him, gentle sea breeze in hair */}
        <group position={[0.7, 0, 0.1]}>
          <CharacterGirl
            pose="walking"
            scale={0.94}
            rotation={[0, -0.15, 0]}
            lookAtTarget={[-0.75, 1.55, 0]}
            windIntensity={0.65}
          />
        </group>

        {/* Subtle Water Ripples around their footsteps */}
        <mesh position={[-0.75, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.35, 16]} />
          <meshBasicMaterial color="#fed7aa" transparent opacity={0.25} />
        </mesh>
        <mesh position={[0.7, 0.025, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.35, 16]} />
          <meshBasicMaterial color="#fed7aa" transparent opacity={0.25} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 4. MILESTONE 7 FLOATING MEDIA FRAME                                       */}
      {/* ========================================================================= */}
      <FloatingMediaFrame
        milestoneId="m-7"
        position={[2.8, 2.3, -3.5]}
        rotation={[-0.04, -0.28, 0.02]}
        scale={0.92}
      />
    </group>
  );
}
