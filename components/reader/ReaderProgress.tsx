"use client";

import { memo } from "react";
import { useReaderStore } from "@/store/readerStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Bottom bar: prev/next + live reading percentage.
 * Memoized — re-renders only when `progress` itself changes.
 */
export const ReaderProgress = memo(function ReaderProgress({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const { pct } = useReaderProgress();

  return (
    <div className="flex items-center gap-2 border-t bg-background/80 px-3 py-2 backdrop-blur">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous page">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous (←)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex flex-1 items-center gap-3">
        <Progress value={pct} className="flex-1" aria-label={`Reading progress ${pct}%`} />
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next page">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next (→)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

/** All ReaderProgress logic: live percentage derived from the reader store. */
function useReaderProgress() {
  const progress = useReaderStore((s) => s.progress);
  return { pct: Math.round(progress * 100) };
}
