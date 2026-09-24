"use client";

import React, { Suspense } from "react";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";
import SceneTransitionWrapper from "./SceneTransitionWrapper";
import Act0Entry from "./scenes/Act0Entry";
import Act1Before from "./scenes/Act1Before";
import Act2College from "./scenes/Act2College";
import Act3Train from "./scenes/Act3Train";
import Act3Beach from "./scenes/Act3Beach";
import Act3LateTalks from "./scenes/Act3LateTalks";
import Act3Car from "./scenes/Act3Car";
import Act3Bikes from "./scenes/Act3Bikes";
import Act3Home from "./scenes/Act3Home";
import Act4Finale from "./scenes/Act4Finale";

export function calculateLocalProgress(
  globalProgress: number,
  start: number,
  end: number
): number {
  if (end <= start) return 0;
  return THREE.MathUtils.clamp((globalProgress - start) / (end - start), 0, 1);
}

/**
 * =========================================================================
 * STORY SCENE MANAGER — ONE CONTINUOUS CINEMATIC WORLD (PHASE 10)
 * =========================================================================
 *
 * Replaces discrete scene swapping with a continuous 3D world timeline:
 * BEFORE WE MET → COLLEGE → CLASSROOM → FRIENDS → TRAIN → BEACH
 * → AUGUST 31 → MOTORCYCLES → HOME → LETTER → FINALE
 *
 * Architecture:
 * - All milestone chapters remain permanently mounted in the scene graph.
 * - Distance-based visibility gating skips hidden subtrees with zero draw calls.
 * - Zero React unmount/mount hitches or WebGL shader re-compilation during travel.
 */
export default function StorySceneManager() {
  const { activeMilestoneIndex } = useStory();

  return (
    <group name="story-scene-manager">
      {/* Act 0: Entry Transition (z: 0) */}
      <SceneTransitionWrapper
        positionZ={0}
        visibilityRange={65}
        isActive={activeMilestoneIndex === 0}
      >
        <Suspense fallback={null}>
          <Act0Entry />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 1: Before We Met (z: -31) — Includes exact supplied Before-meeting.jpeg */}
      <SceneTransitionWrapper
        positionZ={-31}
        visibilityRange={80}
        isActive={activeMilestoneIndex === 1}
      >
        <Suspense fallback={null}>
          <Act1Before />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 2: Marine Engineering College, Pen, Classroom, Friend Group (z: -50 to -160) */}
      <SceneTransitionWrapper
        positionZ={-105}
        visibilityRange={115}
        isActive={activeMilestoneIndex >= 2 && activeMilestoneIndex <= 5}
      >
        <Suspense fallback={null}>
          <Act2College />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Kozhikode Train (z: -185) — Photo framed prominently on visible exterior body */}
      <SceneTransitionWrapper
        positionZ={-185}
        visibilityRange={85}
        isActive={activeMilestoneIndex === 6}
      >
        <Suspense fallback={null}>
          <Act3Train localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Kozhikode Beach (z: -235) — Includes NEW Beach image */}
      <SceneTransitionWrapper
        positionZ={-235}
        visibilityRange={85}
        isActive={activeMilestoneIndex === 7}
      >
        <Suspense fallback={null}>
          <Act3Beach localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Late Night Conversations (z: -290) */}
      <SceneTransitionWrapper
        positionZ={-290}
        visibilityRange={85}
        isActive={activeMilestoneIndex === 8}
      >
        <Suspense fallback={null}>
          <Act3LateTalks localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: 31 AUGUST 2025 (Car Cabin Overlook) (z: -345) */}
      <SceneTransitionWrapper
        positionZ={-345}
        visibilityRange={90}
        isActive={activeMilestoneIndex === 9}
      >
        <Suspense fallback={null}>
          <Act3Car localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Royal Enfield Classic 350 (z: -450) */}
      <SceneTransitionWrapper
        positionZ={-450}
        visibilityRange={95}
        isActive={activeMilestoneIndex === 10}
      >
        <Suspense fallback={null}>
          <Act3Bikes milestoneId="m-10" localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Himalayan 450 & Mountain Fall (z: -570) */}
      <SceneTransitionWrapper
        positionZ={-570}
        visibilityRange={95}
        isActive={activeMilestoneIndex === 11}
      >
        <Suspense fallback={null}>
          <Act3Bikes milestoneId="m-11" localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 3: Home / Everyday Life (z: -625) */}
      <SceneTransitionWrapper
        positionZ={-625}
        visibilityRange={85}
        isActive={activeMilestoneIndex === 12}
      >
        <Suspense fallback={null}>
          <Act3Home localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>

      {/* Act 4: Finale & Parchment Letter (z: -685) */}
      <SceneTransitionWrapper
        positionZ={-685}
        visibilityRange={90}
        isActive={activeMilestoneIndex === 13}
      >
        <Suspense fallback={null}>
          <Act4Finale localProgress={0} />
        </Suspense>
      </SceneTransitionWrapper>
    </group>
  );
}
