"use client";

interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export async function requestOrientationPermission(): Promise<boolean> {
  if (
    typeof window !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission).requestPermission === "function"
  ) {
    try {
      const permission = await (DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission).requestPermission!();
      return permission === "granted";
    } catch {
      return false;
    }
  }
  return true;
}
