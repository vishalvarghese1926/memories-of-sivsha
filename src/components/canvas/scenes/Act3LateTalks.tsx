"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles, Text, ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";

interface Act3LateTalksProps {
  localProgress: number;
}

export default function Act3LateTalks({ localProgress }: Act3LateTalksProps) {
  const phoneGlowRef = useRef<THREE.PointLight>(null);
  const card1Ref = useRef<THREE.Group>(null);
  const card2Ref = useRef<THREE.Group>(null);
  const card3Ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle breathing pulse of smartphone screen glow
    if (phoneGlowRef.current) {
      phoneGlowRef.current.intensity = 0.65 + Math.sin(t * 3.0) * 0.1;
    }

    // Smooth scroll-driven floating message card animation
    // Card 1: 0.10 -> 0.40
    if (card1Ref.current) {
      const alpha1 = THREE.MathUtils.clamp((localProgress - 0.1) / 0.25, 0, 1);
      card1Ref.current.position.y = 1.9 + Math.sin(t * 1.2) * 0.03 + (1 - alpha1) * -0.2;
      card1Ref.current.scale.setScalar(alpha1);
    }

    // Card 2: 0.40 -> 0.70
    if (card2Ref.current) {
      const alpha2 = THREE.MathUtils.clamp((localProgress - 0.4) / 0.25, 0, 1);
      card2Ref.current.position.y = 1.35 + Math.sin(t * 1.4 + 1) * 0.03 + (1 - alpha2) * -0.2;
      card2Ref.current.scale.setScalar(alpha2);
    }

    // Card 3: 0.70 -> 0.95
    if (card3Ref.current) {
      const alpha3 = THREE.MathUtils.clamp((localProgress - 0.7) / 0.22, 0, 1);
      card3Ref.current.position.y = 0.8 + Math.sin(t * 1.6 + 2) * 0.03 + (1 - alpha3) * -0.2;
      card3Ref.current.scale.setScalar(alpha3);
    }
  });

  return (
    <group position={[0, 0, -290]}>
      {/* ========================================================================= */}
      {/* 1. DEEP NIGHT SKY & SUBTLE STARS                                          */}
      {/* ========================================================================= */}
      {/* Cool Starlit Night Light */}
      <directionalLight position={[0, 8, 4]} color="#38bdf8" intensity={0.4} />
      <ambientLight color="#0c0f1d" intensity={0.7} />

      {/* Gentle Constellation & Star Embers (controlled, subtle) */}
      <Sparkles
        count={45}
        scale={[18, 12, 12]}
        size={1.6}
        speed={0.2}
        opacity={0.65}
        color="#e0e7ff"
      />

      {/* ========================================================================= */}
      {/* 2. QUIET NIGHTTIME SETTING (Serene Balcony / Highway Overlook)             */}
      {/* ========================================================================= */}
      {/* Dark Floor Terrace */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#090a10" roughness={0.85} />
      </mesh>

      {/* Minimalist Railing */}
      <group position={[0, 0, -2.5]}>
        {/* Top Rail */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[12, 0.06, 0.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Bottom Rail */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[12, 0.04, 0.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Railing Vertical Slats */}
        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((rx, idx) => (
          <mesh key={idx} position={[rx, 0.6, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.85, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Soft Warm Streetlamp / Terrace Lamp in Background */}
      <group position={[-3.8, 0, -1.8]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 3.2, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <pointLight position={[0, 3.2, 0]} color="#fde047" intensity={0.9} distance={8} />
      </group>

      {/* ========================================================================= */}
      {/* 3. PROCEDURAL CHARACTERS IN RELAXED NIGHTTIME POSTURE                     */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Boy (Vishal): Relaxed sitting/leaning on the terrace, holding phone */}
        <group position={[-0.9, 0, -0.4]}>
          <CharacterBoy
            pose="idle"
            scale={0.94}
            rotation={[0, 0.35, 0]}
            lookAtTarget={[-0.2, 1.2, 0.2]}
            windIntensity={0.2}
          />
          {/* Smartphone device */}
          <mesh position={[0.22, 1.05, 0.28]} rotation={[0.4, 0.2, 0]}>
            <boxGeometry args={[0.12, 0.22, 0.015]} />
            <meshStandardMaterial color="#020617" roughness={0.3} />
          </mesh>
          {/* Smartphone Screen Glow */}
          <pointLight
            ref={phoneGlowRef}
            position={[0.22, 1.1, 0.3]}
            color="#38bdf8"
            intensity={0.65}
            distance={2.0}
          />
        </group>

        {/* Girl (Sivani): Relaxed posture, quiet nighttime presence */}
        <group position={[0.85, 0, -0.3]}>
          <CharacterGirl
            pose="idle"
            scale={0.94}
            rotation={[0, -0.3, 0]}
            lookAtTarget={[-0.4, 1.25, 0]}
            windIntensity={0.25}
          />
        </group>

        {/* Terrace Contact Shadows */}
        <ContactShadows
          position={[0, 0.01, -0.3]}
          opacity={0.75}
          scale={4.8}
          blur={1.8}
          far={2.2}
          frames={1}
        />
      </group>

      {/* ========================================================================= */}
      {/* 4. FLOATING PHONE / MESSAGE UI (EXACT PROJECT DATA ONLY)                   */}
      {/* Message 1: "Somewhere between those conversations…"                       */}
      {/* Message 2: "…we stopped being just friends."                             */}
      {/* Message 3: "…we just hadn’t said it out loud yet."                         */}
      {/* No hearts. No cheesy neon. Intimate, understated glass cards.             */}
      {/* ========================================================================= */}
      <group position={[0.3, 0, 0.6]}>
        {/* Message Card 1 */}
        <group ref={card1Ref} position={[0, 1.9, 0]}>
          {/* Glass Card Backing */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.7, 0.42, 0.02]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.3}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Message Text */}
          <Text
            position={[-1.2, 0.02, 0.02]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.105}
            color="#f1f5f9"
            maxWidth={2.4}
            font={undefined}
          >
            Somewhere between those conversations…
          </Text>
          {/* Subtle Timestamp */}
          <Text
            position={[1.15, -0.12, 0.02]}
            anchorX="right"
            anchorY="middle"
            fontSize={0.065}
            color="#64748b"
          >
            01:42 AM · Read
          </Text>
        </group>

        {/* Message Card 2 */}
        <group ref={card2Ref} position={[0.2, 1.35, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.5, 0.42, 0.02]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.3}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
          <Text
            position={[-1.1, 0.02, 0.02]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.105}
            color="#f8fafc"
            maxWidth={2.2}
          >
            …we stopped being just friends.
          </Text>
          <Text
            position={[1.05, -0.12, 0.02]}
            anchorX="right"
            anchorY="middle"
            fontSize={0.065}
            color="#64748b"
          >
            02:08 AM · Read
          </Text>
        </group>

        {/* Message Card 3 */}
        <group ref={card3Ref} position={[0, 0.8, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.8, 0.42, 0.02]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.3}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
          <Text
            position={[-1.25, 0.02, 0.02]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.105}
            color="#e2e8f0"
            maxWidth={2.5}
          >
            …we just hadn’t said it out loud yet.
          </Text>
          <Text
            position={[1.2, -0.12, 0.02]}
            anchorX="right"
            anchorY="middle"
            fontSize={0.065}
            color="#64748b"
          >
            02:34 AM · Read
          </Text>
        </group>
      </group>
    </group>
  );
}
