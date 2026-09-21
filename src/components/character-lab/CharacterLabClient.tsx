"use client";

import React, { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Grid } from "@react-three/drei";
import * as THREE from "three";
import { CharacterPose } from "@/types/character";
import { ModelDiagnostics } from "@/lib/gltfDiagnostics";
import GLBValidationLoader from "@/components/canvas/characters/GLBValidationLoader";
import CharacterBoy from "@/components/canvas/characters/CharacterBoy";
import CharacterGirl from "@/components/canvas/characters/CharacterGirl";
import { getHeroModelUrl } from "@/config/assets";
import {
  User,
  Activity,
  Smile,
  Eye,
  Hand,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  RefreshCw,
  Sparkles,
} from "lucide-react";

type CharacterChoice = "you" | "sivani";
type LookAtMode = "camera" | "forward" | "left" | "right" | "up" | "down";
type ReachMode = "none" | "partial" | "full";

export default function CharacterLabClient() {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterChoice>("you");
  const [preferOptimized, setPreferOptimized] = useState(false);
  const [selectedPose, setSelectedPose] = useState<CharacterPose>("idle");
  const [facialExpression, setFacialExpression] = useState<"neutral" | "smile">("neutral");
  const [autoBlink, setAutoBlink] = useState(true);
  const [lookAtMode, setLookAtMode] = useState<LookAtMode>("camera");
  const [reachMode, setReachMode] = useState<ReachMode>("none");
  const [windIntensity, setWindIntensity] = useState(0);

  // Model Asset State
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);
  const [diagnostics, setDiagnostics] = useState<ModelDiagnostics | null>(null);

  const modelUrl = getHeroModelUrl(selectedCharacter, preferOptimized);

  // Check whether the physical file exists on the server
  useEffect(() => {
    let active = true;
    setModelAvailable(null);
    setDiagnostics(null);

    fetch(modelUrl, { method: "HEAD" })
      .then((res) => {
        if (active) {
          setModelAvailable(res.ok && res.status !== 404);
        }
      })
      .catch(() => {
        if (active) setModelAvailable(false);
      });

    return () => {
      active = false;
    };
  }, [modelUrl]);

  // Derived LookAt Target Vector
  const lookAtTarget = React.useMemo((): [number, number, number] | undefined => {
    switch (lookAtMode) {
      case "camera":
        return [0, 1.5, 3];
      case "left":
        return [-2.5, 1.5, 1];
      case "right":
        return [2.5, 1.5, 1];
      case "up":
        return [0, 3.5, 1.5];
      case "down":
        return [0, 0.2, 1.5];
      case "forward":
      default:
        return [0, 1.5, -5];
    }
  }, [lookAtMode]);

  // Derived Reach Progress
  const reachProgress = reachMode === "full" ? 1.0 : reachMode === "partial" ? 0.5 : 0;

  return (
    <div className="flex h-[100dvh] w-full bg-[#0a0a12] text-neutral-200 overflow-hidden select-none font-sans">
      {/* 3D Neutral Cinematic Studio Viewport */}
      <div className="relative flex-1 h-full">
        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-300 font-semibold tracking-wider uppercase">
            CHARACTER LAB // VALIDATION ENVIRONMENT
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-rose-300 uppercase font-medium">{selectedCharacter}</span>
          {preferOptimized && (
            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/40">
              OPTIMIZED PIPELINE
            </span>
          )}
        </div>

        {/* Real-time Performance Warning Pill */}
        {diagnostics?.performanceEvaluation?.requiresOptimization && (
          <div className="absolute top-4 right-4 z-10 max-w-sm bg-rose-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2.5 shadow-xl animate-in fade-in duration-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-rose-300 uppercase tracking-wide text-[11px] block">
                MODEL REQUIRES OPTIMIZATION
              </span>
              <span className="text-[10px] text-rose-300/80 block">
                {diagnostics.performanceEvaluation.violations.length} budget threshold violation(s)
              </span>
            </div>
          </div>
        )}

        {/* Model Asset Installation Banner */}
        {modelAvailable === false && (
          <div className="absolute top-16 left-4 z-10 max-w-md bg-amber-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3 shadow-lg">
            <FileQuestion className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                CHARACTER ASSET NOT INSTALLED ({modelUrl})
              </p>
              <p className="text-amber-200/80 mt-1 leading-relaxed">
                Currently rendering the <strong>Phase 6A procedural fallback</strong>. Place{" "}
                <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
                  {selectedCharacter === "you" ? "you.glb" : "sivani.glb"}
                </code>{" "}
                in <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">/public/models/characters/</code>{" "}
                to validate your hero GLB model.
              </p>
            </div>
          </div>
        )}

        {/* R3F 3D Canvas */}
        <Canvas
          camera={{ position: [0, 1.4, 3.2], fov: 40 }}
          dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          {/* Studio Lighting Rig */}
          <color attach="background" args={["#0d0d16"]} />
          <ambientLight intensity={0.65} color="#e0e7ff" />
          {/* Key Light */}
          <directionalLight
            position={[3, 4, 3]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
            color="#fffbeb"
          />
          {/* Soft Fill Light */}
          <directionalLight position={[-3, 2, 2]} intensity={0.7} color="#93c5fd" />
          {/* Rim / Silhouette Light */}
          <directionalLight position={[0, 3, -3]} intensity={1.4} color="#f472b6" />

          {/* Neutral Floor Grid & Contact Shadows */}
          <Grid
            position={[0, -0.01, 0]}
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#1e1e2e"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#312e81"
            fadeDistance={12}
          />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.8}
            scale={5}
            blur={1.8}
            far={2}
            frames={1}
          />

          {/* Interactive Target Indicator if not forward */}
          {lookAtTarget && lookAtMode !== "forward" && (
            <mesh position={lookAtTarget}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
          )}

          {/* Character Renderer */}
          <Suspense fallback={null}>
            {modelAvailable ? (
              <GLBValidationLoader
                characterType={selectedCharacter}
                modelUrl={modelUrl}
                pose={selectedPose}
                lookAtTarget={lookAtTarget}
                reachProgress={reachProgress}
                offerProgress={reachProgress}
                windIntensity={windIntensity}
                facialConfig={{
                  expression: facialExpression,
                  autoBlink,
                  smileIntensity: facialExpression === "smile" ? 0.8 : 0.1,
                }}
                onDiagnostics={setDiagnostics}
              />
            ) : selectedCharacter === "you" ? (
              <CharacterBoy
                pose={selectedPose}
                lookAtTarget={lookAtTarget}
                reachProgress={reachProgress}
                windIntensity={windIntensity}
              />
            ) : (
              <CharacterGirl
                pose={selectedPose}
                lookAtTarget={lookAtTarget}
                offerProgress={reachProgress}
                reachProgress={reachProgress}
                windIntensity={windIntensity}
              />
            )}
          </Suspense>

          <OrbitControls
            target={[0, 1.0, 0]}
            minDistance={1.2}
            maxDistance={6}
            maxPolarAngle={Math.PI / 2 + 0.05}
            enableDamping
          />
        </Canvas>
      </div>

      {/* Control Panel & Technical Diagnostic Sidebar */}
      <div className="w-[420px] h-full bg-[#11111c] border-l border-white/10 flex flex-col z-20 shadow-2xl">
        {/* Panel Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold tracking-wider text-rose-300 uppercase">
              Quality Lab Controller
            </h1>
            <p className="text-[11px] text-neutral-400">Validate Hero Rigged GLB Assets</p>
          </div>
          <button
            onClick={() => {
              setModelAvailable(null);
              fetch(modelUrl, { method: "HEAD" }).then((res) =>
                setModelAvailable(res.ok && res.status !== 404)
              );
            }}
            title="Reload Model Check"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Controls & Diagnostics */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* 1. Character Selector */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wide uppercase text-[11px]">
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Character Model</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCharacter("you")}
                className={`py-2 px-3 rounded-xl font-medium text-xs transition-all ${
                  selectedCharacter === "you"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/50"
                    : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
              >
                YOU (Vishal)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCharacter("sivani")}
                className={`py-2 px-3 rounded-xl font-medium text-xs transition-all ${
                  selectedCharacter === "sivani"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/50"
                    : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
              >
                SIVANI
              </button>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] mb-1.5 text-neutral-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Asset Pipeline Variant:</span>
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {preferOptimized ? "Optimized Asset" : "Current Hero Asset"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferOptimized(false)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                    !preferOptimized
                      ? "bg-neutral-700 text-white shadow-sm"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  Current (.glb)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferOptimized(true)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                    preferOptimized
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  Optimized (-optimized.glb)
                </button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              Active Path: <code className="text-neutral-300 bg-black/40 px-1 py-0.5 rounded">{modelUrl}</code>
            </p>
          </section>

          {/* 2. Animation Pose Testing */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wide uppercase text-[11px]">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Animation Pose</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  "idle",
                  "walk",
                  "stand",
                  "sit",
                  "look",
                  "reach",
                  "interact",
                  "biker",
                  "bikerPillion",
                ] as CharacterPose[]
              ).map((pose) => (
                <button
                  key={pose}
                  type="button"
                  onClick={() => setSelectedPose(pose)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] capitalize transition-all ${
                    selectedPose === pose
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {pose}
                </button>
              ))}
            </div>
          </section>

          {/* 3. Facial Controls */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wide uppercase text-[11px]">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Facial Expressions & Blinks</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFacialExpression("neutral")}
                className={`py-1.5 px-3 rounded-lg text-xs transition-all ${
                  facialExpression === "neutral"
                    ? "bg-amber-600 text-white font-medium"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Neutral
              </button>
              <button
                type="button"
                onClick={() => setFacialExpression("smile")}
                className={`py-1.5 px-3 rounded-lg text-xs transition-all ${
                  facialExpression === "smile"
                    ? "bg-amber-600 text-white font-medium"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Subtle Smile
              </button>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBlink}
                onChange={(e) => setAutoBlink(e.target.checked)}
                className="rounded border-white/20 text-rose-600 focus:ring-0"
              />
              <span className="text-[11px] text-neutral-300">
                Auto Involuntary Blink (every 3.8s)
              </span>
            </label>
          </section>

          {/* 4. Look-At Targets */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wide uppercase text-[11px]">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Head & Eye Tracking</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["camera", "forward", "left", "right", "up", "down"] as LookAtMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLookAtMode(mode)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] capitalize transition-all ${
                      lookAtMode === mode
                        ? "bg-purple-600 text-white font-medium"
                        : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          </section>

          {/* 5. Hand / Reach Kinematics */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wide uppercase text-[11px]">
              <Hand className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hand Reach (Admission Pen Interaction)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["none", "partial", "full"] as ReachMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setReachMode(mode)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] capitalize transition-all ${
                    reachMode === mode
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {mode === "none" ? "Rest" : mode}
                </button>
              ))}
            </div>
          </section>

          {/* 6. Environmental Wind */}
          <section className="space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-300 font-semibold uppercase">
                Wind Simulation (Hair & Coat)
              </span>
              <span className="font-mono text-neutral-400">{Math.round(windIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={windIntensity}
              onChange={(e) => setWindIntensity(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </section>

          {/* 7. Model Inspection & Diagnostics Report */}
          <section className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-200 font-semibold uppercase tracking-wider text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-rose-400" />
                <span>Technical Diagnostics</span>
              </span>
              {diagnostics && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    diagnostics.memoryRiskAssessment === "LOW"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : diagnostics.memoryRiskAssessment === "MODERATE"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {diagnostics.memoryRiskAssessment} RISK
                </span>
              )}
            </div>

            {diagnostics ? (
              <div className="space-y-2.5 bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] font-mono">
                {/* Mobile Performance Budget Evaluation Banner */}
                {diagnostics.performanceEvaluation && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs ${
                      diagnostics.performanceEvaluation.requiresOptimization
                        ? "bg-rose-950/50 border-rose-500/50 text-rose-200"
                        : "bg-emerald-950/50 border-emerald-500/50 text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[11px]">
                      {diagnostics.performanceEvaluation.requiresOptimization ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span className="text-rose-300">MODEL REQUIRES OPTIMIZATION</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-emerald-300">OPTIMIZED FOR PRODUCTION</span>
                        </>
                      )}
                    </div>

                    {diagnostics.performanceEvaluation.requiresOptimization && (
                      <div className="mt-2 space-y-1 text-[10px]">
                        <p className="text-rose-300/80 font-sans">
                          Current asset exceeds mobile performance thresholds:
                        </p>
                        <ul className="space-y-0.5 font-mono text-rose-200/90 pl-1">
                          {diagnostics.performanceEvaluation.violations.map((violation, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 mt-0.5 font-bold">⚠️</span>
                              <span>{violation}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[9px] text-neutral-400 pt-1 italic font-sans">
                          Note: Asset will continue to load for development. Optimization recommended before final release.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-neutral-400">
                  <span>Dimensions (W×H×D):</span>
                  <span className="text-neutral-200">
                    {diagnostics.dimensions.width}m × {diagnostics.dimensions.height}m ×{" "}
                    {diagnostics.dimensions.depth}m
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Vertices / Triangles:</span>
                  <span className="text-neutral-200">
                    {diagnostics.vertexCount ? diagnostics.vertexCount.toLocaleString() : "N/A"} / {diagnostics.triangleCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Bones:</span>
                  <span className="text-neutral-200">{diagnostics.boneCount}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Skinned Meshes:</span>
                  <span className="text-neutral-200">{diagnostics.skinnedMeshCount}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Materials / Textures:</span>
                  <span className="text-neutral-200">
                    {diagnostics.materialCount} / {diagnostics.textureCount}
                  </span>
                </div>

                {/* Finger Bone Checklist */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-neutral-400 block mb-1">Hand Finger Bones:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {Object.entries(diagnostics.fingerBonesFound).map(([finger, found]) => (
                      <span
                        key={finger}
                        className={`flex items-center gap-1 ${
                          found ? "text-emerald-400" : "text-neutral-500"
                        }`}
                      >
                        {found ? "✓" : "✗"} {finger}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Animation Clips Found */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-neutral-400 block mb-1">
                    Clips Found ({diagnostics.animationClipNames.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {diagnostics.animationClipNames.length > 0 ? (
                      diagnostics.animationClipNames.map((name) => (
                        <span
                          key={name}
                          className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-neutral-300"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-rose-400 text-[10px]">No embedded clips</span>
                    )}
                  </div>
                </div>

                {/* Morph Targets Found */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-neutral-400 block mb-1">Morph Target Support:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {Object.entries(diagnostics.supportedMorphTargets).map(([morph, found]) => (
                      <span
                        key={morph}
                        className={`flex items-center gap-1 ${
                          found ? "text-emerald-400" : "text-neutral-500"
                        }`}
                      >
                        {found ? "✓" : "✗"} {morph}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {diagnostics.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-amber-400 block font-semibold">Recommendations:</span>
                    {diagnostics.recommendations.map((rec, i) => (
                      <p key={i} className="text-neutral-400 text-[10px] leading-tight">
                        &bull; {rec}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] text-neutral-400 text-center py-4">
                {modelAvailable === false ? (
                  <p>
                    Procedural fallback in use. Diagnostics will automatically calculate when a GLB
                    model is placed in <code className="text-neutral-200">/public/models/characters/</code>.
                  </p>
                ) : (
                  <p>Inspecting model...</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
