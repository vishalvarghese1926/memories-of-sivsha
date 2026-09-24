"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStory } from "@/context/StoryContext";

interface CameraWaypoint {
  progress: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
}

/**
 * EXACT MILESTONE-ALIGNED CAMERA KEYFRAMES (Acts 0 through IV)
 * Progress 0.00 to 1.00 directly matches storyData milestone boundaries and 3D world geometry.
 */
const CAMERA_KEYFRAMES: CameraWaypoint[] = [
  // 0. Act 0: Entry Transition (0.00 - 0.08) - Vortex [0, 0, 0]
  {
    progress: 0.00,
    position: new THREE.Vector3(0, 4.0, 18),
    lookAt: new THREE.Vector3(0, 1.5, 0),
    fov: 50,
  },
  {
    progress: 0.04,
    position: new THREE.Vector3(0, 3.0, 8),
    lookAt: new THREE.Vector3(0, 1.5, -6),
    fov: 48,
  },
  {
    progress: 0.08,
    position: new THREE.Vector3(0, 2.3, -8),
    lookAt: new THREE.Vector3(0, 1.4, -22),
    fov: 46,
  },

  // 1. Act I: Before We Met (0.08 - 0.18) - Dreamworld Sivani walking z: -22.5 to -39
  {
    progress: 0.13,
    position: new THREE.Vector3(0.5, 2.0, -22),
    lookAt: new THREE.Vector3(0, 1.3, -32),
    fov: 45,
  },
  {
    progress: 0.18,
    position: new THREE.Vector3(0, 2.0, -36),
    lookAt: new THREE.Vector3(0, 1.5, -54),
    fov: 44,
  },

  // 2. Act II: College Admission Hall (0.18 - 0.32) - Hall z: -50 to -70
  {
    progress: 0.25,
    position: new THREE.Vector3(0.7, 1.8, -56),
    lookAt: new THREE.Vector3(0, 1.4, -70),
    fov: 42,
  },
  {
    progress: 0.32,
    position: new THREE.Vector3(0.2, 1.7, -68),
    lookAt: new THREE.Vector3(0.1, 1.35, -75.2),
    fov: 40,
  },

  // 3. Act II: The Pen Moment (0.32 - 0.38) - Exchange Desk at z = -75.2
  {
    progress: 0.35,
    position: new THREE.Vector3(0.30, 1.50, -72.2),
    lookAt: new THREE.Vector3(0.1, 1.35, -75.2),
    fov: 39,
  },
  {
    progress: 0.38,
    position: new THREE.Vector3(0, 1.9, -78),
    lookAt: new THREE.Vector3(0, 1.6, -105),
    fov: 42,
  },

  // 4. Act II: Tribly / Classroom (0.38 - 0.45) - Lecture hall z = -118
  {
    progress: 0.415,
    position: new THREE.Vector3(-0.6, 1.9, -110),
    lookAt: new THREE.Vector3(0, 1.4, -120),
    fov: 42,
  },
  {
    progress: 0.45,
    position: new THREE.Vector3(0, 2.0, -125),
    lookAt: new THREE.Vector3(0, 1.3, -145),
    fov: 43,
  },

  // 5. Act II: Friend Group (0.45 - 0.53) - Study table z = -152
  {
    progress: 0.49,
    position: new THREE.Vector3(1.2, 1.7, -145),
    lookAt: new THREE.Vector3(0, 1.15, -152),
    fov: 44,
  },
  {
    progress: 0.53,
    position: new THREE.Vector3(0, 2.1, -162),
    lookAt: new THREE.Vector3(-0.8, 1.5, -185),
    fov: 46,
  },

  // 6. Act III: Kozhikode Train (0.53 - 0.61) - Carriage z = -185, Doorway at [-0.55, 0.4, -186]
  {
    progress: 0.57,
    position: new THREE.Vector3(-3.2, 1.85, -183.5),
    lookAt: new THREE.Vector3(-0.7, 1.75, -183.5),
    fov: 46,
  },
  {
    progress: 0.61,
    position: new THREE.Vector3(-2.0, 2.0, -196),
    lookAt: new THREE.Vector3(0, 1.2, -235),
    fov: 47,
  },

  // 7. Act III: Kozhikode Beach (0.61 - 0.68) - Shoreline z = -235
  {
    progress: 0.645,
    position: new THREE.Vector3(1.4, 1.6, -232),
    lookAt: new THREE.Vector3(0, 1.1, -235),
    fov: 46,
  },
  {
    progress: 0.68,
    position: new THREE.Vector3(0, 2.2, -248),
    lookAt: new THREE.Vector3(0, 1.6, -290),
    fov: 45,
  },

  // 8. Act III: Late Night Conversations (0.68 - 0.75) - Terrace z = -290
  {
    progress: 0.715,
    position: new THREE.Vector3(0.6, 1.9, -284),
    lookAt: new THREE.Vector3(0, 1.4, -290),
    fov: 44,
  },
  {
    progress: 0.75,
    position: new THREE.Vector3(0, 1.9, -302),
    lookAt: new THREE.Vector3(0, 1.3, -345),
    fov: 45,
  },

  // 9. Act III: 31 AUGUST 2025 (Car) (0.75 - 0.80) - Car cabin z = -345
  {
    progress: 0.775,
    position: new THREE.Vector3(0.9, 1.6, -342),
    lookAt: new THREE.Vector3(-0.2, 1.25, -345),
    fov: 45,
  },
  {
    progress: 0.80,
    position: new THREE.Vector3(0, 2.0, -360),
    lookAt: new THREE.Vector3(0, 1.4, -450),
    fov: 45,
  },

  // 10. Act III: Classic 350 (0.80 - 0.86) - Motorcycle z = -450
  {
    progress: 0.83,
    position: new THREE.Vector3(2.6, 1.7, -448),
    lookAt: new THREE.Vector3(0, 1.3, -450),
    fov: 46,
  },
  {
    progress: 0.86,
    position: new THREE.Vector3(0, 2.2, -475),
    lookAt: new THREE.Vector3(0, 1.4, -570),
    fov: 46,
  },

  // 11. Act III: Himalayan 450 & Mountain Fall (0.86 - 0.92) - Motorcycle z = -570
  {
    progress: 0.89,
    position: new THREE.Vector3(-2.4, 1.6, -568),
    lookAt: new THREE.Vector3(0, 1.2, -570),
    fov: 46,
  },
  {
    progress: 0.92,
    position: new THREE.Vector3(0, 2.0, -588),
    lookAt: new THREE.Vector3(0, 1.4, -625),
    fov: 45,
  },

  // 12. Act III: Home / Everyday Life (0.92 - 0.96) - Living room z = -625
  {
    progress: 0.94,
    position: new THREE.Vector3(0.85, 1.55, -621.8),
    lookAt: new THREE.Vector3(0, 1.25, -625),
    fov: 43,
  },
  {
    progress: 0.96,
    position: new THREE.Vector3(0, 2.2, -640),
    lookAt: new THREE.Vector3(0, 1.6, -685),
    fov: 42,
  },

  // 13. Act IV: Finale (0.96 - 1.00) - Pedestal z = -685
  {
    progress: 0.98,
    position: new THREE.Vector3(0, 1.85, -681.5),
    lookAt: new THREE.Vector3(0, 1.4, -685),
    fov: 40,
  },
  {
    progress: 1.00,
    position: new THREE.Vector3(0, 1.65, -683.2),
    lookAt: new THREE.Vector3(0, 1.38, -685),
    fov: 38,
  },
];

/**
 * Catmull-Rom cubic spline interpolation for continuous smooth position/target evaluation.
 */
function catmullRomVector3(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  u: number,
  out: THREE.Vector3
): THREE.Vector3 {
  const u2 = u * u;
  const u3 = u2 * u;

  const a0 = -0.5 * u3 + u2 - 0.5 * u;
  const a1 = 1.5 * u3 - 2.5 * u2 + 1.0;
  const a2 = -1.5 * u3 + 2.0 * u2 + 0.5 * u;
  const a3 = 0.5 * u3 - 0.5 * u2;

  out.x = a0 * p0.x + a1 * p1.x + a2 * p2.x + a3 * p3.x;
  out.y = a0 * p0.y + a1 * p1.y + a2 * p2.y + a3 * p3.y;
  out.z = a0 * p0.z + a1 * p1.z + a2 * p2.z + a3 * p3.z;

  return out;
}

function interpolateCamera(
  progress: number,
  keyframes: CameraWaypoint[],
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
): number {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const n = keyframes.length;

  let k = 0;
  for (let i = 0; i < n - 1; i++) {
    if (p >= keyframes[i].progress && p <= keyframes[i + 1].progress) {
      k = i;
      break;
    }
  }

  const k0 = Math.max(0, k - 1);
  const k1 = k;
  const k2 = Math.min(n - 1, k + 1);
  const k3 = Math.min(n - 1, k + 2);

  const p1 = keyframes[k1];
  const p2 = keyframes[k2];
  const span = Math.max(0.00001, p2.progress - p1.progress);
  const u = THREE.MathUtils.clamp((p - p1.progress) / span, 0, 1);

  catmullRomVector3(
    keyframes[k0].position,
    p1.position,
    p2.position,
    keyframes[k3].position,
    u,
    outPos
  );

  catmullRomVector3(
    keyframes[k0].lookAt,
    p1.lookAt,
    p2.lookAt,
    keyframes[k3].lookAt,
    u,
    outLook
  );

  const fov1 = p1.fov ?? 45;
  const fov2 = p2.fov ?? fov1;
  return THREE.MathUtils.lerp(fov1, fov2, u);
}

// Pre-allocated static vectors to eliminate GC churn inside 60-120fps useFrame
const PEN_FOCAL_POINT = new THREE.Vector3(0.1, 1.35, -75.2);
const CLASS_FOCAL_1 = new THREE.Vector3(0, 1.8, -125);
const CLASS_FOCAL_2 = new THREE.Vector3(-0.9, 1.25, -114.2);
const CLASS_FOCAL_3 = new THREE.Vector3(0.8, 1.25, -120.8);
const CLASS_FOCAL_4 = new THREE.Vector3(0, 1.4, -118);
const FG_FOCAL_POINT = new THREE.Vector3(0, 1.15, -152);
const AUG_FOCAL_POINT = new THREE.Vector3(-0.2, 1.25, -345);

const TARGET_POS_SCRATCH = new THREE.Vector3();
const TARGET_LOOK_SCRATCH = new THREE.Vector3();

export default function CameraRig() {
  const { scrollProgressRef, orientation } = useStory();
  const { camera } = useThree();

  const currentPos = useRef(new THREE.Vector3(0, 4, 18));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const tempTargetPos = useRef(new THREE.Vector3());
  const tempTargetLook = useRef(new THREE.Vector3());
  const currentBankRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useFrame((_, delta) => {
    const t = THREE.MathUtils.clamp(scrollProgressRef.current, 0, 1);

    // 1. Evaluate smooth Catmull-Rom spline at normalized scroll progress
    const targetFov = interpolateCamera(
      t,
      CAMERA_KEYFRAMES,
      tempTargetPos.current,
      tempTargetLook.current
    );

    TARGET_POS_SCRATCH.copy(tempTargetPos.current);
    TARGET_LOOK_SCRATCH.copy(tempTargetLook.current);

    // 2. EMOTIONAL FOCAL OVERRIDES PRESERVED
    // Pen exchange milestone (t ~ 0.32 to 0.38): lock target onto pen exchange center
    if (t >= 0.32 && t <= 0.38) {
      const penFactor = Math.sin(((t - 0.32) / (0.38 - 0.32)) * Math.PI);
      TARGET_LOOK_SCRATCH.lerp(PEN_FOCAL_POINT, penFactor * 0.9);
    }
    // Classroom milestone (t ~ 0.38 to 0.45): rack focus between blackboard, boy, and Sivani
    else if (t >= 0.38 && t <= 0.45) {
      const classProgress = (t - 0.38) / (0.45 - 0.38);
      let classFocalPoint = CLASS_FOCAL_1;

      if (classProgress < 0.2) {
        classFocalPoint = CLASS_FOCAL_1;
      } else if (classProgress < 0.45) {
        classFocalPoint = CLASS_FOCAL_2;
      } else if (classProgress < 0.75) {
        classFocalPoint = CLASS_FOCAL_3;
      } else {
        classFocalPoint = CLASS_FOCAL_4;
      }

      const classFactor = Math.sin(classProgress * Math.PI);
      TARGET_LOOK_SCRATCH.lerp(classFocalPoint, classFactor * 0.85);
    }
    // Friend Group milestone (t ~ 0.45 to 0.53): focus on shared study table
    else if (t >= 0.45 && t <= 0.53) {
      const fgProgress = (t - 0.45) / (0.53 - 0.45);
      const fgFactor = Math.sin(fgProgress * Math.PI);
      TARGET_LOOK_SCRATCH.lerp(FG_FOCAL_POINT, fgFactor * 0.85);
    }
    // August 31 milestone (t ~ 0.75 to 0.80): lock focus on car interior & couple
    else if (t >= 0.75 && t <= 0.80) {
      const augFactor = Math.sin(((t - 0.75) / (0.80 - 0.75)) * Math.PI);
      TARGET_LOOK_SCRATCH.lerp(AUG_FOCAL_POINT, augFactor * 0.85);
    }

    // 3. Cinematic Camera Banking (gentle roll on lateral turns)
    if (!reducedMotion) {
      const lateralVel = TARGET_POS_SCRATCH.x - currentPos.current.x;
      const targetBank = THREE.MathUtils.clamp(-lateralVel * 0.08, -0.04, 0.04);
      currentBankRef.current = THREE.MathUtils.lerp(
        currentBankRef.current,
        targetBank,
        Math.min(1, delta * 6.0)
      );
    } else {
      currentBankRef.current = 0;
    }

    // Apply gentle gyro parallax if not reduced motion
    if (!reducedMotion) {
      TARGET_POS_SCRATCH.x += orientation.gamma * 0.2;
      TARGET_POS_SCRATCH.y += orientation.beta * 0.15;
    }

    // Steadycam kinematic damping: responsive yet cinematic (eliminates sluggish lag)
    const damping = reducedMotion ? Math.min(1, delta * 12.0) : Math.min(1, delta * 10.0);
    currentPos.current.lerp(TARGET_POS_SCRATCH, damping);
    currentLookAt.current.lerp(TARGET_LOOK_SCRATCH, damping);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    // Subtle cinematic camera roll banking along turns
    if (!reducedMotion && Math.abs(currentBankRef.current) > 0.0001) {
      camera.rotation.z += currentBankRef.current;
    }

    // Smooth FOV interpolation
    if (camera instanceof THREE.PerspectiveCamera) {
      const clampedFov = THREE.MathUtils.clamp(targetFov, 36, 54);
      const prevFov = camera.fov;
      camera.fov = THREE.MathUtils.lerp(prevFov, clampedFov, Math.min(1, delta * 5.0));
      if (Math.abs(camera.fov - prevFov) > 0.001) {
        camera.updateProjectionMatrix();
      }
    }

    // Development diagnostic telemetry without cloning
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      const w = window as any;
      if (!w.__storyCamera) {
        w.__storyCamera = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
      }
      w.__storyCamera.pos.copy(currentPos.current);
      w.__storyCamera.look.copy(currentLookAt.current);
    }
  });

  return null;
}
