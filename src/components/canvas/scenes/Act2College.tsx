"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import Act2Classroom from "./Act2Classroom";
import Act2FriendGroup from "./Act2FriendGroup";

interface Act2CollegeProps {
  localProgress?: number;
  penProgress?: number;
  globalProgress?: number;
  classroomProgress?: number;
  friendGroupProgress?: number;
}

// Procedural Marine Engineering Blueprint texture
function createShipBlueprintTexture(): THREE.CanvasTexture {
  if (typeof window === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#0c2340";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 140);
    ctx.bezierCurveTo(70, 180, 180, 180, 228, 130);
    ctx.lineTo(228, 110);
    ctx.lineTo(40, 110);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(38, 155, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 240, 240);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

// Procedural Academic Notice Board texture
function createNoticeBoardTexture(): THREE.CanvasTexture {
  if (typeof window === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, 256, 256);

    const papers = [
      { x: 16, y: 20, w: 90, h: 100, color: "#f8fafc" },
      { x: 120, y: 16, w: 115, h: 110, color: "#f1f5f9" },
      { x: 24, y: 135, w: 105, h: 100, color: "#f8fafc" },
      { x: 145, y: 140, w: 92, h: 95, color: "#fef3c7" },
    ];

    papers.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
      for (let ly = p.y + 16; ly < p.y + p.h - 10; ly += 12) {
        ctx.fillRect(p.x + 8, ly, p.w - 16, 4);
      }
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

export default function Act2College({
  localProgress = 0,
  penProgress = 0,
  globalProgress = 0,
  classroomProgress,
  friendGroupProgress,
}: Act2CollegeProps) {
  // Local progress for Classroom (0.38 - 0.45) and Friend Group (0.45 - 0.53)
  const cProgress =
    classroomProgress ??
    Math.max(0, Math.min(1, (globalProgress - 0.38) / (0.45 - 0.38)));
  const fgProgress =
    friendGroupProgress ??
    Math.max(0, Math.min(1, (globalProgress - 0.45) / (0.53 - 0.45)));
  const charactersGroupRef = useRef<THREE.Group>(null);
  const dustParticlesRef = useRef<THREE.Points>(null);

  // Character & Prop Refs for The Pen Moment
  const userHeadRef = useRef<THREE.Mesh>(null);
  const userRightArmRef = useRef<THREE.Group>(null);
  const fatherGroupRef = useRef<THREE.Group>(null);
  const sivaniHeadRef = useRef<THREE.Mesh>(null);
  const sivaniRightArmRef = useRef<THREE.Group>(null);
  const penRef = useRef<THREE.Group>(null);
  const penWarmLightRef = useRef<THREE.PointLight>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Procedural canvas textures
  const blueprintTexture = useMemo(() => createShipBlueprintTexture(), []);
  const noticeBoardTexture = useMemo(() => createNoticeBoardTexture(), []);

  // Pen prop geometries and materials
  const penBodyGeo = useMemo(() => new THREE.CylinderGeometry(0.016, 0.016, 0.35, 12), []);
  const penTipGeo = useMemo(() => new THREE.ConeGeometry(0.018, 0.05, 12), []);
  const penClipGeo = useMemo(() => new THREE.BoxGeometry(0.01, 0.12, 0.02), []);

  const penBarrelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1e3a8a",
        roughness: 0.3,
        metalness: 0.6,
      }),
    []
  );
  const penMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.15,
        metalness: 0.9,
      }),
    []
  );

  // Dispose scene-owned textures, geometries, and materials on unmount
  useEffect(() => {
    return () => {
      blueprintTexture.dispose();
      noticeBoardTexture.dispose();
      penBodyGeo.dispose();
      penTipGeo.dispose();
      penClipGeo.dispose();
      penBarrelMaterial.dispose();
      penMetalMaterial.dispose();
    };
  }, [
    blueprintTexture,
    noticeBoardTexture,
    penBodyGeo,
    penTipGeo,
    penClipGeo,
    penBarrelMaterial,
    penMetalMaterial,
  ]);

  // Atmospheric dust motes (80 points)
  const dustCount = 80;
  const [dustPositions] = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = 0.5 + Math.random() * 4.5;
      pos[i * 3 + 2] = -46 - Math.random() * 34;
    }
    return [pos];
  }, [dustCount]);

  // Ref to track elapsed time for the 2.5-second emotional hold
  const holdTimerRef = useRef<number>(0);
  const prevPRef = useRef<number>(0);

  // Derived kinematic values for High-Fidelity CharacterBoy & CharacterGirl
  const reachProgress = useMemo(() => {
    if (penProgress >= 0.63 && penProgress <= 0.88) {
      return Math.min(1, (penProgress - 0.63) / 0.09);
    }
    if (penProgress > 0.88) {
      return Math.max(0, 1 - (penProgress - 0.88) / 0.12);
    }
    return 0;
  }, [penProgress]);

  const offerProgress = useMemo(() => {
    if (penProgress >= 0.48 && penProgress <= 0.88) {
      return Math.min(1, (penProgress - 0.48) / 0.15);
    }
    if (penProgress > 0.88) {
      return Math.max(0, 1 - (penProgress - 0.88) / 0.12);
    }
    return 0;
  }, [penProgress]);

  const boyLookTarget = useMemo((): [number, number, number] | undefined => {
    if (penProgress >= 0.68 && penProgress <= 0.90) {
      return [1.4, 1.48, -75.2];
    }
    if (penProgress < 0.3) {
      return [-1.2, 0.75, -74.8];
    }
    return undefined;
  }, [penProgress]);

  const girlLookTarget = useMemo((): [number, number, number] | undefined => {
    if (penProgress >= 0.68 && penProgress <= 0.90) {
      return [-1.2, 1.58, -75.2];
    }
    if (penProgress < 0.3) {
      return [1.4, 0.75, -74.8];
    }
    if (penProgress >= 0.30 && penProgress < 0.48) {
      return [-1.2, 1.5, -75.2];
    }
    return undefined;
  }, [penProgress]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Subtle idle breathing of background figures
    if (charactersGroupRef.current && !reducedMotion) {
      charactersGroupRef.current.children.forEach((charGroup, idx) => {
        const phase = idx * 0.9;
        charGroup.position.y = Math.sin(time * 1.6 + phase) * 0.015;
      });
    }

    // 2. Dust drift in sun shafts
    if (dustParticlesRef.current && !reducedMotion) {
      dustParticlesRef.current.rotation.y = time * 0.01;
      const positions = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < dustCount * 3; i += 3) {
        positions[i] -= delta * 0.08;
        if (positions[i] < 0.3) {
          positions[i] = 4.8;
        }
      }
      dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // =========================================================================
    // 3. PHASE 5C: THE PEN MOMENT KINEMATICS (Driven by penProgress: 0.0 -> 1.0)
    // =========================================================================
    const rawP = THREE.MathUtils.clamp(penProgress, 0, 1);
    const lerpRate = reducedMotion ? 1 : Math.min(1, delta * 6);

    // Track 2.5-second scene-local elapsed cinematic hold at p >= 0.88
    // If user scrolls backwards before 0.88, immediately reset the hold timer
    if (rawP < 0.88) {
      holdTimerRef.current = 0;
    } else {
      // Accumulate real elapsed scene time via R3F delta
      holdTimerRef.current = Math.min(2.5, holdTimerRef.current + delta);
    }
    prevPRef.current = rawP;

    // Calculate effective kinematic progress:
    // When rawP reaches [0.88, 1.00], characters freeze in the mutual look/smile hold pose
    // until holdTimerRef reaches 2.5 seconds of actual elapsed R3F time.
    // Once 2.5s completes, remaining progress (return toward paperwork) resumes.
    const HOLD_DURATION = 2.5;
    const holdProgress = holdTimerRef.current / HOLD_DURATION; // 0.0 -> 1.0
    const isHoldComplete = holdTimerRef.current >= HOLD_DURATION;

    let effectiveP: number;
    if (rawP < 0.88) {
      effectiveP = rawP;
    } else if (!isHoldComplete) {
      // During the 2.5s elapsed hold, pin character pose at 0.88 (look, smile, stable composition)
      effectiveP = 0.88;
    } else {
      // Hold has elapsed 2.5 seconds: map raw scroll progress (0.88-1.00) to return to paperwork
      effectiveP = rawP;
    }

    const p = effectiveP;

    // Target positions & rotations
    let fatherRotY = 0;
    let userHeadRotY = 0;
    let userHeadRotX = 0.2; // default: looking down at paperwork
    let sivaniHeadRotY = 0;
    let sivaniHeadRotZ = 0;

    let sivaniArmRotX = 0;
    let sivaniArmRotZ = 0;
    let userArmRotX = 0;
    let userArmRotZ = 0;

    let penWorldPos = new THREE.Vector3(1.3, 0.85, -75.2);
    let penRotZ = 0;
    let warmLightIntensity = 0.8;

    if (p < 0.18) {
      // Beat 1: Paperwork (0.00-0.18)
      // User & father focused on forms
      userHeadRotX = 0.25;
      userHeadRotY = 0;
      sivaniHeadRotY = 0;
      sivaniArmRotX = 0;
      userArmRotX = 0;
      penWorldPos.set(1.35, 0.85, -75.1);
    } else if (p < 0.30) {
      // Beat 2: Father Asks (0.18-0.30)
      const sub = (p - 0.18) / 0.12;
      fatherRotY = THREE.MathUtils.lerp(0, 0.25, sub);
      userHeadRotY = THREE.MathUtils.lerp(0, 0.22, sub);
      userHeadRotX = 0.1; // looking around for a pen
      penWorldPos.set(1.35, 0.85, -75.1);
    } else if (p < 0.48) {
      // Beat 3: Sivani Notices (0.30-0.48)
      const sub = (p - 0.30) / 0.18;
      fatherRotY = 0.25;
      userHeadRotY = 0.22;
      userHeadRotX = 0.15;
      sivaniHeadRotY = THREE.MathUtils.lerp(0, -0.38, sub); // turns subtly toward user
      sivaniArmRotX = THREE.MathUtils.lerp(0, 0.2, sub); // prepares pen
      penWorldPos.set(
        THREE.MathUtils.lerp(1.35, 1.1, sub),
        THREE.MathUtils.lerp(0.85, 1.0, sub),
        -75.1
      );
    } else if (p < 0.63) {
      // Beat 4: Pen Offer (0.48-0.63)
      const sub = (p - 0.48) / 0.15;
      sivaniHeadRotY = -0.38;
      userHeadRotY = THREE.MathUtils.lerp(0.22, 0.35, sub); // user notices offered pen
      userHeadRotX = 0.1;

      // Sivani extends arm forward across the desk
      sivaniArmRotX = THREE.MathUtils.lerp(0.2, 0.75, sub);
      sivaniArmRotZ = THREE.MathUtils.lerp(0, -0.35, sub);

      // Pen travels in Sivani's hand toward desk center
      penWorldPos.set(
        THREE.MathUtils.lerp(1.1, 0.25, sub),
        THREE.MathUtils.lerp(1.0, 1.15, sub),
        THREE.MathUtils.lerp(-75.1, -74.9, sub)
      );
      penRotZ = THREE.MathUtils.lerp(0, -Math.PI / 4, sub);
      warmLightIntensity = THREE.MathUtils.lerp(0.8, 1.4, sub);
    } else if (p < 0.72) {
      // Beat 5: Acceptance (0.63-0.72)
      const sub = (p - 0.63) / 0.09;
      sivaniHeadRotY = -0.38;
      sivaniArmRotX = 0.75;
      sivaniArmRotZ = -0.35;

      // User extends arm to receive the pen
      userArmRotX = THREE.MathUtils.lerp(0, 0.7, sub);
      userArmRotZ = THREE.MathUtils.lerp(0, 0.3, sub);
      userHeadRotY = 0.35;
      userHeadRotX = 0.05;

      // Pen transfers smoothly from Sivani to User hand
      penWorldPos.set(
        THREE.MathUtils.lerp(0.25, -0.1, sub),
        1.15,
        -74.9
      );
      penRotZ = -Math.PI / 4;
      warmLightIntensity = 1.6;
    } else if (p <= 0.88) {
      // Beat 6: First Look / Smile / Emotional Hold (0.72-0.88)
      // When rawP reaches 0.88, character pose remains held here for 2.5s of elapsed time
      const sub = (p - 0.72) / 0.16;
      // Arms gently rest
      sivaniArmRotX = THREE.MathUtils.lerp(0.75, 0.1, sub);
      sivaniArmRotZ = THREE.MathUtils.lerp(-0.35, 0, sub);
      userArmRotX = THREE.MathUtils.lerp(0.7, 0.35, sub);
      userArmRotZ = THREE.MathUtils.lerp(0.3, 0.1, sub);

      // Both look at each other with subtle gentle head angle
      userHeadRotY = THREE.MathUtils.lerp(0.35, 0.32, sub);
      userHeadRotX = THREE.MathUtils.lerp(0.05, -0.05, sub); // slight warm tilt
      sivaniHeadRotY = THREE.MathUtils.lerp(-0.38, -0.32, sub);
      sivaniHeadRotZ = THREE.MathUtils.lerp(0, 0.06, sub); // gentle head tilt

      // Pen held securely in User's hand
      penWorldPos.set(-0.35, 1.1, -74.95);
      penRotZ = -Math.PI / 5;
      warmLightIntensity = 1.7;
    } else {
      // Beat 7: Return to Paperwork (0.88-1.00) — resumes after 2.5s hold elapsed
      const sub = (p - 0.88) / 0.12;
      // User turns back toward admission paperwork with pen in hand
      userHeadRotX = THREE.MathUtils.lerp(-0.05, 0.28, sub);
      userHeadRotY = THREE.MathUtils.lerp(0.32, 0.05, sub);
      userArmRotX = THREE.MathUtils.lerp(0.35, 0.45, sub); // pen over paperwork

      // Sivani turns back toward her parent and forms
      sivaniHeadRotY = THREE.MathUtils.lerp(-0.32, 0, sub);
      sivaniHeadRotZ = THREE.MathUtils.lerp(0.06, 0, sub);
      sivaniArmRotX = THREE.MathUtils.lerp(0.1, 0, sub);

      // Pen resting over forms on desk
      penWorldPos.set(
        THREE.MathUtils.lerp(-0.35, -0.6, sub),
        THREE.MathUtils.lerp(1.1, 1.04, sub),
        -75.0
      );
      penRotZ = THREE.MathUtils.lerp(-Math.PI / 5, -Math.PI / 6, sub);
      warmLightIntensity = THREE.MathUtils.lerp(1.7, 1.0, sub);
    }

    // Apply smooth updates
    if (userHeadRef.current) {
      userHeadRef.current.rotation.x = THREE.MathUtils.lerp(
        userHeadRef.current.rotation.x,
        userHeadRotX,
        lerpRate
      );
      userHeadRef.current.rotation.y = THREE.MathUtils.lerp(
        userHeadRef.current.rotation.y,
        userHeadRotY,
        lerpRate
      );
    }
    if (sivaniHeadRef.current) {
      sivaniHeadRef.current.rotation.y = THREE.MathUtils.lerp(
        sivaniHeadRef.current.rotation.y,
        sivaniHeadRotY,
        lerpRate
      );
      sivaniHeadRef.current.rotation.z = THREE.MathUtils.lerp(
        sivaniHeadRef.current.rotation.z,
        sivaniHeadRotZ,
        lerpRate
      );
    }
    if (fatherGroupRef.current) {
      fatherGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        fatherGroupRef.current.rotation.y,
        fatherRotY,
        lerpRate
      );
    }
    if (sivaniRightArmRef.current) {
      sivaniRightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        sivaniRightArmRef.current.rotation.x,
        sivaniArmRotX,
        lerpRate
      );
      sivaniRightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        sivaniRightArmRef.current.rotation.z,
        sivaniArmRotZ,
        lerpRate
      );
    }
    if (userRightArmRef.current) {
      userRightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        userRightArmRef.current.rotation.x,
        userArmRotX,
        lerpRate
      );
      userRightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        userRightArmRef.current.rotation.z,
        userArmRotZ,
        lerpRate
      );
    }
    if (penRef.current) {
      penRef.current.position.lerp(penWorldPos, lerpRate);
      penRef.current.rotation.z = THREE.MathUtils.lerp(
        penRef.current.rotation.z,
        penRotZ,
        lerpRate
      );
    }
    if (penWarmLightRef.current) {
      penWarmLightRef.current.intensity = THREE.MathUtils.lerp(
        penWarmLightRef.current.intensity,
        warmLightIntensity,
        lerpRate
      );
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 1. EXTERIOR ARRIVAL AREA & ENTRANCE PORTICO (z: -46 to -52)               */}
      {/* ========================================================================= */}
      <group position={[0, 0, -48]}>
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#2d2a3e" roughness={0.7} />
        </mesh>

        {[-3.8, 3.8].map((x, idx) => (
          <mesh key={`portico-col-${idx}`} position={[x, 2.5, 0]}>
            <cylinderGeometry args={[0.32, 0.38, 5.0, 16]} />
            <meshStandardMaterial color="#3f3b52" roughness={0.6} />
          </mesh>
        ))}

        <mesh position={[0, 4.8, 0]}>
          <boxGeometry args={[8.4, 0.5, 0.8]} />
          <meshStandardMaterial color="#332e44" roughness={0.7} />
        </mesh>

        <mesh position={[0, 4.2, 0.4]}>
          <boxGeometry args={[3.2, 0.5, 0.05]} />
          <meshStandardMaterial color="#1e1b29" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[-0.85, 1.4, -0.2]}>
          <boxGeometry args={[1.5, 2.8, 0.08]} />
          <meshStandardMaterial color="#2b2320" roughness={0.5} />
        </mesh>
        <mesh position={[0.85, 1.4, -0.2]}>
          <boxGeometry args={[1.5, 2.8, 0.08]} />
          <meshStandardMaterial color="#2b2320" roughness={0.5} />
        </mesh>

        <pointLight position={[2.5, 3.5, 1.5]} color="#fde68a" intensity={1.4} distance={9} />
      </group>

      {/* ========================================================================= */}
      {/* 2. ENTRANCE CORRIDOR & WAITING AREA (z: -52 to -62)                       */}
      {/* ========================================================================= */}
      <group position={[0, 0, -57]}>
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[11, 14]} />
          <meshStandardMaterial color="#1e1b27" roughness={0.3} metalness={0.25} />
        </mesh>

        <mesh position={[-4.5, 2.5, 0]}>
          <boxGeometry args={[0.25, 5.0, 14]} />
          <meshStandardMaterial color="#2a2536" roughness={0.8} />
        </mesh>
        <mesh position={[4.5, 2.5, 0]}>
          <boxGeometry args={[0.25, 5.0, 14]} />
          <meshStandardMaterial color="#2a2536" roughness={0.8} />
        </mesh>

        {[-3.5, 0, 3.5].map((z, idx) => (
          <group key={`win-${idx}`}>
            <mesh position={[-4.35, 3.2, z]}>
              <boxGeometry args={[0.08, 1.4, 2.0]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#fde047"
                emissiveIntensity={0.35}
                transparent
                opacity={0.7}
              />
            </mesh>
            <pointLight position={[-3.8, 3.2, z]} color="#fef08a" intensity={0.6} distance={6} />
          </group>
        ))}

        <mesh position={[4.35, 2.2, -1]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2.4, 1.5]} />
          <meshStandardMaterial map={noticeBoardTexture} roughness={0.6} />
        </mesh>

        <mesh position={[-4.35, 2.2, -1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.0, 1.4]} />
          <meshStandardMaterial map={blueprintTexture} roughness={0.4} />
        </mesh>

        {[-2.5, -0.5, 1.5].map((z, idx) => (
          <group key={`bench-${idx}`} position={[3.6, 0.45, z]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.6]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
            <mesh position={[0.3, 0.35, 0]}>
              <boxGeometry args={[0.08, 0.6, 0.6]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 3. ADMISSION & FEE OFFICE DESK AREA (z: -62 to -72)                       */}
      {/* ========================================================================= */}
      <group position={[0, 0, -67]}>
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13, 14]} />
          <meshStandardMaterial color="#1c1926" roughness={0.35} metalness={0.2} />
        </mesh>

        <group position={[-1.2, 0, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[4.2, 1.0, 1.1]} />
            <meshStandardMaterial color="#3b2b22" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <boxGeometry args={[4.4, 0.06, 1.25]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.45, 0.1]}>
            <boxGeometry args={[4.0, 0.65, 0.05]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} />
          </mesh>

          <mesh position={[-1.0, 1.13, 0]} rotation={[-Math.PI / 2, 0, 0.05]}>
            <planeGeometry args={[0.35, 0.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.8} />
          </mesh>
          <mesh position={[-0.4, 1.13, -0.05]} rotation={[-Math.PI / 2, 0, -0.1]}>
            <planeGeometry args={[0.35, 0.5]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>
          <mesh position={[1.2, 1.25, -0.1]}>
            <boxGeometry args={[0.4, 0.28, 0.5]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
          </mesh>
        </group>

        <group position={[-1.5, 0, -1.0]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 1.1, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
        </group>

        <pointLight position={[-1.2, 1.8, 0]} color="#fef3c7" intensity={1.2} distance={5} />
      </group>

      {/* ========================================================================= */}
      {/* 4. PRINCIPAL OFFICE & CENTRAL PAPERWORK DESK (z: -72 to -78)              */}
      {/* ========================================================================= */}
      <group position={[0, 0, -75]}>
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 12]} />
          <meshStandardMaterial color="#1a1824" roughness={0.3} metalness={0.2} />
        </mesh>

        {[-4.5, 4.5].map((x) =>
          [-3, 3].map((z) => (
            <mesh key={`col-${x}-${z}`} position={[x, 3, z]}>
              <cylinderGeometry args={[0.35, 0.4, 6, 16]} />
              <meshStandardMaterial color="#2d2a3e" roughness={0.6} />
            </mesh>
          ))
        )}

        {/* Principal Office Alcove */}
        <group position={[-3.8, 0, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[1.8, 0.75, 1.0]} />
            <meshStandardMaterial color="#451a03" roughness={0.6} />
          </mesh>
          <group position={[0, 0, -0.6]}>
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 1.1, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
          </group>
          <mesh position={[-0.4, 0.4, 0.8]}>
            <boxGeometry args={[0.45, 0.08, 0.45]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0.4, 0.4, 0.8]}>
            <boxGeometry args={[0.45, 0.08, 0.45]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
        </group>

        {/* Central Paperwork Admission Desk */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[3.8, 0.8, 1.2]} />
            <meshStandardMaterial color="#382c24" roughness={0.7} />
          </mesh>

          {/* Admission Papers & Forms on desk */}
          <mesh position={[-0.6, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
          </mesh>
          <mesh position={[0.4, 1.02, 0]} rotation={[-Math.PI / 2, 0, -0.2]}>
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.9} />
          </mesh>
        </group>

        {/* Local Warm Light illuminating the Pen Moment interaction */}
        <pointLight
          ref={penWarmLightRef}
          position={[0, 1.7, 0]}
          color="#fef3c7"
          intensity={0.9}
          distance={4.5}
        />

        {/* Milestone 3: The Pen Moment Floating Media Frame */}
        <FloatingMediaFrame
          milestoneId="m-3"
          position={[0, 2.5, -0.6]}
          rotation={[-0.1, 0, 0]}
          scale={0.9}
        />
      </group>

      {/* ========================================================================= */}
      {/* 5. MAIN CHARACTERS & THE ICONIC PEN EXCHANGE                              */}
      {/* ========================================================================= */}
      <group>
        {/* USER (BOY - VISHAL) AT ADMISSION DESK WITH FATHER */}
        <group position={[-1.2, 0, -75.2]}>
          <CharacterBoy
            pose="idle"
            scale={0.96}
            rotation={[0, 0.28, 0]}
            reachProgress={reachProgress}
            lookAtTarget={boyLookTarget}
          />

          {/* User's Father - Dignified Stylized Humanoid */}
          <group ref={fatherGroupRef} position={[-0.7, 0, 0.2]}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 1.0, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.22, 0.8, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <group position={[0, 1.55, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.16, 20, 20]} />
                <meshStandardMaterial color="#fbd3b6" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.05, -0.02]} castShadow>
                <sphereGeometry args={[0.17, 18, 18]} />
                <meshStandardMaterial color="#475569" roughness={0.7} />
              </mesh>
            </group>
          </group>
        </group>

        {/* SIVANI AT ADMISSION DESK WITH HER PARENT */}
        <group position={[1.4, 0, -75.2]}>
          <CharacterGirl
            pose="idle"
            scale={0.94}
            rotation={[0, -0.28, 0]}
            offerProgress={offerProgress}
            lookAtTarget={girlLookTarget}
          />

          {/* Sivani's Parent - Dignified Stylized Humanoid */}
          <group position={[0.7, 0, 0.2]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.32, 1.1, 16]} />
              <meshStandardMaterial color="#0f766e" roughness={0.6} />
            </mesh>
            <group position={[0, 1.55, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.16, 20, 20]} />
                <meshStandardMaterial color="#fce0cc" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.05, -0.02]} castShadow>
                <sphereGeometry args={[0.17, 18, 18]} />
                <meshStandardMaterial color="#1f2937" roughness={0.7} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Realistic Contact Shadow grounding the characters and desk */}
        <ContactShadows
          position={[0, 0.01, -75.2]}
          opacity={0.75}
          scale={8}
          blur={2.0}
          far={3.5}
          frames={1}
        />

        {/* THE ICONIC PEN (Clearly visible, dynamically positioned across exchange) */}
        <group ref={penRef} position={[1.3, 0.85, -75.2]}>
          {/* Pen Barrel */}
          <mesh geometry={penBodyGeo} material={penBarrelMaterial} />
          {/* Pen Metallic Tip */}
          <mesh
            geometry={penTipGeo}
            material={penMetalMaterial}
            position={[0, -0.2, 0]}
            rotation={[Math.PI, 0, 0]}
          />
          {/* Pen Metallic Clip */}
          <mesh
            geometry={penClipGeo}
            material={penMetalMaterial}
            position={[0.02, 0.1, 0]}
          />
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 6. BACKGROUND FIGURES IN ADMISSION HALL                                   */}
      {/* ========================================================================= */}
      <group ref={charactersGroupRef}>
        <group position={[2.2, 0, -56]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 1.1, 14]} />
            <meshStandardMaterial color="#581c87" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.6} />
          </mesh>
        </group>
        <group position={[-2.4, 0, -58]}>
          <mesh position={[0, 0.88, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 1.15, 14]} />
            <meshStandardMaterial color="#164e63" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color="#fdba74" roughness={0.6} />
          </mesh>
        </group>
        <group position={[1.8, 0, -66]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 1.1, 14]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Atmospheric Dust in Sunbeams */}
      <points ref={dustParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustCount}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#fef08a"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ========================================================================= */}
      {/* 7. CINEMATIC CLASSROOM & FRIEND GROUP SCENES (PHASE 7A)                    */}
      {/* ========================================================================= */}
      {/* Classroom — Marine Engineering Lecture, Boy Back Bench, Girl Front Row (z: -118) */}
      <Act2Classroom progress={cProgress} />

      {/* Same Class — Six-Person Friend Group Study Table (z: -152) */}
      <Act2FriendGroup progress={fgProgress} />
    </group>
  );
}
