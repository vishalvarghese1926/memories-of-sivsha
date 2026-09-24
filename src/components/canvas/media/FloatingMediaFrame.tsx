"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";
import { resolveMilestoneMedia } from "@/lib/mediaRegistry";

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
  const { milestones, activeMilestoneIndex, openPhotoLightbox } = useStory();
  const groupRef = useRef<THREE.Group>(null);

  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // Retrieve milestone and resolved personal or placeholder media
  const milestone = useMemo(() => {
    return milestones.find((m) => m.id === milestoneId);
  }, [milestones, milestoneId]);

  const milestoneIndex = milestone?.sequence ?? -1;
  // Windowing: load asset only if within current or neighboring milestone
  const isInActiveWindow =
    milestoneIndex === -1 || Math.abs(milestoneIndex - activeMilestoneIndex) <= 1;

  const mediaAsset = useMemo(() => {
    return resolveMilestoneMedia(milestoneId, milestone?.media);
  }, [milestoneId, milestone]);

  // Image texture loader with loading, error fallback, and explicit disposal
  useEffect(() => {
    if (!isInActiveWindow || !mediaAsset || mediaAsset.type !== "image" || !mediaAsset.url) {
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const tex = loader.load(
      mediaAsset.url,
      () => {
        if (isSubscribed) {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          setImageTexture(tex);
          setIsLoading(false);
        }
      },
      undefined,
      () => {
        if (isSubscribed) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isSubscribed = false;
      tex.dispose();
      setImageTexture(null);
    };
  }, [mediaAsset, isInActiveWindow]);

  // Mobile Safari compliant Video Texture Handling
  useEffect(() => {
    if (!isInActiveWindow || !mediaAsset || mediaAsset.type !== "video" || !mediaAsset.url) {
      setVideoTexture(null);
      return;
    }

    if (typeof window === "undefined") return;

    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);

    const vid = document.createElement("video");
    vid.src = mediaAsset.url;
    vid.crossOrigin = "anonymous";
    vid.loop = true;
    vid.muted = true; // Required for mobile iOS Safari autoplay
    vid.playsInline = true; // Prevent automatic fullscreen on iOS Safari
    vid.preload = "metadata"; // Do not aggressively buffer until active

    const onCanPlay = () => {
      if (!isSubscribed) return;
      vid.play().catch(() => {
        // Autoplay may be deferred until user gesture
      });
      setIsLoading(false);
    };

    const onError = () => {
      if (!isSubscribed) return;
      setHasError(true);
      setIsLoading(false);
    };

    vid.addEventListener("canplay", onCanPlay);
    vid.addEventListener("error", onError);

    const tex = new THREE.VideoTexture(vid);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    setVideoTexture(tex);

    return () => {
      isSubscribed = false;
      vid.removeEventListener("canplay", onCanPlay);
      vid.removeEventListener("error", onError);
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      tex.dispose();
      setVideoTexture(null);
    };
  }, [mediaAsset, isInActiveWindow]);

  // Procedural elegant monogram fallback canvas texture
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

      // Elegant monogram "S & V"
      ctx.font = "italic 44px 'Playfair Display', Georgia, serif";
      ctx.fillStyle = "#fecdd3";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S  &  V", 256, 155);

      // Subtext
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(253, 164, 175, 0.75)";
      ctx.letterSpacing = "4px";
      ctx.fillText("MEMORIES OF SIVSHA", 256, 205);

      // Subtle border line
      ctx.strokeStyle = "rgba(251, 113, 133, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, 480, 308);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // Frame floating animation: gentle breath & tilt (disabled under reduced-motion)
  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.04;
    groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.2 + position[2]) * 0.015;
  });

  const activeTexture = hasError
    ? fallbackTexture
    : videoTexture || imageTexture || fallbackTexture;

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
          openPhotoLightbox(milestoneId);
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
