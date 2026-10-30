import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  return [
    { url: SITE.siteUrl, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.siteUrl}/match`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.siteUrl}/method`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
  ];
}
