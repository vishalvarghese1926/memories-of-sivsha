/**
 * Memories of Sivsha — Central Story Asset Manifest & Preload Pipeline
 *
 * Provides staged preloading:
 * - Priority A (Critical Initial): Sivani hero model, local Draco decoders, entry assets
 * - Priority B (Core Narrative): Boy hero model, car, beach props
 * - Priority C (Later Milestones): Mountain props, home furniture, media
 */

import { useGLTF } from "@react-three/drei";

export interface ManifestAssetItem {
  id: string;
  name: string;
  url: string;
  type: "model" | "wasm" | "script" | "image" | "audio";
  priority: "A" | "B" | "C";
  estimatedBytes: number;
}

export const STORY_ASSET_MANIFEST: ManifestAssetItem[] = [
  // --- PRIORITY A: Critical for immediate First-Frame & Hero Characters ---
  {
    id: "draco-wasm",
    name: "Draco WASM Decoder",
    url: "/draco/draco_decoder.wasm",
    type: "wasm",
    priority: "A",
    estimatedBytes: 192_000,
  },
  {
    id: "draco-js",
    name: "Draco Decoder Engine",
    url: "/draco/draco_decoder.js",
    type: "script",
    priority: "A",
    estimatedBytes: 512_000,
  },
  {
    id: "draco-wrapper",
    name: "Draco WASM Wrapper",
    url: "/draco/draco_wasm_wrapper.js",
    type: "script",
    priority: "A",
    estimatedBytes: 58_000,
  },
  {
    id: "sivani-hero",
    name: "Sivani Hero Model",
    url: "/models/characters/sivani-optimized.glb",
    type: "model",
    priority: "A",
    estimatedBytes: 1_125_000,
  },
  {
    id: "you-hero",
    name: "Vishal Hero Model",
    url: "/models/characters/you-optimized.glb",
    type: "model",
    priority: "A",
    estimatedBytes: 702_000,
  },

  // --- PRIORITY B: Core Environment Assets ---
  {
    id: "car-rain",
    name: "August 31 Car Chassis",
    url: "/models/vehicles/car_rain-opt.glb",
    type: "model",
    priority: "B",
    estimatedBytes: 1_321_000,
  },
  {
    id: "beach-props",
    name: "Kozhikode Beach Elements",
    url: "/models/environment/beach_props-opt.glb",
    type: "model",
    priority: "B",
    estimatedBytes: 351_000,
  },
  {
    id: "mountain-props",
    name: "Himalayan Mountain Boulders",
    url: "/models/environment/mountain_props-opt.glb",
    type: "model",
    priority: "B",
    estimatedBytes: 1_032_000,
  },
  {
    id: "home-furniture",
    name: "Home Parquet & Sofa",
    url: "/models/environment/home_furniture-opt.glb",
    type: "model",
    priority: "B",
    estimatedBytes: 187_000,
  },
];

// Helper to preload a specific model with Drei's useGLTF cache
export function preloadGLTFAsset(url: string) {
  if (typeof window === "undefined") return;
  try {
    useGLTF.setDecoderPath("/draco/");
    useGLTF.preload(url);
  } catch {
    // Fail-safe preload catch
  }
}

// Staged loader that downloads and warms up Priority A & B assets
export async function runStagedPreloader(
  onProgress?: (progress: number, currentItem: string) => void
): Promise<void> {
  if (typeof window === "undefined") return;

  const coreAssets = STORY_ASSET_MANIFEST.filter((a) => a.priority === "A" || a.priority === "B");
  let completedBytes = 0;
  const totalBytes = coreAssets.reduce((sum, item) => sum + item.estimatedBytes, 0);

  // Load and cache all core models and wasm decoders
  for (const item of coreAssets) {
    if (onProgress) {
      const pct = Math.min(95, Math.round((completedBytes / totalBytes) * 100));
      onProgress(pct, item.name);
    }

    try {
      if (item.type === "model") {
        preloadGLTFAsset(item.url);
      } else {
        // Fetch WASM / script into browser cache
        await fetch(item.url, { cache: "force-cache" });
      }
    } catch {
      // Non-blocking fallback
    }

    completedBytes += item.estimatedBytes;
  }

  if (onProgress) {
    onProgress(100, "Ready");
  }
}
