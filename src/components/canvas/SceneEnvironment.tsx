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

export default function SceneEnvironment() {
  const { scrollProgress, milestones } = useStory();
  const fogRef = useRef<THREE.FogExp2>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const goldFillRef = useRef<THREE.PointLight>(null);

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
    const t = THREE.MathUtils.clamp(scrollProgress, 0, 1);

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

    const targetFogColor = new THREE.Color(prev.fog).lerp(new THREE.Color(next.fog), factor);
    const targetAmbientColor = new THREE.Color(prev.ambient).lerp(new THREE.Color(next.ambient), factor);
    const targetIntensity = THREE.MathUtils.lerp(prev.intensity, next.intensity, factor);
    const targetFogDensity = THREE.MathUtils.lerp(prev.fogDensity, next.fogDensity, factor);

    const lerpRate = Math.min(1, delta * 3.5);

    if (fogRef.current) {
      fogRef.current.color.lerp(targetFogColor, lerpRate);
      fogRef.current.density = THREE.MathUtils.lerp(fogRef.current.density, targetFogDensity, lerpRate);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.lerp(targetAmbientColor, lerpRate);
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, targetIntensity, lerpRate);
    }

    if (rimLightRef.current) {
      const rimTarget = new THREE.Color(t > 0.5 ? "#fde047" : "#fda4af");
      rimLightRef.current.color.lerp(rimTarget, lerpRate);
    }

    if (goldFillRef.current) {
      const zPos = THREE.MathUtils.lerp(18, -690, t);
      goldFillRef.current.position.z = zPos;
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

      {/* Ambient floating dust / romantic embers */}
      <Sparkles
        count={90}
        scale={24}
        size={2.8}
        speed={0.4}
        opacity={0.65}
        color="#ffd1dc"
      />
    </>
  );
}
