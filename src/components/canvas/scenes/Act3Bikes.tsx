"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows, Text } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import ExternalAsset from "../environment/ExternalAsset";

interface Act3BikesProps {
  milestoneId: string; // "m-10" (Classic 350) or "m-11" (Himalayan 450)
  localProgress: number;
}

export default function Act3Bikes({ milestoneId, localProgress }: Act3BikesProps) {
  const wheelsRef = useRef<THREE.Group>(null);
  const roadRef = useRef<THREE.Group>(null);
  const bikeGroupRef = useRef<THREE.Group>(null);

  const isClassic = milestoneId === "m-10";
  const zPosition = isClassic ? -450 : -570;

  // Mountain Fall Stages for m-11:
  // 0.00-0.32: Mountain ride
  // 0.32-0.55: Slipped on wet patch -> controlled tilt onto crash guard
  // 0.55-0.78: Cut to road shoulder -> both safe, checking knee injury
  // 0.78-1.00: Safe recovery -> holding hands in relief
  const isFalling = !isClassic && localProgress >= 0.32 && localProgress < 0.55;
  const isAftermath = !isClassic && localProgress >= 0.55;
  const isRecovery = !isClassic && localProgress >= 0.78;

  // Classic 350 Teaching Stages for m-10:
  // 0.00-0.28: Bike parked & preparing
  // 0.28-0.58: Teaching Sivani on handlebars
  // 0.58-1.00: Riding together along beach road
  const isTeaching = isClassic && localProgress >= 0.28 && localProgress < 0.58;
  const isClassicRiding = isClassic && localProgress >= 0.58;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Road speed motion (stops during aftermath of mountain fall)
    if (roadRef.current) {
      if (!isAftermath) {
        const speed = isClassic ? (isClassicRiding ? 20 : 8) : isFalling ? 6 : 14;
        roadRef.current.position.z = (t * speed) % 6;
      }
    }

    // Engine thump vibration & motorcycle dynamics
    if (bikeGroupRef.current) {
      if (isClassic) {
        if (isClassicRiding) {
          bikeGroupRef.current.position.y = 0.05 + Math.sin(t * 14) * 0.006;
          bikeGroupRef.current.rotation.z = Math.sin(t * 2.5) * 0.02;
          bikeGroupRef.current.rotation.x = 0;
        } else {
          bikeGroupRef.current.position.y = 0.04;
          bikeGroupRef.current.rotation.z = -0.06; // kickstand lean
          bikeGroupRef.current.rotation.x = 0;
        }
      } else {
        // Himalayan 450 Fall Dynamics:
        if (localProgress < 0.32) {
          // Normal mountain ride
          bikeGroupRef.current.position.y = 0.06 + Math.sin(t * 18) * 0.006;
          bikeGroupRef.current.position.x = 0;
          bikeGroupRef.current.rotation.z = Math.sin(t * 2.0) * 0.03;
          bikeGroupRef.current.rotation.x = 0;
        } else if (isFalling) {
          // Controlled low-side slide: smoothly tilt bike onto crash guard
          const fallAlpha = (localProgress - 0.32) / (0.55 - 0.32);
          bikeGroupRef.current.position.y = THREE.MathUtils.lerp(0.06, 0.28, fallAlpha);
          bikeGroupRef.current.position.x = THREE.MathUtils.lerp(0, 0.6, fallAlpha);
          bikeGroupRef.current.rotation.z = THREE.MathUtils.lerp(0, 1.15, fallAlpha); // tilts onto right crash bar
          bikeGroupRef.current.rotation.y = THREE.MathUtils.lerp(0, 0.2, fallAlpha);
        } else {
          // Rested safely on road shoulder crash guard
          bikeGroupRef.current.position.y = 0.28;
          bikeGroupRef.current.position.x = 0.8;
          bikeGroupRef.current.rotation.z = 1.18;
          bikeGroupRef.current.rotation.y = 0.25;
        }
      }
    }

    // Wheel rotation
    if (wheelsRef.current && !isAftermath) {
      wheelsRef.current.children.forEach((wheel) => {
        wheel.rotation.x += delta * (isClassic ? (isClassicRiding ? 16 : 4) : 14);
      });
    }
  });

  return (
    <group position={[0, 0, zPosition]}>
      {/* ========================================================================= */}
      {/* SCENE LIGHTING & ATMOSPHERE                                               */}
      {/* ========================================================================= */}
      {isClassic ? (
        // Coastal sunset warm rim light for Classic 350
        <>
          <directionalLight position={[-8, 6, -10]} color="#f97316" intensity={2.4} />
          <pointLight position={[3, 2, -2]} color="#fed7aa" intensity={1.8} distance={22} />
          <ambientLight color="#301d14" intensity={0.9} />
        </>
      ) : (
        // Misty mountain atmospheric light for Himalayan 450
        <>
          <directionalLight position={[6, 8, -10]} color="#94a3b8" intensity={1.6} />
          <pointLight position={[-2, 3, -1]} color="#e2e8f0" intensity={1.2} distance={25} />
          <ambientLight color="#18181b" intensity={0.85} />
        </>
      )}

      {/* ========================================================================= */}
      {/* ROAD / TERRAIN SURFACE                                                    */}
      {/* ========================================================================= */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 38]} />
        <meshStandardMaterial
          color={isClassic ? "#1e1b18" : "#1f1d1b"}
          roughness={isClassic ? 0.7 : 0.85}
        />
      </mesh>

      {/* Ground Contact Shadow */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.8}
        scale={7}
        blur={1.8}
        far={3}
        frames={1}
      />

      {/* Wet / Slippery Asphalt Puddle Patch for Himalayan 450 */}
      {!isClassic && (
        <mesh position={[0.2, 0.005, -1.2]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[3.5, 6.0]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.12}
            metalness={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Road Speed Lines */}
      <group ref={roadRef}>
        {[-14, -7, 0, 7, 14].map((z, idx) => (
          <mesh key={idx} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.14, 2.4]} />
            <meshBasicMaterial color={isClassic ? "#fef08a" : "#94a3b8"} />
          </mesh>
        ))}
      </group>

      {/* Mountain Mist & Slate Pine Hills (for Himalayan 450) */}
      {!isClassic && (
        <group position={[0, 0, -20]}>
          <mesh position={[-9, 5, 0]}>
            <coneGeometry args={[11, 14, 6]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
          <mesh position={[8, 6, -6]}>
            <coneGeometry args={[13, 16, 6]} />
            <meshStandardMaterial color="#0c0a09" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Mountain Ghats Road Shoulder Boulders — Real Poly Haven Photogrammetry Rocks with Fallback */}
      {!isClassic && (
        <>
          <ExternalAsset
            assetKey="mountainEnvironment"
            position={[3.8, 0, -3.5]}
            scale={1.8}
            rotation={[0, 0.5, 0]}
            proceduralFallback={
              <mesh position={[3.8, 0.6, -3.5]}>
                <boxGeometry args={[1.8, 1.2, 2.2]} />
                <meshStandardMaterial color="#292524" roughness={0.9} />
              </mesh>
            }
          />
          <ExternalAsset
            assetKey="mountainEnvironment"
            position={[-4.2, 0, 2.2]}
            scale={1.4}
            rotation={[0.2, -0.7, 0]}
            proceduralFallback={
              <mesh position={[-4.2, 0.5, 2.2]}>
                <boxGeometry args={[1.4, 1.0, 1.6]} />
                <meshStandardMaterial color="#292524" roughness={0.9} />
              </mesh>
            }
          />
        </>
      )}

      {/* ========================================================================= */}
      {/* THE MOTORCYCLE RIG (Classic 350 / Himalayan 450)                           */}
      {/* ========================================================================= */}
      <group ref={bikeGroupRef} position={[0, 0.45, 0]}>
        {/* Wheels */}
        <group ref={wheelsRef}>
          {/* Front Wheel */}
          <group position={[0, 0.1, -1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.42, 0.08, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* Rear Wheel */}
          <group position={[0, 0.1, 1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.42, 0.09, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* Engine Block */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.38, 0.45, 1.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Exhaust Pipe */}
        <mesh position={[0.22, 0.18, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 1.4, 16]} />
          <meshStandardMaterial
            color={isClassic ? "#e2e8f0" : "#334155"}
            metalness={isClassic ? 0.95 : 0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Fuel Tank & Bodywork */}
        {isClassic ? (
          // Royal Enfield Classic 350: Signals Storm Green Teardrop Tank
          <mesh position={[0, 0.68, -0.35]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshPhysicalMaterial
              color="#2d3a24"
              roughness={0.4}
              metalness={0.2}
              clearcoat={0.35}
              clearcoatRoughness={0.3}
            />
          </mesh>
        ) : (
          // Royal Enfield Himalayan 450: Adventure Sculpted Kaza Brown Tank + Crash Guard
          <group position={[0, 0.72, -0.35]}>
            <mesh>
              <boxGeometry args={[0.42, 0.34, 0.68]} />
              <meshPhysicalMaterial
                color="#8c6239"
                roughness={0.35}
                metalness={0.2}
                clearcoat={0.7}
                clearcoatRoughness={0.15}
              />
            </mesh>
            {/* Protective Crash Guard Bars (holds bike safely when slipped) */}
            <mesh position={[-0.26, -0.1, 0]}>
              <boxGeometry args={[0.05, 0.45, 0.75]} />
              <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.25} />
            </mesh>
            <mesh position={[0.26, -0.1, 0]}>
              <boxGeometry args={[0.05, 0.45, 0.75]} />
              <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.25} />
            </mesh>
          </group>
        )}

        {/* Split Seats */}
        <mesh position={[0, 0.62, 0.3]} rotation={[-0.05, 0, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.9]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>

        {/* Handlebars & Headlamp */}
        <group position={[0, 0.95, -0.75]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.78, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Round Headlamp */}
          <mesh position={[0, -0.05, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.1, 0.12, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} />
          </mesh>
          {!isAftermath && (
            <pointLight position={[0, -0.05, -0.3]} color="#fef08a" intensity={1.8} distance={12} />
          )}
        </group>

        {/* ======================================================================= */}
        {/* CHARACTER POSING ON MOTORCYCLE (STAGED BY MILESTONE & PROGRESS)          */}
        {/* ======================================================================= */}
        {isClassic ? (
          // CLASSIC 350: TEACHING SIVANI TO RIDE SEQUENCE
          <>
            {isClassicRiding ? (
              // Riding together along beach road
              <>
                {/* Sivani in rider seat on handlebars */}
                <CharacterGirl
                  position={[0, 0.38, -0.15]}
                  rotation={[0, Math.PI, 0]}
                  pose="biker"
                  scale={0.9}
                  windIntensity={0.8}
                />
                {/* Vishal seated behind guiding her */}
                <CharacterBoy
                  position={[0, 0.44, 0.45]}
                  rotation={[0, Math.PI, 0]}
                  pose="bikerPillion"
                  scale={0.92}
                  windIntensity={0.75}
                />
              </>
            ) : isTeaching ? (
              // Teaching phase: Sivani on rider saddle on handlebars, Vishal standing close beside guiding
              <>
                <CharacterGirl
                  position={[0, 0.38, -0.15]}
                  rotation={[0, Math.PI, 0]}
                  pose="biker"
                  scale={0.9}
                  windIntensity={0.2}
                />
                <CharacterBoy
                  position={[-0.55, 0.1, -0.15]}
                  rotation={[0, Math.PI / 2 + 0.3, 0]}
                  pose="idle"
                  scale={0.94}
                  lookAtTarget={[0, 1.2, -0.15]}
                  reachProgress={0.8}
                />
              </>
            ) : (
              // Parked / Preparing phase
              <>
                <CharacterBoy
                  position={[-0.6, 0.1, 0.1]}
                  rotation={[0, Math.PI / 2, 0]}
                  pose="idle"
                  scale={0.94}
                  lookAtTarget={[0.6, 1.2, 0.1]}
                />
                <CharacterGirl
                  position={[0.7, 0.1, 0.3]}
                  rotation={[0, -Math.PI / 2, 0]}
                  pose="idle"
                  scale={0.92}
                  lookAtTarget={[-0.6, 1.2, 0.1]}
                />
              </>
            )}
          </>
        ) : (
          // HIMALAYAN 450: MOUNTAIN RIDE & FALL SEQUENCE
          <>
            {!isAftermath && (
              // Both riding before/during slide
              <>
                <CharacterBoy
                  position={[0, 0.35, 0.0]}
                  rotation={[0, Math.PI, 0]}
                  pose="biker"
                  scale={0.92}
                  windIntensity={isFalling ? 0.3 : 0.85}
                />
                <CharacterGirl
                  position={[0, 0.42, 0.52]}
                  rotation={[0, Math.PI, 0]}
                  pose="bikerPillion"
                  scale={0.9}
                  windIntensity={isFalling ? 0.3 : 0.9}
                />
              </>
            )}
          </>
        )}
      </group>

      {/* ========================================================================= */}
      {/* MOUNTAIN FALL AFTERMATH (SAFE RECOVERY ON ROAD SHOULDER)                   */}
      {/* Completely safe, no gore, both characters resting on shoulder, relief     */}
      {/* ========================================================================= */}
      {!isClassic && isAftermath && (
        <group position={[-1.2, 0.02, 0.2]}>
          {/* Vishal sitting on road shoulder checking his scraped knee */}
          <group position={[-0.4, 0, 0]}>
            <CharacterBoy
              pose="sitting"
              scale={0.92}
              rotation={[0, 0.4, 0]}
              lookAtTarget={[0.5, 0.8, 0]}
            />
          </group>

          {/* Sivani safe on shoulder, reaching out / holding his hand in relief */}
          <group position={[0.5, 0, 0]}>
            <CharacterGirl
              pose="sitting"
              scale={0.9}
              rotation={[0, -0.4, 0]}
              lookAtTarget={[-0.4, 0.8, 0]}
            />
          </group>

          {/* Safe recovery touch point light */}
          <pointLight position={[0, 0.8, 0]} color="#fde047" intensity={0.8} distance={4} />

          {/* Story Progression Captions rendered cleanly in 3D */}
          <group position={[0, 1.7, -0.5]}>
            <Text
              fontSize={0.15}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
            >
              {localProgress < 0.68
                ? "We fell. We were scared."
                : isRecovery
                ? "And that's what mattered."
                : "But we were okay."}
            </Text>
          </group>
        </group>
      )}

      {/* Floating Motorcycle Milestone Frame */}
      <FloatingMediaFrame
        milestoneId={milestoneId}
        position={[2.4, 2.3, -2.5]}
        rotation={[-0.05, -0.3, 0.02]}
        scale={0.92}
      />
    </group>
  );
}
