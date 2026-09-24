"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles, Text, ContactShadows, useTexture } from "@react-three/drei";
import { useStory } from "@/context/StoryContext";
import { audioEngine } from "@/lib/audioEngine";

import { getStoryTexture, getFallbackMonogramTexture } from "@/lib/storyTextureManager";

interface Act4FinaleProps {
  localProgress: number;
}

function LetterPaper() {
  const texture = getStoryTexture("/media/photos/letter_seal.webp") || getFallbackMonogramTexture();
  return (
    <mesh>
      <planeGeometry args={[0.9, 1.2]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        toneMapped={false}
      />
    </mesh>
  );
}


export default function Act4Finale({ localProgress }: Act4FinaleProps) {
  const { setIsLetterModalOpen } = useStory();
  const envelopeRef = useRef<THREE.Group>(null);
  const sealRef = useRef<THREE.Mesh>(null);
  const letterRef = useRef<THREE.Group>(null);
  const [isOpened, setIsOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Lanterns floating data
  const lanterns = [
    { pos: [-3.5, 2.5, -4], speed: 1.1, offset: 0 },
    { pos: [3.8, 3.2, -5], speed: 0.9, offset: 1.5 },
    { pos: [-2.2, 4.0, -8], speed: 1.3, offset: 2.2 },
    { pos: [2.5, 2.0, -3], speed: 1.0, offset: 3.1 },
    { pos: [-4.2, 1.8, -2], speed: 0.8, offset: 4.0 },
    { pos: [4.5, 3.8, -7], speed: 1.2, offset: 0.8 },
  ];

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Envelope gentle float above pedestal
    if (envelopeRef.current) {
      envelopeRef.current.position.y = 1.35 + Math.sin(t * 1.5) * 0.04;
      envelopeRef.current.rotation.y = Math.sin(t * 0.8) * 0.05;
    }

    // Letter reveal animation on opening
    if (letterRef.current) {
      const targetY = isOpened ? 0.35 : 0;
      letterRef.current.position.y = THREE.MathUtils.lerp(
        letterRef.current.position.y,
        targetY,
        delta * 3
      );
    }
  });

  const handleSealClick = (e: any) => {
    e.stopPropagation();
    setIsOpened(true);
    // Play romantic wax crack and chime audio effects
    try {
      audioEngine.playWaxSealCrack();
      setTimeout(() => {
        audioEngine.playChime();
      }, 120);
    } catch {
      // Audio engine graceful fallback
    }
    // Open parchment letter modal with slight delay for the visual seal crack
    setTimeout(() => {
      setIsLetterModalOpen(true);
    }, 450);
  };

  return (
    <group position={[0, 0, -685]}>
      {/* Deep Starlit Navy Atmosphere & Volumetric Lantern Light */}
      <directionalLight position={[0, 8, 4]} color="#e0e7ff" intensity={1.2} />
      <pointLight position={[0, 2.5, 0]} color="#fef08a" intensity={2.2} distance={15} />

      {/* Floating Star / Firefly Embers */}
      <Sparkles
        count={70}
        scale={14}
        size={3.2}
        speed={0.3}
        opacity={0.8}
        color="#fef08a"
      />

      {/* Ground: Midnight Forest Clearing Meadow */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0b0816" roughness={0.8} />
      </mesh>

      {/* Warm Floating Sky Lanterns */}
      {lanterns.map((l, i) => (
        <group key={i} position={[l.pos[0], l.pos[1], l.pos[2]]}>
          {/* Paper Lantern Body */}
          <mesh>
            <cylinderGeometry args={[0.22, 0.28, 0.6, 16]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#f97316"
              emissiveIntensity={0.6}
              roughness={0.4}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Lantern Inner Glow PointLight */}
          <pointLight color="#fde047" intensity={0.9} distance={4} />
        </group>
      ))}

      {/* Elegant Translucent Marble Pedestal */}
      <group position={[0, 0, 0]}>
        {/* Base Tier */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.1, 1.2, 0.4, 32]} />
          <meshPhysicalMaterial
            color="#cbd5e1"
            roughness={0.25}
            metalness={0.1}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
          />
        </mesh>
        {/* Column Shaft */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.65, 0.8, 0.6, 32]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            roughness={0.2}
            metalness={0.1}
            clearcoat={0.7}
            clearcoatRoughness={0.12}
          />
        </mesh>
        {/* Pedestal Capital / Top Plinth with subtle marble subsurface sheen */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 0.75, 0.15, 32]} />
          <meshPhysicalMaterial
            color="#f8fafc"
            roughness={0.18}
            metalness={0.1}
            clearcoat={0.85}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Marble Pedestal Ground Contact Shadow */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.8}
          scale={7}
          blur={2.0}
          far={3.5}
          frames={1}
        />
      </group>

      {/* INTERACTIVE 3D ENVELOPE & WAX SEAL */}
      <group ref={envelopeRef} position={[0, 1.35, 0]}>
        {/* Envelope Body */}
        <mesh
          position={[0, 0, 0]}
          rotation={[0.35, 0, 0]}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
          onClick={handleSealClick}
        >
          <boxGeometry args={[1.2, 0.8, 0.08]} />
          <meshStandardMaterial
            color={isHovered ? "#fffbeb" : "#fef3c7"}
            roughness={0.7}
          />
        </mesh>

        {/* Envelope Flap */}
        <mesh
          position={[0, 0.28, 0.045]}
          rotation={[isOpened ? -1.8 : 0.35, 0, 0]}
          onClick={handleSealClick}
        >
          <coneGeometry args={[0.65, 0.45, 3]} />
          <meshStandardMaterial color="#fde68a" roughness={0.7} />
        </mesh>

        {/* Crackable Red Wax Seal with Sivsha Emblem */}
        <mesh
          ref={sealRef}
          position={[0, 0.12, 0.08]}
          rotation={[0.35, 0, 0]}
          scale={isHovered ? 1.15 : 1.0}
          onClick={handleSealClick}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
          <meshStandardMaterial
            color={isOpened ? "#991b1b" : "#dc2626"}
            roughness={0.2}
            metalness={0.4}
            emissive={isHovered ? "#ef4444" : "#7f1d1d"}
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Gold particle burst & pulsing prompt when unopened */}
        {!isOpened && (
          <>
            <group position={[0, -0.22, 0.15]}>
              <Sparkles count={24} scale={1.2} size={2.2} speed={0.6} color="#fde047" opacity={0.8} />
            </group>
            <group position={[0, 0.72, 0.1]}>
              <Text
                fontSize={0.095}
                color="#fef08a"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.12}
              >
                TAP TO OPEN
              </Text>
            </group>
          </>
        )}

        {/* Authentic Letter paper sliding out when opened */}
        <group ref={letterRef} position={[0, 0, 0.02]} rotation={[0.35, 0, 0]}>
          <LetterPaper />
        </group>
      </group>

      {/* Final Cinematic Title & Subtitle */}
      <group position={[0, 3.4, -3.5]}>
        <Text
          fontSize={0.26}
          color="#fff1f2"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.14}
        >
          MEMORIES OF SIVSHA
        </Text>
        <Text
          position={[0, -0.38, 0]}
          fontSize={0.11}
          color="#fbcfe8"
          anchorX="center"
          anchorY="middle"
        >
          Every picture is a place we once existed together.
        </Text>
      </group>
    </group>
  );
}
