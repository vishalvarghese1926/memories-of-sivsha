"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";

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
  const { milestones } = useStory();
  const groupRef = useRef<THREE.Group>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  // Retrieve media asset associated with milestone
  const milestone = useMemo(() => {
    return milestones.find((m) => m.id === milestoneId);
  }, [milestones, milestoneId]);

  const mediaAsset = milestone?.media?.[0];

  // Texture loader for image assets with memory cleanup
  const imageTexture = useMemo(() => {
    if (!mediaAsset || mediaAsset.type !== "image" || !mediaAsset.url) {
      return null;
    }
    const loader = new THREE.TextureLoader();
    const tex = loader.load(mediaAsset.url);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }, [mediaAsset]);

  // Video texture handling for video assets (playsInline, muted, autoPlay, loop)
  useEffect(() => {
    if (mediaAsset?.type === "video" && mediaAsset.url && typeof window !== "undefined") {
      const vid = document.createElement("video");
      vid.src = mediaAsset.url;
      vid.crossOrigin = "anonymous";
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.preload = "auto";
      vid.play().catch(() => {
        // Autoplay may be deferred until user interaction
      });

      const tex = new THREE.VideoTexture(vid);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.format = THREE.RGBAFormat;
      setVideoTexture(tex);

      return () => {
        vid.pause();
        vid.src = "";
        tex.dispose();
      };
    }
  }, [mediaAsset]);

  // Procedural elegant romantic fallback texture if no media asset is attached
  const fallbackTexture = useMemo(() => {
    if (typeof window === "undefined") {
      return new THREE.CanvasTexture({} as HTMLCanvasElement);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Deep velvet romantic gradient
      const grad = ctx.createLinearGradient(0, 0, 512, 340);
      grad.addColorStop(0, "#1f091c");
      grad.addColorStop(0.5, "#2a0d24");
      grad.addColorStop(1, "#0d0614");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 340);

      // Subtle glow circle
      const glow = ctx.createRadialGradient(256, 170, 10, 256, 170, 180);
      glow.addColorStop(0, "rgba(244, 63, 94, 0.25)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 512, 340);

      // Elegant gold/rose monogram "S & V"
      ctx.font = "italic 44px 'Playfair Display', Georgia, serif";
      ctx.fillStyle = "#fecdd3";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S  &  V", 256, 160);

      // Subtext
      ctx.font = "12px monospace";
      ctx.fillStyle = "rgba(253, 164, 175, 0.75)";
      ctx.letterSpacing = "4px";
      ctx.fillText("MEMORIES OF SIVSHA", 256, 210);

      // Subtle border line
      ctx.strokeStyle = "rgba(251, 113, 133, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, 480, 308);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // Frame animation: gentle floating breath & tilt
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.04;
      groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.2 + position[2]) * 0.015;
    }
  });

  const activeTexture = videoTexture || imageTexture || fallbackTexture;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Outer Curved Glass Border Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.05]} />
        <meshPhysicalMaterial
          color="#fda4af"
          transmission={0.88}
          roughness={0.12}
          ior={1.45}
          thickness={0.6}
          clearcoat={1.0}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Rim Accent Border Glow */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.01]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#e11d48"
          emissiveIntensity={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* Main Image / Video Plane */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={activeTexture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft Romantic Ambient Backlight for the Frame */}
      <pointLight
        position={[0, 0, -0.2]}
        color="#fb7185"
        intensity={0.8}
        distance={3.5}
      />
    </group>
  );
}
