/**
 * Memories of Sivsha — Central 3D Asset Pipeline Configuration
 * Phase 9B: Production-Ready Asset Registry & Performance Budgets
 *
 * Defines single-source-of-truth asset paths, optimization variants,
 * realistic environment prop registry, and mobile performance budgets.
 */

// ============================================================================
// 1. PERFORMANCE BUDGET THRESHOLDS
// ============================================================================
export const ASSET_PERFORMANCE_BUDGETS = {
  // Hard limits for mobile web stability
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
  maxVertices: 250_000, // 250k vertices
  maxTriangles: 500_000, // 500k triangles
  maxTextureDimension: 2048, // 2K max for mobile GPU memory
  propTextureDimension: 1024, // 1K recommended for environment props

  // Rigging & Locomotion requirements
  requiresArmature: true,
  requiresAnimations: true,

  // Standard Humanoid Animation Clip Names (Mixamo / Blender / Rigify)
  standardClips: [
    "idle",
    "walk",
    "stand",
    "sit",
    "look",
    "reach",
    "interact",
    "biker",
    "bikerPillion",
  ] as const,
} as const;

export type StandardAnimationClip = typeof ASSET_PERFORMANCE_BUDGETS.standardClips[number];

// ============================================================================
// 2. HERO CHARACTER ASSETS
// ============================================================================
export interface HeroCharacterConfig {
  id: "you" | "sivani";
  displayName: string;
  targetHeight: number; // In meters
  primaryModelUrl: string;
  optimizedModelUrl: string;
  fallbackType: "procedural";
  boneMappings: {
    head: string[];
    neck: string[];
    spine: string[];
    rightArm: string[];
    rightForearm: string[];
    rightHand: string[];
  };
}

export const HERO_CHARACTER_CONFIGS: Record<"you" | "sivani", HeroCharacterConfig> = {
  you: {
    id: "you",
    displayName: "Vishal (You)",
    targetHeight: 1.75, // Scaled to natural boy height
    primaryModelUrl: "/models/characters/you.glb",
    optimizedModelUrl: "/models/characters/you-optimized.glb",
    fallbackType: "procedural",
    boneMappings: {
      head: ["head", "mixamorighead", "b_head", "def-head"],
      neck: ["neck", "mixamorigneck", "b_neck", "def-neck"],
      spine: ["spine", "mixamorigspine", "spine1", "b_spine", "def-spine"],
      rightArm: ["rightarm", "arm_r", "shoulder_r", "mixamorigrightarm", "b_r_arm"],
      rightForearm: ["rightforearm", "forearm_r", "mixamorigrightforearm", "b_r_forearm"],
      rightHand: ["righthand", "hand_r", "mixamorigrighthand", "b_r_hand"],
    },
  },
  sivani: {
    id: "sivani",
    displayName: "Sivani",
    targetHeight: 1.65, // Scaled to natural girl height
    primaryModelUrl: "/models/characters/sivani.glb",
    optimizedModelUrl: "/models/characters/sivani-optimized.glb",
    fallbackType: "procedural",
    boneMappings: {
      head: ["head", "mixamorighead", "b_head", "def-head"],
      neck: ["neck", "mixamorigneck", "b_neck", "def-neck"],
      spine: ["spine", "mixamorigspine", "spine1", "b_spine", "def-spine"],
      rightArm: ["rightarm", "arm_r", "shoulder_r", "mixamorigrightarm", "b_r_arm"],
      rightForearm: ["rightforearm", "forearm_r", "mixamorigrightforearm", "b_r_forearm"],
      rightHand: ["righthand", "hand_r", "mixamorigrighthand", "b_r_hand"],
    },
  },
};

/**
 * Resolves the active model URL for a hero character.
 * Supports preferring the future optimized asset or the current primary asset.
 */
export function getHeroModelUrl(
  character: "you" | "sivani",
  preferOptimized: boolean = true
): string {
  const config = HERO_CHARACTER_CONFIGS[character];
  return preferOptimized ? config.optimizedModelUrl : config.primaryModelUrl;
}

// ============================================================================
// 3. ENVIRONMENT & VEHICLE REALISTIC 3D ASSET REGISTRY
// ============================================================================
export type EnvironmentAssetKey =
  | "classic350"
  | "himalayan"
  | "train"
  | "car"
  | "homeFurniture"
  | "railwayStation"
  | "beachProps"
  | "mountainEnvironment";

export interface EnvironmentAssetItem {
  id: EnvironmentAssetKey;
  priority: number;
  name: string;
  category: "vehicle" | "architecture" | "prop" | "terrain";
  modelUrl: string;
  optimizedModelUrl?: string;
  defaultScale: number;
  autoGround: boolean;
  proceduralFallbackAvailable: boolean;
  description: string;
}

export const ENVIRONMENT_ASSET_REGISTRY: Record<EnvironmentAssetKey, EnvironmentAssetItem> = {
  // Priority 1: Classic 350 motorcycle
  classic350: {
    id: "classic350",
    priority: 1,
    name: "Royal Enfield Classic 350",
    category: "vehicle",
    modelUrl: "/models/vehicles/classic350.glb",
    optimizedModelUrl: "/models/vehicles/classic350-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Detailed Royal Enfield Classic 350 for beach ride & teaching sequence.",
  },

  // Priority 2: Himalayan motorcycle
  himalayan: {
    id: "himalayan",
    priority: 2,
    name: "Royal Enfield Himalayan 450",
    category: "vehicle",
    modelUrl: "/models/vehicles/himalayan450.glb",
    optimizedModelUrl: "/models/vehicles/himalayan450-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "High-clearance adventure motorcycle for mountain ride and slide aftermath.",
  },

  // Priority 3: Kozhikode Coastal Train
  train: {
    id: "train",
    priority: 3,
    name: "Kozhikode Coastal Train",
    category: "vehicle",
    modelUrl: "/models/vehicles/train.glb",
    optimizedModelUrl: "/models/vehicles/train-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Multi-coach train exterior & interior for golden hour journey.",
  },

  // Priority 4: August 31 Rain Car
  car: {
    id: "car",
    priority: 4,
    name: "August 31 Rain Car (Interior & Exterior)",
    category: "vehicle",
    modelUrl: "/models/vehicles/car_rain.glb",
    optimizedModelUrl: "/models/vehicles/car_rain-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Sedan exterior with rain-streaked windows and cabin interior.",
  },

  // Priority 5: Home Furniture & Interior
  homeFurniture: {
    id: "homeFurniture",
    priority: 5,
    name: "Home Furniture & Interior Props",
    category: "prop",
    modelUrl: "/models/environment/home_furniture.glb",
    optimizedModelUrl: "/models/environment/home_furniture-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Detailed cozy living room, couch, study table, and warm lamps.",
  },

  // Priority 6: Railway Station Props
  railwayStation: {
    id: "railwayStation",
    priority: 6,
    name: "Railway Platform & Overhead Canopies",
    category: "architecture",
    modelUrl: "/models/environment/railway_station.glb",
    optimizedModelUrl: "/models/environment/railway_station-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Station platform canopy, track ballast, and evening platform lights.",
  },

  // Priority 7: Kozhikode Beach Props
  beachProps: {
    id: "beachProps",
    priority: 7,
    name: "Beach Shore Rocks, Pier & Ocean Horizon",
    category: "terrain",
    modelUrl: "/models/environment/beach_props.glb",
    optimizedModelUrl: "/models/environment/beach_props-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Weathered stones, driftwood, coastal pier posts, and shoreline detail.",
  },

  // Priority 8: Mountain Ghats Environment
  mountainEnvironment: {
    id: "mountainEnvironment",
    priority: 8,
    name: "Mountain Ghats Rocks & Roadside Barriers",
    category: "terrain",
    modelUrl: "/models/environment/mountain_props.glb",
    optimizedModelUrl: "/models/environment/mountain_props-opt.glb",
    defaultScale: 1.0,
    autoGround: true,
    proceduralFallbackAvailable: true,
    description: "Winding misty mountain road shoulders, rock face boulders, and guardrails.",
  },
};

/**
 * Retrieves an environment asset entry by key.
 */
export function getEnvironmentAsset(key: EnvironmentAssetKey): EnvironmentAssetItem {
  return ENVIRONMENT_ASSET_REGISTRY[key];
}

/**
 * Resolves the active model URL for an environment asset, preferring optimized variants.
 */
export function getEnvironmentModelUrl(
  key: EnvironmentAssetKey,
  preferOptimized: boolean = true
): string {
  const asset = ENVIRONMENT_ASSET_REGISTRY[key];
  if (!asset) return "";
  return (preferOptimized && asset.optimizedModelUrl) ? asset.optimizedModelUrl : asset.modelUrl;
}
