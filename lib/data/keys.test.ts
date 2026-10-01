import { describe, expect, test } from "bun:test";
import {
  bookDataKey,
  bookmarksKey,
  highlightsKey,
  libraryIndexKey,
  positionKey,
  settingsKey,
} from "./keys";

describe("storage keys", () => {
  test("per-book keys embed the id", () => {
    const id = "epub-reader-my-book-1";
    expect(bookDataKey(id)).toBe("epub-reader:book-data:epub-reader-my-book-1");
    expect(positionKey(id)).toBe("epub-reader:position:epub-reader-my-book-1");
    expect(bookmarksKey(id)).toBe("epub-reader:bookmarks:epub-reader-my-book-1");
    expect(highlightsKey(id)).toBe("epub-reader:highlights:epub-reader-my-book-1");
  });

  test("per-book scopes never collide with each other", () => {
    const id = "abc";
    const keys = new Set([bookDataKey(id), positionKey(id), bookmarksKey(id), highlightsKey(id)]);
    expect(keys.size).toBe(4);
  });

  test("index keys are stable", () => {
    expect(libraryIndexKey).toBe("epub-reader:library");
    expect(settingsKey).toBe("epub-reader:settings");
  });
});
