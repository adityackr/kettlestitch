"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEpub } from "@/hooks/useEpub";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useBookmarkActions, usePendingSelection } from "@/hooks/useBookmarks";
import { useHighlightStore } from "@/store/highlightStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useReaderStore } from "@/store/readerStore";
import { ReaderView } from "@/components/reader/ReaderView";
import { Toolbar } from "@/components/reader/Toolbar";
import { ReaderProgress } from "@/components/reader/ReaderProgress";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ChapterSidebar } from "@/components/sidebar/ChapterSidebar";
import { LibrarySheet } from "@/components/sidebar/LibrarySheet";
import { HighlightPicker } from "@/components/reader/HighlightPicker";
import { RestoreBook } from "@/components/reader/RestoreBook";
import { openBook } from "@/lib/services/books";
import { chapterTitleForHref, liveContents, prettyFileName, type EpubCfiLocation } from "@/lib/epub";
import type { HighlightColor } from "@/types";

/**
 * Orchestrates the whole reading experience:
 * route book id -> library resolution -> epub.js lifecycle (useEpub) +
 * toolbar + sidebar + sheets + shortcuts.
 *
 * All logic lives in `useEpubReader` below — this component is JSX only.
 */
export function EpubReader({ bookId }: { bookId: string }) {
  const {
    viewerRef, shellRef, isReady, missingTitle, isFullscreen,
    sidebarOpen, settingsOpen, libraryOpen, setSettingsOpen, setLibraryOpen,
    toggleSidebar, openLibrary, openSettings, clearMissing,
    prev, next, gotoCfi, gotoHref, gotoPercent,
    handleAddBookmark, handleToggleFullscreen, handleSaveHighlight,
    pending, clearPending,
  } = useEpubReader(bookId);

  if (missingTitle) {
    return <RestoreBook bookId={bookId} title={missingTitle} onRestored={clearMissing} />;
  }

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening book…</p>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar
        onPrev={prev}
        onNext={next}
        onGotoPercent={gotoPercent}
        onToggleSidebar={toggleSidebar}
        onOpenLibrary={openLibrary}
        onOpenSettings={openSettings}
        onAddBookmark={handleAddBookmark}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <div className="flex h-full">
            <ChapterSidebar open={sidebarOpen} onNavigate={gotoHref} />
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ReaderView viewerRef={viewerRef} />
          <HighlightPicker pending={pending} onSave={handleSaveHighlight} onClose={clearPending} />
        </div>
      </div>

      {/* Mobile chapters drawer */}
      {sidebarOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="max-h-48 overflow-y-auto p-2">
            <ChapterSidebar open onNavigate={gotoHref} />
          </div>
        </div>
      )}

      <ReaderProgress onPrev={prev} onNext={next} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <LibrarySheet open={libraryOpen} onOpenChange={setLibraryOpen} onJump={gotoCfi} />
    </div>
  );
}

/**
 * All EpubReader logic: route-id resolution, epub lifecycle wiring,
 * highlight/bookmark actions, fullscreen, shortcuts, and panel state.
 * Subscribes only to `bookId` (branch switching) — per-page-turn
 * updates (progress/CFI) flow into narrow child subscribers, never here.
 */
function useEpubReader(bookId: string) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const loadedBookId = useReaderStore((s) => s.bookId);
  const [missingTitle, setMissingTitle] = useState<string | null>(null);

  const { renditionRef, next, prev, gotoCfi, gotoHref, gotoPercent } = useEpub(viewerRef);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef);
  const { addCurrent } = useBookmarkActions(renditionRef);
  const { pending, clearPending } = usePendingSelection();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  /* Bridge the route id into the transient reader store (one-shot per id). */
  useEffect(() => {
    setMissingTitle(null);
    const reader = useReaderStore.getState();
    if (reader.bookId === bookId && (reader.fileData || reader.fileUrl)) return;

    let cancelled = false;
    void (async () => {
      const result = await openBook(bookId);
      if (cancelled) return;
      if (result.status === "unknown") {
        // Library was cleared or the id is bogus — back to the shelf.
        router.replace("/library");
      } else if (result.status === "missing") {
        setMissingTitle(result.title);
      } else {
        reader.setSource({
          bookId: result.bookId,
          title: result.title,
          fileData: result.fileData,
          fileUrl: result.fileUrl,
        });
        if (result.bookId !== bookId) {
          // Resolved through migration — canonicalize the URL.
          router.replace(`/reader/${result.bookId}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId, router]);

  const saveHighlight = useCallback(
    async (color: HighlightColor, selection: { cfiRange: string; text: string }) => {
      // Resolve the chapter title so the Highlights tab can show it.
      let chapter = "Unknown chapter";
      try {
        const { toc } = useReaderStore.getState();
        const loc = renditionRef.current?.currentLocation() as unknown as
          | EpubCfiLocation
          | EpubCfiLocation[]
          | undefined;
        const cur = Array.isArray(loc) ? loc[0] : loc;
        const href = cur?.start?.href;
        if (href) chapter = chapterTitleForHref(toc, href) ?? prettyFileName(href) ?? chapter;
      } catch { /* label stays generic */ }
      useHighlightStore
        .getState()
        .add({ cfiRange: selection.cfiRange, text: selection.text, color, chapter, createdAt: Date.now() });
      try {
        const fill = { yellow: "#ffe066", green: "#b2f2bb", blue: "#a5d8ff", pink: "#ffc6e0" }[color];
        await renditionRef.current?.annotations.highlight?.(
          selection.cfiRange,
          {},
          () => {},
          "",
          { fill, "fill-opacity": "0.45" },
        );
      } catch { /* annotation repaint is best-effort */ }
      // Drop the native selection so the painted mark reads cleanly.
      try {
        const rendition = renditionRef.current;
        if (rendition) {
          for (const contents of liveContents(rendition)) {
            try {
              contents.window?.getSelection?.()?.removeAllRanges?.();
            } catch { /* noop */ }
          }
        }
      } catch { /* noop */ }
      clearPending();
    },
    [renditionRef, clearPending],
  );

  /* All stable — safe to pass to memoized children. */
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const openLibrary = useCallback(() => setLibraryOpen(true), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const clearMissing = useCallback(() => setMissingTitle(null), []);
  const handleAddBookmark = useCallback(() => {
    // Toggle: a filled icon removes the bookmark for this page.
    const { currentCfi } = useReaderStore.getState();
    const bookmarks = useBookmarkStore.getState();
    if (currentCfi && bookmarks.items.some((b) => b.cfi === currentCfi)) {
      bookmarks.remove(currentCfi);
    } else {
      void addCurrent();
    }
  }, [addCurrent]);
  const handleToggleFullscreen = useCallback(() => {
    void toggleFullscreen();
  }, [toggleFullscreen]);
  const handleSaveHighlight = useCallback(
    (color: HighlightColor) => {
      if (pending) void saveHighlight(color, pending);
    },
    [pending, saveHighlight],
  );

  useKeyboardShortcuts({
    onPrev: prev,
    onNext: next,
    onBookmark: handleAddBookmark,
    onFullscreen: handleToggleFullscreen,
    onOpenSettings: openSettings,
  });

  return {
    viewerRef,
    shellRef,
    isReady: loadedBookId === bookId,
    missingTitle,
    isFullscreen,
    sidebarOpen,
    settingsOpen,
    libraryOpen,
    setSettingsOpen,
    setLibraryOpen,
    toggleSidebar,
    openLibrary,
    openSettings,
    clearMissing,
    prev,
    next,
    gotoCfi,
    gotoHref,
    gotoPercent,
    handleAddBookmark,
    handleToggleFullscreen,
    handleSaveHighlight,
    pending,
    clearPending,
  };
}
