"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";

import { Sparkles, ContactShadows } from "@react-three/drei";

interface EnvStage {
  t: number;
  fog: string;
  ambient: string;
  intensity: number;
  fogDensity: number;
}

// Static reusable color scratch objects to eliminate allocations inside useFrame
const TARGET_FOG_COLOR = new THREE.Color();
const TARGET_AMBIENT_COLOR = new THREE.Color();
const PREV_COLOR_SCRATCH = new THREE.Color();
const NEXT_COLOR_SCRATCH = new THREE.Color();
const RIM_TARGET_WARM = new THREE.Color("#fde047");
const RIM_TARGET_ROSE = new THREE.Color("#fda4af");

export default function SceneEnvironment() {
  const { scrollProgressRef, milestones } = useStory();
  const fogRef = useRef<THREE.FogExp2>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const goldFillRef = useRef<THREE.PointLight>(null);
  const sparklesGroupRef = useRef<THREE.Group>(null);

  // Derive environment stages dynamically from milestones in storyData (source of truth)
  const environmentStages: EnvStage[] = useMemo(() => {
    if (!milestones || milestones.length === 0) {
      return [{ t: 0.0, fog: "#07070d", ambient: "#140e24", intensity: 1.2, fogDensity: 0.02 }];
    }

    const stages: EnvStage[] = milestones.map((m) => {
      const cfg = m.custom3DConfig;
      return {
        t: cfg?.splineProgressStart ?? 0,
        fog: cfg?.fogColor || "#0b0817",
        ambient: cfg?.ambientColor || "#150e28",
        intensity: 1.4,
        fogDensity: cfg?.fogDensity || 0.025,
      };
    });

    // Add finale end cap
    const last = milestones[milestones.length - 1];
    if (last && last.custom3DConfig) {
      stages.push({
        t: 1.0,
        fog: last.custom3DConfig.fogColor || "#0e0616",
        ambient: last.custom3DConfig.ambientColor || "#20122c",
        intensity: 1.6,
        fogDensity: last.custom3DConfig.fogDensity || 0.02,
      });
    }

    return stages.sort((a, b) => a.t - b.t);
  }, [milestones]);

  useFrame((_, delta) => {
    const t = THREE.MathUtils.clamp(scrollProgressRef.current, 0, 1);

    // Find bounding stages for color and density lerp
    let prev = environmentStages[0];
    let next = environmentStages[environmentStages.length - 1];

    for (let i = 0; i < environmentStages.length - 1; i++) {
      if (t >= environmentStages[i].t && t <= environmentStages[i + 1].t) {
        prev = environmentStages[i];
        next = environmentStages[i + 1];
        break;
      }
    }

    const span = Math.max(0.0001, next.t - prev.t);
    const factor = (t - prev.t) / span;

    PREV_COLOR_SCRATCH.set(prev.fog);
    NEXT_COLOR_SCRATCH.set(next.fog);
    TARGET_FOG_COLOR.lerpColors(PREV_COLOR_SCRATCH, NEXT_COLOR_SCRATCH, factor);

    PREV_COLOR_SCRATCH.set(prev.ambient);
    NEXT_COLOR_SCRATCH.set(next.ambient);
    TARGET_AMBIENT_COLOR.lerpColors(PREV_COLOR_SCRATCH, NEXT_COLOR_SCRATCH, factor);

    const targetIntensity = THREE.MathUtils.lerp(prev.intensity, next.intensity, factor);
    const targetFogDensity = THREE.MathUtils.lerp(prev.fogDensity, next.fogDensity, factor);

    const lerpRate = Math.min(1, delta * 3.5);

    if (fogRef.current) {
      fogRef.current.color.lerp(TARGET_FOG_COLOR, lerpRate);
      fogRef.current.density = THREE.MathUtils.lerp(fogRef.current.density, targetFogDensity, lerpRate);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.lerp(TARGET_AMBIENT_COLOR, lerpRate);
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, targetIntensity, lerpRate);
    }

    if (rimLightRef.current) {
      const rimTarget = t > 0.5 ? RIM_TARGET_WARM : RIM_TARGET_ROSE;
      rimLightRef.current.color.lerp(rimTarget, lerpRate);
    }

    const zPos = THREE.MathUtils.lerp(18, -690, t);
    if (goldFillRef.current) {
      goldFillRef.current.position.z = zPos;
    }
    if (sparklesGroupRef.current) {
      sparklesGroupRef.current.position.z = zPos;
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={["#07070d", 0.025]} />
      <ambientLight ref={ambientLightRef} intensity={1.35} color="#140e24" />

      {/* Primary Key light with soft PCF shadow mapping */}
      <directionalLight
        ref={dirLightRef}
        position={[14, 24, 16]}
        intensity={2.4}
        color="#fff1f2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Warm Rose/Gold Rim Light for Silhouette Definition */}
      <directionalLight
        ref={rimLightRef}
        position={[-14, 16, -16]}
        intensity={1.6}
        color="#fda4af"
      />

      {/* Dynamic travelling subtle warm fill light */}
      <pointLight
        ref={goldFillRef}
        position={[0, 3, 0]}
        intensity={0.6}
        color="#fef08a"
        distance={25}
      />

      {/* Ambient floating dust / romantic embers travelling along story spline */}
      <group ref={sparklesGroupRef}>
        <Sparkles
          count={75}
          scale={[22, 14, 22]}
          size={2.6}
          speed={0.4}
          opacity={0.65}
          color="#ffd1dc"
        />
      </group>
    </>
  );
}
