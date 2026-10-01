import { create } from "zustand";
import { bookData } from "@/lib/data";
import type { Bookmark } from "@/types";

/**
 * Bookmarks for the active book (in-memory only).
 *
 * Persistence flows through the `BookDataStore` repository — swap the
 * implementation in `lib/data/index.ts` to move bookmarks to a backend
 * without touching this store. Writes are optimistic: memory updates
 * immediately, persistence follows in the background.
 */
interface BookmarkState {
  bookId: string | null;
  items: Bookmark[];
  bindBook: (bookId: string | null) => Promise<void>;
  add: (b: Bookmark) => void;
  remove: (cfi: string) => void;
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookId: null,
  items: [],
  bindBook: async (bookId) => {
    set({ bookId, items: [] });
    if (!bookId) return;
    const items = await bookData.listBookmarks(bookId).catch(() => []);
    // Drop stale resolves after rapid book switches.
    if (get().bookId === bookId) set({ items });
  },
  add: (b) => {
    const { bookId, items } = get();
    if (!bookId || items.some((x) => x.cfi === b.cfi)) return; // dedupe
    const next = [b, ...items].slice(0, 500);
    set({ items: next });
    void bookData.saveBookmarks(bookId, next).catch(() => {});
  },
  remove: (cfi) => {
    const { bookId, items } = get();
    if (!bookId) return;
    const next = items.filter((x) => x.cfi !== cfi);
    set({ items: next });
    void bookData.saveBookmarks(bookId, next).catch(() => {});
  },
}));
