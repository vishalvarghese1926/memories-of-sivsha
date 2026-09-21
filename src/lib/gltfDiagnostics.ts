import * as THREE from "three";

export interface TextureDiagnostic {
  name: string;
  width: number;
  height: number;
  format?: string;
  type?: string;
}

export interface MorphTargetDiagnostic {
  meshName: string;
  morphTargetNames: string[];
}

export interface ModelDiagnostics {
  modelUrl: string;
  isLoaded: boolean;
  fileSizeEstimate?: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  objectCount: number;
  meshCount: number;
  skinnedMeshCount: number;
  hasSkeleton: boolean;
  boneCount: number;
  boneNames: string[];
  fingerBonesFound: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  materialCount: number;
  materialNames: string[];
  hasSubsurfaceSkin: boolean;
  hasNormalMaps: boolean;
  textureCount: number;
  textures: TextureDiagnostic[];
  triangleCount: number;
  vertexCount: number;
  animationClipNames: string[];
  morphTargets: MorphTargetDiagnostic[];
  supportedStandardClips: {
    idle: boolean;
    walk: boolean;
    stand: boolean;
    sit: boolean;
    look: boolean;
    reach: boolean;
    interact: boolean;
    biker: boolean;
    bikerPillion: boolean;
  };
  supportedMorphTargets: {
    eyeBlinkLeft: boolean;
    eyeBlinkRight: boolean;
    mouthSmileLeft: boolean;
    mouthSmileRight: boolean;
    browInnerUp: boolean;
  };
  memoryRiskAssessment: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendations: string[];
}

/**
 * Inspects a loaded THREE.Group/Object3D and returns detailed technical diagnostics.
 */
export function inspectGLTFModel(
  gltfScene: THREE.Object3D,
  animations: THREE.AnimationClip[] = [],
  modelUrl: string
): ModelDiagnostics {
  const box = new THREE.Box3().setFromObject(gltfScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  let objectCount = 0;
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let triangleCount = 0;
  let vertexCount = 0;

  const boneNames: string[] = [];
  const materialMap = new Map<string, THREE.Material>();
  const textureMap = new Map<string, THREE.Texture>();
  const morphTargets: MorphTargetDiagnostic[] = [];

  let hasSubsurfaceSkin = false;
  let hasNormalMaps = false;

  const fingerBones = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  };

  gltfScene.traverse((obj) => {
    objectCount++;

    if ((obj as THREE.Bone).isBone) {
      const name = obj.name;
      boneNames.push(name);
      const lower = name.toLowerCase();
      if (lower.includes("thumb")) fingerBones.thumb = true;
      if (lower.includes("index")) fingerBones.index = true;
      if (lower.includes("middle")) fingerBones.middle = true;
      if (lower.includes("ring")) fingerBones.ring = true;
      if (lower.includes("pinky") || lower.includes("little")) fingerBones.pinky = true;
    }

    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const mesh = obj as THREE.Mesh;

      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
        skinnedMeshCount++;
      }

      if (mesh.geometry) {
        const geo = mesh.geometry;
        if (geo.index) {
          triangleCount += geo.index.count / 3;
        } else if (geo.attributes.position) {
          triangleCount += geo.attributes.position.count / 3;
        }
        if (geo.attributes.position) {
          vertexCount += geo.attributes.position.count;
        }
      }

      // Check Morph Targets
      if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        morphTargets.push({
          meshName: mesh.name || "UnnamedMesh",
          morphTargetNames: Object.keys(mesh.morphTargetDictionary),
        });
      }

      // Collect Materials & Textures
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (!mat) return;
        materialMap.set(mat.uuid, mat);

        if ((mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
          const phys = mat as THREE.MeshPhysicalMaterial;
          if (phys.clearcoat > 0 || phys.transmission > 0) {
            hasSubsurfaceSkin = true;
          }
        }

        const standard = mat as THREE.MeshStandardMaterial;
        if (standard.normalMap) {
          hasNormalMaps = true;
          textureMap.set(standard.normalMap.uuid, standard.normalMap);
        }
        if (standard.map) textureMap.set(standard.map.uuid, standard.map);
        if (standard.roughnessMap) textureMap.set(standard.roughnessMap.uuid, standard.roughnessMap);
        if (standard.metalnessMap) textureMap.set(standard.metalnessMap.uuid, standard.metalnessMap);
      });
    }
  });

  const textures: TextureDiagnostic[] = [];
  textureMap.forEach((tex) => {
    const image = tex.image;
    textures.push({
      name: tex.name || "Texture",
      width: image?.width || 0,
      height: image?.height || 0,
    });
  });

  const animationClipNames = animations.map((a) => a.name);

  // Check supported clips
  const clipLower = animationClipNames.map((n) => n.toLowerCase());
  const supportedStandardClips = {
    idle: clipLower.some((n) => n.includes("idle")),
    walk: clipLower.some((n) => n.includes("walk")),
    stand: clipLower.some((n) => n.includes("stand") || n.includes("idle")),
    sit: clipLower.some((n) => n.includes("sit")),
    look: clipLower.some((n) => n.includes("look") || n.includes("glance")),
    reach: clipLower.some((n) => n.includes("reach") || n.includes("interact")),
    interact: clipLower.some((n) => n.includes("interact") || n.includes("reach")),
    biker: clipLower.some((n) => n.includes("bike") || n.includes("ride")),
    bikerPillion: clipLower.some((n) => n.includes("pillion") || n.includes("bike")),
  };

  // Check supported morph targets
  const allMorphNames = morphTargets.flatMap((m) => m.morphTargetNames.map((n) => n.toLowerCase()));
  const supportedMorphTargets = {
    eyeBlinkLeft: allMorphNames.some((n) => n.includes("blink") && (n.includes("left") || n.includes("_l") || n.endsWith("l"))),
    eyeBlinkRight: allMorphNames.some((n) => n.includes("blink") && (n.includes("right") || n.includes("_r") || n.endsWith("r"))),
    mouthSmileLeft: allMorphNames.some((n) => n.includes("smile")),
    mouthSmileRight: allMorphNames.some((n) => n.includes("smile")),
    browInnerUp: allMorphNames.some((n) => n.includes("brow")),
  };

  // Mobile Memory Risk Assessment
  let memoryRisk: ModelDiagnostics["memoryRiskAssessment"] = "LOW";
  const recommendations: string[] = [];

  const maxTexDimension = Math.max(0, ...textures.map((t) => Math.max(t.width, t.height)));
  if (maxTexDimension > 2048) {
    memoryRisk = "HIGH";
    recommendations.push(`Texture resolution of ${maxTexDimension}px exceeds the 2048px mobile limit. Scale down to 2K or 1K.`);
  }

  if (triangleCount > 150000) {
    memoryRisk = "CRITICAL";
    recommendations.push("High poly count may crash older iPhones. Run through gltf-transform meshopt or decimate in Blender.");
  } else if (triangleCount > 60000) {
    if (memoryRisk === "LOW") memoryRisk = "MODERATE";
    recommendations.push(`Polygon count (${Math.round(triangleCount).toLocaleString()} tris) is higher than recommended 45k budget for mobile.`);
  }

  if (skinnedMeshCount === 0) {
    recommendations.push("Model has no SkinnedMesh. Ensure mesh is bound to the armature before export.");
  }

  if (!fingerBones.thumb || !fingerBones.index) {
    recommendations.push("Hand skeleton lacks separate thumb/index finger bones. Required for realistic pen grasping.");
  }

  if (animationClipNames.length === 0) {
    recommendations.push("No animation clips found in model file. Include standard clips or import from /public/animations/.");
  }

  if (morphTargets.length === 0) {
    recommendations.push("No morph targets found on character head. Involuntary blinking and subtle smiles will be unavailable.");
  }

  return {
    modelUrl,
    isLoaded: true,
    dimensions: {
      width: Math.round(size.x * 100) / 100,
      height: Math.round(size.y * 100) / 100,
      depth: Math.round(size.z * 100) / 100,
    },
    objectCount,
    meshCount,
    skinnedMeshCount,
    hasSkeleton: boneNames.length > 0,
    boneCount: boneNames.length,
    boneNames,
    fingerBonesFound: fingerBones,
    materialCount: materialMap.size,
    materialNames: Array.from(materialMap.values()).map((m) => m.name || "UnnamedMaterial"),
    hasSubsurfaceSkin,
    hasNormalMaps,
    textureCount: textureMap.size,
    textures,
    triangleCount: Math.round(triangleCount),
    vertexCount,
    animationClipNames,
    morphTargets,
    supportedStandardClips,
    supportedMorphTargets,
    memoryRiskAssessment: memoryRisk,
    recommendations,
  };
}
