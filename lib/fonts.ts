/**
 * Single source of truth for the reader's webfont stylesheet.
 * Used by `app/layout.tsx` (page-level fonts) and `lib/epub.ts`
 * (injection into each EPUB iframe document — iframes cannot see
 * parent-document fonts, so the same URL must load inside them).
 */

const READER_FONT_FAMILIES = [
  "Merriweather:ital,wght@0,400;0,700;1,400",
  "Open+Sans:wght@400;600;700",
  "Noto+Sans+Bengali:wght@400;600;700",
  "Hind+Siliguri:wght@400;500;600",
  "Baloo+Da+2:wght@400;500;600",
].join("&family=");

/** Full Google Fonts CSS URL for every non-system reader font. */
export const READER_FONTS_URL =
  `https://fonts.googleapis.com/css2?family=${READER_FONT_FAMILIES}&display=swap`;
