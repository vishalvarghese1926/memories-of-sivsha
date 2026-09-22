import { MediaAsset } from "@/types";

/**
 * =========================================================================
 * MEMORIES OF SIVSHA — PRODUCTION MEDIA REGISTRY
 * =========================================================================
 *
 * This registry acts as the single source of truth for personal media.
 * To replace placeholder images with personal photos or videos:
 * 1. Place your personal image or video into:
 *      public/media/photos/  (e.g., train_journey.jpg, beach_sunset.jpg)
 *      public/media/videos/  (e.g., waves.mp4, classic350_ride.mp4)
 * 2. Update the corresponding `personalUrl` field below.
 *
 * When `personalUrl` is empty or null, the system automatically falls back
 * to the verified remote placeholder imagery or procedural textures.
 */

export interface PersonalMediaSlot {
  milestoneId: string;
  sceneTitle: string;
  /**
   * Path relative to public directory (e.g., "/media/photos/train_doorway.jpg" or "/media/videos/beach.mp4").
   * Set to empty string until real personal media is supplied.
   */
  personalUrl?: string;
  type: "image" | "video";
  caption?: string;
  thumbnailUrl?: string;
  isHero?: boolean;
  date?: string;
  location?: string;
}

export const PERSONAL_MEDIA_REGISTRY: Record<string, PersonalMediaSlot> = {
  "m-1": {
    milestoneId: "m-1",
    sceneTitle: "Before We Met",
    personalUrl: "/media/photos/m1_before.webp",
    type: "image",
    caption: "Early childhood memories & sunlit laughter",
    isHero: false,
  },
  "m-2": {
    milestoneId: "m-2",
    sceneTitle: "Marine Engineering College",
    personalUrl: "/media/photos/m2_college.webp",
    type: "image",
    caption: "The bustling college corridors where we first stood in the same room",
    location: "Marine Engineering College Administration Hall",
    isHero: true,
  },
  "m-4": {
    milestoneId: "m-4",
    sceneTitle: "Tribaly / Classroom",
    personalUrl: "/media/photos/m4_classroom.webp",
    type: "image",
    caption: "Quiet glances across the lecture hall",
    isHero: false,
  },
  "m-5": {
    milestoneId: "m-5",
    sceneTitle: "The Friend Group",
    personalUrl: "/media/photos/m5_friends.webp",
    type: "image",
    caption: "Our college circle — days filled with laughter and shared studies",
    isHero: true,
  },
  "m-6": {
    milestoneId: "m-6",
    sceneTitle: "Kozhikode Train",
    personalUrl: "/media/photos/m6_train.webp",
    type: "image",
    caption: "Golden hour breeze along the railway tracks heading to Kozhikode",
    location: "En route to Kozhikode",
    isHero: true,
  },
  "m-7": {
    milestoneId: "m-7",
    sceneTitle: "Kozhikode Beach",
    personalUrl: "/media/photos/m7_beach.webp",
    type: "image",
    caption: "Evening tide and bare feet at Kozhikode Beach",
    location: "Kozhikode Beach",
    isHero: true,
  },
  "m-8": {
    milestoneId: "m-8",
    sceneTitle: "Late Night Conversations",
    personalUrl: "/media/photos/m8_latenight.webp",
    type: "image",
    caption: "Late night conversations that bridged our worlds",
    isHero: false,
  },
  "m-9": {
    milestoneId: "m-9",
    sceneTitle: "31 AUGUST 2025",
    personalUrl: "/media/photos/m9_car.webp",
    type: "image",
    caption: "The day we officially began our journey together",
    date: "2025-08-31",
    isHero: true,
  },
  "m-10": {
    milestoneId: "m-10",
    sceneTitle: "Classic 350",
    personalUrl: "/media/photos/m10_classic350.webp",
    type: "image",
    caption: "Riding into the sunset on the Classic 350",
    isHero: true,
  },
  "m-11": {
    milestoneId: "m-11",
    sceneTitle: "Himalayan 450 & Mountain Fall",
    personalUrl: "/media/photos/m11_himalayan.webp",
    type: "image",
    caption: "Conquering mountain curves on the Himalayan",
    isHero: true,
  },
  "m-12": {
    milestoneId: "m-12",
    sceneTitle: "Home / Everyday Life",
    personalUrl: "/media/photos/m12_home.webp",
    type: "image",
    caption: "Visiting home, quiet teas and simple everyday warmth",
    isHero: true,
  },
};

/**
 * Resolves the active media asset for a milestone:
 * 1. Checks if a local personal media file has been specified in PERSONAL_MEDIA_REGISTRY.
 * 2. If present, returns the personal media asset.
 * 3. Otherwise, falls back to the default media asset configured on the milestone (e.g. placeholder).
 */
export function resolveMilestoneMedia(
  milestoneId: string,
  defaultMedia?: MediaAsset[]
): MediaAsset | null {
  const registryEntry = PERSONAL_MEDIA_REGISTRY[milestoneId];

  // If a real personal media URL is configured and non-empty, use it
  if (registryEntry?.personalUrl && registryEntry.personalUrl.trim().length > 0) {
    return {
      id: `personal-${milestoneId}`,
      milestoneId,
      url: registryEntry.personalUrl.trim(),
      type: registryEntry.type,
      caption: registryEntry.caption || defaultMedia?.[0]?.caption,
      thumbnailUrl: registryEntry.thumbnailUrl || registryEntry.personalUrl.trim(),
      date: registryEntry.date || defaultMedia?.[0]?.date,
      location: registryEntry.location || defaultMedia?.[0]?.location,
      isCover: registryEntry.isHero ?? true,
    };
  }

  // Fallback to default milestone media
  if (defaultMedia && defaultMedia.length > 0) {
    return defaultMedia[0];
  }

  return null;
}
