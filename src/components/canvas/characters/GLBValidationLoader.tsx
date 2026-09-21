"use client";

import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { CharacterControllerProps } from "@/types/character";
import { inspectGLTFModel, ModelDiagnostics } from "@/lib/gltfDiagnostics";
import CharacterBoy from "@/components/canvas/characters/CharacterBoy";
import CharacterGirl from "@/components/canvas/characters/CharacterGirl";

interface GLBValidationLoaderProps extends CharacterControllerProps {
  characterType: "you" | "sivani";
  modelUrl: string;
  onDiagnostics?: (diagnostics: ModelDiagnostics) => void;
  onLoadStatus?: (status: "loading" | "loaded" | "error" | "missing") => void;
}

/**
 * Technical validator that loads an external GLTF/GLB model via Drei's useGLTF,
 * performs structural inspection of bones, meshes, animations, and morph targets,
 * and renders it with the Phase 6A character architecture.
 */
export default function GLBValidationLoader({
  characterType,
  modelUrl,
  pose = "idle",
  lookAtTarget,
  reachProgress = 0,
  offerProgress = 0,
  windIntensity = 0,
  facialConfig,
  playbackSpeed = 1.0,
  onDiagnostics,
  onLoadStatus,
  ...props
}: GLBValidationLoaderProps) {
  // Unconditional top-level hook call (standard React Hook rules)
  const gltf = useGLTF(modelUrl) as any;

  useEffect(() => {
    if (gltf?.scene) {
      onLoadStatus?.("loaded");
      if (onDiagnostics) {
        const diag = inspectGLTFModel(gltf.scene, gltf.animations || [], modelUrl);
        onDiagnostics(diag);
      }
    }
  }, [gltf, modelUrl, onDiagnostics, onLoadStatus]);

  // Mount through CharacterBoy or CharacterGirl
  if (characterType === "you") {
    return (
      <CharacterBoy
        modelUrl={modelUrl}
        pose={pose}
        lookAtTarget={lookAtTarget}
        reachProgress={reachProgress}
        windIntensity={windIntensity}
        facialConfig={facialConfig}
        playbackSpeed={playbackSpeed}
        {...props}
      />
    );
  }

  return (
    <CharacterGirl
      modelUrl={modelUrl}
      pose={pose}
      lookAtTarget={lookAtTarget}
      offerProgress={offerProgress}
      reachProgress={reachProgress}
      windIntensity={windIntensity}
      facialConfig={facialConfig}
      playbackSpeed={playbackSpeed}
      {...props}
    />
  );
}
