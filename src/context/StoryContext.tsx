"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Milestone, BirthdayLetter, MediaAsset } from "@/types";
import { INITIAL_MILESTONES, INITIAL_LETTER } from "@/lib/storyData";
import { audioEngine } from "@/lib/audioEngine";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { triggerHaptic } from "@/lib/haptics";
import { requestOrientationPermission } from "@/lib/orientation";

import { SemanticPhotoSlot, getSemanticPhoto, PERSONAL_MEDIA_REGISTRY } from "@/lib/mediaRegistry";

export type UnlockState = "locked" | "unlocking" | "unlocked";
export type ScrollListener = (progress: number, velocity: number) => void;
export type StoryMode = "manual" | "auto";

interface StoryContextType {
  milestones: Milestone[];
  letter: BirthdayLetter;
  activeMilestoneIndex: number;
  scrollProgress: number;
  scrollProgressRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  subscribeToScroll: (listener: ScrollListener) => () => void;
  isMuted: boolean;
  isUnlocked: boolean;
  setIsUnlocked: (unlocked: boolean) => void;
  unlockState: UnlockState;
  setUnlockState: (state: UnlockState) => void;
  beginUnlock: () => Promise<void>;
  isLetterModalOpen: boolean;
  setIsLetterModalOpen: (open: boolean) => void;
  orientation: { beta: number; gamma: number };
  setScrollProgress: (progress: number, velocity?: number) => void;
  toggleAudioMute: () => void;
  setLetter: React.Dispatch<React.SetStateAction<BirthdayLetter>>;
  updateMilestone: (updated: Milestone) => void;
  addMediaToMilestone: (milestoneId: string, media: MediaAsset) => void;
  refreshFromSupabase: () => Promise<void>;

  // Phase 3: Mode & Lightbox
  storyMode: StoryMode;
  setStoryMode: (mode: StoryMode) => void;
  hasChosenStoryMode: boolean;
  setHasChosenStoryMode: (chosen: boolean) => void;
  isAutoPlaying: boolean;
  pauseAuto: () => void;
  resumeAuto: () => void;
  toggleAuto: () => void;
  activeLightboxPhoto: SemanticPhotoSlot | null;
  openPhotoLightbox: (target: string | SemanticPhotoSlot) => void;
  closePhotoLightbox: () => void;
}

const StoryContext = createContext<StoryContextType | null>(null);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [letter, setLetter] = useState<BirthdayLetter>(INITIAL_LETTER);
  const [scrollProgress, setScrollProgressState] = useState<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const scrollListenersRef = useRef<Set<ScrollListener>>(new Set());
  const activeMilestoneIndexRef = useRef<number>(0);
  const rafPendingRef = useRef<boolean>(false);
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [unlockState, setUnlockState] = useState<UnlockState>("locked");
  const [isLetterModalOpen, setIsLetterModalOpen] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<{ beta: number; gamma: number }>({ beta: 0, gamma: 0 });

  // Phase 3 state
  const [storyMode, setStoryModeState] = useState<StoryMode>("manual");
  const [hasChosenStoryMode, setHasChosenStoryModeState] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const wasAutoPlayingBeforePhotoRef = useRef<boolean>(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<SemanticPhotoSlot | null>(null);

  // Initialize story mode from session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = sessionStorage.getItem("sivsha_story_mode") as StoryMode | null;
      if (savedMode) {
        setStoryModeState(savedMode);
        setHasChosenStoryModeState(true);
      }
    }
  }, []);

  const setStoryMode = useCallback((mode: StoryMode) => {
    setStoryModeState(mode);
    setHasChosenStoryModeState(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sivsha_story_mode", mode);
    }
    if (mode === "auto") {
      setIsAutoPlaying(true);
    } else {
      setIsAutoPlaying(false);
    }
  }, []);

  const setHasChosenStoryMode = useCallback((chosen: boolean) => {
    setHasChosenStoryModeState(chosen);
  }, []);

  const pauseAuto = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  const resumeAuto = useCallback(() => {
    setStoryModeState("auto");
    setIsAutoPlaying(true);
  }, []);

  const toggleAuto = useCallback(() => {
    setIsAutoPlaying((prev) => {
      const next = !prev;
      if (next) setStoryModeState("auto");
      return next;
    });
  }, []);

  const openPhotoLightbox = useCallback(
    (target: string | SemanticPhotoSlot) => {
      // 1. Pause auto mode if currently playing
      if (isAutoPlaying) {
        wasAutoPlayingBeforePhotoRef.current = true;
        setIsAutoPlaying(false);
      } else {
        wasAutoPlayingBeforePhotoRef.current = false;
      }

      // 2. Resolve slot
      if (typeof target === "string") {
        const slot = getSemanticPhoto(target) || Object.values(PERSONAL_MEDIA_REGISTRY).find((s) => s.id === target);
        if (slot) {
          setActiveLightboxPhoto(slot);
        }
      } else {
        setActiveLightboxPhoto(target);
      }
    },
    [isAutoPlaying]
  );

  const closePhotoLightbox = useCallback(() => {
    setActiveLightboxPhoto(null);
    // Note: Auto mode REMAINS PAUSED per requirements until user explicitly taps "RESUME AUTO"
  }, []);

  // Load any local overrides or Supabase data
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Check local storage override if any
      try {
        const localMilestones = localStorage.getItem("sivsha_custom_milestones");
        if (localMilestones) {
          setMilestones(JSON.parse(localMilestones));
        }
        const localLetter = localStorage.getItem("sivsha_custom_letter");
        if (localLetter) {
          setLetter(JSON.parse(localLetter));
        }
      } catch {
        // Fallback to initial
      }
      return;
    }

    try {
      const { data: dbMilestones, error: mErr } = await supabase
        .from("milestones")
        .select("*, media:media_assets(*)")
        .order("sequence", { ascending: true });

      if (!mErr && dbMilestones && dbMilestones.length > 0) {
        setMilestones(dbMilestones);
      }

      const { data: dbLetter, error: lErr } = await supabase
        .from("letter")
        .select("*")
        .single();

      if (!lErr && dbLetter) {
        setLetter(dbLetter);
      }
    } catch (e) {
      console.warn("Supabase fetch fallback to defaults:", e);
    }
  }, []);

  useEffect(() => {
    refreshFromSupabase();

    // Verify session with server-signed cookie
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsUnlocked(true);
        }
      })
      .catch(() => {});

    // Gentle gyro parallax handler
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // Clamp and smooth
        const beta = Math.max(-30, Math.min(30, e.beta - 45)) * 0.05;
        const gamma = Math.max(-30, Math.min(30, e.gamma)) * 0.05;
        setOrientation({ beta, gamma });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [refreshFromSupabase]);

  const subscribeToScroll = useCallback((listener: ScrollListener) => {
    scrollListenersRef.current.add(listener);
    return () => {
      scrollListenersRef.current.delete(listener);
    };
  }, []);

  const setScrollProgress = useCallback((progress: number, velocity: number = 0) => {
    const clamped = Math.max(0, Math.min(1, progress));
    scrollProgressRef.current = clamped;
    scrollVelocityRef.current = velocity;

    // Immediately notify high-frequency subscribers without React state overhead
    scrollListenersRef.current.forEach((fn: ScrollListener) => {
      try {
        fn(clamped, velocity);
      } catch {
        // Safe listener error suppression
      }
    });

    // Determine active milestone based on progress boundaries
    const count = milestones.length;
    let foundIndex = 0;
    for (let i = 0; i < count; i++) {
      const m = milestones[i];
      const start = m.custom3DConfig?.splineProgressStart ?? (i / count);
      const end = m.custom3DConfig?.splineProgressEnd ?? ((i + 1) / count);
      const isLast = i === count - 1;
      if (clamped >= start && (isLast ? clamped <= end : clamped < end)) {
        foundIndex = i;
        break;
      }
    }

    // Only update React state when crossing milestone boundaries
    if (activeMilestoneIndexRef.current !== foundIndex) {
      activeMilestoneIndexRef.current = foundIndex;
      setActiveMilestoneIndex(foundIndex);
      setScrollProgressState(clamped);
    }

    // Low-frequency throttle for any residual DOM state consumers (~150ms)
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      setTimeout(() => {
        rafPendingRef.current = false;
        if (Math.abs(scrollProgressRef.current - clamped) < 0.05) {
          setScrollProgressState(scrollProgressRef.current);
        }
      }, 150);
    }
  }, [milestones]);

  const toggleAudioMute = useCallback(() => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const updateMilestone = useCallback((updated: Milestone) => {
    setMilestones((prev) => {
      const next = prev.map((m) => (m.id === updated.id ? updated : m));
      try {
        localStorage.setItem("sivsha_custom_milestones", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const addMediaToMilestone = useCallback((milestoneId: string, media: MediaAsset) => {
    setMilestones((prev) => {
      const next = prev.map((m) => {
        if (m.id === milestoneId) {
          return { ...m, media: [...m.media, media] };
        }
        return m;
      });
      try {
        localStorage.setItem("sivsha_custom_milestones", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const beginUnlock = useCallback(async () => {
    if (unlockState === "unlocking" || unlockState === "unlocked") return;

    setUnlockState("unlocking");

    // 1. Trigger subtle haptic pulse
    triggerHaptic([25, 45]);

    // 2. Request iOS DeviceOrientation permission on this user gesture
    try {
      await requestOrientationPermission();
    } catch {
      // Non-blocking
    }

    // 3. Start generative romantic Web Audio API on this explicit gesture
    try {
      audioEngine.init();
      audioEngine.playChime();
    } catch {
      // Non-blocking
    }
  }, [unlockState]);

  return (
    <StoryContext.Provider
      value={{
        milestones,
        letter,
        activeMilestoneIndex,
        scrollProgress,
        scrollProgressRef,
        scrollVelocityRef,
        subscribeToScroll,
        isMuted,
        isUnlocked,
        setIsUnlocked,
        unlockState,
        setUnlockState,
        beginUnlock,
        isLetterModalOpen,
        setIsLetterModalOpen,
        orientation,
        setScrollProgress,
        toggleAudioMute,
        setLetter,
        updateMilestone,
        addMediaToMilestone,
        refreshFromSupabase,
        storyMode,
        setStoryMode,
        hasChosenStoryMode,
        setHasChosenStoryMode,
        isAutoPlaying,
        pauseAuto,
        resumeAuto,
        toggleAuto,
        activeLightboxPhoto,
        openPhotoLightbox,
        closePhotoLightbox,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStory must be used within a StoryProvider");
  }
  return context;
}
