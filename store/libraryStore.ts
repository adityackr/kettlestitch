import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canonicalBookId } from "@/lib/storage";
import { bookBinaries, bookData } from "@/lib/data";
import { libraryIndexKey } from "@/lib/data/keys";
import type { LibraryBook } from "@/types";

/**
 * Library store — metadata index for every uploaded / URL-opened book.
 *
 * Layering (see ARCHITECTURE.md):
 *  - This store owns IN-MEMORY metadata only. All byte/JSON persistence
 *    goes through repositories (`bookBinaries`, `bookData`), so moving
 *    to a backend means swapping `lib/data/index.ts`, not this store.
 *  - Cross-cutting flows (import/open/restore/delete) live in
 *    `lib/services/books.ts`, not here.
 *  - Only the small metadata index is zustand-persisted; binaries live
 *    under their own keys so one large file can't corrupt the index.
 */

interface LibraryState {
  books: LibraryBook[];
  /** Register a book's metadata (upsert by id, bump lastOpenedAt). */
  upsertMeta: (b: LibraryBook) => void;
  updateProgress: (id: string, progress: number) => void;
  updateCover: (id: string, cover: string, author?: string, title?: string) => void;
  markBinaryMissing: (id: string, missing: boolean) => void;
  touchOpened: (id: string) => void;
  /** Drop a metadata entry (persistence cleanup is the caller's job). */
  removeMeta: (id: string) => void;
  /**
   * One-time migration for legacy ids (`epub-reader:<slug>`, which contain
   * a route-breaking colon) to canonical URL-safe ids. Moves the metadata
   * entry, the persisted binary, and all per-book documents so nothing is
   * lost. Returns the canonical id, or null when `oldId` is unknown.
   */
  migrateLegacyId: (oldId: string) => Promise<string | null>;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],

      upsertMeta: (b) =>
        set((s) => {
          const existing = s.books.find((x) => x.id === b.id);
          const merged: LibraryBook = existing
            ? { ...existing, ...b, lastOpenedAt: Date.now() }
            : { ...b, lastOpenedAt: Date.now() };
          return {
            books: [merged, ...s.books.filter((x) => x.id !== b.id)].slice(0, 100),
          };
        }),

      updateProgress: (id, progress) =>
        set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, progress } : b)) })),

      updateCover: (id, cover, author, title) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === id
              ? { ...b, cover, ...(author ? { author } : {}), ...(title ? { title } : {}) }
              : b
          ),
        })),

      markBinaryMissing: (id, missing) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === id
              ? { ...b, binaryMissing: missing, storage: missing ? "memory-only" : "localStorage" }
              : b
          ),
        })),

      touchOpened: (id) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, lastOpenedAt: Date.now() } : b)),
        })),

      removeMeta: (id) =>
        set((s) => ({ books: s.books.filter((b) => b.id !== id) })),

      migrateLegacyId: async (oldId) => {
        const entry = get().books.find((b) => b.id === oldId);
        if (!entry) return null;
        const newId = canonicalBookId(oldId);
        if (newId === oldId) return oldId;
        const targetExists = get().books.some((b) => b.id === newId);

        if (!targetExists) {
          // Rename the metadata entry (addedAt/progress/cover preserved;
          // lastOpenedAt bumps, which is accurate — it's being opened now).
          get().upsertMeta({ ...entry, id: newId });
        }
        // Move the binary when the target has none.
        if (!(await bookBinaries.exists(newId))) {
          const buffer = await bookBinaries.load(oldId);
          if (buffer) {
            bookBinaries.cache(newId, buffer);
            await bookBinaries.persist(newId);
          }
        }
        // Move per-book documents when the target lacks them.
        await bookData.moveBookData(oldId, newId);
        // Drop the legacy entry + any leftover legacy artifacts.
        await bookBinaries.remove(oldId);
        await bookData.removeBookData(oldId);
        get().removeMeta(oldId);
        return newId;
      },
    }),
    {
      name: libraryIndexKey,
      // Persist metadata only — binaries live under their own keys.
      partialize: (s) => ({ books: s.books }),
    }
  )
);
