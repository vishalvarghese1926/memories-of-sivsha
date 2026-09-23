import { MediaAsset } from "@/types";

/**
 * =========================================================================
 * MEMORIES OF SIVSHA — PRODUCTION MEDIA REGISTRY (PHASE 3)
 * =========================================================================
 *
 * Source of Truth: D:\Site pics\New folder
 * Every story photo is explicitly mapped with semantic metadata:
 * - id & milestoneId
 * - photoUrl (in-canvas WebGL optimized texture)
 * - highResUrl (fullscreen lightbox source)
 * - caption & sceneTitle
 * - aspectRatio (exact computed width/height ratio)
 * - displayMode (framed, pinned, memory-card, surface, cinematic)
 * - focalPoint [x, y]
 * - fullscreenEnabled
 */

export type PhotoDisplayMode =
  | "framed"
  | "pinned"
  | "memory-card"
  | "surface"
  | "cinematic";

export interface SemanticPhotoSlot {
  id: string;
  milestoneId: string;
  sceneTitle: string;
  photoUrl: string;
  highResUrl: string;
  type: "image" | "video";
  caption: string;
  aspectRatio: number;
  displayMode: PhotoDisplayMode;
  focalPoint: [number, number];
  fullscreenEnabled: boolean;
  date?: string;
  location?: string;
  isHero?: boolean;
}

export const PERSONAL_MEDIA_REGISTRY: Record<string, SemanticPhotoSlot> = {
  "m-1": {
    id: "photo-m1",
    milestoneId: "m-1",
    sceneTitle: "Before We Met",
    photoUrl: "/media/photos/m1_before.webp",
    highResUrl: "/media/photos/m1_before_full.webp",
    type: "image",
    caption: "Early childhood memories & sunlit laughter — two worlds before our paths crossed",
    aspectRatio: 1.7778,
    displayMode: "framed",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: false,
  },
  "m-2": {
    id: "photo-m2",
    milestoneId: "m-2",
    sceneTitle: "Marine Engineering College",
    photoUrl: "/media/photos/m2_college.webp",
    highResUrl: "/media/photos/m2_college_full.webp",
    type: "image",
    caption: "Department of Computer Science & Engineering — college corridors where we first stood together",
    aspectRatio: 1.7778,
    displayMode: "memory-card",
    location: "College Corridors",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-4": {
    id: "photo-m4",
    milestoneId: "m-4",
    sceneTitle: "Tribaly / Classroom",
    photoUrl: "/media/photos/m4_classroom.webp",
    highResUrl: "/media/photos/m4_classroom_full.webp",
    type: "image",
    caption: "Quiet glances across the lecture hall benches and blackboard",
    aspectRatio: 1.7778,
    displayMode: "pinned",
    location: "Lecture Hall 3B",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: false,
  },
  "m-5": {
    id: "photo-m5",
    milestoneId: "m-5",
    sceneTitle: "The Friend Group",
    photoUrl: "/media/photos/m5_friends.webp",
    highResUrl: "/media/photos/m5_friends_full.webp",
    type: "image",
    caption: "Our college circle on the staircase — days filled with laughter, shared tea, and camaraderie",
    aspectRatio: 1.3333,
    displayMode: "memory-card",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-6": {
    id: "photo-m6",
    milestoneId: "m-6",
    sceneTitle: "Kozhikode Train",
    photoUrl: "/media/photos/m6_train.webp",
    highResUrl: "/media/photos/m6_train_full.webp",
    type: "image",
    caption: "Wind in our hair by the train doorway on the journey to Kozhikode",
    aspectRatio: 0.5625,
    displayMode: "cinematic",
    location: "En route to Kozhikode",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-7": {
    id: "photo-m7",
    milestoneId: "m-7",
    sceneTitle: "Kozhikode Beach",
    photoUrl: "/media/photos/m7_beach.webp",
    highResUrl: "/media/photos/m7_beach_full.webp",
    type: "image",
    caption: "Sunlit shores, sea breeze, and bare feet at Kozhikode Beach",
    aspectRatio: 1.7778,
    displayMode: "surface",
    location: "Kozhikode Beach",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-8": {
    id: "photo-m8",
    milestoneId: "m-8",
    sceneTitle: "Late Night Conversations",
    photoUrl: "/media/photos/m8_latenight.webp",
    highResUrl: "/media/photos/m8_latenight.webp",
    type: "image",
    caption: "Late night conversations that bridged our worlds across the dark",
    aspectRatio: 1.7778,
    displayMode: "cinematic",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: false,
  },
  "m-9": {
    id: "photo-m9",
    milestoneId: "m-9",
    sceneTitle: "31 AUGUST 2025",
    photoUrl: "/media/photos/m9_august31.webp",
    highResUrl: "/media/photos/m9_august31_full.webp",
    type: "image",
    caption: "August 31, 2025 — The mountain overlook where our story officially began",
    aspectRatio: 1.0,
    displayMode: "cinematic",
    date: "2025-08-31",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-10": {
    id: "photo-m10",
    milestoneId: "m-10",
    sceneTitle: "Classic 350",
    photoUrl: "/media/photos/m10_classic350.webp",
    highResUrl: "/media/photos/m10_classic350_full.webp",
    type: "image",
    caption: "Evening ride on the olive green Classic 350 — wind in her hair",
    aspectRatio: 1.7786,
    displayMode: "framed",
    location: "Coastal Highway",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-11": {
    id: "photo-m11",
    milestoneId: "m-11",
    sceneTitle: "Himalayan 450 & Mountain Fall",
    photoUrl: "/media/photos/m11_himalayan.webp",
    highResUrl: "/media/photos/m11_himalayan_full.webp",
    type: "image",
    caption: "Misty mountain pass on the Himalayan 450 — the curve we navigated together",
    aspectRatio: 0.75,
    displayMode: "framed",
    location: "Mountain Pass",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "m-12": {
    id: "photo-m12",
    milestoneId: "m-12",
    sceneTitle: "Home / Everyday Life",
    photoUrl: "/media/photos/m12_home.webp",
    highResUrl: "/media/photos/m12_home_full.webp",
    type: "image",
    caption: "Visiting home, quiet laughter, and simple everyday warmth",
    aspectRatio: 0.6709,
    displayMode: "surface",
    location: "Home",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: true,
  },
  "letter-seal": {
    id: "photo-letter-seal",
    milestoneId: "m-14",
    sceneTitle: "Letter Monogram & Seal",
    photoUrl: "/media/photos/letter_seal.webp",
    highResUrl: "/media/photos/letter_seal_full.webp",
    type: "image",
    caption: "Handwritten memories sealed with an eternal bond",
    aspectRatio: 0.6095,
    displayMode: "surface",
    focalPoint: [0.5, 0.5],
    fullscreenEnabled: true,
    isHero: false,
  },
};

/**
 * Resolves the active media asset for a milestone:
 * 1. Checks if a local personal media file has been specified in PERSONAL_MEDIA_REGISTRY.
 * 2. If present, returns the personal media asset.
 * 3. Otherwise, falls back to the default media asset configured on the milestone.
 */
export function resolveMilestoneMedia(
  milestoneId: string,
  defaultMedia?: MediaAsset[]
): MediaAsset | null {
  const registryEntry = PERSONAL_MEDIA_REGISTRY[milestoneId];

  if (registryEntry?.photoUrl && registryEntry.photoUrl.trim().length > 0) {
    return {
      id: registryEntry.id,
      milestoneId,
      url: registryEntry.photoUrl.trim(),
      type: registryEntry.type,
      caption: registryEntry.caption || defaultMedia?.[0]?.caption,
      thumbnailUrl: registryEntry.photoUrl.trim(),
      date: registryEntry.date || defaultMedia?.[0]?.date,
      location: registryEntry.location || defaultMedia?.[0]?.location,
      isCover: registryEntry.isHero ?? true,
    };
  }

  if (defaultMedia && defaultMedia.length > 0) {
    return defaultMedia[0];
  }

  return null;
}

export function getSemanticPhoto(milestoneId: string): SemanticPhotoSlot | null {
  return PERSONAL_MEDIA_REGISTRY[milestoneId] || null;
}
