"use client";

import React, { useState, useEffect } from "react";
import { useStory } from "@/context/StoryContext";

export default function StoryDebugOverlay() {
  const { scrollProgress, activeMilestoneIndex, milestones } = useStory();
  const [collapsed, setCollapsed] = useState(false);
  const [cameraState, setCameraState] = useState<{
    pos: { x: number; y: number; z: number };
    look: { x: number; y: number; z: number };
  }>({
    pos: { x: 0, y: 0, z: 0 },
    look: { x: 0, y: 0, z: 0 },
  });

  // Poll camera position from CameraRig in dev mode
  useEffect(() => {
    let animId: number;
    const update = () => {
      if (typeof window !== "undefined" && (window as any).__storyCamera) {
        const cam = (window as any).__storyCamera;
        setCameraState({
          pos: {
            x: Number(cam.pos.x.toFixed(1)),
            y: Number(cam.pos.y.toFixed(1)),
            z: Number(cam.pos.z.toFixed(1)),
          },
          look: {
            x: Number(cam.look.x.toFixed(1)),
            y: Number(cam.look.y.toFixed(1)),
            z: Number(cam.look.z.toFixed(1)),
          },
        });
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentMilestone = milestones[activeMilestoneIndex] || milestones[0];
  const start = currentMilestone.custom3DConfig?.splineProgressStart ?? 0;
  const end = currentMilestone.custom3DConfig?.splineProgressEnd ?? 1;
  const local = end > start ? Math.max(0, Math.min(1, (scrollProgress - start) / (end - start))) : 0;

  const minActive = Math.max(0, activeMilestoneIndex - 1);
  const maxActive = Math.min(milestones.length - 1, activeMilestoneIndex + 1);
  const activeList: string[] = [];
  for (let i = minActive; i <= maxActive; i++) {
    activeList.push(`m-${i}`);
  }

  return (
    <aside
      aria-label="Development Telemetry Diagnostics"
      className="fixed bottom-4 left-4 z-50 font-mono text-[11px] bg-black/85 text-emerald-400 border border-emerald-500/30 rounded-lg p-2.5 backdrop-blur-md shadow-2xl pointer-events-auto select-none"
    >
      <div className="flex items-center justify-between gap-3 mb-1 border-b border-emerald-500/20 pb-1">
        <span className="text-white font-semibold tracking-wider uppercase text-[10px]">
          Story Diagnostic HUD
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-emerald-400/70 hover:text-emerald-300 text-[10px] px-1"
        >
          {collapsed ? "[+]" : "[-]"}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-1">
          <div>
            <span className="text-white/60">Progress: </span>
            <span className="text-yellow-300 font-bold">{scrollProgress.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-white/60">Milestone: </span>
            <span className="text-cyan-300 font-semibold">
              {currentMilestone.id} ({currentMilestone.title})
            </span>
          </div>
          <div>
            <span className="text-white/60">Local: </span>
            <span className="text-yellow-300">{(local * 100).toFixed(1)}%</span>
            <span className="text-white/40 text-[10px]"> ({start.toFixed(2)}–{end.toFixed(2)})</span>
          </div>
          <div>
            <span className="text-white/60">Camera: </span>
            <span className="text-rose-300">
              [{cameraState.pos.x}, {cameraState.pos.y}, {cameraState.pos.z}]
            </span>
          </div>
          <div>
            <span className="text-white/60">LookAt: </span>
            <span className="text-rose-200">
              [{cameraState.look.x}, {cameraState.look.y}, {cameraState.look.z}]
            </span>
          </div>
          <div>
            <span className="text-white/60">Active: </span>
            <span className="text-purple-300">[{activeList.join(", ")}]</span>
          </div>
        </div>
      )}
    </aside>
  );
}
