"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import { useSceneProgress } from "@/lib/useSceneProgress";
import { useSceneLifecycle } from "../SceneTransitionWrapper";
import { canvasStore } from "@/context/StoryContext";

interface Act3TrainProps {
  localProgress: number;
}

export default function Act3Train({ localProgress }: Act3TrainProps) {
  const lifecycle = useSceneLifecycle();
  const { getProgress } = useSceneProgress("m-6", localProgress);
  const trainRef = useRef<THREE.Group>(null);
  const tracksRef = useRef<THREE.Group>(null);
  const passingSceneryRef = useRef<THREE.Group>(null);
  const platformRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (lifecycle.current.state === "dormant" || canvasStore.isStoryPaused) return;

    const t = state.clock.getElapsedTime();
    const currentLocal = getProgress();

    // Speed factor: starts slower during platform/boarding (currentLocal < 0.25), then full journey speed
    const speedMultiplier = currentLocal < 0.25 ? 0.3 + currentLocal * 2.8 : 1.0;

    // Carriage gentle rhythmic sway & track vibration
    if (trainRef.current) {
      const swayAmp = 0.012 * speedMultiplier;
      const bounceAmp = 0.008 * speedMultiplier;
      trainRef.current.rotation.z = Math.sin(t * 7.5) * swayAmp;
      trainRef.current.position.y = Math.sin(t * 15) * bounceAmp;
    }

    // Fast moving track sleepers & ballast ground
    if (tracksRef.current) {
      tracksRef.current.position.z = (t * 22 * speedMultiplier) % 6;
    }

    // Passing telegraph poles & distant coastal palm silhouettes
    if (passingSceneryRef.current) {
      passingSceneryRef.current.position.z = (t * 16 * speedMultiplier) % 24;
    }

    // Platform fade/slide out as journey gets underway
    if (platformRef.current) {
      // Platform shifts back smoothly with real-time scroll progress
      platformRef.current.position.z = currentLocal * 18;
    }
  });

  // Procedural telegraph poles and scenery markers
  const telegraphPoles = useMemo(() => [-24, -12, 0, 12, 24], []);
  const palmTrees = useMemo(() => [-28, -18, -8, 2, 14, 26], []);

  return (
    <group position={[0, 0, -185]}>
      {/* Warm Golden Hour Sunset Light */}
      <directionalLight position={[-16, 8, -12]} color="#fb923c" intensity={2.4} />
      <pointLight position={[-14, 5, -28]} color="#f97316" intensity={3.0} distance={70} />
      <ambientLight color="#3b1d28" intensity={0.8} />

      {/* ========================================================================= */}
      {/* 1. RAILWAY STATION PLATFORM (Transitions at arrival/boarding phase)        */}
      {/* ========================================================================= */}
      <group ref={platformRef} position={[-3.2, 0, 0]}>
        {/* Concrete Platform Surface */}
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.36, 26]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>

        {/* Tactile Yellow Safety Warning Strip near track edge */}
        <mesh position={[1.45, 0.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 26]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} />
        </mesh>

        {/* Station Shelter Support Pillars */}
        {[-8, 0, 8].map((pz, idx) => (
          <group key={idx} position={[-0.8, 1.8, pz]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 3.2, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Platform Light Fixture */}
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[0.4, 0.1, 0.4]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <pointLight position={[0, 1.4, 0]} color="#fed7aa" intensity={0.6} distance={6} />
          </group>
        ))}

        {/* Platform Roof Canopy */}
        <mesh position={[-0.8, 3.45, 0]}>
          <boxGeometry args={[2.4, 0.1, 26]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Station Board: KOZHIKODE EXPRESS */}
        <group position={[-0.8, 2.6, 2.5]}>
          <mesh>
            <boxGeometry args={[0.06, 0.5, 2.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[0.02, 0.42, 2.3]} />
            <meshStandardMaterial color="#fef08a" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. THE TRAIN CARRIAGE (Indian Railways Blue & Cream Livery)                */}
      {/* ========================================================================= */}
      <group ref={trainRef} position={[0.8, 0, 0]}>
        {/* Floor Base */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[2.8, 0.4, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Curved Steel Roof */}
        <mesh position={[0, 3.35, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 16, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Right Wall (Corridor side with square windows) */}
        <mesh position={[1.35, 1.75, 0]}>
          <boxGeometry args={[0.1, 2.7, 16]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>
        {/* Right Wall Interior Trim */}
        <mesh position={[1.29, 1.75, 0]}>
          <boxGeometry args={[0.02, 2.6, 15.8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>

        {/* Left Wall Segment: Aft of doorway */}
        <mesh position={[-1.35, 1.75, 4.5]}>
          <boxGeometry args={[0.1, 2.7, 7]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>
        {/* Left Wall Segment: Forward of doorway */}
        <mesh position={[-1.35, 1.75, -5.0]}>
          <boxGeometry args={[0.1, 2.7, 6]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>
        {/* Iconic Cream Waistband Stripe on Exterior */}
        <mesh position={[-1.41, 1.45, 4.5]}>
          <boxGeometry args={[0.02, 0.35, 7]} />
          <meshStandardMaterial color="#fef08a" roughness={0.4} />
        </mesh>
        <mesh position={[-1.41, 1.45, -5.0]}>
          <boxGeometry args={[0.02, 0.35, 6]} />
          <meshStandardMaterial color="#fef08a" roughness={0.4} />
        </mesh>

        {/* Doorway Header Beam */}
        <mesh position={[-1.35, 3.0, -0.5]}>
          <boxGeometry args={[0.1, 0.4, 3.0]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>

        {/* Doorway Footplate & Boarding Steps */}
        <mesh position={[-1.42, 0.05, -0.5]}>
          <boxGeometry args={[0.25, 0.1, 2.6]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Doorway Sturdy Chrome Safety Grab Bars */}
        <mesh position={[-1.32, 1.6, -1.8]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} />
        </mesh>
        <mesh position={[-1.32, 1.6, 0.8]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} />
        </mesh>
        {/* Central Safety Grab Pole */}
        <mesh position={[-0.8, 1.7, -0.5]}>
          <cylinderGeometry args={[0.025, 0.025, 2.7, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* ======================================================================= */}
        {/* INTERIOR COMFORT: PASSENGER SEATS & OVERHEAD LUGGAGE                    */}
        {/* ======================================================================= */}
        {/* Passenger Blue Berth / Bench Seats */}
        {[3.2, 5.4, -3.2, -5.4].map((zPos, idx) => (
          <group key={idx} position={[0.4, 0.4, zPos]}>
            {/* Seat Base Cushion */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[1.6, 0.3, 0.9]} />
              <meshStandardMaterial color="#1d4ed8" roughness={0.8} />
            </mesh>
            {/* Seat Backrest */}
            <mesh position={[0, 0.9, idx % 2 === 0 ? 0.4 : -0.4]}>
              <boxGeometry args={[1.6, 0.8, 0.12]} />
              <meshStandardMaterial color="#1e40af" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Overhead Luggage Racks with Stored Bags */}
        <group position={[0.4, 2.4, 4.3]}>
          <mesh>
            <boxGeometry args={[1.5, 0.04, 3.5]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Duffel Bag 1 */}
          <mesh position={[-0.2, 0.22, -0.6]} rotation={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.7, 16]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.7} />
          </mesh>
          {/* Backpack 2 */}
          <mesh position={[0.2, 0.2, 0.7]} rotation={[0.1, -0.3, 0]}>
            <boxGeometry args={[0.35, 0.45, 0.28]} />
            <meshStandardMaterial color="#047857" roughness={0.7} />
          </mesh>
        </group>

        {/* Warm Incandescent Interior Ceiling Lights */}
        <pointLight position={[0, 3.1, -0.5]} color="#fef08a" intensity={1.5} distance={10} />
        <pointLight position={[0, 3.1, 4.0]} color="#fed7aa" intensity={1.0} distance={8} />

        {/* ======================================================================= */}
        {/* SAFE DOORWAY TRAVEL: TWO PROCEDURAL CHARACTERS                           */}
        {/* Both characters stand safely INSIDE the doorway holding grab bars       */}
        {/* ======================================================================= */}
        {/* Boy (Vishal): Safely holding doorway bar, looking outward into sunset */}
        <group position={[-1.0, 0.4, -1.1]}>
          <CharacterBoy
            pose="idle"
            scale={0.94}
            rotation={[0, Math.PI / 2 + 0.25, 0]}
            lookAtTarget={[-1.2, 1.7, -0.2]}
            windIntensity={0.65}
          />
        </group>

        {/* Girl (Sivani): Safely beside doorway enjoying the evening breeze */}
        <group position={[-0.95, 0.4, 0.1]}>
          <CharacterGirl
            pose="idle"
            scale={0.94}
            rotation={[0, Math.PI / 2 - 0.2, 0]}
            lookAtTarget={[-1.2, 1.65, -1.0]}
            windIntensity={0.8}
          />
        </group>

        {/* Contact Shadow for characters on carriage floor */}
        <ContactShadows
          position={[-0.98, 0.41, -0.5]}
          opacity={0.75}
          scale={3.6}
          blur={1.6}
          far={2}
          frames={1}
        />

        {/* ======================================================================= */}
        {/* EXTERIOR TRAIN WINDOW SHOWCASE: PHOTOGRAPH PRESENTED CLEARLY ON BODY    */}
        {/* ======================================================================= */}
        <group position={[-1.46, 1.85, 2.8]} rotation={[0, -Math.PI / 2 + 0.08, 0]}>
          {/* Exterior Window / Display Frame Border */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[1.7, 2.45, 0.06]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Chrome / Brushed Steel Outer Bevel Trim */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.76, 2.52, 0.02]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Cream Accent Header */}
          <mesh position={[0, 1.3, -0.02]}>
            <boxGeometry args={[1.4, 0.12, 0.04]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>

          {/* Dedicated Exterior Fill Light to guarantee crisp readability from outside */}
          <pointLight position={[0, 0.2, 1.8]} color="#ffedd5" intensity={1.8} distance={8} />

          {/* Floating Media Frame (m6_train) Mounted Flush on Exterior Window */}
          <FloatingMediaFrame
            milestoneId="m-6"
            position={[0, 0, 0.01]}
            rotation={[0, 0, 0]}
            scale={0.96}
            width={1.5}
            height={2.2}
          />
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 3. PASSING LANDSCAPE SCENERY (Telegraph poles & Coastal Palm silhouettes)  */}
      {/* ========================================================================= */}
      <group ref={passingSceneryRef} position={[-8, 0, 0]}>
        {/* Telegraph Poles */}
        {telegraphPoles.map((tz, idx) => (
          <group key={`pole-${idx}`} position={[0, 2.5, tz]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 5.0, 12]} />
              <meshStandardMaterial color="#27272a" roughness={0.8} />
            </mesh>
            {/* Crossbar */}
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[0.1, 0.08, 1.4]} />
              <meshStandardMaterial color="#3f3f46" />
            </mesh>
          </group>
        ))}

        {/* Distant Coastal Palm Trees Silhouettes */}
        {palmTrees.map((pz, idx) => (
          <group key={`palm-${idx}`} position={[-6, 0, pz]}>
            <mesh position={[0, 3.5, 0]}>
              <cylinderGeometry args={[0.15, 0.28, 7, 8]} />
              <meshStandardMaterial color="#1c1917" roughness={0.9} />
            </mesh>
            {/* Fronds Crown */}
            <mesh position={[0, 7.2, 0]}>
              <coneGeometry args={[2.2, 1.6, 7]} />
              <meshStandardMaterial color="#14532d" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 4. RAILWAY TRACKS & BALLAST RUNNING BENEATH                               */}
      {/* ========================================================================= */}
      <group ref={tracksRef} position={[0.8, -0.8, 0]}>
        {/* Ballast Stone Ground */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 34]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        {/* Steel Rail 1 */}
        <mesh position={[-0.8, 0.16, 0]}>
          <boxGeometry args={[0.09, 0.14, 34]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Steel Rail 2 */}
        <mesh position={[0.8, 0.16, 0]}>
          <boxGeometry args={[0.09, 0.14, 34]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Sleepers / Ties */}
        {[-14, -11, -8, -5, -2, 1, 4, 7, 10, 13].map((sz, idx) => (
          <mesh key={idx} position={[0, 0.06, sz]}>
            <boxGeometry args={[2.2, 0.1, 0.24]} />
            <meshStandardMaterial color="#382c24" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
