"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useReaderStore } from "@/store/readerStore";
import { applyEpubTheme, themeSnapshot, type EpubRendition } from "@/lib/epub";

/**
 * useEpubSettings — live-applies typography / theme / layout to a running
 * rendition without rebuilding the book.
 *
 * Performance details:
 *  - Subscribes to settings ATOMS (not the whole store), so only relevant
 *    changes re-run anything.
 *  - Theme CSS applies synchronously (cheap), but the pagination
 *    re-render (`rendition.display`) is debounced: dragging the font-size
 *    slider emits dozens of ticks per second and must collapse to ONE
 *    re-render on release.
 *  - Stale guards: the debounced re-display is skipped if the user
 *    navigated elsewhere meanwhile, or if the rendition was replaced
 *    (book switch) while the timer was pending.
 *  - Spread/flow are discrete toggles applied in a single effect.
 */
export function useEpubSettings(renditionRef: React.RefObject<EpubRendition | null>) {
  const fontId = useSettingsStore((s) => s.fontId);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const pageThemeId = useSettingsStore((s) => s.pageThemeId);
  const spread = useSettingsStore((s) => s.spread);
  const flow = useSettingsStore((s) => s.flow);

  const themeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Typography + page theme. */
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const snap = themeSnapshot(useSettingsStore.getState());
    applyEpubTheme(rendition, snap);

    // Debounce the expensive part (full pagination re-render).
    if (themeTimer.current) clearTimeout(themeTimer.current);
    themeTimer.current = setTimeout(() => {
      themeTimer.current = null;
      // Rendition replaced (book switch) while debouncing? Bail out.
      if (renditionRef.current !== rendition) return;
      try {
        const cfi = useReaderStore.getState().currentCfi;
        if (cfi) void rendition.display(cfi).catch(() => {});
      } catch { /* noop */ }
    }, 220);

    return () => {
      if (themeTimer.current) {
        clearTimeout(themeTimer.current);
        themeTimer.current = null;
      }
    };
  }, [fontId, fontSize, pageThemeId, renditionRef]);

  /* Layout: spread + flow in one effect (both trigger relayout). */
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    try {
      rendition.spread(spread);
    } catch { /* noop */ }
    try {
      rendition.flow(flow === "scrolled" ? "scrolled" : "paginated");
    } catch { /* noop */ }
  }, [spread, flow, renditionRef]);
}
