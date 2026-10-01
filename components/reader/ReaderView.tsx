"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReaderStore } from "@/store/readerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { PAGE_THEMES } from "@/types";

/**
 * The rendition viewport. epub.js renders its iframe inside this div.
 * Background follows the selected page theme so gutters blend in.
 *
 * Memoized with atomic selectors (`isLoading`, `pageThemeId`) — font-size
 * slider drags and page turns do not touch this component.
 */
export const ReaderView = memo(function ReaderView({ viewerRef }: { viewerRef: React.RefObject<HTMLDivElement> }) {
  const { isLoading, background } = useReaderView();

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={viewerRef}
        id="epub-viewer"
        className="absolute inset-0 overflow-hidden transition-[background-color] duration-300"
        style={{ background }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col gap-3 bg-background/60 p-6 backdrop-blur-sm" aria-busy="true" aria-label="Loading book">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <p className="mt-2 text-sm text-muted-foreground">Parsing EPUB, generating locations…</p>
        </div>
      )}
    </div>
  );
});

/** All ReaderView logic: loading flag + page-theme background. */
function useReaderView() {
  const isLoading = useReaderStore((s) => s.isLoading);
  const pageThemeId = useSettingsStore((s) => s.pageThemeId);
  const theme = PAGE_THEMES.find((t) => t.id === pageThemeId) ?? PAGE_THEMES[0];
  return { isLoading, background: theme.background };
}
