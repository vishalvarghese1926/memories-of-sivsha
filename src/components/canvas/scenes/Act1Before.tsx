"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import { useStory } from "@/context/StoryContext";
import CharacterGirl from "../characters/CharacterGirl";

interface Act1BeforeProps {
  localProgress?: number;
}

// Procedural abstract memory artwork generator (zero external network dependency)
function createAbstractMemoryTexture(theme: "childhood" | "school" | "family" | "dream"): THREE.CanvasTexture {
  if (typeof window === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    if (theme === "childhood") {
      // Golden dawn & playful silhouette hill
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#fed7aa");
      grad.addColorStop(0.45, "#f472b6");
      grad.addColorStop(1, "#3b0764");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.beginPath();
      ctx.arc(128, 90, 42, 0, Math.PI * 2);
      ctx.fill();

      // Hill silhouette
      ctx.fillStyle = "rgba(30, 10, 45, 0.75)";
      ctx.beginPath();
      ctx.ellipse(128, 260, 140, 80, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === "school") {
      // Warm amber library & lecture rays
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(0.5, "#9d174d");
      grad.addColorStop(1, "#180e29");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Bokeh circles
      ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
      ctx.beginPath();
      ctx.arc(80, 70, 28, 0, Math.PI * 2);
      ctx.arc(175, 120, 36, 0, Math.PI * 2);
      ctx.arc(110, 180, 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === "family") {
      // Warm hearth & rose candlelight glow
      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 130);
      grad.addColorStop(0, "#fecdd3");
      grad.addColorStop(0.45, "#be123c");
      grad.addColorStop(1, "#1c101d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(128, 120, 32, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Starry indigo dusk dreaming
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#a5b4fc");
      grad.addColorStop(0.4, "#4338ca");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let i = 0; i < 24; i++) {
        const sx = (i * 47) % 240 + 8;
        const sy = (i * 73) % 240 + 8;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Elegant subtle border frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 236, 236);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

export default function Act1Before({ localProgress = 0 }: Act1BeforeProps) {
  const { milestones } = useStory();
  const actMilestone = milestones.find((m) => m.sceneType === "act-1-before");
  const mediaItems = actMilestone?.media || [];

  const girlAvatarRef = useRef<THREE.Group>(null);
  const petalsRef = useRef<THREE.Points>(null);
  const flowersGroupRef = useRef<THREE.Group>(null);
  const bubblesGroupRef = useRef<THREE.Group>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 1. Procedural Memory Textures
  const memoryTextures = useMemo(() => {
    return [
      createAbstractMemoryTexture("childhood"),
      createAbstractMemoryTexture("school"),
      createAbstractMemoryTexture("family"),
      createAbstractMemoryTexture("dream"),
    ];
  }, []);

  // Dispose canvas textures cleanly on unmount
  useEffect(() => {
    return () => {
      memoryTextures.forEach((t) => t.dispose());
    };
  }, [memoryTextures]);

  // 2. Modest Particle Budget (160 atmospheric glowing motes)
  const particleCount = 160;
  const [particlePositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 7 + 0.2;
      pos[i * 3 + 2] = -18 - Math.random() * 26; // z: -18 to -44
    }
    return [pos];
  }, [particleCount]);

  // 3. Restrained floating flowers (14 low-poly flowers)
  const flowerCount = 14;
  const flowerData = useMemo(() => {
    const items = [];
    for (let i = 0; i < flowerCount; i++) {
      items.push({
        id: `flower-${i}`,
        baseX: (Math.random() - 0.5) * 8,
        baseY: 0.8 + Math.random() * 3.5,
        baseZ: -20 - Math.random() * 22,
        rotSpeed: 0.2 + Math.random() * 0.4,
        driftPhase: Math.random() * Math.PI * 2,
        scale: 0.12 + Math.random() * 0.08,
      });
    }
    return items;
  }, [flowerCount]);

  // Reusable flower geometries & materials
  const petalGeometry = useMemo(() => new THREE.CircleGeometry(0.5, 6), []);
  const centerGeometry = useMemo(() => new THREE.CircleGeometry(0.25, 8), []);
  const flowerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fbcfe8",
        emissive: "#be185d",
        emissiveIntensity: 0.35,
        roughness: 0.4,
        side: THREE.DoubleSide,
      }),
    []
  );
  const centerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fef08a",
        emissive: "#ca8a04",
        emissiveIntensity: 0.5,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Clean up reusable flower geometries/materials on unmount
  useEffect(() => {
    return () => {
      petalGeometry.dispose();
      centerGeometry.dispose();
      flowerMaterial.dispose();
      centerMaterial.dispose();
    };
  }, [petalGeometry, centerGeometry, flowerMaterial, centerMaterial]);

  // Frame update for character, particles, flowers, and memory bubbles
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // A. Character walking progression driven by localProgress
    if (girlAvatarRef.current) {
      // Progress 0: z = -22.5 (entering dreamworld)
      // Progress 1: z = -39.0 (approaching college transition)
      const targetZ = THREE.MathUtils.lerp(-22.5, -39.0, localProgress);
      girlAvatarRef.current.position.z = THREE.MathUtils.lerp(
        girlAvatarRef.current.position.z,
        targetZ,
        Math.min(1, delta * 5)
      );

      if (!reducedMotion) {
        // Subtle walking sway synchronized with progression
        const walkCycle = time * 3.5;
        girlAvatarRef.current.position.y = 0.04 + Math.sin(walkCycle) * 0.03;
        girlAvatarRef.current.rotation.y = Math.sin(walkCycle * 0.5) * 0.05;
        girlAvatarRef.current.rotation.z = Math.sin(walkCycle * 0.5) * 0.02;
      } else {
        girlAvatarRef.current.position.y = 0.04;
        girlAvatarRef.current.rotation.set(0, 0, 0);
      }
    }

    // B. Atmospheric dust motes gentle drift
    if (petalsRef.current) {
      if (!reducedMotion) {
        petalsRef.current.rotation.y = time * 0.02;
        const positions = petalsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < particleCount * 3; i += 3) {
          positions[i] -= delta * 0.15;
          if (positions[i] < 0.2) {
            positions[i] = 7.0;
          }
        }
        petalsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // C. Floating flowers gentle floating & rotation
    if (flowersGroupRef.current && !reducedMotion) {
      flowersGroupRef.current.children.forEach((flower, idx) => {
        const item = flowerData[idx];
        if (item) {
          flower.rotation.z += delta * item.rotSpeed;
          flower.position.y = item.baseY + Math.sin(time * 0.8 + item.driftPhase) * 0.15;
          flower.position.x = item.baseX + Math.cos(time * 0.5 + item.driftPhase) * 0.12;
        }
      });
    }

    // D. Floating memory bubbles gentle floating
    if (bubblesGroupRef.current && !reducedMotion) {
      bubblesGroupRef.current.children.forEach((bubble, idx) => {
        const phase = idx * 1.4;
        bubble.position.y = (bubble.userData.baseY || 1.8) + Math.sin(time * 1.2 + phase) * 0.1;
        bubble.rotation.y = Math.sin(time * 0.6 + phase) * 0.08;
      });
    }
  });

  // Memory bubbles configurations
  const bubbleConfigs = useMemo(() => {
    return [
      { id: "b-0", x: -2.7, y: 1.8, z: -25.0, theme: "childhood" as const, label: "Childhood" },
      { id: "b-1", x: 2.8, y: 2.2, z: -28.5, theme: "school" as const, label: "School Days" },
      { id: "b-2", x: -2.9, y: 1.7, z: -32.5, theme: "family" as const, label: "Family Warmth" },
      { id: "b-3", x: 2.7, y: 2.1, z: -36.0, theme: "dream" as const, label: "Tomorrow's Dream" },
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. DREAM CRYSTALLINE PATHWAY (z: -18 to -44) */}
      <mesh position={[0, -0.05, -31]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, 30]} />
        <meshStandardMaterial
          color="#1e0e29"
          roughness={0.25}
          metalness={0.7}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Pathway Edge Borders */}
      {[-2.75, 2.75].map((x, i) => (
        <mesh key={`border-${i}`} position={[x, 0.02, -31]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 30]} />
          <meshStandardMaterial
            color="#f472b6"
            emissive="#be185d"
            emissiveIntensity={0.6}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Pathway Guide Markers (High-efficiency emissive rendering without real-time light limits) */}
      {[-40, -35, -30, -25, -20].map((z, idx) => (
        <group key={`glow-pair-${idx}`}>
          {/* Subtle glowing floor markers with romantic bloom appearance */}
          <mesh position={[-2.4, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 16]} />
            <meshBasicMaterial color="#f472b6" transparent opacity={0.75} />
          </mesh>
          <mesh position={[2.4, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 16]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.75} />
          </mesh>
        </group>
      ))}

      {/* 2. STYLIZED SIVANI AVATAR (WALKING ALONE) */}
      <group ref={girlAvatarRef} position={[0, 0, -22.5]}>
        <CharacterGirl pose="walking" scale={1.05} />
        {/* Warm Personal Aura Light */}
        <pointLight position={[0, 1.4, 0.2]} color="#fce7f3" intensity={1.8} distance={4.5} />
        {/* Ground Contact Shadow */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.72}
          scale={3.2}
          blur={1.8}
          far={2.5}
          frames={1}
        />
      </group>

      {/* 3. FLOATING GLASS-LIKE MEMORY BUBBLES */}
      <group ref={bubblesGroupRef}>
        {bubbleConfigs.map((cfg, idx) => {
          const texture = memoryTextures[idx] || memoryTextures[0];
          return (
            <group
              key={cfg.id}
              position={[cfg.x, cfg.y, cfg.z]}
              userData={{ baseY: cfg.y }}
            >
              {/* Outer Lusion-Grade Translucent Refractive Glass 3D Bubble */}
              <mesh>
                <sphereGeometry args={[0.92, 48, 48]} />
                <meshPhysicalMaterial
                  color="#ffffff"
                  transparent
                  transmission={0.94}
                  roughness={0.08}
                  metalness={0.02}
                  ior={1.45}
                  thickness={1.2}
                  clearcoat={1.0}
                  clearcoatRoughness={0.08}
                  depthWrite={false}
                />
              </mesh>

              {/* Glass Rim Accent Ring */}
              <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <torusGeometry args={[0.92, 0.015, 12, 32]} />
                <meshStandardMaterial
                  color="#fbcfe8"
                  emissive="#db2777"
                  emissiveIntensity={0.6}
                  transparent
                  opacity={0.7}
                />
              </mesh>

              {/* Inside Abstract Memory Panel */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshBasicMaterial
                  map={texture}
                  transparent
                  opacity={0.88}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Gentle internal warm beacon */}
              <pointLight position={[0, 0, 0]} color="#fce7f3" intensity={0.7} distance={2.5} />
            </group>
          );
        })}
      </group>

      {/* 4. RESTRAINED FLOATING FLOWERS */}
      <group ref={flowersGroupRef}>
        {flowerData.map((item) => (
          <group
            key={item.id}
            position={[item.baseX, item.baseY, item.baseZ]}
            scale={[item.scale, item.scale, item.scale]}
          >
            {/* Center disc */}
            <mesh geometry={centerGeometry} material={centerMaterial} />

            {/* 5 Petals */}
            {[0, 1, 2, 3, 4].map((pIdx) => {
              const angle = (pIdx * Math.PI * 2) / 5;
              return (
                <mesh
                  key={`petal-${pIdx}`}
                  geometry={petalGeometry}
                  material={flowerMaterial}
                  position={[Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0]}
                  rotation={[0, 0, angle]}
                />
              );
            })}
          </group>
        ))}
      </group>

      {/* 5. ATMOSPHERIC DUST MOTES / BOKEH PARTICLES */}
      <points ref={petalsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#f472b6"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 6. SUBTLE SOFT FILL LIGHTS FOR THE DREAM WORLD */}
      <pointLight position={[0, 4, -30]} color="#e879f9" intensity={1.2} distance={15} />
      <pointLight position={[0, 2, -42]} color="#fde047" intensity={0.9} distance={12} />
    </group>
  );
}
