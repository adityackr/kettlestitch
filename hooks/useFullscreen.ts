"use client";

import { useCallback, useEffect, useState } from "react";

/** Fullscreen toggle backed by the Fullscreen API. */
export function useFullscreen(targetRef?: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const el = (targetRef?.current ?? document.documentElement) as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen failed", e);
    }
  }, [targetRef]);

  return { isFullscreen, toggle };
}
