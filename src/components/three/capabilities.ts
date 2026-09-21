/**
 * Client-side capability probe for the fabric hero fallback ladder:
 *   tier "full"  — WebGL2 + adequate device memory/cores
 *   tier "light" — WebGL1-only or borderline device: tiny geometry
 *   tier "none"  — no WebGL / WebGL context creation fails
 * prefers-reduced-motion is handled separately by callers.
 */
export type FabricTier = "full" | "light" | "none";

export function detectFabricTier(): FabricTier {
  if (typeof window === "undefined") return "none";

  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    gl2?.getExtension("WEBGL_lose_context")?.loseContext();
    if (gl2) return "full";

    const gl1 = canvas.getContext("webgl");
    gl1?.getExtension("WEBGL_lose_context")?.loseContext();
    if (gl1) return "light";

    return "none";
  } catch {
    return "none";
  }
}

/** Rough steer away from low-end hardware. */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return true;
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  return false;
}
