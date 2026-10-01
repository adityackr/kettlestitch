"use client";

import { useCallback, useEffect, useState } from "react";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useReaderStore } from "@/store/readerStore";
import { chapterTitleForHref, prettyFileName, textForCfi, type EpubCfiLocation, type EpubRendition } from "@/lib/epub";

/**
 * Bookmark actions bound to the active rendition/position.
 *
 * Intentionally subscription-free: everything is read via `getState()`
 * inside the callback, so components using only the action never
 * re-render on page turns or bookmark list changes. Panels subscribe to
 * `items` themselves where the list is actually rendered.
 */
export function useBookmarkActions(renditionRef: React.RefObject<EpubRendition | null>) {
  const addCurrent = useCallback(async (): Promise<boolean> => {
    const { currentCfi: cfi, bookId, toc } = useReaderStore.getState();
    if (!cfi || !bookId) return false;
    // Human-readable label: real TOC chapter title first, prettified
    // filename as fallback — never a raw `part0003.xhtml`.
    let label = "Bookmark";
    let snippet = "";
    try {
      const rendition = renditionRef.current;
      const loc = rendition?.currentLocation() as unknown as
        | EpubCfiLocation
        | EpubCfiLocation[]
        | undefined;
      const cur = Array.isArray(loc) ? loc[0] : loc;
      const href = cur?.start?.href ?? undefined;
      label =
        (href && chapterTitleForHref(toc, href)) ||
        prettyFileName(href ?? undefined) ||
        "Bookmark";
      const book = rendition?.book;
      snippet = book ? await textForCfi(book, cfi) : "";
      useBookmarkStore.getState().add({
        cfi,
        label,
        snippet: snippet || cfi.slice(0, 80),
        createdAt: Date.now(),
      });
    } catch {
      useBookmarkStore.getState().add({ cfi, label, snippet: cfi.slice(0, 80), createdAt: Date.now() });
    }
    return true;
  }, [renditionRef]);

  return { addCurrent };
}

/** Listen for epub.js text-selection events to drive the highlight popover. */
export function usePendingSelection() {
  const [pending, setPending] = useState<{ cfiRange: string; text: string } | null>(null);

  useEffect(() => {
    const onSelect = (e: Event) => {
      setPending((e as CustomEvent).detail);
    };
    window.addEventListener("epub:select", onSelect);
    return () => window.removeEventListener("epub:select", onSelect);
  }, []);

  const clearPending = useCallback(() => setPending(null), []);

  return { pending, clearPending };
}
