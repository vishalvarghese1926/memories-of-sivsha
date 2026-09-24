"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import { useSceneProgress } from "@/lib/useSceneProgress";

interface Act1BeforeProps {
  localProgress?: number;
}

/**
 * =========================================================================
 * ACT I: BEFORE WE MET (z: -18 to -44)
 * =========================================================================
 *
 * Art Direction: Luxury Editorial / Golden Dawn
 * Palette: Obsidian slate, brushed warm champagne gold, amber dawn light
 *
 * Narrative Focus:
 * - Two separate worlds before paths crossed
 * - Exact supplied childhood photo (Before-meeting.jpeg) framed prominently
 * - Sivani walking serenely ahead along the obsidian dawn path
 */
export default function Act1Before({ localProgress = 0 }: Act1BeforeProps) {
  const { getProgress } = useSceneProgress("m-1", localProgress);
  const girlAvatarRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Character walking progression driven by real-time scroll progress
    if (girlAvatarRef.current) {
      const currentLocal = getProgress();
      // Progress 0: z = -22.5 (entering dawn pathway)
      // Progress 1: z = -38.5 (approaching college entrance)
      const targetZ = THREE.MathUtils.lerp(-22.5, -38.5, currentLocal);
      girlAvatarRef.current.position.z = THREE.MathUtils.lerp(
        girlAvatarRef.current.position.z,
        targetZ,
        Math.min(1, delta * 5)
      );

      if (!reducedMotion) {
        // Natural, restrained walking cadence
        const walkCycle = time * 3.2;
        girlAvatarRef.current.position.y = 0.02 + Math.sin(walkCycle) * 0.015;
        girlAvatarRef.current.rotation.y = Math.sin(walkCycle * 0.5) * 0.025;
      } else {
        girlAvatarRef.current.position.y = 0.02;
        girlAvatarRef.current.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. WARM DAWN ATMOSPHERIC LIGHTING */}
      <directionalLight
        position={[8, 12, -26]}
        color="#fff1e6"
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <pointLight position={[2, 3.5, -28]} color="#fde68a" intensity={1.5} distance={16} />
      <ambientLight color="#1a1524" intensity={0.7} />

      {/* 2. CONTINUOUS OBSIDIAN SLATE PATHWAY (z: -16 to -44) */}
      <mesh position={[0, -0.04, -30]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.2, 28]} />
        <meshStandardMaterial
          color="#0f0c16"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Brushed Champagne Gold Ground Borders */}
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={`border-${i}`} position={[x, -0.02, -30]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 28]} />
          <meshStandardMaterial
            color="#d4af37"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Subtle Inlaid Floor Waypoint Markers */}
      {[-38, -32, -26, -20].map((z, idx) => (
        <mesh key={`marker-${idx}`} position={[0, -0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.02]} />
          <meshStandardMaterial color="#c8b28a" roughness={0.5} opacity={0.6} transparent />
        </mesh>
      ))}

      {/* 3. HERO CHILDHOOD PHOTOGRAPH (Before-meeting.jpeg) */}
      {/* Framed prominently along the pathway right side, angled gently to the passing camera */}
      <group position={[1.45, 1.85, -27.5]} rotation={[0, -0.26, 0]}>
        {/* Understated Minimal Pedestal Base */}
        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 1.6, 16]} />
          <meshStandardMaterial color="#2d2938" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.08, 24]} />
          <meshStandardMaterial color="#1a1625" roughness={0.8} />
        </mesh>

        {/* Real Photograph Frame via FloatingMediaFrame */}
        <FloatingMediaFrame
          milestoneId="m-1"
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={1.05}
          width={2.2}
          height={1.3}
        />
      </group>

      {/* 4. SIVANI CHARACTER AVATAR (WALKING ALONG DAWN PATH) */}
      <group ref={girlAvatarRef} position={[0, 0, -22.5]}>
        <CharacterGirl pose="walking" scale={1.0} />
        {/* Soft Ground Contact Shadow */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.65}
          scale={3.2}
          blur={1.6}
          far={2.5}
          frames={1}
        />
      </group>
    </group>
  );
}
