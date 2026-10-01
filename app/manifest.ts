import type { MetadataRoute } from "next";

/** PWA manifest — installable, brand-tinted. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kettlestitch — Private EPUB Reader",
    short_name: "Kettlestitch",
    description:
      "Free, private EPUB reader with on-device library, bookmarks, highlights and soothing themes.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f59e0b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
