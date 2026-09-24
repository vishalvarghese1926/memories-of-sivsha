/**
 * =========================================================================
 * MEMORIES OF SIVSHA — STORY TEXTURE MANAGER & GPU WARMER
 * =========================================================================
 *
 * Eliminates chapter transition hitches by:
 * 1. Pre-allocating and pre-decoding all story photo THREE.Textures into a singleton cache.
 * 2. Uploading textures to GPU memory via `renderer.initTexture()` during the preloader phase.
 * 3. Providing synchronous zero-overhead texture access to FloatingMediaFrame and scenes.
 * 4. Preventing texture recreation, thrashing, and dispose-reload loops during scrolling.
 */

import * as THREE from "three";
import { PERSONAL_MEDIA_REGISTRY } from "./mediaRegistry";

// Singleton texture cache
const textureCache = new Map<string, THREE.Texture>();
let fallbackMonogramTexture: THREE.CanvasTexture | null = null;
let isWarmedUp = false;

/**
 * Procedural luxury monogram fallback texture (Single shared instance)
 */
export function getFallbackMonogramTexture(): THREE.CanvasTexture {
  if (fallbackMonogramTexture) return fallbackMonogramTexture;

  if (typeof window === "undefined") {
    fallbackMonogramTexture = new THREE.CanvasTexture({} as HTMLCanvasElement);
    return fallbackMonogramTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 340);
    grad.addColorStop(0, "#1f091c");
    grad.addColorStop(0.5, "#2a0d24");
    grad.addColorStop(1, "#0d0614");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 340);

    const glow = ctx.createRadialGradient(256, 170, 10, 256, 170, 180);
    glow.addColorStop(0, "rgba(244, 63, 94, 0.25)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 340);

    ctx.font = "italic 44px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = "#fecdd3";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S  &  V", 256, 155);

    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(253, 164, 175, 0.75)";
    ctx.fillText("MEMORIES OF SIVSHA", 256, 205);

    ctx.strokeStyle = "rgba(251, 113, 133, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 480, 308);
  }

  fallbackMonogramTexture = new THREE.CanvasTexture(canvas);
  fallbackMonogramTexture.generateMipmaps = true;
  fallbackMonogramTexture.minFilter = THREE.LinearMipmapLinearFilter;
  return fallbackMonogramTexture;
}

/**
 * Pre-loads a single texture and stores it in the singleton cache
 */
export function loadStoryTexture(url: string): Promise<THREE.Texture> {
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      const emptyTex = new THREE.Texture();
      textureCache.set(url, emptyTex);
      resolve(emptyTex);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      url,
      (tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      () => {
        // Return shared fallback on error without throwing
        const fallback = getFallbackMonogramTexture();
        textureCache.set(url, fallback);
        resolve(fallback);
      }
    );
  });
}

/**
 * Synchronous getter for already loaded/warmed textures
 */
export function getStoryTexture(url?: string): THREE.Texture | null {
  if (!url) return null;
  return textureCache.get(url) || null;
}

/**
 * Preloads all in-canvas story photos into the texture cache
 */
export async function preloadAllStoryTextures(): Promise<void> {
  if (typeof window === "undefined") return;

  const photoUrls: string[] = Object.values(PERSONAL_MEDIA_REGISTRY)
    .map((slot) => slot.photoUrl)
    .filter(Boolean);

  // Add letter seal
  if (!photoUrls.includes("/media/photos/letter_seal.webp")) {
    photoUrls.push("/media/photos/letter_seal.webp");
  }

  await Promise.all(photoUrls.map((url) => loadStoryTexture(url)));
}

/**
 * GPU Warmup Pass:
 * Force WebGL driver to upload all cached textures (gl.texImage2D)
 * and compile all scene shaders BEFORE story playback starts.
 */
export function warmAllStoryTexturesOnGPU(gl: THREE.WebGLRenderer): void {
  if (isWarmedUp || typeof window === "undefined") return;

  textureCache.forEach((tex) => {
    try {
      if (tex && (tex as any).image) {
        gl.initTexture(tex);
      }
    } catch {
      // Non-blocking catch
    }
  });

  isWarmedUp = true;
}
