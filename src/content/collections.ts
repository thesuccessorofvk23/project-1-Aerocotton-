/**
 * AERO COTTON — the catalogue: real products from the client's line sheets.
 *
 * Products below are the confirmed items from the client's "Kitchen & Table
 * Presentation" catalogue (10-page PDF, designs 01–09 plus tablecloth
 * colourways), with photography extracted from that document
 * (public/images/products/…). Product copy beyond the confirmed sizes and
 * design numbers is placeholder-grade, to be confirmed by Aerocotton.
 *
 * Each product sits in one of the ten landscape collections (Nature,
 * Mountain, Beach, City, Forest, Lake, Desert, Waterfall, Snow, Aurora).
 * Palettes are PLACEHOLDER design intent, to be re-extracted from confirmed
 * product photography at the photography milestone.
 */

import type { Collection, Product } from "./types";

const p = (product: Product): Product => product;

export const collections: Collection[] = [
  {
    slug: "nature",
    name: "Nature",
    landscape: "Leaf-filtered light after rain.",
    story:
      "The collection that started the language: soft botanical greens drawn from leaf-filtered light after rain. Nature is where the printed cushion programme rests — quiet, sage-toned grounds for everyday rooms.",
    intro: "Botanical greens for the everyday.",
    palette: { a: "#4d5f52", b: "#8aa08b", c: "#e9ecdf" },
    dyeClass: "dye-nature",
    image: "/images/collections/nature.svg",
    products: [
      p({
        id: "nature-cushion-design-05",
        slug: "cushion-design-05",
        name: "Cushion Design-05",
        category: "Kitchen & Table Presentation",
        productType: "Cushions",
        tagline: "40 × 40 print, Design-05.",
        description:
          "A 40 × 40 cm printed cushion from the Kitchen & Table Presentation catalogue, Design-05. Printed cotton cover with a concealed closure; the series runs from Design-05 through Design-09 for a coordinated retail wall.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Design", value: "Design-05" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Cover-only or with inserts; print recolours and coordinated sets to programme.",
        image: "/images/products/cushion-design-05.jpg",
      }),
    ],
  },
  {
    slug: "mountain",
    name: "Mountain",
    landscape: "Cold air, clean lines.",
    story:
      "Cool slate blues and greys, drawn from cold air and clean lines. Mountain carries the apron programme — working cuts in quiet, hardwearing prints.",
    intro: "Slate tones with weight and warmth.",
    palette: { a: "#5d6b7a", b: "#97a6b4", c: "#eceef0" },
    dyeClass: "dye-mountain",
    image: "/images/collections/mountain.svg",
    products: [
      p({
        id: "mountain-apron-design-02",
        slug: "apron-design-02",
        name: "Apron Design-02",
        category: "Kitchen & Table Presentation",
        productType: "Apron with Gloves",
        tagline: "Design-02 from the Kitchen & Table Presentation catalogue.",
        description:
          "Design-02 of the 70 × 90 cm apron programme: the same working cut as Design-01 with its own printed artwork. Built from our own weaving and stitching units for retail shelves and promotional programmes.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "70 × 90 cm" },
          { label: "Design", value: "Design-02" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Catalogue designs can be recoloured or printed to buyer artwork; glove pairing and branding on request.",
        image: "/images/products/apron-design-02.jpg",
      }),
    ],
  },
  {
    slug: "beach",
    name: "Beach",
    landscape: "Salt, sun, dry sand.",
    story:
      "Warm sand and salt-bleached neutrals — salt, sun, dry sand. Beach holds the sunniest print in the kitchen-towel programme: a set that carries a little daylight into the kitchen.",
    intro: "Sun-bleached neutrals, made for hard use.",
    palette: { a: "#b08d57", b: "#dcc9a5", c: "#f6f1e7" },
    dyeClass: "dye-beach",
    image: "/images/collections/beach.svg",
    products: [
      p({
        id: "beach-kitchen-towel-set-04",
        slug: "kitchen-towel-set-04",
        name: "Kitchen Towel Set Design-04",
        category: "Kitchen & Table Presentation",
        productType: "Towels",
        tagline: "S/2 print set, 50 × 70 cm, Design-04.",
        description:
          "Design-04 of the S/2 kitchen towel programme: two 50 × 70 cm towels to a set with its own printed artwork. Absorbent cotton ground, colours matched across repeat runs for programme continuity.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "50 × 70 cm each" },
          { label: "Pieces", value: "Set of 2 (S/2)" },
          { label: "Design", value: "Design-04" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Print artwork, set composition and hanging details to programme; woven-in logos available.",
        image: "/images/products/kitchen-towel-design-04.jpg",
      }),
    ],
  },
  {
    slug: "city",
    name: "City",
    landscape: "Rain on stone.",
    story:
      "Charcoal and stone neutrals — rain on stone. City is the architectural collection: restrained prints and solid tones for spaces that keep their voices down.",
    intro: "Charcoal and stone for architectural spaces.",
    palette: { a: "#4b4a48", b: "#8e8a84", c: "#efedea" },
    dyeClass: "dye-city",
    image: "/images/collections/city.svg",
    products: [
      p({
        id: "city-apron-design-01",
        slug: "apron-design-01",
        name: "Apron Design-01",
        category: "Kitchen & Table Presentation",
        productType: "Apron with Gloves",
        tagline: "Design-01 from the Kitchen & Table Presentation catalogue.",
        description:
          "A 70 × 90 cm printed cotton apron from our Kitchen & Table Presentation catalogue, Design-01. Stone-toned artwork on a mid-weight cotton ground, with a generous bib and waist ties cut for a working kitchen.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "70 × 90 cm" },
          { label: "Design", value: "Design-01" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Catalogue designs can be recoloured or printed to buyer artwork; glove pairing and branding on request.",
        image: "/images/products/apron-design-01.jpg",
      }),
    ],
  },
  {
    slug: "forest",
    name: "Forest",
    landscape: "Deep shade, layered green.",
    story:
      "Deep shade and layered green — the deepest palette in the range. Forest grounds the deeper prints of the series: cocoa-toned tablecloths for tables that keep their voices down.",
    intro: "The deepest greens in the range.",
    palette: { a: "#354a42", b: "#5d7a6d", c: "#e7ede8" },
    dyeClass: "dye-forest",
    image: "/images/collections/forest.svg",
    products: [
      p({
        id: "forest-tablecloth-cocoa",
        slug: "tablecloth-cocoa",
        name: "Tablecloth — Cocoa Print",
        category: "Kitchen & Table Presentation",
        productType: "Table Top Cover",
        tagline: "100 × 100 print in warm cocoa tones.",
        description:
          "A 100 × 100 cm printed tablecloth from the Kitchen & Table Presentation catalogue, in warm cocoa tones. Printed on our own ground cloth and finished with a neat hem; an easy companion to the cushion designs in the same series.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "100 × 100 cm" },
          { label: "Colourway", value: "Cocoa" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Square and rectangular sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tablecloth-cocoa.jpg",
      }),
    ],
  },
  {
    slug: "lake",
    name: "Lake",
    landscape: "Still water at dawn.",
    story:
      "Still blues with a calm surface — still water at dawn. Lake takes the striped kitchen towels of the catalogue: cool, even stripes for slow mornings and busy sinks alike.",
    intro: "Still blues for slow mornings.",
    palette: { a: "#43626f", b: "#7fa0ac", c: "#e9f0f2" },
    dyeClass: "dye-lake",
    image: "/images/collections/lake.svg",
    products: [
      p({
        id: "lake-kitchen-towel-set-03",
        slug: "kitchen-towel-set-03",
        name: "Kitchen Towel Set Design-03",
        category: "Kitchen & Table Presentation",
        productType: "Towels",
        tagline: "S/2 print set, 50 × 70 cm, Design-03.",
        description:
          "A two-piece kitchen towel set from the Kitchen & Table Presentation catalogue — Design-03, 50 × 70 cm each. One striped towel and one printed towel to the set, woven and printed under our own roof.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm each" },
          { label: "Pieces", value: "Set of 2 (S/2)" },
          { label: "Design", value: "Design-03" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Print artwork, set composition and hanging details to programme; woven-in logos available.",
        image: "/images/products/kitchen-towel-design-03.jpg",
      }),
    ],
  },
  {
    slug: "desert",
    name: "Desert",
    landscape: "Late afternoon heat.",
    story:
      "Baked earth and brass — late afternoon heat. Desert carries the warmest prints in the catalogue: sand-toned cushions and the clay tablecloth, drawn from craft traditions Karur knows by heart.",
    intro: "Baked earth and brass warmth.",
    palette: { a: "#a4743f", b: "#d3ae7d", c: "#f5ecdf" },
    dyeClass: "dye-desert",
    image: "/images/collections/desert.svg",
    products: [
      p({
        id: "desert-cushion-design-07",
        slug: "cushion-design-07",
        name: "Cushion Design-07",
        category: "Kitchen & Table Presentation",
        productType: "Cushions",
        tagline: "40 × 40 print, Design-07.",
        description:
          "Design-07 of the 40 × 40 cm cushion programme, in warm sand tones. Printed on our own ground cloth in Karur and finished with a clean hidden closure.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Design", value: "Design-07" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Cover-only or with inserts; print recolours and coordinated sets to programme.",
        image: "/images/products/cushion-design-07.jpg",
      }),
      p({
        id: "desert-tablecloth-clay",
        slug: "tablecloth-clay",
        name: "Tablecloth — Clay Print",
        category: "Kitchen & Table Presentation",
        productType: "Table Top Cover",
        tagline: "100 × 100 print in baked clay tones.",
        description:
          "The warmest print in the Kitchen & Table Presentation tablecloth programme: 100 × 100 cm, printed in baked clay tones on cotton ground. Sets a table with the Design-05–09 cushions from the same series.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "100 × 100 cm" },
          { label: "Colourway", value: "Clay" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Square and rectangular sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tablecloth-clay.jpg",
      }),
    ],
  },
  {
    slug: "waterfall",
    name: "Waterfall",
    landscape: "Fresh water over stone.",
    story:
      "Fresh aqua movement — fresh water over stone. Waterfall takes the lightest cushion print of the series: tones that read clean in any room.",
    intro: "The lightest tones in the range.",
    palette: { a: "#4a6b64", b: "#88b0a8", c: "#ecf3f1" },
    dyeClass: "dye-waterfall",
    image: "/images/collections/waterfall.svg",
    products: [
      p({
        id: "waterfall-cushion-design-06",
        slug: "cushion-design-06",
        name: "Cushion Design-06",
        category: "Kitchen & Table Presentation",
        productType: "Cushions",
        tagline: "40 × 40 print, Design-06.",
        description:
          "Design-06 of the 40 × 40 cm cushion programme, in a soft cream print. Part of the Kitchen & Table Presentation catalogue; covers sold singly or as coordinated sets with the series tablecloths.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Design", value: "Design-06" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Cover-only or with inserts; print recolours and coordinated sets to programme.",
        image: "/images/products/cushion-design-06.jpg",
      }),
    ],
  },
  {
    slug: "snow",
    name: "Snow",
    landscape: "First light on a white field.",
    story:
      "Pure undyed whites — first light on a white field. Snow is the quiet end of the print programme: the natural-ground tablecloth, where the cotton does the talking.",
    intro: "Undyed and bleached whites.",
    palette: { a: "#8fa3b0", b: "#c3d2da", c: "#f6f8f9" },
    dyeClass: "dye-snow",
    image: "/images/collections/snow.svg",
    products: [
      p({
        id: "snow-tablecloth-natural",
        slug: "tablecloth-natural",
        name: "Tablecloth — Natural Print",
        category: "Kitchen & Table Presentation",
        productType: "Table Top Cover",
        tagline: "100 × 100 print on a quiet natural ground.",
        description:
          "The quietest print in the Kitchen & Table Presentation tablecloth programme: 100 × 100 cm on a natural-toned cotton ground. Printed and stitched under our own roof for retail and hospitality programmes.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Hospitality"],
        specs: [
          { label: "Size", value: "100 × 100 cm" },
          { label: "Colourway", value: "Natural" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Square and rectangular sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tablecloth-natural.jpg",
      }),
    ],
  },
  {
    slug: "aurora",
    name: "Aurora",
    landscape: "Night sky over a dark field.",
    story:
      "Shifting tones on the darkest ground — night sky over a dark field. Aurora holds the signature prints of the series: the deeper cushion artwork for buyers looking for a point of view.",
    intro: "The signature end of the range.",
    palette: { a: "#5b6b63", b: "#93a4a0", c: "#eef1ee" },
    dyeClass: "dye-aurora",
    image: "/images/collections/aurora.svg",
    products: [
      p({
        id: "aurora-cushion-design-08",
        slug: "cushion-design-08",
        name: "Cushion Design-08",
        category: "Kitchen & Table Presentation",
        productType: "Cushions",
        tagline: "40 × 40 print, Design-08.",
        description:
          "Design-08 of the 40 × 40 cm cushion programme, in muted khaki tones. Shown in the Kitchen & Table Presentation catalogue alongside the cocoa tablecloth; the pair makes a ready-made gifting story.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Design", value: "Design-08" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Cover-only or with inserts; print recolours and coordinated sets to programme.",
        image: "/images/products/cushion-design-08.jpg",
      }),
      p({
        id: "aurora-cushion-design-09",
        slug: "cushion-design-09",
        name: "Cushion Design-09",
        category: "Kitchen & Table Presentation",
        productType: "Cushions",
        tagline: "40 × 40 print, Design-09.",
        description:
          "Design-09 closes the cushion run of the Kitchen & Table Presentation catalogue in deep clay tones. Pairs naturally with the clay tablecloth; both are printed in Karur on our own ground cloth.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Design", value: "Design-09" },
          { label: "Series", value: "Kitchen & Table Presentation" },
        ],
        variants: [],
        customization:
          "Cover-only or with inserts; print recolours and coordinated sets to programme.",
        image: "/images/products/cushion-design-09.jpg",
      }),
    ],
  },
];

/** Flat product list with parent-collection reference attached. */
export interface ProductWithCollection extends Product {
  collectionSlug: string;
  collectionName: string;
}

export const allProducts: ProductWithCollection[] = collections.flatMap((c) =>
  c.products.map((product) => ({
    ...product,
    collectionSlug: c.slug,
    collectionName: c.name,
  }))
);

export const featuredProducts = allProducts.filter((prod) => prod.featured);

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getProduct(
  collectionSlug: string,
  slug: string
): ProductWithCollection | undefined {
  return allProducts.find(
    (prod) => prod.collectionSlug === collectionSlug && prod.slug === slug
  );
}

export function relatedProducts(
  product: ProductWithCollection,
  count = 3
): ProductWithCollection[] {
  const sameCollection = allProducts.filter(
    (prod) =>
      prod.collectionSlug === product.collectionSlug &&
      prod.id !== product.id
  );
  const sameCategory = allProducts.filter(
    (prod) =>
      prod.category === product.category &&
      prod.collectionSlug !== product.collectionSlug
  );
  const rest = allProducts.filter(
    (prod) =>
      prod.id !== product.id &&
      prod.collectionSlug !== product.collectionSlug &&
      prod.category !== product.category
  );
  return [...sameCollection, ...sameCategory, ...rest].slice(0, count);
}
