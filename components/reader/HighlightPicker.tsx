"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Floating highlight picker. Rendered as a plain absolutely-positioned
 * card (not a Radix Popover) so it appears deterministically — Popover
 * content without an anchor positions unreliably and often never shows.
 * Choosing a color saves immediately; Cancel dismisses.
 */
export const HighlightPicker = memo(function HighlightPicker({
  pending,
  onSave,
  onClose,
}: {
  pending: { cfiRange: string; text: string } | null;
  onSave: (color: HighlightColor) => void;
  onClose: () => void;
}) {
  if (!pending) return null;

  return (
    <div className="animate-fade-up absolute left-1/2 top-4 z-30 w-[min(92%,22rem)] -translate-x-1/2">
      <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Highlight selection
        </p>
        <p className="mt-1.5 line-clamp-2 rounded-md bg-muted px-2 py-1.5 text-sm">
          &ldquo;{pending.text || "(empty selection)"}&rdquo;
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <RadioGroup
            aria-label="Highlight color"
            className="flex items-center gap-2"
            // Uncontrolled momentary group: any choice saves + unmounts.
            onValueChange={(v) => onSave(v as HighlightColor)}
          >
            {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => (
              <RadioGroupItem
                key={c}
                value={c}
                title={HIGHLIGHT_COLORS[c].label}
                aria-label={`Highlight in ${HIGHLIGHT_COLORS[c].label}`}
                className={cn(
                  "h-8 w-8 aspect-auto rounded-full border-transparent ring-offset-2 ring-offset-background",
                  "transition hover:scale-110 focus-visible:ring-primary",
                  "data-[state=checked]:border-transparent data-[state=checked]:ring-2 data-[state=checked]:ring-primary",
                  // White selection dot on the color.
                  "text-white",
                )}
                style={{ background: HIGHLIGHT_COLORS[c].hex }}
              />
            ))}
          </RadioGroup>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
});
