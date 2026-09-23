"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act2FriendGroupProps {
  progress?: number;
}

export default function Act2FriendGroup({ progress = 0 }: Act2FriendGroupProps) {
  const youRef = useRef<THREE.Group>(null);
  const sivaniRef = useRef<THREE.Group>(null);
  const underDeskTapRef = useRef<THREE.Group>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Normalized milestone progress for m-5 (0.00 -> 1.00)
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  // Sivani's arm offer / pointing gesture toward the study notes on the table
  // 0.25–0.55: Extends hand forward to point out the solution
  // 0.55–0.72: Holds pointing gesture as You understand
  // 0.72–0.88: Relaxes back toward her notes
  const sivaniOfferProgress = useMemo(() => {
    if (p < 0.25) return 0;
    if (p < 0.45) return (p - 0.25) / 0.2;
    if (p <= 0.72) return 1.0;
    if (p < 0.88) return Math.max(0, 1 - (p - 0.72) / 0.16);
    return 0;
  }, [p]);

  // Sivani LookAt target across study table:
  // 0.00–0.25: Looking at her open notes [0, 0.75, -0.6]
  // 0.25–0.55: Explaining to You, looking up across the table [0, 1.35, 1.2]
  // 0.55–0.72: Looking down at the diagram where she points [0, 0.78, 0]
  // 0.72–0.88: Under-desk playful tap: looking down at textbook with subtle tilt [0.1, 0.76, -0.5]
  // 0.88–1.00: Looking back at group notes [0, 0.75, -0.5]
  const sivaniLookTarget = useMemo((): [number, number, number] => {
    if (p < 0.25) {
      return [0, 0.75, -0.6];
    } else if (p < 0.55) {
      const sub = (p - 0.25) / 0.3;
      return [0, THREE.MathUtils.lerp(0.75, 1.35, sub), THREE.MathUtils.lerp(-0.6, 1.2, sub)];
    } else if (p < 0.72) {
      return [0, 0.78, 0];
    } else if (p < 0.88) {
      return [0.15, 0.8, -0.5];
    } else {
      return [0, 0.75, -0.5];
    }
  }, [p]);

  // You (Boy) LookAt target:
  // 0.00–0.25: Confused, staring at your own notes [0, 0.75, 0.8]
  // 0.25–0.55: Sivani calls attention: You look across at Sivani [0, 1.35, -1.2]
  // 0.55–0.72: You look at the center notes she points to [0, 0.78, 0], understanding!
  // 0.72–0.85: Under-desk tap! You glance down under the desk [0, 0.2, 0.4] then back up
  // 0.85–1.00: Relaxed glance across table, smiling [0, 1.2, -1.2]
  const youLookTarget = useMemo((): [number, number, number] => {
    if (p < 0.25) {
      return [0, 0.75, 0.8];
    } else if (p < 0.55) {
      const sub = (p - 0.25) / 0.3;
      return [0, THREE.MathUtils.lerp(0.75, 1.35, sub), THREE.MathUtils.lerp(0.8, -1.2, sub)];
    } else if (p < 0.72) {
      return [0, 0.78, 0];
    } else if (p < 0.82) {
      const sub = (p - 0.72) / 0.1;
      return [0, THREE.MathUtils.lerp(0.78, 0.25, sub), THREE.MathUtils.lerp(0, 0.35, sub)];
    } else if (p < 0.88) {
      const sub = (p - 0.82) / 0.06;
      return [0, THREE.MathUtils.lerp(0.25, 1.25, sub), THREE.MathUtils.lerp(0.35, -1.2, sub)];
    } else {
      return [0, 1.2, -1.2];
    }
  }, [p]);

  // Under-desk playful leg tap kinematics:
  // During 0.72–0.86, Sivani's foot gently reaches across under the desk
  const underDeskOffset = useMemo(() => {
    if (p >= 0.72 && p <= 0.86) {
      // Sine pulse reaching toward You's foot under desk
      return Math.sin(((p - 0.72) / 0.14) * Math.PI) * 0.18;
    }
    return 0;
  }, [p]);

  return (
    <group position={[0, 0, -152]} name="act2-friend-group">
      {/* ======================================================================= */}
      {/* 1. STUDY ROOM ENVIRONMENT                                               */}
      {/* ======================================================================= */}
      {/* Study Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 16]} />
        <meshStandardMaterial color="#181523" roughness={0.7} metalness={0.08} />
      </mesh>

      {/* Warm Ambient Collegiate Lighting */}
      <pointLight position={[0, 3.2, 0]} intensity={1.4} color="#fef3c7" distance={12} />
      <pointLight position={[-3, 2.5, 2]} intensity={0.4} color="#bae6fd" distance={8} />
      <pointLight position={[3, 2.5, -2]} intensity={0.4} color="#fbcfe8" distance={8} />

      {/* Ambient Fill */}
      <ambientLight intensity={0.4} color="#252136" />

      {/* ======================================================================= */}
      {/* 2. COLLABORATIVE STUDY TABLES (JOINED CENTER TABLE)                      */}
      {/* ======================================================================= */}
      {/* Central Joined Study Table */}
      <group position={[0, 0, 0]}>
        {/* Main Oak Study Surface */}
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.06, 1.8]} />
          <meshStandardMaterial color="#4a2511" roughness={0.65} metalness={0.05} />
        </mesh>

        {/* Heavy Table Legs */}
        {[-2.05, 2.05].map((x) =>
          [-0.78, 0.78].map((z) => (
            <mesh key={`tleg-${x}-${z}`} position={[x, 0.36, z]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.72, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* Center Under-Desk Modesty / Footrest Beam */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[4.1, 0.04, 0.08]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </group>

      {/* ======================================================================= */}
      {/* 3. STUDY CLUTTER & EDUCATIONAL PROPS                                    */}
      {/* ======================================================================= */}
      {/* Center Shared Study Material (Where Sivani points & explains) */}
      <group position={[0, 0.76, 0]}>
        {/* Large Engineering Blueprint Diagram Sheet */}
        <mesh rotation={[-Math.PI / 2, 0, 0.05]} receiveShadow>
          <planeGeometry args={[0.68, 0.48]} />
          <meshStandardMaterial color="#0284c7" roughness={0.7} />
        </mesh>
        {/* Open Spiral Notebook */}
        <mesh position={[0.1, 0.015, -0.05]} rotation={[0, -0.1, 0]}>
          <boxGeometry args={[0.34, 0.02, 0.26]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
        {/* Scientific Calculator */}
        <mesh position={[-0.32, 0.01, 0.1]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.14, 0.018, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Highlighters & Pens */}
        <mesh position={[0.35, 0.01, 0.1]} rotation={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
        <mesh position={[0.38, 0.01, 0.14]} rotation={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.4} />
        </mesh>
      </group>

      {/* Sivani's Side Props (Front Center, z ~ -0.6) */}
      <group position={[0, 0.76, -0.55]}>
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0.05, 0]}>
          <boxGeometry args={[0.32, 0.02, 0.24]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.7} />
        </mesh>
        {/* Water bottle */}
        <mesh position={[0.35, 0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 12]} />
          <meshStandardMaterial color="#fda4af" roughness={0.3} />
        </mesh>
      </group>

      {/* You's Side Props (Back Center, z ~ 0.55) */}
      <group position={[0, 0.76, 0.55]}>
        <mesh position={[0.15, 0, 0]} rotation={[0, -0.08, 0]}>
          <boxGeometry args={[0.32, 0.02, 0.24]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
        </mesh>
        <mesh position={[-0.32, 0.01, 0]} rotation={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
        </mesh>
      </group>

      {/* Friends' props on left & right */}
      <group position={[-1.35, 0.76, -0.4]}>
        <mesh rotation={[0, 0.12, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.22]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      </group>
      <group position={[1.35, 0.76, -0.4]}>
        <mesh rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.28, 0.035, 0.36]} />
          <meshStandardMaterial color="#065f46" roughness={0.7} />
        </mesh>
      </group>
      <group position={[-1.35, 0.76, 0.4]}>
        <mesh rotation={[0, -0.1, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.22]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
      </group>
      <group position={[1.35, 0.76, 0.4]}>
        <mesh rotation={[0, 0.08, 0]}>
          <boxGeometry args={[0.32, 0.02, 0.24]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
      </group>

      {/* ======================================================================= */}
      {/* 4. SIX-PERSON FRIEND GROUP COMPOSITION                                  */}
      {/* BACK ROW: YOU + 2 MALE FRIENDS                                          */}
      {/* FRONT ROW: SIVANI + 2 FEMALE FRIENDS                                    */}
      {/* ======================================================================= */}

      {/* ---------------- FRONT ROW (GIRLS, FACING POSITIVE Z) ---------------- */}
      {/* Sivani (Center Front, x: 0, z: -1.2) */}
      <group ref={sivaniRef} position={[0, -0.2, -1.2]}>
        <CharacterGirl
          pose="sitting"
          scale={0.86}
          rotation={[0, 0, 0]}
          offerProgress={sivaniOfferProgress}
          lookAtTarget={sivaniLookTarget}
          castShadow
          receiveShadow
        />
      </group>

      {/* Female Friend 1 (Left Front, x: -1.4, z: -1.2) */}
      <group position={[-1.4, -0.2, -1.2]}>
        <CharacterGirl
          isHero={false}
          pose="sitting"
          scale={0.82}
          rotation={[0, 0.18, 0]}
          lookAtTarget={[-0.4, 0.8, 0]}
          castShadow
          receiveShadow
        />
      </group>

      {/* Female Friend 2 (Right Front, x: +1.4, z: -1.2) */}
      <group position={[1.4, -0.2, -1.2]}>
        <CharacterGirl
          isHero={false}
          pose="sitting"
          scale={0.82}
          rotation={[0, -0.18, 0]}
          lookAtTarget={[0.2, 0.8, 0]}
          castShadow
          receiveShadow
        />
      </group>

      {/* ---------------- BACK ROW (BOYS, FACING NEGATIVE Z) ------------------ */}
      {/* You / Vishal (Center Back, x: 0, z: +1.2) */}
      <group ref={youRef} position={[0, -0.2, 1.2]}>
        <CharacterBoy
          pose="sitting"
          scale={0.88}
          rotation={[0, Math.PI, 0]}
          lookAtTarget={youLookTarget}
          castShadow
          receiveShadow
        />
      </group>

      {/* Male Friend 1 (Left Back, x: -1.4, z: +1.2) */}
      <group position={[-1.4, -0.2, 1.2]}>
        <CharacterBoy
          isHero={false}
          pose="sitting"
          scale={0.84}
          rotation={[0, Math.PI - 0.22, 0]}
          lookAtTarget={[0, 1.1, 1.2]}
          castShadow
          receiveShadow
        />
      </group>

      {/* Male Friend 2 (Right Back, x: +1.4, z: +1.2) */}
      <group position={[1.4, -0.2, 1.2]}>
        <CharacterBoy
          isHero={false}
          pose="sitting"
          scale={0.84}
          rotation={[0, Math.PI + 0.22, 0]}
          lookAtTarget={[0, 0.9, -1.2]}
          castShadow
          receiveShadow
        />
      </group>

      {/* ======================================================================= */}
      {/* 5. SUBTLE UNDER-DESK PLAYFUL INTERACTION RIG                            */}
      {/* Staged cleanly between You and Sivani under the desk                     */}
      {/* ======================================================================= */}
      <group ref={underDeskTapRef} position={[0, 0.15, -0.1 + underDeskOffset]}>
        {/* Subtle shoe / foot tap indicator geometry grounded under desk */}
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.05, 0.16]} />
          <meshStandardMaterial color="#fb7185" roughness={0.5} />
        </mesh>
      </group>

      {/* Milestone 5: The Friend Group Photo Floating Media Frame */}
      <FloatingMediaFrame
        milestoneId="m-5"
        position={[0, 2.5, -2.0]}
        rotation={[-0.1, 0, 0]}
        scale={0.9}
      />

      {/* Contact Shadows Grounding the entire 6-person study group */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.68}
        scale={16}
        blur={2.4}
        far={4.5}
        frames={1}
      />
    </group>
  );
}
