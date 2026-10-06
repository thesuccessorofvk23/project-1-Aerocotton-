/**
 * AERO COTTON — client catalogue decks, imported as products.
 *
 * The deck designs are no longer part of the live catalogue — they were
 * removed at the client's request, so every deck below carries an empty
 * `entries` list. The expansion pipeline is kept intact so the decks can be
 * re-imported unchanged if that decision is reversed.
 *
 * Five decks arrived as PowerPoint exports (`.pptx` + PDF); every product image
 * was pulled out of the original files by `scripts/pdf-images.mjs` and
 * `scripts/pptx-catalog.mjs`, optimised into `public/images/products/<deck>/`
 * by `scripts/build-catalogue-images.mjs`, and catalogued here.
 *
 *   Deck                                    Designs   Product types
 *   AUTUMN CUSHION 2026                          18    Cushions
 *   Blankets                                     24    Blankets
 *   PLACE MATS & RUNNERS                          35    Runners, place mats
 *   CUSHIONS -1 & CHAIR PADS                      45    Cushions, chair pads
 *   TEXTILES - PRODUCT PPT (SKU'd items)           33    Cushions, towels, …
 *
 * The client's own SKU codes are used verbatim where the deck labels them
 * (SC-2001 … SC-4001). Everywhere else the design number follows the sheet
 * order of the deck — the decks carry no printed design numbers.
 *
 * PLACEHOLDER-GRADE COPY: sizes, weights, weaves and colourway names are
 * editorial, drawn from the swatch itself, and are listed in the handover fact
 * inventory (`README.md`) for the client to confirm or replace. Nothing here is
 * a claim about a certification, capacity or market.
 *
 * Designs deliberately NOT imported:
 *   — marketing collage sheets that show several products in one frame
 *     (textiles 01–05, 07–11, 21, 28, 29; place-mats sheet p036)
 *   — one novelty slogan cushion carrying a third-party trademark
 *   — a Japanese promotional slide with overlaid marketing text (14_02)
 *   — a framed root-vegetable artwork render (12_02)
 */

import type { Product, ProductSpec } from "./types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DeckEntry {
  /** Design number within the deck, or the client's SKU code. */
  design: string;
  /** URL segment. */
  slug: string;
  /** Pattern / colourway label — shown as the product tagline. */
  label: string;
  /** Product type from the client's line sheet. */
  type: string;
  /** File inside `.pdf-work/norm/<dir>/`. */
  src: string;
  /** Surface on the home page and at the top of the products index. */
  featured?: boolean;
}

interface Deck {
  /** Folder under `.pdf-work/norm/` and `public/images/products/`. */
  dir: string;
  /** Client series name — the "Series" facet on the products index. */
  series: string;
  /** Source document, kept on every product page for traceability. */
  source: string;
  /** Landscape collections this deck is spread across, in order. */
  collections: string[];
  entries: DeckEntry[];
}

/* ------------------------------------------------------------------ */
/* Copy generated per product type                                     */
/* ------------------------------------------------------------------ */

interface TypeCopy {
  lead: string;
  close: string;
  weave: string;
  applications: string[];
  materials: string[];
  customization: string;
}

const TYPE_COPY: Record<string, TypeCopy> = {
  Cushions: {
    lead: "A printed cotton cushion cover with a concealed closure and a soft, mid-weight hand.",
    close: "Cover-only or with inserts, in coordinated sets for retail, hospitality and gifting.",
    weave: "Percale",
    applications: ["Living rooms", "Retail", "Gifting"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Cover-only or with inserts; print recolours and coordinated sets to programme.",
  },
  "Chair Pads": {
    lead: "A tufted seat pad with tie-on tapes, cut and stitched to sit square on a dining chair.",
    close: "Sold singly or as colour-coordinated sets for retail and contract tables.",
    weave: "Quilted",
    applications: ["Dining chairs", "Hospitality", "Retail"],
    materials: ["100% cotton", "Quilted wadding"],
    customization:
      "Tie-on or elasticated backs, pad thickness, and cover fabric to programme.",
  },
  Blankets: {
    lead: "A fringed cotton throw, woven on our own looms and finished by hand.",
    close: "Colour-matched across repeat runs so a programme reads as one family on the shelf.",
    weave: "Flatweave",
    applications: ["Living rooms", "Bedrooms", "Gifting"],
    materials: ["100% cotton", "Woven"],
    customization:
      "Sett, scale, fringe and colourway to buyer artwork; woven-in logos available.",
  },
  "Printed Table Runners": {
    lead: "A table runner printed on our own cotton ground and finished with a neat hem.",
    close: "Cut for hospitality and retail tables; napery sets matched on request.",
    weave: "Dobby",
    applications: ["Table linen", "Hospitality", "Retail"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Prints and hem finishes to programme; coordinating napery on request.",
  },
  "Place Mats": {
    lead: "A table mat printed on our own cotton ground with a clean, hard-wearing finish.",
    close: "Sold singly or as coordinated sets with the runners from the same programme.",
    weave: "Dobby",
    applications: ["Table linen", "Retail", "Gifting"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Corner shapes, prints and hem finishes to programme; sets matched on request.",
  },
  Towels: {
    lead: "A cotton kitchen towel with a dense, absorbent ground built for daily use.",
    close: "Woven and printed under our own roof in Karur, colour-matched across repeats.",
    weave: "Waffle",
    applications: ["Kitchen linens", "Retail", "Promotional"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Buyer artwork, hanging loops, woven-in logos and set composition to programme.",
  },
  Napkins: {
    lead: "A cotton napkin, dyed and finished for restaurant and retail table settings.",
    close: "Sold by the set, in stock and buyer colourways, with matching napery on request.",
    weave: "Percale",
    applications: ["Table linen", "Hospitality", "Retail"],
    materials: ["100% cotton", "Piece dyed"],
    customization: "Dyed colourways, hem styles and monogram weaves to programme.",
  },
  "Cloth Materials": {
    lead: "A woven cotton cloth presented as a material sample rather than a finished article.",
    close: "Used for development, sampling and private-label programmes before bulk.",
    weave: "Structure weave",
    applications: ["Product development", "Sampling", "Private label"],
    materials: ["100% cotton", "Woven"],
    customization:
      "Construction, count and finish specified to the buyer's end product.",
  },
  "Hang Tags": {
    lead: "A kraft paper hang tag, part of the private-label finishing we run alongside the textiles.",
    close: "Printed and strung to buyer artwork for retail programmes.",
    weave: "Woven",
    applications: ["Private label", "Packaging", "Retail"],
    materials: ["Kraft board", "Cotton string"],
    customization: "Artwork, board weight and string to programme.",
  },
  Pillows: {
    lead: "A filled pillow with a soft cotton shell, built for bed and sofa programmes.",
    close: "Made to firmness specifications for retail and contract.",
    weave: "Percale",
    applications: ["Bedrooms", "Hospitality", "Retail"],
    materials: ["100% cotton", "Filled"],
    customization: "Shell fabric, fill weight and packaging to programme.",
  },
};

/* ------------------------------------------------------------------ */
/* Colourway detection — turns a swatch label into facet values         */
/* ------------------------------------------------------------------ */

/** Colour word in a label (lower-case) → faceted colourway name. */
const COLOUR_WORDS: Record<string, string> = {
  white: "White",
  ivory: "Ivory",
  cream: "Ivory",
  natural: "Natural",
  oatmeal: "Natural",
  linen: "Natural",
  beige: "Natural",
  sand: "Sand",
  blush: "Sand",
  tan: "Sand",
  sage: "Sage",
  green: "Forest",
  emerald: "Forest",
  moss: "Moss",
  olive: "Moss",
  teal: "Seafoam",
  mint: "Seafoam",
  aqua: "Seafoam",
  lagoon: "Seafoam",
  seafoam: "Seafoam",
  turquoise: "Seafoam",
  navy: "Navy",
  cobalt: "Cobalt",
  blue: "Lake",
  sky: "Lake",
  indigo: "Navy",
  denim: "Navy",
  grey: "Stone",
  gray: "Stone",
  charcoal: "Charcoal",
  black: "Charcoal",
  dove: "Stone",
  stone: "Stone",
  mustard: "Ochre",
  ochre: "Ochre",
  amber: "Ochre",
  yellow: "Ochre",
  gold: "Brass",
  brass: "Brass",
  rust: "Rust",
  terracotta: "Rust",
  scarlet: "Scarlet",
  red: "Scarlet",
  cranberry: "Cranberry",
  maroon: "Cranberry",
  coral: "Rust",
  pink: "Blush",
  magenta: "Blush",
  rose: "Blush",
  tangerine: "Tangerine",
  cocoa: "Cocoa",
  brown: "Cocoa",
  multicolour: "Multicolour",
  rainbow: "Multicolour",
};

function colourwaysFor(label: string): string[] {
  const words = label.toLowerCase().split(/[^a-z]+/);
  const out: string[] = [];
  for (const w of words) {
    const name = COLOUR_WORDS[w];
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The decks                                                           */
/* ------------------------------------------------------------------ */

const decks: Deck[] = [
  {
    dir: "autumn-cushion-2026",
    series: "Autumn Cushions 2026",
    source: "AUTUMN CUSHION 2026",
    collections: ["desert", "beach", "forest"],
    entries: [],
  },
  {
    dir: "blankets",
    series: "Blankets",
    source: "Blankets",
    collections: ["snow", "mountain", "lake", "city", "aurora"],
    entries: [],
  },
  {
    dir: "place-mats-runners",
    series: "Place Mats & Runners",
    source: "PLACE MATS & RUNNERS",
    collections: ["lake", "beach", "desert", "snow", "aurora"],
    entries: [],
  },
  {
    dir: "cushions-chair-pads",
    series: "Cushions & Chair Pads",
    source: "CUSHIONS -1 & CHAIR PADS",
    collections: ["nature", "forest", "waterfall", "desert", "aurora"],
    entries: [],
  },
  {
    dir: "textiles-product",
    series: "Textiles Programme",
    source: "TEXTILES - PRODUCT PPT",
    collections: ["city", "waterfall", "lake", "mountain", "aurora"],
    entries: [],
  },
];

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

function specsFor(entry: DeckEntry, deck: Deck, copy: TypeCopy, code: string): ProductSpec[] {
  return [
    { label: "Design", value: code },
    { label: "Series", value: deck.series },
    { label: "Deck", value: deck.source },
    { label: "Weave", value: copy.weave },
  ];
}

function buildDeck(deck: Deck): CatalogueProduct[] {
  /** Design numbers are per product type, so "Chair Pad 01" follows cushions 01–31. */
  const perType = new Map<string, number>();
  return deck.entries.map((entry, i) => {
    const copy = TYPE_COPY[entry.type] ?? TYPE_COPY.Cushions;
    const collection = deck.collections[i % deck.collections.length];
    const nth = (perType.get(entry.type) ?? 0) + 1;
    perType.set(entry.type, nth);
    // The client's own SKU codes are kept verbatim; everything else is numbered
    // in sheet order within its product type.
    const code = /^[A-Z]{2}-\d/.test(entry.design)
      ? entry.design
      : String(nth).padStart(2, "0");
    return {
      id: `${deck.dir}-${entry.slug}`,
      slug: entry.slug,
      name: `${entry.type.replace(/s$/, "")} ${code}`,
      category: deck.series,
      productType: entry.type,
      tagline: entry.label,
      description: `${copy.lead} The swatch shown here is “${entry.label}” — design ${code} of the ${deck.series} deck. ${copy.close}`,
      materials: copy.materials,
      applications: copy.applications,
      specs: specsFor(entry, deck, copy, code),
      variants: colourwaysFor(entry.label),
      customization: copy.customization,
      image: `/images/products/${deck.dir}/${entry.slug}.jpg`,
      featured: entry.featured,
      collectionSlug: collection,
      source: entry.src,
    };
  });
}

export interface CatalogueProduct extends Product {
  /** Landscape collection this product is filed under. */
  collectionSlug: string;
  /** File inside `.pdf-work/norm/<dir>/` — asset-pipeline source, not shipped. */
  source: string;
}

export const catalogueProducts: CatalogueProduct[] = decks.flatMap(buildDeck);

/** Products grouped by the landscape collection they belong to. */
export const catalogueByCollection: Record<string, Product[]> = (() => {
  const map: Record<string, Product[]> = {};
  for (const product of catalogueProducts) {
    const { collectionSlug, source, ...clean } = product;
    void source;
    (map[collectionSlug] ??= []).push(clean);
  }
  return map;
})();

/** Deck metadata for the catalogue documentation and build tooling. */
export const catalogueDecks = decks.map((d) => ({
  dir: d.dir,
  series: d.series,
  source: d.source,
  designs: d.entries.length,
}));
