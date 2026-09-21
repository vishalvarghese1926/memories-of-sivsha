"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";
import { Milestone } from "@/types";

// Curve waypoints spanning Acts 0 to IV (z-axis progress from positive to negative)
const WAYPOINTS = [
  new THREE.Vector3(0, 4, 18),      // Act 0: Entry / Vortex (z ~ 0 to 20)
  new THREE.Vector3(0, 2.2, -18),   // Act I: Before We Met (z ~ -18 to -35)
  new THREE.Vector3(0, 1.8, -62),   // Act II: College Pen (z ~ -62 to -80)
  new THREE.Vector3(0, 2.1, -105),  // Act II-B: Tribly Class (z ~ -105 to -125)
  new THREE.Vector3(0, 2.0, -140),  // Act II-C: Same Class (z ~ -140 to -160)
  new THREE.Vector3(4, 2.6, -185),  // Act III: Train
  new THREE.Vector3(-3, 2.0, -235), // Act III-B: Beach
  new THREE.Vector3(0, 3.5, -290),  // Act III-C: Late Night Talks
  new THREE.Vector3(0, 1.7, -345),  // Act III-D: Car Memory
  new THREE.Vector3(0, 2.8, -395),  // Act III-E: Oct 31
  new THREE.Vector3(5, 2.4, -450),  // Act III-F: Classic 350
  new THREE.Vector3(-4, 3.2, -510), // Act III-G: Himalayan 450
  new THREE.Vector3(0, 1.6, -570),  // Act III-H: Mountain Fall
  new THREE.Vector3(0, 2.0, -625),  // Act III-I: Life Together
  new THREE.Vector3(0, 2.5, -685),  // Act IV: Finale Pedestal
];

const LOOKAT_WAYPOINTS = [
  new THREE.Vector3(0, 1.5, 0),
  new THREE.Vector3(0, 1.4, -32),
  new THREE.Vector3(0, 1.5, -78),
  new THREE.Vector3(0, 1.3, -120),
  new THREE.Vector3(0, 1.3, -155),
  new THREE.Vector3(0, 2.0, -200),
  new THREE.Vector3(0, 1.2, -252),
  new THREE.Vector3(0, 2.0, -310),
  new THREE.Vector3(0, 1.4, -360),
  new THREE.Vector3(0, 2.5, -415),
  new THREE.Vector3(0, 1.8, -470),
  new THREE.Vector3(0, 2.2, -530),
  new THREE.Vector3(0, 1.2, -588),
  new THREE.Vector3(0, 1.5, -645),
  new THREE.Vector3(0, 1.8, -700),
];

function getTargetFov(progress: number, milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0) return 45;
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const start = m.custom3DConfig?.splineProgressStart ?? 0;
    const end = m.custom3DConfig?.splineProgressEnd ?? 1;
    if (progress >= start && progress <= end) {
      const nextM = milestones[i + 1] || m;
      const span = Math.max(0.0001, end - start);
      const factor = (progress - start) / span;
      const curFov = m.custom3DConfig?.cameraFov ?? 45;
      const nextFov = nextM.custom3DConfig?.cameraFov ?? curFov;
      return THREE.MathUtils.lerp(curFov, nextFov, factor);
    }
  }
  return 45;
}

export default function CameraRig() {
  const { scrollProgress, orientation, milestones } = useStory();
  const { camera } = useThree();

  const currentPos = useRef(new THREE.Vector3(0, 4, 18));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Smooth CatmullRom splines for both camera path and look-at target
  const positionSpline = useMemo(() => {
    return new THREE.CatmullRomCurve3(WAYPOINTS, false, "centripetal", 0.5);
  }, []);

  const lookAtSpline = useMemo(() => {
    return new THREE.CatmullRomCurve3(LOOKAT_WAYPOINTS, false, "centripetal", 0.5);
  }, []);

  useFrame((_, delta) => {
    // Clamped normalized progress [0, 0.999] for CatmullRom evaluation
    const t = THREE.MathUtils.clamp(scrollProgress, 0, 0.999);

    // Sample independent target position and look-at point along curves
    const targetPos = positionSpline.getPointAt(t);
    let targetLook = lookAtSpline.getPointAt(t);

    // EMOTIONAL FOCAL POINTS OVERRIDES:
    // 1. Pen exchange milestone (t ~ 0.32 to 0.38): lock target onto pen exchange center & smiling faces
    if (t >= 0.32 && t <= 0.38) {
      const penFactor = Math.sin(((t - 0.32) / (0.38 - 0.32)) * Math.PI);
      const penFocalPoint = new THREE.Vector3(0.1, 1.35, -75.2);
      targetLook = targetLook.clone().lerp(penFocalPoint, penFactor * 0.85);
    }
    // 2. Classroom milestone (t ~ 0.38 to 0.45): rack focus from back-row boy to front-row Sivani
    else if (t >= 0.38 && t <= 0.45) {
      const classProgress = (t - 0.38) / (0.45 - 0.38);
      let classFocalPoint = new THREE.Vector3(0, 1.8, -125); // 0.00-0.18: wide classroom / blackboard

      if (classProgress < 0.18) {
        classFocalPoint = new THREE.Vector3(0, 1.8, -125);
      } else if (classProgress < 0.38) {
        // 0.18-0.38: reveal boy in back row
        const sub = (classProgress - 0.18) / 0.20;
        classFocalPoint = new THREE.Vector3(
          THREE.MathUtils.lerp(0, -0.9, sub),
          THREE.MathUtils.lerp(1.8, 1.25, sub),
          THREE.MathUtils.lerp(-125, -114.2, sub)
        );
      } else if (classProgress < 0.70) {
        // 0.38-0.70: rack focus toward Sivani in front row
        const sub = (classProgress - 0.38) / 0.32;
        classFocalPoint = new THREE.Vector3(
          THREE.MathUtils.lerp(-0.9, 0.8, sub),
          THREE.MathUtils.lerp(1.25, 1.25, sub),
          THREE.MathUtils.lerp(-114.2, -120.8, sub)
        );
      } else if (classProgress < 0.84) {
        // 0.70-0.84: shared composition
        const sub = (classProgress - 0.70) / 0.14;
        classFocalPoint = new THREE.Vector3(
          THREE.MathUtils.lerp(0.8, 0.0, sub),
          THREE.MathUtils.lerp(1.25, 1.35, sub),
          THREE.MathUtils.lerp(-120.8, -118.0, sub)
        );
      } else {
        // 0.84-1.00: subtle return toward classroom center
        const sub = (classProgress - 0.84) / 0.16;
        classFocalPoint = new THREE.Vector3(
          0.0,
          THREE.MathUtils.lerp(1.35, 1.4, sub),
          THREE.MathUtils.lerp(-118.0, -122.0, sub)
        );
      }

      const classFactor = Math.sin(classProgress * Math.PI);
      targetLook = targetLook.clone().lerp(classFocalPoint, Math.min(0.9, classFactor * 0.95 + 0.35));
    }
    // 3. Friend Group milestone (t ~ 0.45 to 0.53): focus on shared study table & Sivani explaining
    else if (t >= 0.45 && t <= 0.53) {
      const fgProgress = (t - 0.45) / (0.53 - 0.45);
      let fgFocalPoint = new THREE.Vector3(0, 1.2, -152);

      if (fgProgress < 0.25) {
        fgFocalPoint = new THREE.Vector3(0, 1.2, -152);
      } else if (fgProgress < 0.60) {
        // Focus on study notes & Sivani explaining
        const sub = (fgProgress - 0.25) / 0.35;
        fgFocalPoint = new THREE.Vector3(
          0,
          THREE.MathUtils.lerp(1.2, 1.1, sub),
          THREE.MathUtils.lerp(-152, -152.4, sub)
        );
      } else if (fgProgress < 0.85) {
        // Shared glance across table & subtle under-desk tap
        const sub = (fgProgress - 0.60) / 0.25;
        fgFocalPoint = new THREE.Vector3(
          0,
          THREE.MathUtils.lerp(1.1, 0.95, sub),
          -152.0
        );
      } else {
        // Settle back to study circle
        fgFocalPoint = new THREE.Vector3(0, 1.2, -152);
      }

      const fgFactor = Math.sin(fgProgress * Math.PI);
      targetLook = targetLook.clone().lerp(fgFocalPoint, Math.min(0.9, fgFactor * 0.9 + 0.4));
    }
    // 4. August 31 milestone (t ~ 0.75 to 0.80): lock focus on car interior & couple
    else if (t >= 0.75 && t <= 0.80) {
      const augFactor = Math.sin(((t - 0.75) / (0.80 - 0.75)) * Math.PI);
      const augFocalPoint = new THREE.Vector3(-0.2, 1.25, -345);
      targetLook = targetLook.clone().lerp(augFocalPoint, augFactor * 0.85);
    }

    // Apply gyro tilt if reduced motion is false
    if (!reducedMotion) {
      targetPos.x += orientation.gamma * 0.25;
      targetPos.y += orientation.beta * 0.18;
    }

    // Steadycam kinematic damping: smoother glide on camera movements
    const damping = reducedMotion ? Math.min(1, delta * 3.0) : Math.min(1, delta * 3.6);
    currentPos.current.lerp(targetPos, damping);
    currentLookAt.current.lerp(targetLook, damping * 1.2);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    // Smooth FOV interpolation based on current milestone's cinematic framing
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = THREE.MathUtils.clamp(getTargetFov(t, milestones), 36, 54);
      const prevFov = camera.fov;
      camera.fov = THREE.MathUtils.lerp(prevFov, targetFov, Math.min(1, delta * 3.5));
      if (Math.abs(camera.fov - prevFov) > 0.001) {
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}
