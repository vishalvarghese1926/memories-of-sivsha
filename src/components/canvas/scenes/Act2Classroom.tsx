"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";

interface Act2ClassroomProps {
  progress?: number;
}

// Procedural Marine Engineering Blackboard Texture
function createClassroomBoardTexture(): THREE.CanvasTexture {
  if (typeof window === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Blackboard base slate
    ctx.fillStyle = "#0c281e";
    ctx.fillRect(0, 0, 512, 256);

    // Chalk dust patina
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(
        Math.random() * 500,
        Math.random() * 240,
        Math.random() * 60 + 10,
        Math.random() * 12 + 2
      );
    }

    // Title banner
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 15px monospace";
    ctx.fillText("NAVAL ARCHITECTURE & PROPULSION SYSTEMS", 24, 32);

    ctx.strokeStyle = "rgba(254, 240, 138, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 38);
    ctx.lineTo(488, 38);
    ctx.stroke();

    // Hull Waterline Schematic
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, 120);
    ctx.bezierCurveTo(90, 155, 180, 155, 230, 105);
    ctx.lineTo(230, 85);
    ctx.lineTo(48, 85);
    ctx.closePath();
    ctx.stroke();

    // Waterline hatch
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    for (let x = 50; x < 220; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x + 10, 130);
      ctx.stroke();
    }
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "11px monospace";
    ctx.fillText("DWL (Designed Waterline)", 40, 175);

    // 4-Blade Propeller Diagram
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(360, 110, 16, 0, Math.PI * 2);
    ctx.stroke();

    const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    angles.forEach((ang) => {
      ctx.beginPath();
      ctx.ellipse(
        360 + Math.cos(ang) * 32,
        110 + Math.sin(ang) * 32,
        22,
        10,
        ang,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    });

    ctx.fillStyle = "#6ee7b7";
    ctx.font = "11px monospace";
    ctx.fillText("Fixed Pitch Propeller (P/D = 0.88)", 265, 175);

    // Engineering Equations
    ctx.fillStyle = "#f8fafc";
    ctx.font = "12px monospace";
    ctx.fillText("η_prop = (T · V_a) / (2π · n · Q)", 28, 215);
    ctx.fillText("P_brake = 2π N · τ / 60,000 [kW]", 270, 215);

    // Wooden Frame Border
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 248);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

export default function Act2Classroom({ progress = 0 }: Act2ClassroomProps) {
  const boyRef = useRef<THREE.Group>(null);
  const sivaniRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const bgStudentsRef = useRef<THREE.Group>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const boardTexture = useMemo(() => createClassroomBoardTexture(), []);

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      boardTexture.dispose();
    };
  }, [boardTexture]);

  // Subtle sunbeam dust particles
  const dustCount = 35;
  const [dustPositions] = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = -5 + Math.random() * 8; // Window side
      pos[i * 3 + 1] = 0.8 + Math.random() * 2.8;
      pos[i * 3 + 2] = -5 + Math.random() * 10;
    }
    return [pos];
  }, [dustCount]);

  // Normalized scroll choreography within m-4 (0.00 -> 1.00)
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  // Dynamic Boy LookAt target based on sequence:
  // 0.00-0.38: Writing notes in his open desk notebook [-1.2, 0.72, 3.4]
  // 0.38-0.55: Head lifts slightly toward blackboard [0, 2.2, -6.8]
  // 0.55-0.70: Attention catches Sivani, shifts toward [0.8, 1.25, -2.8]
  // 0.70-0.84: Subtle sustained noticing gaze toward Sivani
  // 0.84-1.00: Naturally eases back toward front blackboard / lecture
  const boyLookTarget = useMemo((): [number, number, number] => {
    if (p < 0.38) {
      return [-1.2, 0.72, 3.4];
    } else if (p < 0.55) {
      const sub = (p - 0.38) / 0.17;
      return [
        THREE.MathUtils.lerp(-1.2, -0.4, sub),
        THREE.MathUtils.lerp(0.72, 1.8, sub),
        THREE.MathUtils.lerp(3.4, -4.0, sub),
      ];
    } else if (p < 0.70) {
      const sub = (p - 0.55) / 0.15;
      return [
        THREE.MathUtils.lerp(-0.4, 0.8, sub),
        THREE.MathUtils.lerp(1.8, 1.25, sub),
        THREE.MathUtils.lerp(-4.0, -2.8, sub),
      ];
    } else if (p < 0.84) {
      return [0.8, 1.25, -2.8];
    } else {
      const sub = (p - 0.84) / 0.16;
      return [
        THREE.MathUtils.lerp(0.8, 0.0, sub),
        THREE.MathUtils.lerp(1.25, 2.0, sub),
        THREE.MathUtils.lerp(-2.8, -6.5, sub),
      ];
    }
  }, [p]);

  // Sivani LookAt target:
  // 0.00-0.75: Attentive to lecture & blackboard [0, 2.2, -7]
  // 0.75-0.84: Subtle natural glance / adjustment toward left side
  // 0.84-1.00: Returns to blackboard and note-taking
  const sivaniLookTarget = useMemo((): [number, number, number] => {
    if (p >= 0.75 && p <= 0.84) {
      const sub = Math.sin(((p - 0.75) / 0.09) * Math.PI);
      return [
        THREE.MathUtils.lerp(0, -0.6, sub * 0.4),
        1.3,
        THREE.MathUtils.lerp(-7, -0.5, sub * 0.3),
      ];
    }
    return [0, 2.2, -7];
  }, [p]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Subtle drift in window dust (zero-allocation continuous rotation)
    if (dustRef.current && !reducedMotion) {
      dustRef.current.rotation.y = t * 0.04;
      dustRef.current.position.y = 1.8 + Math.sin(t * 0.6) * 0.06;
    }

    // Background students subtle asynchronous breathing & writing
    if (bgStudentsRef.current && !reducedMotion) {
      bgStudentsRef.current.children.forEach((child, i) => {
        const offset = i * 1.35;
        child.position.y = Math.sin(t * 1.5 + offset) * 0.006;
      });
    }
  });

  return (
    <group position={[0, 0, -118]} name="act2-classroom">
      {/* ======================================================================= */}
      {/* 1. ROOM ARCHITECTURE & STRUCTURAL SHELL                                 */}
      {/* ======================================================================= */}
      {/* Classroom Parquet Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 20]} />
        <meshStandardMaterial color="#1a1824" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Ceiling with acoustic depth */}
      <mesh position={[0, 4.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 20]} />
        <meshStandardMaterial color="#0f0e17" roughness={0.8} />
      </mesh>

      {/* Structural Ceiling Beams */}
      {[-6, -2, 2, 6].map((zBeam) => (
        <mesh key={`beam-${zBeam}`} position={[0, 4.05, zBeam]}>
          <boxGeometry args={[14.1, 0.3, 0.4]} />
          <meshStandardMaterial color="#161421" roughness={0.7} />
        </mesh>
      ))}

      {/* Front Wall with chalkboard backing */}
      <mesh position={[0, 2.1, -7.5]}>
        <planeGeometry args={[14, 4.2]} />
        <meshStandardMaterial color="#13111d" roughness={0.8} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.1, 7.5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 4.2]} />
        <meshStandardMaterial color="#13111d" roughness={0.8} />
      </mesh>

      {/* Right Wall with engineering notice poster */}
      <mesh position={[7, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 4.2]} />
        <meshStandardMaterial color="#151320" roughness={0.85} />
      </mesh>

      {/* Left Wall with Windows */}
      <group position={[-7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 2.1, 0]}>
          <planeGeometry args={[20, 4.2]} />
          <meshStandardMaterial color="#13111d" roughness={0.8} />
        </mesh>
        {/* Window Cutout Frames & Soft Daylight Ingress */}
        {[-4, 0, 4].map((wZ) => (
          <group key={`win-${wZ}`} position={[wZ, 2.3, -0.05]}>
            {/* Window Glass Pane */}
            <mesh>
              <planeGeometry args={[2.4, 2.0]} />
              <meshPhysicalMaterial
                color="#bae6fd"
                transmission={0.75}
                opacity={0.35}
                transparent
                roughness={0.2}
              />
            </mesh>
            {/* Window Mullions / Frame */}
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[2.5, 0.08, 0.04]} />
              <meshStandardMaterial color="#2d2b3d" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.08, 2.1, 0.04]} />
              <meshStandardMaterial color="#2d2b3d" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ======================================================================= */}
      {/* 2. CLASSROOM LIGHTING                                                   */}
      {/* ======================================================================= */}
      {/* Soft Window Daylight Streaming In */}
      <directionalLight
        position={[-6.8, 3.8, -2]}
        target-position={[1, 0.8, 0]}
        intensity={0.75}
        color="#e0f2fe"
        castShadow
        shadow-bias={-0.001}
      />

      {/* Warm Front Blackboard Key Light */}
      <spotLight
        position={[0, 3.9, -4.5]}
        target-position={[0, 2.0, -7.4]}
        angle={0.75}
        penumbra={0.6}
        intensity={1.2}
        color="#fef3c7"
      />

      {/* Subtle Overhead Ambient Troffers */}
      <pointLight position={[0, 3.8, 1.5]} intensity={0.5} color="#e2e8f0" distance={10} />

      {/* ======================================================================= */}
      {/* 3. FRONT TEACHER & BLACKBOARD AREA                                      */}
      {/* ======================================================================= */}
      {/* Large Marine Propulsion Blackboard */}
      <mesh position={[0, 2.2, -7.4]} castShadow receiveShadow>
        <planeGeometry args={[5.8, 2.4]} />
        <meshStandardMaterial map={boardTexture} roughness={0.4} />
      </mesh>

      {/* Chalk Tray & Duster */}
      <mesh position={[0, 0.98, -7.32]}>
        <boxGeometry args={[5.8, 0.06, 0.12]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[-0.8, 1.03, -7.3]}>
        <boxGeometry args={[0.2, 0.04, 0.08]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>

      {/* Teacher Podium / Lectern */}
      <group position={[-2.4, 0, -5.8]}>
        {/* Podium Base & Stand */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.75, 1.2, 0.5]} />
          <meshStandardMaterial color="#3f1d0b" roughness={0.65} />
        </mesh>
        {/* Angled Reading Shelf */}
        <mesh position={[0, 1.22, -0.05]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.85, 0.05, 0.55]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
        {/* Lecture Notes Binder */}
        <mesh position={[0.05, 1.27, -0.05]} rotation={[0.2, 0.05, 0]}>
          <boxGeometry args={[0.36, 0.03, 0.45]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>
      </group>

      {/* ======================================================================= */}
      {/* 4. STUDENT DESKS & CHAIRS SETUP                                         */}
      {/* ======================================================================= */}
      {/* Row 1 (Front Row): Sivani at x: +0.8, Empty desk at x: -1.2 */}
      {/* Front Right Desk — Sivani's Desk */}
      <group position={[0.8, 0, -2.8]}>
        {/* Desktop Surface */}
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Steel Desk Frame & Legs */}
        <mesh position={[-0.68, 0.36, -0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.68, 0.36, -0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.68, 0.36, 0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.68, 0.36, 0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Sivani's Open Notebook */}
        <mesh position={[-0.1, 0.76, 0.04]} rotation={[0, 0.04, 0]}>
          <boxGeometry args={[0.32, 0.015, 0.24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        {/* Sivani's Pen */}
        <mesh position={[0.18, 0.76, 0.04]} rotation={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
          <meshStandardMaterial color="#be185d" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Pastel Water Bottle */}
        <mesh position={[0.55, 0.88, -0.15]}>
          <cylinderGeometry args={[0.045, 0.045, 0.24, 12]} />
          <meshStandardMaterial color="#fda4af" roughness={0.3} />
        </mesh>
      </group>

      {/* Front Left Desk */}
      <group position={[-1.2, 0, -2.8]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Backpack hanging on chair side hook */}
        <mesh position={[-0.72, 0.42, 0.15]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.14, 0.38, 0.28]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
      </group>

      {/* Middle Row 1 (z = -0.6) */}
      <group position={[-1.2, 0, -0.6]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
        {/* Notebook */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[0.3, 0.015, 0.22]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.8, 0, -0.6]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
        {/* Engineering Textbook */}
        <mesh position={[-0.1, 0.77, 0]} rotation={[0, -0.05, 0]}>
          <boxGeometry args={[0.26, 0.03, 0.34]} />
          <meshStandardMaterial color="#047857" roughness={0.7} />
        </mesh>
      </group>

      {/* Middle Row 2 (z = 1.6) */}
      <group position={[-1.2, 0, 1.6]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.8, 0, 1.6]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
        <mesh position={[0.5, 0.88, -0.15]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Row 4 (Back Row): Boy at x: -1.2, z: 3.8 */}
      <group position={[-1.2, 0, 3.8]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Desk Legs */}
        <mesh position={[-0.68, 0.36, -0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.68, 0.36, -0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.68, 0.36, 0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.68, 0.36, 0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Boy's Grid Notebook & Pen */}
        <mesh position={[-0.08, 0.76, 0.02]} rotation={[0, -0.06, 0]}>
          <boxGeometry args={[0.34, 0.015, 0.26]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </mesh>
        <mesh position={[0.2, 0.76, 0.05]} rotation={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Boy's backpack on floor next to desk */}
        <mesh position={[-0.88, 0.25, 0.2]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.25, 0.45, 0.32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      <group position={[0.8, 0, 3.8]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} />
        </mesh>
      </group>

      {/* ======================================================================= */}
      {/* 5. HERO CHARACTERS (SIVANI FRONT, BOY BACK)                              */}
      {/* ======================================================================= */}
      {/* SIVANI — Seated in Front Row (z: -2.8, x: +0.8) */}
      <group ref={sivaniRef} position={[0.8, -0.2, -2.45]}>
        <CharacterGirl
          pose="sitting"
          scale={0.86}
          rotation={[0, 0, 0]}
          lookAtTarget={sivaniLookTarget}
          castShadow
          receiveShadow
        />
      </group>

      {/* BOY (YOU) — Seated in Back Row (z: +3.8, x: -1.2) */}
      <group ref={boyRef} position={[-1.2, -0.2, 4.15]}>
        <CharacterBoy
          pose="sitting"
          scale={0.88}
          rotation={[0, 0, 0]}
          lookAtTarget={boyLookTarget}
          castShadow
          receiveShadow
        />
      </group>

      {/* ======================================================================= */}
      {/* 6. BACKGROUND STUDENTS (LIGHTWEIGHT, SUBTLE ASYNC BREATHING/WRITING)     */}
      {/* ======================================================================= */}
      <group ref={bgStudentsRef}>
        {/* Student 1 (Middle Row 1 Left, x: -1.2, z: -0.25) */}
        <group position={[-1.2, 0, -0.25]}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.85, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.4, 0.05]} castShadow>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.6} />
          </mesh>
          {/* Slight tilt looking at desk notebook */}
          <mesh position={[0, 1.46, 0.02]}>
            <sphereGeometry args={[0.17, 10, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>

        {/* Student 2 (Middle Row 1 Right, x: 0.8, z: -0.25) */}
        <group position={[0.8, 0, -0.25]}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.21, 0.85, 12]} />
            <meshStandardMaterial color="#047857" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.42, 0]} castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
          </mesh>
        </group>

        {/* Student 3 (Middle Row 2 Left, x: -1.2, z: 1.95) */}
        <group position={[-1.2, 0, 1.95]}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.19, 0.23, 0.85, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fdba74" roughness={0.6} />
          </mesh>
        </group>

        {/* Student 4 (Middle Row 2 Right, x: 0.8, z: 1.95) */}
        <group position={[0.8, 0, 1.95]}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.85, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.42, -0.05]} castShadow>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* ======================================================================= */}
      {/* 7. DUST MOTES IN WINDOW SUNLIGHT                                        */}
      {/* ======================================================================= */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustCount}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#fef08a"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Milestone 4: Classroom Lecture Hall Photo Floating Media Frame */}
      <FloatingMediaFrame
        milestoneId="m-4"
        position={[2.4, 2.1, -0.6]}
        rotation={[0, -0.35, 0]}
        scale={0.9}
      />

      {/* Ground Contact Shadow for grounding */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.6}
        scale={14}
        blur={2.2}
        far={4.5}
        frames={1}
      />
    </group>
  );
}
