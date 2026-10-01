"use client";

import { memo } from "react";
import { Settings2, Type, Palette, LayoutGrid, MoveHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/store/settingsStore";
import { FONT_OPTIONS, PAGE_THEMES, type FlowMode, type PageThemeId, type SpreadMode } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Reading settings sheet. Subscribes to settings ATOMS so (for example)
 * dragging the font-size slider doesn't re-render the theme swatches
 * section beyond the value it actually reads — and vice versa.
 */
export const SettingsPanel = memo(function SettingsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const {
    fontSize, fontId, pageThemeId, spread, flow,
    setFontSize, setFontId, setPageThemeId, setSpread, setFlow,
  } = useSettingsPanel();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Reading settings</SheetTitle>
          <SheetDescription>Typography, colors and layout. Everything is saved automatically. Shortcut: Ctrl/⌘+K.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Typography */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Type className="h-4 w-4" /> Typography</h3>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="font-size" className="text-muted-foreground">Font size</Label>
                <span className="text-sm tabular-nums">{fontSize}px</span>
              </div>
              <Slider
                id="font-size"
                min={12}
                max={32}
                step={1}
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                aria-label="Font size"
              />
            </div>
            <div>
              <Label className="mb-2 block text-muted-foreground">Font family</Label>
              <Select value={fontId} onValueChange={setFontId}>
                <SelectTrigger><SelectValue placeholder="Choose a font" /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span style={{ fontFamily: f.family }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Page color themes */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4" /> Page theme</h3>
            <RadioGroup
              value={pageThemeId}
              onValueChange={(v) => setPageThemeId(v as PageThemeId)}
              aria-label="Page color theme"
              className="grid grid-cols-3 gap-2"
            >
              {PAGE_THEMES.map((t) => (
                <RadioGroupItem
                  key={t.id}
                  value={t.id}
                  aria-label={t.label}
                  className={cn(
                    "flex h-auto w-full aspect-auto rounded-lg border p-2.5",
                    "flex-col items-stretch gap-1.5 transition-all hover:bg-muted",
                    "data-[state=checked]:border-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary/30",
                    // The item's indicator dot is redundant inside a swatch
                    // card (the ring marks selection); hide it. It renders
                    // as the item's first-child span.
                    "[&>span:first-child]:hidden",
                  )}
                >
                  <span
                    className="block h-10 w-full rounded-md border"
                    style={{ background: t.background, borderColor: "#00000022" }}
                    aria-hidden
                  >
                    <span className="mx-2 mt-2 block h-1.5 rounded" style={{ background: t.foreground, opacity: 0.7 }} />
                    <span className="mx-2 mt-1 block h-1.5 w-3/4 rounded" style={{ background: t.foreground, opacity: 0.4 }} />
                  </span>
                  <span className="text-center text-xs font-medium">{t.label}</span>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </section>

          <Separator />

          {/* Layout */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><LayoutGrid className="h-4 w-4" /> Layout</h3>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Pages per view</p>
              <ToggleGroup type="single" value={spread} onValueChange={(v) => v && setSpread(v as SpreadMode)}>
                <ToggleGroupItem value="none" aria-label="Single page">Single</ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="Double page spread">Spread</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MoveHorizontal className="h-3.5 w-3.5" /> Navigation direction</p>
              <ToggleGroup type="single" value={flow} onValueChange={(v) => v && setFlow(v as FlowMode)}>
                <ToggleGroupItem value="paginated" aria-label="Left-right pages">Left–Right</ToggleGroupItem>
                <ToggleGroupItem value="scrolled" aria-label="Top-bottom scroll">Top–Bottom</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
});

/** All SettingsPanel logic: atomic settings subscriptions + setters. */
function useSettingsPanel() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontId = useSettingsStore((s) => s.fontId);
  const pageThemeId = useSettingsStore((s) => s.pageThemeId);
  const spread = useSettingsStore((s) => s.spread);
  const flow = useSettingsStore((s) => s.flow);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setFontId = useSettingsStore((s) => s.setFontId);
  const setPageThemeId = useSettingsStore((s) => s.setPageThemeId);
  const setSpread = useSettingsStore((s) => s.setSpread);
  const setFlow = useSettingsStore((s) => s.setFlow);
  return {
    fontSize, fontId, pageThemeId, spread, flow,
    setFontSize, setFontId, setPageThemeId, setSpread, setFlow,
  };
}
