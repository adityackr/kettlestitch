"use client";

import { memo, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useReaderStore } from "@/store/readerStore";
import { flattenToc } from "@/lib/epub";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

/** Single chapter row — memoized so page turns only touch the two rows whose active state flips. */
const ChapterRow = memo(function ChapterRow({
  href, label, depth, active, onNavigate,
}: {
  href: string;
  label: string;
  depth: number;
  active: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "mb-0.5 h-auto w-full justify-start whitespace-normal py-1.5 text-left text-sm",
        depth > 0 && "ml-3 w-[calc(100%-0.75rem)] text-[13px] text-muted-foreground",
      )}
      onClick={() => onNavigate(href)}
    >
      <span className="line-clamp-2">{label}</span>
    </Button>
  );
});

/**
 * Collapsible chapter sidebar driven by the EPUB TOC.
 * The flattened list is memoized (previously rebuilt — with input
 * mutation — on every render, including every page turn).
 */
export const ChapterSidebar = memo(function ChapterSidebar({ open, onNavigate }: { open: boolean; onNavigate: (href: string) => void }) {
  const { items, currentHref } = useChapterSidebar();

  if (!open) return null;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30" aria-label="Chapters">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Chapters</h2>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav className="p-2">
          {items.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">No table of contents found in this book.</p>
          )}
          {items.map((item) => {
            const base = item.href.split("#")[0];
            const active = Boolean(currentHref && base && currentHref.includes(base));
            return (
              <ChapterRow
                key={`${item.href}-${item.id}`}
                href={item.href}
                label={item.label}
                depth={item.depth}
                active={active}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
});

/** All ChapterSidebar logic: TOC subscription + memoized flattening. */
function useChapterSidebar() {
  const toc = useReaderStore((s) => s.toc);
  const currentHref = useReaderStore((s) => s.currentHref);
  const items = useMemo(() => flattenToc(toc), [toc]);
  return { items, currentHref };
}
