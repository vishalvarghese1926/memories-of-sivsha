export function triggerHaptic(pattern: number | number[] = 15) {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore devices where vibration permission is restricted
    }
  }
}

export function triggerRomanticHeartbeat() {
  triggerHaptic([40, 60, 80]);
}

export function triggerWaxCrackHaptic() {
  triggerHaptic([25, 30, 45]);
}
