"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { canvasStore } from "@/context/StoryContext";
import { resolveMilestoneMedia } from "@/lib/mediaRegistry";
import { getStoryTexture, getFallbackMonogramTexture, loadStoryTexture } from "@/lib/storyTextureManager";
import { useSceneLifecycle } from "../SceneTransitionWrapper";

interface FloatingMediaFrameProps {
  milestoneId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  width?: number;
  height?: number;
}

export default function FloatingMediaFrame({
  milestoneId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 2.0,
  height = 1.35,
}: FloatingMediaFrameProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [asyncTexture, setAsyncTexture] = useState<THREE.Texture | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Retrieve milestone and resolved personal media
  const milestone = useMemo(() => {
    return canvasStore.milestones.find((m) => m.id === milestoneId);
  }, [milestoneId]);

  const mediaAsset = useMemo(() => {
    return resolveMilestoneMedia(milestoneId, milestone?.media);
  }, [milestoneId, milestone]);

  // Synchronously fetch warmed texture from StoryTextureManager
  const cachedTexture = useMemo(() => {
    if (!mediaAsset?.url) return null;
    return getStoryTexture(mediaAsset.url);
  }, [mediaAsset]);

  // Fallback lazy load if not yet in cache (non-blocking)
  useEffect(() => {
    if (!cachedTexture && mediaAsset?.url) {
      let isSubscribed = true;
      loadStoryTexture(mediaAsset.url).then((tex) => {
        if (isSubscribed) {
          setAsyncTexture(tex);
        }
      });
      return () => {
        isSubscribed = false;
      };
    }
  }, [cachedTexture, mediaAsset?.url]);

  const lifecycle = useSceneLifecycle();

  // Frame floating animation: gentle breath & tilt (disabled under reduced-motion, dormant, or paused)
  useFrame((state) => {
    if (
      reducedMotion ||
      !groupRef.current ||
      lifecycle.current.state === "dormant" ||
      canvasStore.isStoryPaused
    ) {
      return;
    }
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.04;
    groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.2 + position[2]) * 0.015;
  });

  const activeTexture = cachedTexture || asyncTexture || getFallbackMonogramTexture();

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "auto";
      }
    };
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Luxury Obsidian Satin Backing Bezel */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.03]} />
        <meshStandardMaterial
          color="#0f0d14"
          roughness={0.45}
          metalness={0.25}
        />
      </mesh>

      {/* Hairline Champagne Gold Inset Trim */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[width + 0.03, height + 0.03, 0.01]} />
        <meshStandardMaterial
          color={isHovered ? "#f5ebd4" : "#e2c275"}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>

      {/* Main Photograph Plane — EXCLUSIVELY CLICKABLE TARGET */}
      <mesh
        position={[0, 0, 0.01]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          if (typeof document !== "undefined") document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          canvasStore.openPhotoLightbox(milestoneId);
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={activeTexture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

