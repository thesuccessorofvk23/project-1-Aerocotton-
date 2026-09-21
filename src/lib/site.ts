/** Navigation + site-wide constants. Single source for header, footer, nav. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://aerocotton.in";

export const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/manufacturing", label: "Manufacturing" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/global-presence", label: "Global" },
] as const;

export const CONTACT_HREF = "/contact";

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
