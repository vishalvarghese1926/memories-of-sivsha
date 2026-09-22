"use client";

import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import {
  EnvironmentAssetKey,
  getEnvironmentAsset,
  getEnvironmentModelUrl,
  ENVIRONMENT_ASSET_REGISTRY,
} from "@/config/assets";

if (typeof window !== "undefined") {
  try {
    useGLTF.setDecoderPath("/draco/");
  } catch {}
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: () => void;
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class AssetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    // Graceful fallback without crashing R3F scene graph
    if (process.env.NODE_ENV !== "production") {
      console.info("External asset unavailable, rendering procedural fallback:", error?.message || error);
    }
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface LoadedGLTFObjectProps {
  modelUrl: string;
  autoGround?: boolean;
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

function LoadedGLTFObject({
  modelUrl,
  autoGround = true,
  scale = 1,
  castShadow = true,
  receiveShadow = true,
}: LoadedGLTFObjectProps) {
  const gltf = useGLTF(modelUrl) as any;

  const { clonedScene, groundOffset, centerOffset } = useMemo(() => {
    if (!gltf?.scene) return { clonedScene: null, groundOffset: 0, centerOffset: [0, 0, 0] as [number, number, number] };
    try {
      const clone = SkeletonUtils.clone(gltf.scene);
      clone.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
        }
      });

      const box = new THREE.Box3().setFromObject(clone);
      const offsetY = autoGround ? -box.min.y : 0;
      const offsetX = -(box.min.x + box.max.x) / 2;
      const offsetZ = -(box.min.z + box.max.z) / 2;

      return {
        clonedScene: clone,
        groundOffset: offsetY,
        centerOffset: [offsetX, offsetY, offsetZ] as [number, number, number],
      };
    } catch {
      return { clonedScene: null, groundOffset: 0, centerOffset: [0, 0, 0] as [number, number, number] };
    }
  }, [gltf, autoGround, castShadow, receiveShadow]);

  if (!clonedScene) return null;

  return (
    <group position={[centerOffset[0], groundOffset, centerOffset[2]]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

export interface ExternalAssetProps {
  assetKey: EnvironmentAssetKey;
  modelUrlOverride?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  visible?: boolean;
  proceduralFallback: React.ReactNode;
}

/**
 * ExternalAsset: Unified pipeline for loading realistic external 3D environment & vehicle assets.
 * 
 * Rules:
 * - If real external GLB is present and loads -> renders high-detail GLB
 * - If real external GLB is missing, loading, or fails -> seamlessly renders proceduralFallback
 * - Never crashes the scene on missing or unsupplied asset files
 */
export default function ExternalAsset({
  assetKey,
  modelUrlOverride,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  visible = true,
  proceduralFallback,
}: ExternalAssetProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  const assetItem = getEnvironmentAsset(assetKey);
  const targetUrl = modelUrlOverride || getEnvironmentModelUrl(assetKey, true);

  if (!visible) return null;

  // If no URL or load previously failed, render procedural fallback directly
  if (!targetUrl || loadFailed) {
    return <>{proceduralFallback}</>;
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <AssetErrorBoundary
        fallback={proceduralFallback}
        onError={() => setLoadFailed(true)}
      >
        <React.Suspense fallback={proceduralFallback}>
          <LoadedGLTFObject
            modelUrl={targetUrl}
            autoGround={assetItem?.autoGround ?? true}
            scale={assetItem?.defaultScale ?? 1}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        </React.Suspense>
      </AssetErrorBoundary>
    </group>
  );
}
