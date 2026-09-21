"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act3HomeProps {
  localProgress: number;
}

export default function Act3Home({ localProgress }: Act3HomeProps) {
  const steamRef = useRef<THREE.Group>(null);
  const lampLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Gentle tea steam drift
    if (steamRef.current) {
      steamRef.current.position.y = 0.58 + Math.sin(t * 2.0) * 0.02;
    }

    // Warm evening lamp gentle glow
    if (lampLightRef.current) {
      lampLightRef.current.intensity = 1.6 + Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <group position={[0, 0, -625]}>
      {/* Warm Ambient Home Interior Light */}
      <ambientLight color="#2d1e2f" intensity={0.9} />
      <directionalLight position={[4, 6, 2]} color="#fed7aa" intensity={1.2} />

      {/* ========================================================================= */}
      {/* 1. ROOM ARCHITECTURE (Living Room Floor, Walls, Evening Window)          */}
      {/* ========================================================================= */}
      {/* Warm Hardwood Parquet Floor */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#2c1810" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Cozy Textured Area Rug under sofa and table */}
      <mesh position={[0, 0.005, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, -2.8]}>
        <boxGeometry args={[14, 5.2, 0.2]} />
        <meshStandardMaterial color="#1e1b24" roughness={0.8} />
      </mesh>

      {/* Side Wall (Left) with Evening Twilight Window */}
      <group position={[-5.5, 2.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 4.6, 8]} />
          <meshStandardMaterial color="#1e1b24" roughness={0.8} />
        </mesh>
        {/* Window Opening */}
        <mesh position={[0.11, 0.3, 0]}>
          <planeGeometry args={[2.8, 2.2]} />
          <meshBasicMaterial color="#1e102a" />
        </mesh>
        {/* Soft Window Twilight Light */}
        <pointLight position={[0.4, 0.3, 0]} color="#c084fc" intensity={0.6} distance={6} />
      </group>

      {/* ========================================================================= */}
      {/* 2. FURNITURE: COZY 2-SEATER SOFA & COFFEE TABLE                           */}
      {/* ========================================================================= */}
      {/* 2-Seater Sofa / Couch */}
      <group position={[0, 0.35, 0.2]}>
        {/* Sofa Base */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.4, 1.1]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
        {/* Soft Seat Cushions */}
        <mesh position={[-0.55, 0.38, 0.05]} castShadow>
          <boxGeometry args={[1.05, 0.2, 0.9]} />
          <meshStandardMaterial color="#52525b" roughness={0.85} />
        </mesh>
        <mesh position={[0.55, 0.38, 0.05]} castShadow>
          <boxGeometry args={[1.05, 0.2, 0.9]} />
          <meshStandardMaterial color="#52525b" roughness={0.85} />
        </mesh>
        {/* Sofa Backrest */}
        <mesh position={[0, 0.75, 0.45]} castShadow>
          <boxGeometry args={[2.5, 0.75, 0.3]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.8} />
        </mesh>
        {/* Left Armrest */}
        <mesh position={[-1.2, 0.52, 0.05]} castShadow>
          <boxGeometry args={[0.25, 0.45, 1.05]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.8} />
        </mesh>
        {/* Right Armrest */}
        <mesh position={[1.2, 0.52, 0.05]} castShadow>
          <boxGeometry args={[0.25, 0.45, 1.05]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.8} />
        </mesh>
      </group>

      {/* Low Wooden Coffee Table */}
      <group position={[0, 0, -1.0]}>
        {/* Table Top */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.06, 0.9]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} />
        </mesh>
        {/* Four Legs */}
        {[-0.8, 0.8].map((x, xi) =>
          [-0.35, 0.35].map((z, zi) => (
            <mesh key={`${xi}-${zi}`} position={[x, 0.2, z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.6} />
            </mesh>
          ))
        )}

        {/* Two Ceramic Tea Mugs */}
        <group position={[-0.25, 0.46, 0]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.06, 0.12, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        </group>
        <group position={[0.22, 0.46, 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.06, 0.12, 16]} />
            <meshStandardMaterial color="#fb7185" roughness={0.3} />
          </mesh>
        </group>

        {/* Gentle Tea Steam */}
        <group ref={steamRef} position={[0, 0.58, 0]}>
          <mesh position={[-0.25, 0, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#fed7aa" transparent opacity={0.35} />
          </mesh>
          <mesh position={[0.22, 0, 0.05]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#fed7aa" transparent opacity={0.35} />
          </mesh>
        </group>

        {/* Open Photo Album on Table */}
        <mesh position={[0, 0.46, 0.22]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[0.35, 0.25]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 3. WARM STANDING FLOOR LAMP                                               */}
      {/* ========================================================================= */}
      <group position={[2.2, 0, 0.2]}>
        {/* Lamp Base */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Slender Pole */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 2.2, 12]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Conical Lamp Shade */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.22, 0.38, 0.45, 16, 1, true]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.5}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Warm Lamp Light Bulb */}
        <pointLight
          ref={lampLightRef}
          position={[0, 2.1, 0]}
          color="#fde047"
          intensity={1.8}
          distance={8}
        />
      </group>

      {/* Bookshelf & Small Houseplant in Background */}
      <group position={[-2.8, 0, -2.4]}>
        {/* Bookshelf Frame */}
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[1.6, 2.4, 0.4]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
        {/* Small Potted Plant */}
        <group position={[0, 2.6, 0]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.09, 0.18, 12]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 4. CHARACTERS SEATED TOGETHER IN WHOLESOME TOGETHERNESS                   */}
      {/* Side-by-side on the sofa, relaxed and peaceful                           */}
      {/* ========================================================================= */}
      <group position={[0, 0.38, 0.25]}>
        {/* Boy (Vishal): Seated comfortably on sofa */}
        <group position={[-0.45, 0, 0]}>
          <CharacterBoy
            pose="sitting"
            scale={0.92}
            rotation={[0, 0.2, 0]}
            lookAtTarget={[0.45, 1.25, 0]}
          />
        </group>

        {/* Sivani: Seated beside him enjoying peaceful evening */}
        <group position={[0.45, 0, 0]}>
          <CharacterGirl
            pose="sitting"
            scale={0.9}
            rotation={[0, -0.2, 0]}
            lookAtTarget={[-0.45, 1.25, 0]}
          />
        </group>

        {/* Sofa Contact Shadow */}
        <ContactShadows
          position={[0, -0.37, 0]}
          opacity={0.75}
          scale={3.6}
          blur={1.8}
          far={2}
          frames={1}
        />
      </group>

      {/* Milestone 12 Floating Media Frame */}
      <FloatingMediaFrame
        milestoneId="m-12"
        position={[2.8, 2.1, -1.2]}
        rotation={[-0.04, -0.3, 0.02]}
        scale={0.9}
      />
    </group>
  );
}
