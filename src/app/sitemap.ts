import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { collections } from "@/content/collections";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly" as const, priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${SITE_URL}/sustainability`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/global-presence`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly" as const, priority: 0.9 },
  ].map((entry) => ({ ...entry, lastModified: now }));

  const collectionPages: MetadataRoute.Sitemap = collections.flatMap((c) => [
    {
      url: `${SITE_URL}/products/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...c.products.map((p) => ({
      url: `${SITE_URL}/products/${c.slug}/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]);

  return [...staticPages, ...collectionPages];
}
