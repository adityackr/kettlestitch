import type { MetadataRoute } from "next";

/** Public pages only — reader routes are per-user local state. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: "/add", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "/library", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
}
