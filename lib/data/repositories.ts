/**
 * Repository interfaces — the seam where a backend plugs in later.
 *
 * Design rules:
 *  - ALL methods are async (`Promise`), even though the local
 *    implementations resolve immediately. Sync localStorage assumptions
 *    must never leak into stores/services again — a future API-backed
 *    implementation drops in without changing a single caller.
 *  - Repositories own serialization + transport only. Domain logic
 *    (dedup caps, merging, id schemes) lives in stores/services.
 *  - Failures are value-typed (`boolean` / `null`), never thrown, so
 *    quota/offline/API errors degrade to explicit states the UI
 *    already handles (e.g. memory-only books).
 */

import type { Bookmark, Highlight } from "@/types";

/** EPUB binaries (large, quota-sensitive) keyed by book id. */
export interface BookBinaryStore {
  /** Memory cache first, then persistent storage. Warms the cache on hit. */
  load(id: string): Promise<ArrayBuffer | null>;
  /** Presence check without decoding (cheap). */
  exists(id: string): Promise<boolean>;
  /** Hold bytes for this session (shared reference, no copy). */
  cache(id: string, buffer: ArrayBuffer): void;
  /** Persist cached bytes. `false` = quota/transport failure. */
  persist(id: string): Promise<boolean>;
  /** Drop memory + persistent copies. */
  remove(id: string): Promise<void>;
}

/** Small per-book JSON documents: position, bookmarks, highlights. */
export interface BookDataStore {
  listBookmarks(bookId: string): Promise<Bookmark[]>;
  saveBookmarks(bookId: string, items: Bookmark[]): Promise<void>;
  listHighlights(bookId: string): Promise<Highlight[]>;
  saveHighlights(bookId: string, items: Highlight[]): Promise<void>;
  getPosition(bookId: string): Promise<string | null>;
  setPosition(bookId: string, cfi: string): Promise<void>;
  /** Verbatim key move (used by id migration); no-op-safe. */
  moveBookData(fromId: string, toId: string): Promise<void>;
  /** Remove every per-book document for one book. */
  removeBookData(bookId: string): Promise<void>;
}
