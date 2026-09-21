import type { Metadata } from "next";
import { SITE_URL } from "./site";
import { company } from "@/content/company";

const DEFAULT_TITLE = "Aero Cotton — Premium Cotton Home Textiles from Karur, India";
const DEFAULT_DESCRIPTION =
  "Aero Cotton is a family-run manufacturer and exporter of premium cotton home textiles in Karur, Tamil Nadu — weaving ten signature collections for homes and businesses worldwide since 2010.";

interface PageMetaInput {
  title: string;
  description: string;
  path: string; // e.g. "/about" ("" for home)
  ogImage?: string;
  noIndex?: boolean;
}

/** Build consistent, canonical metadata for a page. */
export function pageMeta({
  title,
  description,
  path,
  ogImage = "/opengraph-image",
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === "" ? DEFAULT_TITLE : `${title} — Aero Cotton`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: company.name,
      locale: "en_IN",
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Organization schema — site-wide. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    alternateName: company.legalName,
    url: SITE_URL,
    slogan: company.tagline,
    foundingDate: String(company.founded),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${company.address.line1}, ${company.address.line2}`,
      addressLocality: company.address.city,
      addressRegion: company.address.region,
      addressCountry: "IN",
    },
  };
}

/** BreadcrumbList schema for nested pages. */
export function breadcrumbsJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

/**
 * Product schema. NOTE: no `offers` — this is a B2B manufacturer site,
 * not a storefront, and we never imply retail pricing.
 */
export function productJsonLd(product: {
  name: string;
  description: string;
  image: string;
  category: string;
  brand: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category,
    image: `${SITE_URL}${product.image}`,
    brand: { "@type": "Brand", name: product.brand },
  };
}
