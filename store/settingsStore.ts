import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settingsKey } from "@/lib/data/keys";
import type { PageThemeId, SpreadMode, FlowMode } from "@/types";

/**
 * Settings slice — persisted globally under `epub-reader:settings`.
 * Split out of `readerStore` so components can subscribe to individual
 * atoms (e.g. `s => s.fontSize`) without re-rendering on unrelated
 * reader state such as per-page-turn progress.
 */
interface SettingsState {
  fontSize: number; // px, 12..32
  fontId: string;
  pageThemeId: PageThemeId;
  spread: SpreadMode; // single vs double page
  flow: FlowMode; // paginated vs scrolled
  setFontSize: (n: number) => void;
  setFontId: (id: string) => void;
  setPageThemeId: (id: PageThemeId) => void;
  setSpread: (s: SpreadMode) => void;
  setFlow: (f: FlowMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 18,
      fontId: "georgia",
      pageThemeId: "cream",
      spread: "none",
      flow: "paginated",
      setFontSize: (n) => set({ fontSize: Math.min(32, Math.max(12, Math.round(n))) }),
      setFontId: (id) => set({ fontId: id }),
      setPageThemeId: (id) => set({ pageThemeId: id }),
      setSpread: (s) => set({ spread: s }),
      setFlow: (f) => set({ flow: f }),
    }),
    { name: settingsKey }
  )
);
