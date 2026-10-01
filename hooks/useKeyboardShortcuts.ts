"use client";

import { useEffect, useRef } from "react";

interface ShortcutHandlers {
  onPrev: () => void;
  onNext: () => void;
  onBookmark: () => void;
  onFullscreen: () => void;
  onOpenSettings: () => void;
}

/**
 * Global keyboard shortcuts:
 *  ←/→ prev/next · B bookmark · F fullscreen · Ctrl/Cmd+K settings.
 * Ignored while typing in inputs/textareas.
 *
 * The handlers are mirrored into a ref and the listener is subscribed
 * ONCE — callers may pass inline closures without causing
 * unsubscribe/resubscribe churn on every render.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); h.onPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); h.onNext(); }
      else if (e.key === "b" || e.key === "B") { h.onBookmark(); }
      else if (e.key === "f" || e.key === "F") { h.onFullscreen(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); h.onOpenSettings(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
