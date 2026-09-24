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

  // --- PRIORITY B: Core Story Photographs (Pre-decoded into GPU memory) ---
  {
    id: "photo-m1",
    name: "Before We Met Memory",
    url: "/media/photos/m1_before.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 70_000,
  },
  {
    id: "photo-m2",
    name: "College Hall Memory",
    url: "/media/photos/m2_college.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 180_000,
  },
  {
    id: "photo-m4",
    name: "Classroom Memory",
    url: "/media/photos/m4_classroom.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 150_000,
  },
  {
    id: "photo-m5",
    name: "Friends Circle Memory",
    url: "/media/photos/m5_friends.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 250_000,
  },
  {
    id: "photo-m6",
    name: "Kozhikode Train Memory",
    url: "/media/photos/m6_train.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 140_000,
  },
  {
    id: "photo-m7",
    name: "Kozhikode Beach Sunset",
    url: "/media/photos/m7_beach.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 43_000,
  },
  {
    id: "photo-m9",
    name: "August 31 Overlook Memory",
    url: "/media/photos/m9_august31.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 173_000,
  },
  {
    id: "photo-m10",
    name: "Classic 350 Memory",
    url: "/media/photos/m10_classic350.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 153_000,
  },
  {
    id: "photo-m11",
    name: "Himalayan 450 Pass",
    url: "/media/photos/m11_himalayan.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 258_000,
  },
  {
    id: "photo-m12",
    name: "Home Everyday Warmth",
    url: "/media/photos/m12_home.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 52_000,
  },
  {
    id: "photo-letter-seal",
    name: "Handwritten Letter Seal",
    url: "/media/photos/letter_seal.webp",
    type: "image",
    priority: "B",
    estimatedBytes: 12_000,
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

// Pre-decode an image bitmap off the main thread
export function preloadAndDecodeImage(url: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if ("decode" in img && typeof img.decode === "function") {
      img.decode().then(() => resolve()).catch(() => resolve());
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
}

// Staged loader that downloads and warms up Priority A & B assets
export async function runStagedPreloader(
  onProgress?: (progress: number, currentItem: string) => void
): Promise<void> {
  if (typeof window === "undefined") return;

  const coreAssets = STORY_ASSET_MANIFEST.filter((a) => a.priority === "A" || a.priority === "B");
  let completedBytes = 0;
  const totalBytes = coreAssets.reduce((sum, item) => sum + item.estimatedBytes, 0);

  // Load and cache all core models, images, and wasm decoders
  for (const item of coreAssets) {
    if (onProgress) {
      const pct = Math.min(95, Math.round((completedBytes / totalBytes) * 100));
      onProgress(pct, item.name);
    }

    try {
      if (item.type === "model") {
        preloadGLTFAsset(item.url);
      } else if (item.type === "image") {
        await preloadAndDecodeImage(item.url);
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
