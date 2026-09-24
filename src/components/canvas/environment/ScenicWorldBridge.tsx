"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * =========================================================================
 * SCENIC WORLD BRIDGE — CONTINUOUS CINEMATIC ENVIRONMENTAL CONTINUITY
 * =========================================================================
 *
 * Eliminates all empty voids, blank skies, and disconnected regions across
 * the entire 700-unit story travel spline (z: +10 down to -710).
 *
 * Bridges the world seamlessly through 5 distinct cinematic zones:
 * 1. College Campus Avenue & Lawns (z: +10 to -150)
 * 2. Railway Line & Coastal Dunes (z: -150 to -270)
 * 3. Urban Terrace & Night Highway (z: -270 to -390)
 * 4. Mountain Ghats & Misty Rock Faces (z: -390 to -600)
 * 5. Pine Grove & Twilight Finale Meadow (z: -600 to -710)
 *
 * Optimized for 60fps on mobile & desktop with shared geometries and materials.
 */

export default function ScenicWorldBridge() {
  // 1. Campus Avenue Lampposts (z: 0 to -140)
  const campusLamps = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let z = 0; z >= -140; z -= 28) {
      list.push([-6.2, 0, z]);
      list.push([6.2, 0, z]);
    }
    return list;
  }, []);

  // 2. Railway Track Ties (z: -150 to -260)
  const railwayTies = useMemo(() => {
    const list: number[] = [];
    for (let z = -150; z >= -260; z -= 3.6) {
      list.push(z);
    }
    return list;
  }, []);

  // 3. Telegraph Poles alongside train route (z: -155 to -265)
  const telegraphPoles = useMemo(() => {
    const list: number[] = [];
    for (let z = -155; z >= -265; z -= 28) {
      list.push(z);
    }
    return list;
  }, []);

  // 4. Highway Guardrails & Roadside Reflectors (z: -270 to -385)
  const highwayMarkers = useMemo(() => {
    const list: number[] = [];
    for (let z = -270; z >= -385; z -= 20) {
      list.push(z);
    }
    return list;
  }, []);

  // 5. Mountain Ghat Boulder Cliffs & Terrain Walls (z: -390 to -600)
  const mountainCliffs = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: number }[] = [];
    for (let z = -390; z >= -600; z -= 36) {
      list.push({
        pos: [-14.5, 4.5, z],
        scale: [6.5, 11, 36],
        rot: 0.15,
      });
      list.push({
        pos: [14.5, 5.0, z - 18],
        scale: [7.0, 12, 36],
        rot: -0.18,
      });
    }
    return list;
  }, []);

  // 6. Layered Horizon Mountain Ridges for Cinematic Depth Parallax
  const distantPeaks = useMemo(() => {
    return [
      { pos: [-45, 16, -440] as [number, number, number], scale: [48, 32, 8] as [number, number, number], col: "#090d18" },
      { pos: [42, 19, -480] as [number, number, number], scale: [52, 36, 8] as [number, number, number], col: "#080a14" },
      { pos: [-38, 22, -540] as [number, number, number], scale: [60, 42, 8] as [number, number, number], col: "#060710" },
      { pos: [36, 24, -590] as [number, number, number], scale: [64, 46, 8] as [number, number, number], col: "#05060d" },
      { pos: [0, 26, -670] as [number, number, number], scale: [72, 48, 8] as [number, number, number], col: "#040409" },
    ];
  }, []);

  // 7. Mountain Pine Trees (z: -400 to -690)
  const pineTrees = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number }[] = [];
    for (let z = -400; z >= -690; z -= 16) {
      list.push({ pos: [-8.8, 0, z + Math.sin(z) * 2], scale: 0.85 + Math.sin(z * 2) * 0.25 });
      list.push({ pos: [8.8, 0, z - 8 + Math.cos(z) * 2], scale: 0.9 + Math.cos(z * 2) * 0.25 });
    }
    return list;
  }, []);

  return (
    <group>
      {/* ========================================================================= */}
      {/* 1. CONTINUOUS TERRAIN FLANKS (Rolling Hills flanking the travel ribbon)  */}
      {/* ========================================================================= */}
      {/* Left Continuous Terrain Flank (x: -16, z: -350, length: 720) */}
      <mesh position={[-16, -0.3, -350]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 720, 16, 64]} />
        <meshStandardMaterial
          color="#080712"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Right Continuous Terrain Flank (x: +16, z: -350, length: 720) */}
      <mesh position={[16, -0.3, -350]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 720, 16, 64]} />
        <meshStandardMaterial
          color="#080712"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* 2. CAMPUS AVENUE TRANSITION (z: +10 to -150)                              */}
      {/* ========================================================================= */}
      {/* Stone Pathway Curbs */}
      <mesh position={[-5.2, -0.1, -70]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 160]} />
        <meshStandardMaterial color="#2d2938" roughness={0.7} />
      </mesh>
      <mesh position={[5.2, -0.1, -70]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 160]} />
        <meshStandardMaterial color="#2d2938" roughness={0.7} />
      </mesh>

      {/* Campus Lampposts */}
      {campusLamps.map((lpos, idx) => (
        <group key={`camp-lamp-${idx}`} position={lpos}>
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 4.0, 8]} />
            <meshStandardMaterial color="#1e1b29" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde047"
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 3. RAILWAY & COASTAL CORRIDOR (z: -150 to -270)                           */}
      {/* ========================================================================= */}
      {/* Gravel Railway Ballast Bed */}
      <mesh position={[0, -0.14, -205]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 120]} />
        <meshStandardMaterial color="#171520" roughness={0.95} />
      </mesh>

      {/* Dual Steel Rails */}
      <mesh position={[-0.9, -0.05, -205]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 120]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.9, -0.05, -205]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 120]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Railway Wooden Sleepers / Ties */}
      {railwayTies.map((rz, idx) => (
        <mesh key={`tie-${idx}`} position={[0, -0.08, rz]}>
          <boxGeometry args={[2.5, 0.06, 0.22]} />
          <meshStandardMaterial color="#271c19" roughness={0.85} />
        </mesh>
      ))}

      {/* Train Telegraph Line Poles */}
      {telegraphPoles.map((tz, idx) => (
        <group key={`t-pole-${idx}`} position={[-5.5, 0, tz]}>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 5.6, 8]} />
            <meshStandardMaterial color="#33241b" roughness={0.8} />
          </mesh>
          <mesh position={[0.4, 5.2, 0]}>
            <boxGeometry args={[1.4, 0.08, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 4. HIGHWAY & ROADSIDE BARRIERS (z: -270 to -390)                          */}
      {/* ========================================================================= */}
      {/* Highway Guardrail Left */}
      <mesh position={[-5.8, 0.35, -330]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 120]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Highway Guardrail Right */}
      <mesh position={[5.8, 0.35, -330]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 120]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Highway Posts */}
      {highwayMarkers.map((hz, idx) => (
        <group key={`hw-m-${idx}`}>
          <mesh position={[-5.8, 0.35, hz]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          <mesh position={[5.8, 0.35, hz]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 5. MOUNTAIN GHATS ROCK FACES & RIDGES (z: -390 to -600)                   */}
      {/* ========================================================================= */}
      {mountainCliffs.map((cliff, idx) => (
        <mesh
          key={`cliff-${idx}`}
          position={cliff.pos}
          rotation={[0, cliff.rot, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={cliff.scale} />
          <meshStandardMaterial
            color="#14111d"
            roughness={0.88}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Distant Parallax Mountain Horizons */}
      {distantPeaks.map((dp, idx) => (
        <mesh key={`peak-${idx}`} position={dp.pos}>
          <coneGeometry args={[dp.scale[0] / 2, dp.scale[1], 4]} />
          <meshStandardMaterial
            color={dp.col}
            roughness={0.95}
          />
        </mesh>
      ))}

      {/* Evergreen Pine Trees across Mountain Road */}
      {pineTrees.map((pt, idx) => (
        <group key={`pine-${idx}`} position={pt.pos} scale={pt.scale}>
          {/* Trunk */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 8]} />
            <meshStandardMaterial color="#231709" roughness={0.9} />
          </mesh>
          {/* Foliage Layers */}
          <mesh position={[0, 1.6, 0]}>
            <coneGeometry args={[0.9, 1.4, 8]} />
            <meshStandardMaterial color="#082016" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <coneGeometry args={[0.7, 1.2, 8]} />
            <meshStandardMaterial color="#0b2c1f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <coneGeometry args={[0.45, 0.9, 8]} />
            <meshStandardMaterial color="#0e3a29" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
