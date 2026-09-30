/** Navigation + site-wide constants. Single source for header, footer, nav. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://aerocotton.in";

export const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Catalogue" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/global-presence", label: "Global" },
] as const;

export const CONTACT_HREF = "/contact";

/** The Request Support form — order, delivery, quality and aftercare. */
export const SUPPORT_HREF = "/support";

export const COLLECTIONS = [
  "nature",
  "mountain",
  "beach",
  "city",
  "forest",
  "lake",
  "desert",
  "waterfall",
  "snow",
  "aurora",
] as const;
