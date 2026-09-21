"use client";

import React, { useMemo, Suspense } from "react";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";
import { Milestone } from "@/types";
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
import ScenePlaceholder from "./scenes/ScenePlaceholder";

// Z-waypoint anchors for milestone positioning
const MILESTONE_Z_POSITIONS: Record<string, number> = {
  "m-6": -185,  // Train
  "m-7": -235,  // Beach
  "m-8": -290,  // Late Night Conversations
  "m-9": -345,  // August 31
  "m-10": -450, // Classic 350
  "m-11": -570, // Himalayan / Mountain Fall
  "m-12": -625, // Home / Everyday Life
  "m-13": -685, // Finale
};

export function calculateLocalProgress(
  globalProgress: number,
  start: number,
  end: number
): number {
  if (end <= start) return 0;
  return THREE.MathUtils.clamp((globalProgress - start) / (end - start), 0, 1);
}

export default function StorySceneManager() {
  const { scrollProgress, milestones, activeMilestoneIndex } = useStory();

  // Active scene window: previous, current, next
  const activeWindowIndices = useMemo(() => {
    const min = Math.max(0, activeMilestoneIndex - 1);
    const max = Math.min(milestones.length - 1, activeMilestoneIndex + 1);
    const set = new Set<number>();
    for (let i = min; i <= max; i++) {
      set.add(i);
    }
    return set;
  }, [activeMilestoneIndex, milestones.length]);

  // Determine which major scenes to mount
  const shouldRenderAct0 = activeWindowIndices.has(0);
  const shouldRenderAct1 = activeWindowIndices.has(1);
  const shouldRenderAct2 =
    activeWindowIndices.has(2) ||
    activeWindowIndices.has(3) ||
    activeWindowIndices.has(4) ||
    activeWindowIndices.has(5);

  // Local progress for core milestones
  const m0 = milestones[0];
  const m0Start = m0?.custom3DConfig?.splineProgressStart ?? 0.0;
  const m0End = m0?.custom3DConfig?.splineProgressEnd ?? 0.08;
  const m0Local = calculateLocalProgress(scrollProgress, m0Start, m0End);

  const m1 = milestones[1];
  const m1Start = m1?.custom3DConfig?.splineProgressStart ?? 0.08;
  const m1End = m1?.custom3DConfig?.splineProgressEnd ?? 0.18;
  const m1Local = calculateLocalProgress(scrollProgress, m1Start, m1End);

  const m2 = milestones[2];
  const m2Start = m2?.custom3DConfig?.splineProgressStart ?? 0.18;
  const m2End = m2?.custom3DConfig?.splineProgressEnd ?? 0.32;
  const m2Local = calculateLocalProgress(scrollProgress, m2Start, m2End);

  const m3 = milestones[3];
  const m3Start = m3?.custom3DConfig?.splineProgressStart ?? 0.32;
  const m3End = m3?.custom3DConfig?.splineProgressEnd ?? 0.38;
  const m3Local = calculateLocalProgress(scrollProgress, m3Start, m3End);

  const m4 = milestones[4];
  const m4Start = m4?.custom3DConfig?.splineProgressStart ?? 0.38;
  const m4End = m4?.custom3DConfig?.splineProgressEnd ?? 0.45;
  const m4Local = calculateLocalProgress(scrollProgress, m4Start, m4End);

  const m5 = milestones[5];
  const m5Start = m5?.custom3DConfig?.splineProgressStart ?? 0.45;
  const m5End = m5?.custom3DConfig?.splineProgressEnd ?? 0.53;
  const m5Local = calculateLocalProgress(scrollProgress, m5Start, m5End);

  const collegeStart = 0.18;
  const collegeEnd = 0.53;
  const collegeLocal = calculateLocalProgress(scrollProgress, collegeStart, collegeEnd);

  return (
    <group name="story-scene-manager">
      {/* Act 0: Entry Transition */}
      {shouldRenderAct0 && (
        <SceneTransitionWrapper
          localProgress={m0Local}
          isActive={activeMilestoneIndex === 0}
          fadeSpan={0.2}
        >
          <Suspense fallback={null}>
            <Act0Entry />
          </Suspense>
        </SceneTransitionWrapper>
      )}

      {/* Act 1: Before We Met */}
      {shouldRenderAct1 && (
        <SceneTransitionWrapper
          localProgress={m1Local}
          isActive={activeMilestoneIndex === 1}
          fadeSpan={0.15}
        >
          <Suspense fallback={null}>
            <Act1Before localProgress={m1Local} />
          </Suspense>
        </SceneTransitionWrapper>
      )}

      {/* Act 2: Marine Engineering College, Pen, Tribaly, Friend Group */}
      {shouldRenderAct2 && (
        <SceneTransitionWrapper
          localProgress={collegeLocal}
          isActive={activeMilestoneIndex >= 2 && activeMilestoneIndex <= 5}
          fadeSpan={0.1}
        >
          <Suspense fallback={null}>
            <Act2College
              localProgress={m2Local}
              penProgress={m3Local}
              classroomProgress={m4Local}
              friendGroupProgress={m5Local}
              globalProgress={scrollProgress}
            />
          </Suspense>
        </SceneTransitionWrapper>
      )}

      {/* Act 3 & 4 Milestones */}
      {milestones.slice(6).map((m) => {
        const idx = m.sequence;
        if (!activeWindowIndices.has(idx)) {
          // Windowed culling for optimal GPU memory
          return null;
        }

        const start = m.custom3DConfig?.splineProgressStart ?? 0.53;
        const end = m.custom3DConfig?.splineProgressEnd ?? 1.0;
        const local = calculateLocalProgress(scrollProgress, start, end);
        const posZ = MILESTONE_Z_POSITIONS[m.id] ?? -200;

        // Custom scene dispatch
        let sceneContent = null;
        if (m.id === "m-6") {
          sceneContent = <Act3Train localProgress={local} />;
        } else if (m.id === "m-7") {
          sceneContent = <Act3Beach localProgress={local} />;
        } else if (m.id === "m-8") {
          // Late Night Conversations: distinct midnight visual beat
          sceneContent = <Act3LateTalks localProgress={local} />;
        } else if (m.id === "m-9") {
          // August 31, 2025: Quiet cinematic car road milestone
          sceneContent = <Act3Car localProgress={local} />;
        } else if (m.id === "m-10" || m.id === "m-11") {
          // Royal Enfield Classic 350 & Himalayan 450 Mountain Fall
          sceneContent = <Act3Bikes milestoneId={m.id} localProgress={local} />;
        } else if (m.id === "m-12") {
          // Home / Everyday Life: warm interior togetherness
          sceneContent = <Act3Home localProgress={local} />;
        } else if (m.id === "m-13") {
          // Act IV Finale: Pedestal, floating lanterns & wax seal envelope
          sceneContent = <Act4Finale localProgress={local} />;
        } else {
          // Fallback placeholder for other interim markers
          sceneContent = (
            <ScenePlaceholder
              milestone={m}
              localProgress={local}
              positionZ={posZ}
            />
          );
        }

        return (
          <SceneTransitionWrapper
            key={m.id}
            localProgress={local}
            isActive={activeMilestoneIndex === idx}
            fadeSpan={0.2}
          >
            <Suspense fallback={null}>
              {sceneContent}
            </Suspense>
          </SceneTransitionWrapper>
        );
      })}
    </group>
  );
}
