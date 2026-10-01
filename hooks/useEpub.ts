"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReaderStore } from "@/store/readerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useHighlightStore } from "@/store/highlightStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useEpubSettings } from "@/hooks/useEpubSettings";
import {
  applyEpubTheme,
  normalizeToc,
  restoreHighlights,
  spineItems,
  themeSnapshot,
  LOCATION_CHARS_PER_BREAK,
  type EpubBook,
  type EpubBookMetadata,
  type EpubCfiLocation,
  type EpubContents,
  type EpubRendition,
} from "@/lib/epub";
import { bookData } from "@/lib/data";
import { coverBlobToThumbnail } from "@/lib/base64";

/**
 * useEpub — owns the epub.js Book + Rendition lifecycle.
 *
 * Design notes (see also `useEpubSettings`):
 *  - ONE effect owns create/destroy. It subscribes to the source only
 *    (`bookId`/`fileData`/`fileUrl` as atomic selectors), so per-page-turn
 *    store updates (progress, CFI) do NOT re-render the consumer.
 *  - Per-book side stores (bookmarks/highlights) are bound inside the
 *    lifecycle effect — no extra effect needed.
 *  - Imperative controls are stable (`useCallback` over refs) and the
 *    returned handle is memoized, so consumers can safely pass them to
 *    memoized children.
 *  - Library progress mirroring is throttled (≥1% delta) because each
 *    mirror rewrites the persisted library JSON.
 */
export function useEpub(viewerRef: React.RefObject<HTMLDivElement>) {
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);

  // Atomic selectors: re-render only when the *source* changes.
  const bookId = useReaderStore((s) => s.bookId);
  const fileData = useReaderStore((s) => s.fileData);
  const fileUrl = useReaderStore((s) => s.fileUrl);

  /* Book + rendition lifecycle (single effect). */
  useEffect(() => {
    if (!bookId || (!fileData && !fileUrl)) return;
    const mount = viewerRef.current;
    if (!mount) return;

    let cancelled = false;
    let book: EpubBook | null = null;
    let rendition: EpubRendition | null = null;
    // Throttle library progress writes: full JSON rewrite per tick.
    let lastMirroredProgress = -1;

    (async () => {
      // epub.js is heavy and client-only — code-split it away from first paint.
      const { default: ePub } = await import("epubjs");
      if (cancelled) return;

      const store = useReaderStore.getState();
      store.setLoading(true);
      store.setError(null);

      // Bind per-book collections for the incoming book (awaited: the
      // highlight restore below must see the bound items).
      await Promise.all([
        useBookmarkStore.getState().bindBook(bookId),
        useHighlightStore.getState().bindBook(bookId),
      ]);
      if (cancelled) return;

      try {
        // Shared reference — epub.js/JSZip only read the buffer.
        book = fileData ? ePub(fileData) : ePub(fileUrl as string);
        bookRef.current = book;

        await book.ready;

        const metadata = await book.loaded.metadata.catch(
          (): EpubBookMetadata => ({}),
        );
        // Fire-and-forget: cover/author enrichment must never block reading.
        void enrichLibraryEntry(bookId, book, metadata);

        const nav = await book.loaded.navigation.catch(() => ({ toc: [] }));
        if (!cancelled) store.setToc(normalizeToc(nav?.toc));

        // Locations power percentage progress; deferred errors are fine.
        book.locations
          .generate(LOCATION_CHARS_PER_BREAK)
          .then((locs: string[]) => {
            if (!cancelled) useReaderStore.getState().setLocationsMeta(true, locs.length);
          })
          .catch(() => {
            if (!cancelled) useReaderStore.getState().setLocationsMeta(false, 0);
          });

        const settings = useSettingsStore.getState();
        rendition = book.renderTo(mount, {
          width: "100%",
          height: "100%",
          flow: settings.flow === "scrolled" ? "scrolled" : "paginated",
          spread: settings.spread,
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        applyEpubTheme(rendition, themeSnapshot(settings));

        // Restore last position for this book.
        const savedCfi = await bookData.getPosition(bookId).catch(() => null);

        rendition.on("relocated", (loc: EpubCfiLocation) => {
          const cfi = loc?.start?.cfi ?? null;
          const href = loc?.start?.href ?? loc?.href ?? null;
          let progress = 0;
          try {
            if (cfi && book?.locations?.length()) progress = book.locations.percentageFromCfi(cfi);
          } catch { /* locations not ready yet */ }
          useReaderStore.getState().setLocation(cfi, href, progress || 0);
          if (cfi) void bookData.setPosition(bookId, cfi).catch(() => {});
          if (progress > 0 && Math.abs(progress - lastMirroredProgress) >= 0.01) {
            lastMirroredProgress = progress;
            try {
              useLibraryStore.getState().updateProgress(bookId, progress);
            } catch { /* library sync is best-effort */ }
          }
        });

        rendition.on("selected", (cfiRange: string, contents: EpubContents) => {
          try {
            const text = contents.window?.getSelection?.()?.toString().trim().slice(0, 500) ?? "";
            window.dispatchEvent(new CustomEvent("epub:select", { detail: { cfiRange, text } }));
          } catch { /* noop */ }
        });

        await rendition.display(savedCfi ?? undefined);
        await restoreHighlights(rendition, useHighlightStore.getState().items);

        if (!cancelled) {
          store.setLoading(false);
          try {
            // Typed as a single location upstream, but flow modes may
            // yield an array at runtime — narrow defensively.
            const loc = rendition.currentLocation() as unknown as
              | EpubCfiLocation
              | EpubCfiLocation[]
              | undefined;
            const cur = Array.isArray(loc) ? loc[0] : loc;
            if (cur?.start?.cfi) {
              store.setLocation(cur.start.cfi, cur.start.href ?? null, 0);
            }
          } catch { /* noop */ }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          store.setError(err instanceof Error ? err.message : "Failed to open this EPUB.");
        }
      }
    })();

    return () => {
      cancelled = true;
      try { renditionRef.current?.destroy?.(); } catch { /* noop */ }
      try { bookRef.current?.destroy?.(); } catch { /* noop */ }
      renditionRef.current = null;
      bookRef.current = null;
      if (mount) mount.innerHTML = "";
    };
  }, [bookId, fileData, fileUrl, viewerRef]);

  /* Live typography / layout (owned by a dedicated hook). */
  useEpubSettings(renditionRef);

  /* Stable imperative controls — identity never changes across renders. */
  const next = useCallback(async () => {
    try { await renditionRef.current?.next(); } catch { /* noop */ }
  }, []);
  const prev = useCallback(async () => {
    try { await renditionRef.current?.prev(); } catch { /* noop */ }
  }, []);
  const gotoCfi = useCallback(async (cfi: string) => {
    try { await renditionRef.current?.display(cfi); } catch { /* noop */ }
  }, []);
  const gotoHref = useCallback(async (href: string) => {
    try { await renditionRef.current?.display(href); } catch { /* noop */ }
  }, []);
  const gotoPercent = useCallback(async (pct: number) => {
    try {
      const book = bookRef.current;
      const rendition = renditionRef.current;
      if (!book || !rendition) return;
      const clamped = Math.min(0.999, Math.max(0, pct));
      let cfi: string | null = null;
      try { cfi = book.locations.cfiFromPercentage(clamped); } catch { /* not ready */ }
      if (cfi) {
        await rendition.display(cfi);
      } else {
        // Fallback: walk the spine proportionally by chapter index.
        const spine = spineItems(book);
        const idx = Math.min(spine.length - 1, Math.floor(clamped * spine.length));
        const item = spine[idx];
        if (item?.href) await rendition.display(item.href);
      }
    } catch { /* noop */ }
  }, []);

  return useMemo(
    () => ({ renditionRef, next, prev, gotoCfi, gotoHref, gotoPercent }),
    [next, prev, gotoCfi, gotoHref, gotoPercent],
  );
}

/**
 * Best-effort library enrichment (author + cover thumbnail).
 * Async and isolated so cover fetching can never block the reader.
 */
async function enrichLibraryEntry(
  bookId: string,
  book: EpubBook,
  metadata: EpubBookMetadata,
): Promise<void> {
  try {
    const lib = useLibraryStore.getState();
    const author =
      metadata?.creator ??
      (Array.isArray(metadata?.creators) ? metadata.creators.join(", ") : undefined);
    let cover = lib.books.find((b) => b.id === bookId)?.cover ?? "";
    try {
      const coverUrl: string | null = await book.coverUrl?.().catch(() => null);
      if (coverUrl) {
        try {
          const res = await fetch(coverUrl).catch(() => null);
          const blob = await res?.blob().catch(() => null);
          if (blob && blob.size > 0 && blob.size < 4 * 1024 * 1024) {
            cover = (await coverBlobToThumbnail(blob).catch(() => undefined)) ?? cover;
          }
        } finally {
          try {
            if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl);
          } catch { /* noop */ }
        }
      }
    } catch { /* cover is optional */ }
    if (cover || author || metadata?.title) {
      lib.updateCover(bookId, cover, author, metadata?.title);
    }
  } catch { /* library enrichment is optional */ }
}
