/**
 * localStorage-backed repository implementations.
 *
 * To add a backend later: implement `BookBinaryStore` / `BookDataStore`
 * against your API (same async signatures) and swap the construction in
 * `lib/data/index.ts`. Callers never touch `window.localStorage`
 * directly — everything funnels through these two classes.
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from "@/lib/base64";
import { load, remove, save } from "@/lib/storage";
import {
  bookDataKey,
  bookmarksKey,
  highlightsKey,
  positionKey,
} from "@/lib/data/keys";
import type { BookBinaryStore, BookDataStore } from "@/lib/data/repositories";
import type { Bookmark, Highlight } from "@/types";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export class LocalBookBinaryStore implements BookBinaryStore {
  /** Session cache (never persisted; survives only in memory). */
  private readonly cacheMap = new Map<string, ArrayBuffer>();

  async load(id: string): Promise<ArrayBuffer | null> {
    const cached = this.cacheMap.get(id);
    if (cached) return cached;
    try {
      const b64 = readRaw(bookDataKey(id));
      if (!b64) return null;
      const buffer = base64ToArrayBuffer(b64);
      this.cacheMap.set(id, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  async exists(id: string): Promise<boolean> {
    if (this.cacheMap.has(id)) return true;
    return readRaw(bookDataKey(id)) != null;
  }

  cache(id: string, buffer: ArrayBuffer): void {
    this.cacheMap.set(id, buffer);
  }

  async persist(id: string): Promise<boolean> {
    const buffer = this.cacheMap.get(id);
    if (!buffer) return false;
    try {
      window.localStorage.setItem(bookDataKey(id), arrayBufferToBase64(buffer));
      return true;
    } catch {
      // Quota / privacy-mode failure — caller degrades to memory-only.
      try {
        window.localStorage.removeItem(bookDataKey(id));
      } catch { /* noop */ }
      return false;
    }
  }

  async remove(id: string): Promise<void> {
    this.cacheMap.delete(id);
    remove(bookDataKey(id));
  }
}

export class LocalBookDataStore implements BookDataStore {
  async listBookmarks(bookId: string): Promise<Bookmark[]> {
    return load<Bookmark[]>(bookmarksKey(bookId), []);
  }

  async saveBookmarks(bookId: string, items: Bookmark[]): Promise<void> {
    save(bookmarksKey(bookId), items);
  }

  async listHighlights(bookId: string): Promise<Highlight[]> {
    return load<Highlight[]>(highlightsKey(bookId), []);
  }

  async saveHighlights(bookId: string, items: Highlight[]): Promise<void> {
    save(highlightsKey(bookId), items);
  }

  async getPosition(bookId: string): Promise<string | null> {
    return load<string | null>(positionKey(bookId), null);
  }

  async setPosition(bookId: string, cfi: string): Promise<void> {
    save(positionKey(bookId), cfi);
  }

  async moveBookData(fromId: string, toId: string): Promise<void> {
    moveRawKey(positionKey(fromId), positionKey(toId));
    moveRawKey(bookmarksKey(fromId), bookmarksKey(toId));
    moveRawKey(highlightsKey(fromId), highlightsKey(toId));
  }

  async removeBookData(bookId: string): Promise<void> {
    remove(positionKey(bookId));
    remove(bookmarksKey(bookId));
    remove(highlightsKey(bookId));
  }
}

/** Move a raw value verbatim when the target has none; always drop the source. */
function moveRawKey(from: string, to: string): void {
  try {
    const value = window.localStorage.getItem(from);
    if (value != null && window.localStorage.getItem(to) == null) {
      window.localStorage.setItem(to, value);
    }
    window.localStorage.removeItem(from);
  } catch { /* quota/privacy — best effort */ }
}
