"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ContactShadows, Text } from "@react-three/drei";
import CharacterBoy from "../characters/CharacterBoy";
import CharacterGirl from "../characters/CharacterGirl";
import FloatingMediaFrame from "../media/FloatingMediaFrame";
import ExternalAsset from "../environment/ExternalAsset";
import { useSceneProgress } from "@/lib/useSceneProgress";

interface Act3BikesProps {
  milestoneId: string; // "m-10" (Classic 350) or "m-11" (Himalayan 450)
  localProgress: number;
}

export default function Act3Bikes({ milestoneId, localProgress }: Act3BikesProps) {
  const { getProgress } = useSceneProgress(milestoneId, localProgress);
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
        const currentLocal = getProgress();
        // Himalayan 450 Fall Dynamics:
        if (currentLocal < 0.32) {
          // Normal mountain ride
          bikeGroupRef.current.position.y = 0.06 + Math.sin(t * 18) * 0.006;
          bikeGroupRef.current.position.x = 0;
          bikeGroupRef.current.rotation.z = Math.sin(t * 2.0) * 0.03;
          bikeGroupRef.current.rotation.x = 0;
        } else if (currentLocal >= 0.32 && currentLocal < 0.55) {
          // Controlled low-side slide: smoothly tilt bike onto crash guard
          const fallAlpha = (currentLocal - 0.32) / (0.55 - 0.32);
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

      {/* Roadside Milestone Marker Stone (Classic Indian Ghats White & Yellow/Green) */}
      <group position={[2.6, 0, 0]}>
        {/* Base stone pillar */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.7, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
        {/* Rounded top painted dome */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={isClassic ? "#059669" : "#eab308"} roughness={0.6} />
        </mesh>
      </group>

      {/* Cinematic Mountain Mist & Layered Ghats Ridgeline (Himalayan 450) */}
      {!isClassic && (
        <group position={[0, 0, -18]}>
          {/* Far Distant Mist Ridgeline */}
          <mesh position={[0, 7, -16]}>
            <planeGeometry args={[48, 18]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>

          {/* Mid-ground Mountain Ghat Silhouette (Left Ridge) */}
          <group position={[-11, 4.5, -6]} rotation={[0, 0.2, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[2.5, 9.5, 12, 5]} />
              <meshStandardMaterial color="#172033" roughness={0.9} />
            </mesh>
            {/* Subtle cyan moonlight crest accent */}
            <mesh position={[0.2, 5.8, 0]}>
              <cylinderGeometry args={[0.4, 2.2, 2.4, 5]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#0e3a47"
                emissiveIntensity={0.3}
                roughness={0.8}
              />
            </mesh>
          </group>

          {/* Mid-ground Mountain Ghat Silhouette (Right Crag) */}
          <group position={[10, 5.2, -10]} rotation={[0, -0.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[3.0, 11.0, 14, 5]} />
              <meshStandardMaterial color="#0c1322" roughness={0.9} />
            </mesh>
          </group>

          {/* Atmospheric Ghats Mist Layer */}
          <mesh position={[0, 1.8, -4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[32, 14]} />
            <meshBasicMaterial
              color="#1e293b"
              transparent
              opacity={0.35}
            />
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
        {/* Wheels with Spoke Detailing */}
        <group ref={wheelsRef}>
          {/* Front Wheel */}
          <group position={[0, 0.1, -1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[0.42, 0.08, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Radial Wire Spokes */}
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <mesh key={deg} rotation={[0, 0, (deg * Math.PI) / 180]}>
                <cylinderGeometry args={[0.008, 0.008, 0.72, 6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>

          {/* Rear Wheel */}
          <group position={[0, 0.1, 1.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[0.42, 0.09, 16, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Radial Wire Spokes */}
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <mesh key={deg} rotation={[0, 0, (deg * Math.PI) / 180]}>
                <cylinderGeometry args={[0.008, 0.008, 0.72, 6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Front Suspension Forks */}
        <group position={[0, 0.5, -1.0]}>
          <mesh position={[-0.14, 0, 0]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.95, 12]} />
            <meshStandardMaterial
              color={isClassic ? "#cbd5e1" : "#0284c7"}
              metalness={isClassic ? 0.9 : 0.6}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0.14, 0, 0]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.95, 12]} />
            <meshStandardMaterial
              color={isClassic ? "#cbd5e1" : "#0284c7"}
              metalness={isClassic ? 0.9 : 0.6}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Engine Block with Cooling Fins */}
        <group position={[0, 0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.45, 0.85]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>
          {/* Cooling Fin Ridges */}
          {[-0.12, -0.04, 0.04, 0.12].map((fy, fi) => (
            <mesh key={fi} position={[0, fy, 0]}>
              <boxGeometry args={[0.42, 0.015, 0.88]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Exhaust System */}
        <mesh position={[0.22, 0.18, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 1.4, 16]} />
          <meshStandardMaterial
            color={isClassic ? "#f1f5f9" : "#334155"}
            metalness={isClassic ? 0.95 : 0.65}
            roughness={isClassic ? 0.15 : 0.4}
          />
        </mesh>

        {/* Fuel Tank & Bodywork */}
        {isClassic ? (
          // Royal Enfield Classic 350: Signals Storm Green Teardrop Tank with Rubber Thigh Grips
          <group position={[0, 0.68, -0.35]}>
            {/* Teardrop Tank */}
            <mesh rotation={[0.2, 0, 0]} castShadow>
              <sphereGeometry args={[0.26, 24, 24]} />
              <meshPhysicalMaterial
                color="#2d3a24"
                roughness={0.4}
                metalness={0.2}
                clearcoat={0.4}
                clearcoatRoughness={0.25}
              />
            </mesh>
            {/* Black Rubber Knee/Thigh Grips */}
            <mesh position={[-0.22, -0.02, 0]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.02, 0.16, 0.22]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            <mesh position={[0.22, -0.02, 0]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.02, 0.16, 0.22]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            {/* Front & Rear Classic Metal Fenders */}
            <mesh position={[0, -0.22, -0.85]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.16, 16, 1, true, 0, Math.PI * 0.7]} />
              <meshStandardMaterial color="#2d3a24" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.22, 1.35]} rotation={[-0.3, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.16, 16, 1, true, 0, Math.PI * 0.7]} />
              <meshStandardMaterial color="#2d3a24" roughness={0.4} />
            </mesh>
          </group>
        ) : (
          // Royal Enfield Himalayan 450: Adventure Sculpted Kaza Brown Tank + Beak + Windscreen + Crash Guard
          <group position={[0, 0.72, -0.35]}>
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.34, 0.68]} />
              <meshPhysicalMaterial
                color="#8c6239"
                roughness={0.35}
                metalness={0.2}
                clearcoat={0.7}
                clearcoatRoughness={0.15}
              />
            </mesh>
            {/* Front Raised Beak Fender */}
            <mesh position={[0, -0.15, -0.55]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.24, 0.05, 0.45]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            {/* Upright Adventure Smoked Windscreen */}
            <mesh position={[0, 0.35, -0.45]} rotation={[-0.25, 0, 0]}>
              <planeGeometry args={[0.28, 0.35]} />
              <meshPhysicalMaterial
                color="#0f172a"
                transmission={0.65}
                opacity={0.8}
                transparent
                roughness={0.1}
                ior={1.5}
              />
            </mesh>
            {/* High-Tensile Protective Crash Guard Cage */}
            <mesh position={[-0.26, -0.1, 0]}>
              <boxGeometry args={[0.06, 0.48, 0.78]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.26, -0.1, 0]}>
              <boxGeometry args={[0.06, 0.48, 0.78]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
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
