"use client";

import { Highlighter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHighlightStore } from "@/store/highlightStore";
import { HIGHLIGHT_COLORS } from "@/types";

/**
 * Highlights tab: chapter name + highlighted text (clamped to 2 lines).
 * Click a row to jump to it.
 */
export function HighlightsPanel({ onJump }: { onJump: (cfi: string) => void }) {
  const { items } = useHighlightsPanel();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Highlighter className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Select any text in the book to create a highlight.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh] pr-2">
      <ul className="space-y-2">
        {items.map((h) => (
          <li key={h.cfiRange} className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
            <button className="block w-full text-left" onClick={() => onJump(h.cfiRange)}>
              <span className="block truncate text-xs font-medium text-muted-foreground">
                {h.chapter ?? "Unknown chapter"}
              </span>
              <span
                className="mt-1 block rounded px-1.5 py-1"
                style={{ background: `${HIGHLIGHT_COLORS[h.color].hex}55` }}
              >
                <span className="line-clamp-2 block text-sm text-foreground">
                  {h.text || "(empty selection)"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

/** All HighlightsPanel logic: highlight list for the active book. */
function useHighlightsPanel() {
  const items = useHighlightStore((s) => s.items);
  return { items };
}
