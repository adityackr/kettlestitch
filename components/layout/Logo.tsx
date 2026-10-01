import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Kettlestitch brand mark — open book with a kettle-stitch dash row,
 * in the warm amber→rose gradient. Inline SVG (crisp at any size,
 * no extra request); gradient ids are unique per instance.
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const gid = useLogoGradientId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Kettlestitch logo"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.55" stopColor="#f97316" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${gid})`} />
      <path
        d="M32 20 C28.5 16.8 23.5 15.5 18 15.5 V44.5 C23.5 44.5 28.5 45.8 32 49 C35.5 45.8 40.5 44.5 46 44.5 V15.5 C40.5 15.5 35.5 16.8 32 20 Z"
        fill="#ffffff"
        fillOpacity="0.14"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <path d="M32 20 V49" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <path
        d="M20.5 37.5 C27 34.2 37 34.2 43.5 37.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="0.5 4.6"
      />
    </svg>
  );
}

/** All Logo logic: a per-instance gradient id (colons break `url(#…)` refs). */
function useLogoGradientId() {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  return `kgrad-${raw}`;
}
