import { describe, expect, test } from "bun:test";
import type { NavItem } from "epubjs";
import {
  buildThemeRules,
  chapterTitleForHref,
  displayBookmarkLabel,
  flattenToc,
  normalizeToc,
  prettyFileName,
  repaintHighlights,
  spineItems,
  themeSnapshot,
} from "./epub";

const RAW: NavItem[] = [
  { id: "c1", href: "Text/c1.xhtml", label: "  Chapter 1: Loomings  ", subitems: [
    { id: "c1s1", href: "Text/c1.xhtml#sec1", label: "Doubts" },
  ] },
  { id: "Text/c2.xhtml", href: "Text/c2.xhtml", label: "Text/c2.xhtml" },
];

describe("normalizeToc", () => {
  test("trims labels and fills fallbacks", () => {
    const toc = normalizeToc(RAW);
    expect(toc[0].label).toBe("Chapter 1: Loomings");
    expect(toc[0].subitems?.[0].label).toBe("Doubts");
    expect(toc[1].id).toBe("Text/c2.xhtml");
    expect(toc[1].label).toBe("Text/c2.xhtml");
  });

  test("undefined input yields empty TOC", () => {
    expect(normalizeToc(undefined)).toEqual([]);
  });

  test("defensive fallbacks for malformed nodes", () => {
    const toc = normalizeToc([{ href: "Text/c9.xhtml" } as unknown as NavItem]);
    expect(toc[0].id).toBe("Text/c9.xhtml");
    expect(toc[0].label).toBe("Text/c9.xhtml");
  });
});

describe("flattenToc", () => {
  test("flattens with depth and without mutating input", () => {
    const toc = normalizeToc(RAW);
    const snapshot = JSON.stringify(toc);
    const flat = flattenToc(toc);
    expect(flat.map((f) => [f.label, f.depth])).toEqual([
      ["Chapter 1: Loomings", 0],
      ["Doubts", 1],
      ["Text/c2.xhtml", 0],
    ]);
    expect(JSON.stringify(toc)).toBe(snapshot);
  });
});

describe("chapterTitleForHref", () => {
  const toc = normalizeToc(RAW);

  test("exact and fragment-stripped matches", () => {
    expect(chapterTitleForHref(toc, "Text/c1.xhtml")).toBe("Chapter 1: Loomings");
    expect(chapterTitleForHref(toc, "Text/c1.xhtml#sec1")).toBe("Doubts");
  });

  test("tolerates missing Text/ prefix", () => {
    expect(chapterTitleForHref(toc, "c2.xhtml")).toBe("Text/c2.xhtml");
  });

  test("unknown href yields undefined", () => {
    expect(chapterTitleForHref(toc, "Text/nope.xhtml")).toBeUndefined();
    expect(chapterTitleForHref([], "Text/c1.xhtml")).toBeUndefined();
  });
});

describe("prettyFileName", () => {
  test("strips folders, extensions and separators", () => {
    expect(prettyFileName("Text/part-0003.xhtml")).toBe("part 0003");
    expect(prettyFileName(undefined)).toBeUndefined();
    expect(prettyFileName("cover.jpeg")).toBe("cover");
  });
});

describe("displayBookmarkLabel", () => {
  test("strips legacy ebook extensions, keeps real titles", () => {
    expect(displayBookmarkLabel("part0003.xhtml")).toBe("part0003");
    expect(displayBookmarkLabel("Chapter 1: Loomings")).toBe("Chapter 1: Loomings");
  });
});

describe("themeSnapshot + buildThemeRules", () => {
  test("resolves font and page theme", () => {
    const snap = themeSnapshot({ fontId: "merriweather", fontSize: 20, pageThemeId: "sepia" });
    expect(snap.fontFamily).toContain("Merriweather");
    expect(snap.fontSize).toBe(20);
    expect(snap.background).toBe("#f4ecd8");
  });

  test("falls back to first options on unknown ids", () => {
    const snap = themeSnapshot({ fontId: "nope", fontSize: 18, pageThemeId: "nope" });
    expect(snap.fontFamily).toBeTruthy();
    expect(snap.background).toBeTruthy();
  });

  test("rules force family/size with !important and spare headings from px sizing", () => {
    const rules = buildThemeRules(themeSnapshot({ fontId: "georgia", fontSize: 18, pageThemeId: "cream" }));
    expect(rules["body"]["font-family"]).toContain("!important");
    expect(rules["body"]["font-size"]).toBe("18px !important");
    expect("font-size" in rules["h1, h2, h3, h4, h5, h6"]).toBe(false);
  });
});

describe("spineItems", () => {
  test("reads runtime spine items, tolerates absence", () => {
    expect(spineItems({ spine: { items: [{ href: "a.xhtml" }] } } as never)).toEqual([{ href: "a.xhtml" }]);
    expect(spineItems({ spine: {} } as never)).toEqual([]);
  });
});

describe("repaintHighlights", () => {
  test("removes every mark before re-adding (no stale rects, no duplicates)", async () => {
    const calls: string[] = [];
    const fakeRendition = {
      annotations: {
        remove: (cfiRange: string) => {
          calls.push(`remove:${cfiRange}`);
        },
        highlight: async (cfiRange: string) => {
          calls.push(`highlight:${cfiRange}`);
        },
      },
    };
    await repaintHighlights(fakeRendition as never, [
      { cfiRange: "cfi-a", color: "yellow" },
      { cfiRange: "cfi-b", color: "green" },
    ]);
    expect(calls).toEqual([
      "remove:cfi-a",
      "remove:cfi-b",
      "highlight:cfi-a",
      "highlight:cfi-b",
    ]);
  });

  test("empty list is a no-op", async () => {
    const calls: string[] = [];
    const fakeRendition = {
      annotations: {
        remove: (cfiRange: string) => {
          calls.push(`remove:${cfiRange}`);
        },
        highlight: async (cfiRange: string) => {
          calls.push(`highlight:${cfiRange}`);
        },
      },
    };
    await repaintHighlights(fakeRendition as never, []);
    expect(calls).toEqual([]);
  });
});
