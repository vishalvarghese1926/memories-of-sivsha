"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CameraRig from "./CameraRig";
import SceneEnvironment from "./SceneEnvironment";
import StorySceneManager from "./StorySceneManager";
import CanvasErrorBoundary from "@/components/ui/CanvasErrorBoundary";

import { Preload } from "@react-three/drei";
import { useAdaptiveQuality } from "@/lib/adaptiveQuality";

export default function StoryCanvas() {
  const quality = useAdaptiveQuality();

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 4, 18], fov: 50, near: 0.1, far: 1000 }}
          dpr={[1, quality.dpr]}
          shadows={quality.enableContactShadows ? { type: THREE.PCFSoftShadowMap } : false}
          gl={{
            antialias: quality.tier !== "low",
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
          }}
          flat={false}
        >
          {/* Camera and Environment render unconditionally without suspending */}
          <CameraRig />
          <SceneEnvironment />

          {/* StorySceneManager has its own suspense boundary with preloader */}
          <Suspense fallback={null}>
            <StorySceneManager />
            <Preload all />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* Lusion-Grade Cinematic Vignette & Edge Framing */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 62%, rgba(7, 5, 13, 0.45) 88%, rgba(7, 5, 13, 0.85) 100%)",
        }}
      />

      {/* Subtle Analog Film Grain Overlay (Eliminates digital color banding) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
