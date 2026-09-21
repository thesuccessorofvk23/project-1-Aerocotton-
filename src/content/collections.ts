/**
 * AERO COTTON — the catalogue: ten collections, one thread.
 *
 * Each collection is named for a landscape (Nature, Mountain, Beach, City,
 * Forest, Lake, Desert, Waterfall, Snow, Aurora — confirmed from the live
 * site). Every palette here is PLACEHOLDER — extracted design intent, to be
 * re-extracted from confirmed product photography at the photography
 * milestone (README fact inventory, P3).
 *
 * Product entries are structural placeholders: real SKUs, categories, and
 * specifications must come from the client. Copy is written to be replaced
 * verbatim. Images are placeholder-grade gradient plates until photography
 * lands (public/images/collections/…).
 */

import type { Collection, Product } from "./types";

const p = (product: Product): Product => product;

export const collections: Collection[] = [
  {
    slug: "nature",
    name: "Nature",
    landscape: "Leaf-filtered light after rain.",
    story:
      "The collection that started the language: soft botanical greens drawn from leaf-filtered light after rain. Nature pieces are the quiet backbone of a linen closet — the throws and towels that get reached for daily and outlive trends.",
    intro: "Botanical greens for the everyday.",
    palette: { a: "#4d5f52", b: "#8aa08b", c: "#e9ecdf" },
    dyeClass: "dye-nature",
    image: "/images/collections/nature.svg",
    products: [
      p({
        id: "nature-flatweave-throw",
        slug: "flatweave-throw",
        name: "Flatweave Throw",
        category: "Throws & Blankets",
        tagline: "Everyday weave in quiet botanical green.",
        description:
          "A double-sided flatweave throw with a clean reverse and a hand-finished edge. Weighted for drape rather than bulk, it works as a bed accent, a reading-chair companion, or a guest-room staple.",
        materials: ["100% cotton", "Reactive-dyed"],
        applications: ["Bedroom accent", "Guest rooms", "Retail programmes"],
        specs: [
          { label: "Sizes", value: "127 × 152 cm · 152 × 228 cm" },
          { label: "Weight", value: "~350 GSM" },
          { label: "Weave", value: "Double-sided flatweave" },
          { label: "Edge", value: "Hand-knotted fringe" },
        ],
        variants: ["Sage", "Moss", "Natural"],
        customization:
          "Size, palette and fringe finish can be adapted to order; private-label woven labels available.",
        image: "/images/collections/nature-throw.svg",
        featured: true,
      }),
    ],
  },
  {
    slug: "mountain",
    name: "Mountain",
    landscape: "Cold air, clean lines.",
    story:
      "Cool slate blues and greys, drawn from cold air and clean lines. Mountain is the weighty collection — blankets and throws with enough substance to feel like shelter.",
    intro: "Slate tones with weight and warmth.",
    palette: { a: "#5d6b7a", b: "#97a6b4", c: "#eceef0" },
    dyeClass: "dye-mountain",
    image: "/images/collections/mountain.svg",
    products: [
      p({
        id: "mountain-woven-blanket",
        slug: "woven-blanket",
        name: "Woven Blanket",
        category: "Throws & Blankets",
        tagline: "Full-loom weight for cold-weather programmes.",
        description:
          "A dense, full-loom woven blanket with a subtle twill structure. Built for hospitalitylaundry cycles and retail shelves alike; the kind of blanket that gets inherited.",
        materials: ["100% cotton", "Yarn-dyed"],
        applications: ["Hospitality", "Winter retail", "Private label"],
        specs: [
          { label: "Sizes", value: "152 × 228 cm · 228 × 254 cm" },
          { label: "Weight", value: "~450 GSM" },
          { label: "Weave", value: "Full-loom twill" },
          { label: "Edge", value: "Self-bound" },
        ],
        variants: ["Slate", "Fog", "Charcoal"],
        customization:
          "Colourways and dimensions on request; hospitality packaging available.",
        image: "/images/collections/mountain-blanket.svg",
        featured: true,
      }),
    ],
  },
  {
    slug: "beach",
    name: "Beach",
    landscape: "Salt, sun, dry sand.",
    story:
      "Warm sand and salt-bleached neutrals — salt, sun, dry sand. Beach pieces are made to be used hard and washed often: the towels that go to the water and come home unbothered.",
    intro: "Sun-bleached neutrals, made for hard use.",
    palette: { a: "#b08d57", b: "#dcc9a5", c: "#f6f1e7" },
    dyeClass: "dye-beach",
    image: "/images/collections/beach.svg",
    products: [
      p({
        id: "beach-flatweave-towel",
        slug: "flatweave-towel",
        name: "Flatweave Towel",
        category: "Towels",
        tagline: "Sand-shaking flatweave in sun-bleached tones.",
        description:
          "A tightly woven flatweave towel that shakes sand clean and dries twice as fast as terry. Runs light in a suitcase and looks better creased.",
        materials: ["100% cotton", "Flatweave"],
        applications: ["Beach & pool", "Travel retail", "Promotional"],
        specs: [
          { label: "Sizes", value: "90 × 180 cm" },
          { label: "Weight", value: "~280 GSM" },
          { label: "Weave", value: "Flatweave with band" },
          { label: "Edge", value: "Knotted fringe" },
        ],
        variants: ["Sand", "Brass", "Ivory"],
        customization:
          "Band colours, woven-in logos and size adaptations for retail or promotional programmes.",
        image: "/images/collections/beach-towel.svg",
        featured: true,
      }),
    ],
  },
  {
    slug: "city",
    name: "City",
    landscape: "Rain on stone.",
    story:
      "Charcoal and stone neutrals — rain on stone. City is the architectural collection: restrained patterns and solid tones for spaces that keep their voices down.",
    intro: "Charcoal and stone for architectural spaces.",
    palette: { a: "#4b4a48", b: "#8e8a84", c: "#efedea" },
    dyeClass: "dye-city",
    image: "/images/collections/city.svg",
    products: [
      p({
        id: "city-terry-towel-set",
        slug: "terry-towel-set",
        name: "Terry Towel Set",
        category: "Towels",
        tagline: "Zero-twist plush in stone neutrals.",
        description:
          "Zero-twist terry with a dense, thirsty pile and a dobby border. The set covers bath, hand and face sizes with matched edges for a composed shelf line.",
        materials: ["100% cotton", "Zero-twist terry"],
        applications: ["Bath linens", "Hospitality", "Gifting"],
        specs: [
          { label: "Sizes", value: "Face 30×30 · Hand 50×90 · Bath 70×140 cm" },
          { label: "Weight", value: "~550 GSM" },
          { label: "Weave", value: "Zero-twist terry, dobby border" },
          { label: "Edge", value: "Dobby hem" },
        ],
        variants: ["Stone", "Charcoal", "Ivory"],
        customization:
          "GSM, size breaks and border styles to programme; embroidery and woven labels available.",
        image: "/images/collections/city-towels.svg",
        featured: true,
      }),
    ],
  },
  {
    slug: "forest",
    name: "Forest",
    landscape: "Deep shade, layered green.",
    story:
      "Deep shade and layered green — the deepest palette in the range. Forest pieces anchor a room the way a treeline anchors a valley.",
    intro: "The deepest greens in the range.",
    palette: { a: "#354a42", b: "#5d7a6d", c: "#e7ede8" },
    dyeClass: "dye-forest",
    image: "/images/collections/forest.svg",
    products: [
      p({
        id: "forest-bathrobe",
        slug: "bathrobe",
        name: "Bathrobe",
        category: "Robes",
        tagline: "Weighted waffle weave, deep forest tone.",
        description:
          "A waffle-weave robe with a shawl collar and deep patch pockets. Absorbs like terry, packs like a shirt — the robe guests mention in reviews.",
        materials: ["100% cotton", "Waffle weave"],
        applications: ["Hospitality", "Spa & wellness", "Retail"],
        specs: [
          { label: "Sizes", value: "S–XXL" },
          { label: "Weight", value: "~320 GSM" },
          { label: "Weave", value: "Waffle with terry trim" },
          { label: "Details", value: "Shawl collar, double belt loops" },
        ],
        variants: ["Forest", "Moss", "Ivory"],
        customization:
          "Sizing, collar styles and embroidery for hotel programmes.",
        image: "/images/collections/forest-robe.svg",
        featured: false,
      }),
    ],
  },
  {
    slug: "lake",
    name: "Lake",
    landscape: "Still water at dawn.",
    story:
      "Still blues with a calm surface — still water at dawn. Lake is the softest expression of the range: quilted layers and gentle tones for slow mornings.",
    intro: "Still blues for slow mornings.",
    palette: { a: "#43626f", b: "#7fa0ac", c: "#e9f0f2" },
    dyeClass: "dye-lake",
    image: "/images/collections/lake.svg",
    products: [
      p({
        id: "lake-quilted-coverlet",
        slug: "quilted-coverlet",
        name: "Quilted Coverlet",
        category: "Bedding",
        tagline: "Lightly quilted, endlessly layerable.",
        description:
          "A lightly quilted coverlet with a cotton-fill loft that layers over sheets or under a duvet. Designed to smooth a bed in one motion.",
        materials: ["100% cotton shell and fill"],
        applications: ["Bedding", "Hospitality", "Retail"],
        specs: [
          { label: "Sizes", value: "228 × 264 cm · 264 × 290 cm" },
          { label: "Weight", value: "Lightweight fill" },
          { label: "Quilting", value: "Linear channel stitch" },
          { label: "Edge", value: "Micro-flange" },
        ],
        variants: ["Lake", "Mist", "Ivory"],
        customization:
          "Quilt patterns, size sets and colourways for made-to-order programmes.",
        image: "/images/collections/lake-coverlet.svg",
        featured: false,
      }),
    ],
  },
  {
    slug: "desert",
    name: "Desert",
    landscape: "Late afternoon heat.",
    story:
      "Baked earth and brass — late afternoon heat. Desert carries the warmest palette in the range and the boldest weaves, drawn from craft traditions Karur knows by heart.",
    intro: "Baked earth and brass warmth.",
    palette: { a: "#a4743f", b: "#d3ae7d", c: "#f5ecdf" },
    dyeClass: "dye-desert",
    image: "/images/collections/desert.svg",
    products: [
      p({
        id: "desert-jacquard-runner",
        slug: "jacquard-runner",
        name: "Jacquard Runner",
        category: "Table Linen",
        tagline: "Woven pattern, no print.",
        description:
          "A jacquard-woven table runner whose pattern is the cloth itself — no print to fade, no finish to wear off. A table piece that survives its decade.",
        materials: ["100% cotton", "Jacquard woven"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Sizes", value: "33 × 178 cm · 33 × 244 cm" },
          { label: "Weight", value: "~250 GSM" },
          { label: "Weave", value: "Jacquard" },
          { label: "Edge", value: "Hemmed, mitered corners" },
        ],
        variants: ["Ochre", "Brass", "Cocoa"],
        customization:
          "Custom jacquard patterns from buyer artwork; napery sets matched on request.",
        image: "/images/collections/desert-runner.svg",
        featured: false,
      }),
    ],
  },
  {
    slug: "waterfall",
    name: "Waterfall",
    landscape: "Fresh water over stone.",
    story:
      "Fresh aqua movement — fresh water over stone. Waterfall is the energising collection: crisp dobby structures and tones that read clean in any bathroom.",
    intro: "Crisp aquas with dobby structure.",
    palette: { a: "#4a6b64", b: "#88b0a8", c: "#ecf3f1" },
    dyeClass: "dye-waterfall",
    image: "/images/collections/waterfall.svg",
    products: [
      p({
        id: "waterfall-dobby-towel",
        slug: "dobby-towel",
        name: "Dobby Towel",
        category: "Towels",
        tagline: "Geometric border, thirsty pile.",
        description:
          "A combed-cotton terry towel with a geometric dobby border. High absorbency, low lint — the workhorse of a well-run linen room.",
        materials: ["100% combed cotton", "Terry"],
        applications: ["Bath linens", "Hospitality", "Retail"],
        specs: [
          { label: "Sizes", value: "Face 30×30 · Hand 50×90 · Bath 70×140 cm" },
          { label: "Weight", value: "~500 GSM" },
          { label: "Weave", value: "Terry with dobby border" },
          { label: "Edge", value: "Double-needle hem" },
        ],
        variants: ["Waterfall", "Seafoam", "Ivory"],
        customization:
          "GSM ladder, border artwork and embroidery to programme.",
        image: "/images/collections/waterfall-towel.svg",
        featured: false,
      }),
    ],
  },
  {
    slug: "snow",
    name: "Snow",
    landscape: "First light on a white field.",
    story:
      "Pure undyed whites — first light on a white field. Snow is the collection with nothing to hide: undyed and bleached whites where the weave itself is the design.",
    intro: "Undyed and bleached whites.",
    palette: { a: "#8fa3b0", b: "#c3d2da", c: "#f6f8f9" },
    dyeClass: "dye-snow",
    image: "/images/collections/snow.svg",
    products: [
      p({
        id: "snow-percale-bedding",
        slug: "percale-bedding",
        name: "Percale Bedding Set",
        category: "Bedding",
        tagline: "Crisp weave, honest white.",
        description:
          "A crisp percale sheet set in honest white — the weave and finish do the talking. Cold-water wash, minimal shrinkage, hotel-grade longevity.",
        materials: ["100% cotton percale"],
        applications: ["Bedding", "Hospitality", "Retail"],
        specs: [
          { label: "Sizes", value: "Single–Super King" },
          { label: "Thread count", value: "300 TC" },
          { label: "Weave", value: "Percale" },
          { label: "Finish", value: "Singe, mercerise" },
        ],
        variants: ["White", "Ivory"],
        customization:
          "Size sets and thread counts to programme; hospitality label options.",
        image: "/images/collections/snow-bedding.svg",
        featured: false,
      }),
    ],
  },
  {
    slug: "aurora",
    name: "Aurora",
    landscape: "Night sky over a dark field.",
    story:
      "Shifting tones on the darkest ground — night sky over a dark field. Aurora is the experimental edge of the range: special weaves and finishes for buyers looking for a signature.",
    intro: "The experimental edge of the range.",
    palette: { a: "#5b6b63", b: "#93a4a0", c: "#eef1ee" },
    dyeClass: "dye-aurora",
    image: "/images/collections/aurora.svg",
    products: [
      p({
        id: "aurora-structure-throw",
        slug: "structure-throw",
        name: "Structure Throw",
        category: "Throws & Blankets",
        tagline: "Dimensional weave, tonal shift.",
        description:
          "A dimensional weave that reads solid across the room and textured up close, with tonal shifts along its length. The conversation piece that still behaves like a blanket.",
        materials: ["100% cotton", "Structure weave"],
        applications: ["Bedroom accent", "Retail", "Gifting"],
        specs: [
          { label: "Sizes", value: "130 × 180 cm" },
          { label: "Weight", value: "~380 GSM" },
          { label: "Weave", value: "Dimensional structure weave" },
          { label: "Edge", value: "Clean hem" },
        ],
        variants: ["Aurora", "Storm", "Moss"],
        customization:
          "Weave structures and palettes developed with buyer design teams.",
        image: "/images/collections/aurora-throw.svg",
        featured: false,
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
