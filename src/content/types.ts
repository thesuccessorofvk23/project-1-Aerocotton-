/**
 * AERO COTTON — content contracts.
 *
 * Every page consumes content through these types (never by importing files
 * directly), so the catalogue can later move to a CMS without touching UI
 * code. Products/collections are plain TypeScript for v1 — zod validation
 * becomes relevant when the source becomes external (CMS/API).
 *
 * FACTS POLICY: only statements confirmed by Aerocotton (see company.ts)
 * may appear in content. Descriptive product copy is placeholder-grade and
 * listed in the handover fact inventory for client review.
 */

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  /** Stable identifier, e.g. "nature-flatweave-throw" */
  id: string;
  /** URL segment: /products/[collection]/[slug] */
  slug: string;
  name: string;
  /** Short family, e.g. "Throws & Blankets" */
  category: string;
  /** One-line hook for cards. */
  tagline: string;
  /** 2–3 sentence B2B description. */
  description: string;
  materials: string[];
  applications: string[];
  specs: ProductSpec[];
  variants: string[];
  /** Customisation note shown on the detail page. */
  customization: string;
  /** Placeholder-grade image path (public/images/collections/…). */
  image: string;
  /** Surface on the home page + products index top. */
  featured?: boolean;
}

export interface Collection {
  slug: string;
  name: string;
  /** The landscape this collection is named after (brand story). */
  landscape: string;
  /** 2-sentence editorial story for the collection page. */
  story: string;
  /** One-line intro used on cards / index. */
  intro: string;
  /** Dye palette: deep anchor, mid tone, highlight. Drives hero + accents. */
  palette: { a: string; b: string; c: string };
  /** CSS class from tokens.css that sets --dye-a/b/c. */
  dyeClass: string;
  image: string;
  products: Product[];
}

export interface ConfirmedFact {
  value: string;
  /** Where this fact came from — audit trail. */
  source: string;
}
