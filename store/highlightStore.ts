import { create } from "zustand";
import { bookData } from "@/lib/data";
import type { Highlight } from "@/types";

/**
 * Highlights for the active book (in-memory only).
 * Same persistence contract as bookmarks — see `bookmarkStore.ts`.
 */
interface HighlightState {
  bookId: string | null;
  items: Highlight[];
  bindBook: (bookId: string | null) => Promise<void>;
  add: (h: Highlight) => void;
}

export const useHighlightStore = create<HighlightState>()((set, get) => ({
  bookId: null,
  items: [],
  bindBook: async (bookId) => {
    set({ bookId, items: [] });
    if (!bookId) return;
    const items = await bookData.listHighlights(bookId).catch(() => []);
    // Drop stale resolves after rapid book switches.
    if (get().bookId === bookId) set({ items });
  },
  add: (h) => {
    const { bookId, items } = get();
    if (!bookId || items.some((x) => x.cfiRange === h.cfiRange)) return;
    const next = [h, ...items].slice(0, 1000);
    set({ items: next });
    void bookData.saveHighlights(bookId, next).catch(() => {});
  },
}));
