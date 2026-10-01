import type { MetadataRoute } from "next";

/**
 * Crawlers are welcome on the public pages. `/reader/*` is per-user
 * local state (nothing renders without the visitor's own library),
 * so it stays out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/add", "/library"], disallow: ["/reader"] }],
  };
}
