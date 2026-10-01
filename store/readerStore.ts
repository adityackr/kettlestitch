import { create } from "zustand";
import type { TocItem } from "@/types";

/**
 * Reader slice — transient per-book session state.
 *
 * Deliberately NOT persisted via zustand: `fileData` is an ArrayBuffer
 * (not JSON-serializable) and per-book data (position, bookmarks,
 * highlights) lives under its own localStorage key. Global reading
 * preferences live in `store/settingsStore.ts`.
 */
interface ReaderState {
  bookId: string | null; // bookKey(title) for per-book persistence
  title: string;
  /** Raw EPUB data source: ArrayBuffer for uploads. URL handled separately. */
  fileData: ArrayBuffer | null;
  fileUrl: string | null;
  toc: TocItem[];
  currentCfi: string | null;
  currentHref: string | null;
  progress: number; // 0..1
  locationsReady: boolean;
  totalLocations: number;
  isLoading: boolean;
  error: string | null;
  setSource: (opts: { bookId: string; title: string; fileData?: ArrayBuffer | null; fileUrl?: string | null }) => void;
  setToc: (toc: TocItem[]) => void;
  setLocation: (cfi: string | null, href: string | null, progress: number) => void;
  setLocationsMeta: (ready: boolean, total: number) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  bookId: null,
  title: "",
  fileData: null,
  fileUrl: null,
  toc: [],
  currentCfi: null,
  currentHref: null,
  progress: 0,
  locationsReady: false,
  totalLocations: 0,
  isLoading: false,
  error: null,
  setSource: (opts) =>
    set({
      bookId: opts.bookId,
      title: opts.title,
      fileData: opts.fileData ?? null,
      fileUrl: opts.fileUrl ?? null,
      toc: [],
      currentCfi: null,
      currentHref: null,
      progress: 0,
      locationsReady: false,
      totalLocations: 0,
      error: null,
      isLoading: true,
    }),
  setToc: (toc) => set({ toc }),
  setLocation: (cfi, href, progress) => set({ currentCfi: cfi, currentHref: href, progress }),
  setLocationsMeta: (ready, total) => set({ locationsReady: ready, totalLocations: total }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg, isLoading: false }),
  reset: () =>
    set({
      bookId: null, title: "", fileData: null, fileUrl: null, toc: [],
      currentCfi: null, currentHref: null, progress: 0,
      locationsReady: false, totalLocations: 0, isLoading: false, error: null,
    }),
}));
