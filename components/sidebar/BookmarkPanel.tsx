"use client";

import { Trash2, Bookmark as BookmarkIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { displayBookmarkLabel } from "@/lib/epub";

export function BookmarkPanel({ onJump }: { onJump: (cfi: string) => void }) {
  const { items, remove } = useBookmarkPanel();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <BookmarkIcon className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No bookmarks yet. Press <Badge variant="outline">B</Badge> to bookmark the current page.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh] pr-2">
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.cfi} className="group rounded-lg border p-3 hover:bg-muted/50">
            <button className="w-full text-left" onClick={() => onJump(b.cfi)}>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate" title={displayBookmarkLabel(b.label)}>
                  {displayBookmarkLabel(b.label)}
                </span>
              </span>
              {b.snippet && <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{b.snippet}</span>}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 gap-1 text-xs text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              onClick={() => remove(b.cfi)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

/** All BookmarkPanel logic: bookmark list + removal. */
function useBookmarkPanel() {
  const items = useBookmarkStore((s) => s.items);
  const remove = useBookmarkStore((s) => s.remove);
  return { items, remove };
}
