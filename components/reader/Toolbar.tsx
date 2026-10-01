"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark as BookmarkIcon, ChevronLeft, ChevronRight,
  FileText, Maximize, Minimize, PanelLeft, Settings2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useReaderStore } from "@/store/readerStore";
import { useBookmarkStore } from "@/store/bookmarkStore";

interface Props {
  onPrev: () => void;
  onNext: () => void;
  onGotoPercent: (pct: number) => void;
  onToggleSidebar: () => void;
  onOpenLibrary: () => void; // bookmarks & highlights sheet
  onOpenSettings: () => void;
  onAddBookmark: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  sidebarOpen: boolean;
}

/** Module-scope icon button: stable identity, no per-render closures. */
const IconBtn = memo(function IconBtn({
  label, tip, onClick, active, children,
}: {
  label: string;
  tip: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={active ? "secondary" : "ghost"} size="icon" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

/**
 * Top toolbar: navigation, jump-to-percent, bookmarks/highlights,
 * layout helpers, fullscreen, settings and theme.
 *
 * Memoized — the parent passes stable callbacks, and the only store
 * slices read here (`title`, `progress`, `totalLocations`) are the ones
 * actually rendered. Local jump input state stays inside.
 */
export const Toolbar = memo(function Toolbar(p: Props) {
  const {
    title, progress, totalLocations, isBookmarked,
    jump, setJump, submitJump, closeBook,
  } = useToolbar(p);

  return (
    <header className="flex flex-wrap items-center gap-1 border-b bg-background/90 px-2 py-1.5 backdrop-blur">
      <IconBtn label="Toggle chapters" tip="Chapters sidebar" onClick={p.onToggleSidebar} active={p.sidebarOpen}>
        <PanelLeft className="h-5 w-5" />
      </IconBtn>
      <IconBtn label="Previous" tip="Previous (←)" onClick={p.onPrev}>
        <ChevronLeft className="h-5 w-5" />
      </IconBtn>
      <IconBtn label="Next" tip="Next (→)" onClick={p.onNext}>
        <ChevronRight className="h-5 w-5" />
      </IconBtn>

      <div className="mx-1 hidden min-w-0 flex-1 items-center justify-center sm:flex">
        <span className="truncate text-sm font-medium">{title || "Kettlestitch"}</span>
      </div>

      <div className="flex items-center gap-1">
        <Input
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitJump(); }}
          placeholder={totalLocations ? `1–${totalLocations} or %` : "Go to %"}
          aria-label="Jump to location or percent"
          className="h-8 w-28 text-xs"
          inputMode="numeric"
        />
        <Button variant="outline" size="sm" onClick={submitJump}>Go</Button>
      </div>

      <span className="hidden px-1 text-xs tabular-nums text-muted-foreground md:inline">
        {Math.round(progress * 100)}%
      </span>

      <IconBtn
        label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
        tip={isBookmarked ? "Bookmarked — click to remove (B)" : "Bookmark this page (B)"}
        onClick={p.onAddBookmark}
        active={isBookmarked}
      >
        <BookmarkIcon className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} />
      </IconBtn>
      <IconBtn label="Bookmarks & highlights" tip="Annotation panels" onClick={p.onOpenLibrary}>
        <FileText className="h-5 w-5" />
      </IconBtn>
      <IconBtn label="Reading settings" tip="Settings (Ctrl/⌘+K)" onClick={p.onOpenSettings}>
        <Settings2 className="h-5 w-5" />
      </IconBtn>
      <IconBtn
        label={p.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        tip="Fullscreen (F)"
        onClick={p.onToggleFullscreen}
      >
        {p.isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </IconBtn>
      <IconBtn label="Close book" tip="Close and go to library" onClick={closeBook}>
        <X className="h-5 w-5" />
      </IconBtn>
    </header>
  );
});

/** All Toolbar logic: store subscriptions, jump input, bookmark state, close. */
function useToolbar(p: Props) {
  const router = useRouter();
  const title = useReaderStore((s) => s.title);
  const progress = useReaderStore((s) => s.progress);
  const totalLocations = useReaderStore((s) => s.totalLocations);
  const currentCfi = useReaderStore((s) => s.currentCfi);
  // Primitive boolean selector: re-renders only when bookmarked-state flips,
  // not on every bookmark list or location update.
  const isBookmarked = useBookmarkStore((s) =>
    currentCfi != null && s.items.some((b) => b.cfi === currentCfi),
  );
  const [jump, setJump] = useState("");

  const { onGotoPercent } = p;
  const submitJump = useCallback(() => {
    const raw = jump.trim().replace("%", "");
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    // Accept either a 0-100 percent or a raw location index.
    if (totalLocations > 0 && Number.isInteger(num) && num >= 1 && num <= totalLocations && !raw.includes(".")) {
      onGotoPercent((num - 1) / totalLocations);
    } else {
      onGotoPercent(Math.min(100, Math.max(0, num)) / 100);
    }
    setJump("");
  }, [jump, totalLocations, onGotoPercent]);

  const closeBook = useCallback(() => {
    useReaderStore.getState().reset();
    router.push("/library");
  }, [router]);

  return {
    title, progress, totalLocations, isBookmarked,
    jump, setJump, submitJump, closeBook,
  };
}
