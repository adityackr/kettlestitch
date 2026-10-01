import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names (shadcn `cn` helper). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Run a non-critical task when the browser is idle (fallback: macrotask).
 * Used for persistence writes (base64, localStorage) so they never block
 * first paint or rendition mounting.
 */
export function scheduleIdle(cb: () => void): void {
  if (typeof window === "undefined") return;
  const ric = (window as unknown as {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (typeof ric === "function") ric.call(window, cb, { timeout: 2000 });
  else setTimeout(cb, 0);
}
