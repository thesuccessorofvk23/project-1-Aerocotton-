/**
 * AERO COTTON — client catalogue decks, imported as products.
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
  size: string;
  weave: string;
  applications: string[];
  materials: string[];
  customization: string;
}

const TYPE_COPY: Record<string, TypeCopy> = {
  Cushions: {
    lead: "A printed cotton cushion cover with a concealed closure and a soft, mid-weight hand.",
    close: "Cover-only or with inserts, in coordinated sets for retail, hospitality and gifting.",
    size: "40 × 40 cm",
    weave: "Percale",
    applications: ["Living rooms", "Retail", "Gifting"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Cover-only or with inserts; print recolours, sizes and coordinated sets to programme.",
  },
  "Chair Pads": {
    lead: "A tufted seat pad with tie-on tapes, cut and stitched to sit square on a dining chair.",
    close: "Sold singly or as colour-coordinated sets for retail and contract tables.",
    size: "40 × 40 cm, tie-on",
    weave: "Quilted",
    applications: ["Dining chairs", "Hospitality", "Retail"],
    materials: ["100% cotton", "Quilted wadding"],
    customization:
      "Tie-on or elasticated backs, pad thickness, and cover fabric to programme.",
  },
  Blankets: {
    lead: "A fringed cotton throw, woven on our own looms and finished by hand.",
    close: "Colour-matched across repeat runs so a programme reads as one family on the shelf.",
    size: "130 × 170 cm",
    weave: "Flatweave",
    applications: ["Living rooms", "Bedrooms", "Gifting"],
    materials: ["100% cotton", "Woven"],
    customization:
      "Sett, scale, fringe and colourway to buyer artwork; woven-in logos available.",
  },
  "Printed Table Runners": {
    lead: "A table runner printed on our own cotton ground and finished with a neat hem.",
    close: "Cut for hospitality and retail tables; napery sets matched on request.",
    size: "33 × 180 cm",
    weave: "Dobby",
    applications: ["Table linen", "Hospitality", "Retail"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Lengths, widths, prints and hem finishes to programme; coordinating napery on request.",
  },
  "Place Mats": {
    lead: "A table mat printed on our own cotton ground with a clean, hard-wearing finish.",
    close: "Sold singly or as coordinated sets with the runners from the same programme.",
    size: "33 × 45 cm",
    weave: "Dobby",
    applications: ["Table linen", "Retail", "Gifting"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Sizes, corner shapes, prints and hem finishes to programme; sets matched on request.",
  },
  Towels: {
    lead: "A cotton kitchen towel with a dense, absorbent ground built for daily use.",
    close: "Woven and printed under our own roof in Karur, colour-matched across repeats.",
    size: "50 × 70 cm",
    weave: "Waffle",
    applications: ["Kitchen linens", "Retail", "Promotional"],
    materials: ["100% cotton", "Pigment print"],
    customization:
      "Buyer artwork, hanging loops, woven-in logos and set composition to programme.",
  },
  Napkins: {
    lead: "A cotton napkin, dyed and finished for restaurant and retail table settings.",
    close: "Sold by the set, in stock and buyer colourways, with matching napery on request.",
    size: "45 × 45 cm",
    weave: "Percale",
    applications: ["Table linen", "Hospitality", "Retail"],
    materials: ["100% cotton", "Piece dyed"],
    customization: "Dyed colourways, sizes, hem styles and monogram weaves to programme.",
  },
  "Cloth Materials": {
    lead: "A woven cotton cloth presented as a material sample rather than a finished article.",
    close: "Used for development, sampling and private-label programmes before bulk.",
    size: "Sample yardage",
    weave: "Structure weave",
    applications: ["Product development", "Sampling", "Private label"],
    materials: ["100% cotton", "Woven"],
    customization:
      "Construction, count, width and finish specified to the buyer's end product.",
  },
  "Hang Tags": {
    lead: "A kraft paper hang tag, part of the private-label finishing we run alongside the textiles.",
    close: "Printed and strung to buyer artwork for retail programmes.",
    size: "Standard hang tag",
    weave: "Woven",
    applications: ["Private label", "Packaging", "Retail"],
    materials: ["Kraft board", "Cotton string"],
    customization: "Artwork, size, board weight and string to programme.",
  },
  Pillows: {
    lead: "A filled pillow with a soft cotton shell, built for bed and sofa programmes.",
    close: "Made to size and firmness specifications for retail and contract.",
    size: "45 × 45 cm",
    weave: "Percale",
    applications: ["Bedrooms", "Hospitality", "Retail"],
    materials: ["100% cotton", "Filled"],
    customization: "Shell fabric, fill weight, size and packaging to programme.",
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
    entries: [
      { design: "01", slug: "autumn-cushion-01", label: "Maple leaf with Hello Autumn script", type: "Cushions", src: "01_01_image1.png", featured: true },
      { design: "02", slug: "autumn-cushion-02", label: "Autumn leaf bouquet on white", type: "Cushions", src: "02_01_image2.png" },
      { design: "03", slug: "autumn-cushion-03", label: "Leaf sprig trail on cream", type: "Cushions", src: "03_01_image3.png" },
      { design: "04", slug: "autumn-cushion-04", label: "Berry and leaf bloom on white", type: "Cushions", src: "04_01_image4.png" },
      { design: "05", slug: "autumn-cushion-05", label: "Leaves and stripes, two-cushion set", type: "Cushions", src: "05_01_image5.png", featured: true },
      { design: "06", slug: "autumn-cushion-06", label: "Fine autumn leaf print on cream", type: "Cushions", src: "06_01_image6.png" },
      { design: "07", slug: "autumn-cushion-07", label: "Green leaf sprigs on white", type: "Cushions", src: "07_01_image7.png" },
      { design: "08", slug: "autumn-cushion-08", label: "Botanical leaves with berries", type: "Cushions", src: "08_01_image8.png" },
      { design: "09", slug: "autumn-cushion-09", label: "Acorn and pumpkin spot on white", type: "Cushions", src: "09_01_image9.png" },
      { design: "10", slug: "autumn-cushion-10", label: "Golden leaf spray on cream", type: "Cushions", src: "10_01_image10.png" },
      { design: "11", slug: "autumn-cushion-11", label: "Outline leaf study on cream", type: "Cushions", src: "11_01_image11.png" },
      { design: "12", slug: "autumn-cushion-12", label: "Hello Fall stripes with corner tassels", type: "Cushions", src: "12_01_image12.png", featured: true },
      { design: "13", slug: "autumn-cushion-13", label: "Maple leaf scatter in pink and rust", type: "Cushions", src: "13_01_image13.png" },
      { design: "14", slug: "autumn-cushion-14", label: "Gold and ivory geometric trellis", type: "Cushions", src: "14_01_image14.png" },
      { design: "15", slug: "autumn-cushion-15", label: "Rust leaf print with tassels", type: "Cushions", src: "15_01_image15.png" },
      { design: "16", slug: "autumn-cushion-16", label: "Tonal leaf print on beige", type: "Cushions", src: "16_01_image16.png" },
      { design: "17", slug: "autumn-cushion-17", label: "Maple leaves in ochre and amber", type: "Cushions", src: "17_01_image17.png" },
      { design: "18", slug: "autumn-cushion-18", label: "Autumn leaf collage on cream", type: "Cushions", src: "18_01_image18.png" },
    ],
  },
  {
    dir: "blankets",
    series: "Blankets",
    source: "Blankets",
    collections: ["snow", "mountain", "lake", "city", "aurora"],
    entries: [
      { design: "01", slug: "blanket-01", label: "Blue windowpane plaid, fringed", type: "Blankets", src: "01_01_image1.jpeg", featured: true },
      { design: "02", slug: "blanket-02", label: "Cream and grey windowpane plaid", type: "Blankets", src: "01_02_image2.jpeg" },
      { design: "03", slug: "blanket-03", label: "Fine blue and white tartan", type: "Blankets", src: "02_01_image3.jpeg" },
      { design: "04", slug: "blanket-04", label: "Blue and cream large-sett plaid", type: "Blankets", src: "02_02_image4.jpeg" },
      { design: "05", slug: "blanket-05", label: "Black and white gingham", type: "Blankets", src: "03_01_image5.jpeg" },
      { design: "06", slug: "blanket-06", label: "White ground with green windowpane grid", type: "Blankets", src: "03_02_image6.jpeg" },
      { design: "07", slug: "blanket-07", label: "Grey and white gingham", type: "Blankets", src: "04_01_image7.jpeg" },
      { design: "08", slug: "blanket-08", label: "Grey and white vertical stripes", type: "Blankets", src: "04_02_image8.jpeg" },
      { design: "09", slug: "blanket-09", label: "Navy and cream tartan", type: "Blankets", src: "05_01_image9.jpeg" },
      { design: "10", slug: "blanket-10", label: "Cream ground with blue plaid", type: "Blankets", src: "05_02_image10.jpeg" },
      { design: "11", slug: "blanket-11", label: "Mustard and cocoa plaid", type: "Blankets", src: "06_01_image11.jpeg", featured: true },
      { design: "12", slug: "blanket-12", label: "White and black large-sett plaid", type: "Blankets", src: "06_02_image12.jpeg" },
      { design: "13", slug: "blanket-13", label: "Pink and cream plaid with folded set", type: "Blankets", src: "07_01_image13.jpeg" },
      { design: "14", slug: "blanket-14", label: "Mint and white plaid with folded set", type: "Blankets", src: "07_02_image14.jpeg" },
      { design: "15", slug: "blanket-15", label: "Pink and magenta plaid", type: "Blankets", src: "08_01_image15.jpeg" },
      { design: "16", slug: "blanket-16", label: "Blush plain weave with tonal texture", type: "Blankets", src: "08_02_image16.jpeg" },
      { design: "17", slug: "blanket-17", label: "Ivory plain weave with tonal texture", type: "Blankets", src: "09_01_image17.jpeg" },
      { design: "18", slug: "blanket-18", label: "Grey and white fine horizontal stripes", type: "Blankets", src: "09_02_image18.jpeg" },
      { design: "19", slug: "blanket-19", label: "Bright yellow plain weave", type: "Blankets", src: "10_01_image19.jpeg" },
      { design: "20", slug: "blanket-20", label: "Ivory ground with folded navy and yellow throws", type: "Blankets", src: "10_02_image20.jpeg" },
      { design: "21", slug: "blanket-21", label: "Black and ivory large-sett plaid", type: "Blankets", src: "11_01_image21.jpeg" },
      { design: "22", slug: "blanket-22", label: "Blue, cream and tan plaid", type: "Blankets", src: "11_02_image22.jpeg" },
      { design: "23", slug: "blanket-23", label: "Navy and ivory large-sett plaid", type: "Blankets", src: "12_01_image23.jpeg" },
      { design: "24", slug: "blanket-24", label: "Blue, olive and cream large-sett plaid", type: "Blankets", src: "12_02_image24.jpeg" },
    ],
  },
  {
    dir: "place-mats-runners",
    series: "Place Mats & Runners",
    source: "PLACE MATS & RUNNERS",
    collections: ["lake", "beach", "desert", "snow", "aurora"],
    entries: [
      { design: "01", slug: "runner-01", label: "Black and white buffalo check, fringed", type: "Printed Table Runners", src: "p001.jpg", featured: true },
      { design: "02", slug: "runner-02", label: "Scarlet and white buffalo check, fringed", type: "Printed Table Runners", src: "p002.jpg" },
      { design: "03", slug: "runner-03", label: "Oatmeal ground with navy and scarlet bands", type: "Printed Table Runners", src: "p003.jpg" },
      { design: "04", slug: "runner-04", label: "Mustard and cocoa plaid pair", type: "Printed Table Runners", src: "p004.jpg" },
      { design: "05", slug: "runner-05", label: "Scarlet herringbone with fringe", type: "Printed Table Runners", src: "p005.jpg" },
      { design: "06", slug: "runner-06", label: "Scarlet plain weave", type: "Printed Table Runners", src: "p006.jpg" },
      { design: "07", slug: "runner-07", label: "Stone grey textured weave", type: "Printed Table Runners", src: "p007.jpg" },
      { design: "08", slug: "runner-08", label: "Indigo feather print", type: "Printed Table Runners", src: "p008.jpg" },
      { design: "09", slug: "runner-09", label: "French script print on natural", type: "Printed Table Runners", src: "p009.jpg" },
      { design: "10", slug: "runner-10", label: "Indigo floral print", type: "Printed Table Runners", src: "p010.jpg" },
      { design: "11", slug: "runner-11", label: "Dove grey leaf print with pinecone", type: "Printed Table Runners", src: "p011.jpg" },
      { design: "12", slug: "runner-12", label: "Winter white and scarlet botanical", type: "Printed Table Runners", src: "p012.jpg" },
      { design: "13", slug: "runner-13", label: "Natural and charcoal botanical", type: "Printed Table Runners", src: "p013.jpg" },
      { design: "14", slug: "runner-14", label: "Scarlet folk jacquard with reindeer", type: "Printed Table Runners", src: "p014.jpg", featured: true },
      { design: "15", slug: "runner-15", label: "Natural linen weave", type: "Printed Table Runners", src: "p015.jpg" },
      { design: "16", slug: "runner-16", label: "Scarlet plain weave, dressed table", type: "Printed Table Runners", src: "p016.jpg" },
      { design: "17", slug: "runner-17", label: "Scarlet with white napery", type: "Printed Table Runners", src: "p017.jpg" },
      { design: "18", slug: "runner-18", label: "Pine tree print on natural", type: "Printed Table Runners", src: "p018.jpg" },
      { design: "19", slug: "place-mat-01", label: "Scarlet reindeer print with plate", type: "Place Mats", src: "p019.jpg", featured: true },
      { design: "20", slug: "place-mat-02", label: "Indigo ikat print", type: "Place Mats", src: "p020.jpg" },
      { design: "21", slug: "place-mat-03", label: "Black check and French script pair", type: "Place Mats", src: "p021.jpg" },
      { design: "22", slug: "place-mat-04", label: "Cranberry snowflake print", type: "Place Mats", src: "p022.jpg" },
      { design: "23", slug: "place-mat-05", label: "Cranberry and white check", type: "Place Mats", src: "p023.jpg" },
      { design: "24", slug: "place-mat-06", label: "Sunset and lagoon stripe pair", type: "Place Mats", src: "p024.jpg" },
      { design: "25", slug: "place-mat-07", label: "Charcoal check print", type: "Place Mats", src: "p025.jpg" },
      { design: "26", slug: "place-mat-08", label: "Scarlet gingham", type: "Place Mats", src: "p026.jpg" },
      { design: "27", slug: "place-mat-09", label: "Scarlet gingham with floral styling", type: "Place Mats", src: "p027.jpg" },
      { design: "28", slug: "place-mat-10", label: "Navy leaf print with cup", type: "Place Mats", src: "p028.jpg" },
      { design: "29", slug: "place-mat-11", label: "Seafoam stripe pair", type: "Place Mats", src: "p029.jpg" },
      { design: "30", slug: "place-mat-12", label: "Scarlet damask print", type: "Place Mats", src: "p030.jpg" },
      { design: "31", slug: "place-mat-13", label: "Scarlet folk band print", type: "Place Mats", src: "p031.jpg" },
      { design: "32", slug: "place-mat-14", label: "Scarlet forest print", type: "Place Mats", src: "p032.jpg" },
      { design: "33", slug: "place-mat-15", label: "Cranberry pine print", type: "Place Mats", src: "p033.jpg" },
      { design: "34", slug: "place-mat-16", label: "Sage and charcoal pine print", type: "Place Mats", src: "p034.jpg" },
      { design: "35", slug: "place-mat-17", label: "Scarlet gingham on the table", type: "Place Mats", src: "p035.jpg" },
    ],
  },
  {
    dir: "cushions-chair-pads",
    series: "Cushions & Chair Pads",
    source: "CUSHIONS -1 & CHAIR PADS",
    collections: ["nature", "forest", "waterfall", "desert", "aurora"],
    entries: [
      { design: "01", slug: "cushion-01", label: "Scarlet tartan check", type: "Cushions", src: "p001.jpg", featured: true },
      { design: "02", slug: "cushion-02", label: "Cobalt buffalo check", type: "Cushions", src: "p002.jpg", featured: true },
      { design: "03", slug: "cushion-03", label: "Charcoal and ivory buffalo check", type: "Cushions", src: "p003.jpg" },
      { design: "04", slug: "cushion-04", label: "Cranberry buffalo check", type: "Cushions", src: "p004.jpg" },
      { design: "05", slug: "cushion-05", label: "Emerald stripe", type: "Cushions", src: "p005.jpg" },
      { design: "06", slug: "cushion-06", label: "Navy stripe", type: "Cushions", src: "p006.jpg" },
      { design: "07", slug: "cushion-07", label: "Multicolour pinstripe", type: "Cushions", src: "p007.jpg" },
      { design: "08", slug: "cushion-08", label: "Sky blue stripe", type: "Cushions", src: "p008.jpg" },
      { design: "09", slug: "cushion-09", label: "Chevron weave", type: "Cushions", src: "p009.jpg" },
      { design: "10", slug: "cushion-10", label: "Grey honeycomb", type: "Cushions", src: "p010.jpg" },
      { design: "11", slug: "cushion-11", label: "Black and white gingham", type: "Cushions", src: "p011.jpg" },
      { design: "12", slug: "cushion-12", label: "Grey gingham", type: "Cushions", src: "p012.jpg" },
      { design: "13", slug: "cushion-13", label: "Six-design colourcard set", type: "Cushions", src: "p013.jpg" },
      { design: "14", slug: "cushion-14", label: "Cranberry lattice pair", type: "Cushions", src: "p014.jpg" },
      { design: "15", slug: "cushion-15", label: "Scarlet folk embroidery", type: "Cushions", src: "p015.jpg" },
      { design: "16", slug: "cushion-16", label: "Rose fretwork", type: "Cushions", src: "p016.jpg" },
      { design: "17", slug: "cushion-17", label: "Garden floral in scarlet", type: "Cushions", src: "p017.jpg" },
      { design: "18", slug: "cushion-18", label: "Scarlet and ivory bird print", type: "Cushions", src: "p018.jpg" },
      { design: "19", slug: "cushion-19", label: "Rosette damask pair", type: "Cushions", src: "p019.jpg" },
      { design: "20", slug: "cushion-20", label: "Indigo triangle print", type: "Cushions", src: "p020.jpg" },
      { design: "21", slug: "cushion-21", label: "Check colourcard, four colourways", type: "Cushions", src: "p021.jpg" },
      { design: "22", slug: "cushion-22", label: "Vintage floral trio", type: "Cushions", src: "p022.jpg" },
      { design: "23", slug: "cushion-23", label: "Plain colourcard, seven colourways", type: "Cushions", src: "p023.jpg" },
      { design: "24", slug: "cushion-24", label: "Tangerine plain weave", type: "Cushions", src: "p024.jpg" },
      { design: "25", slug: "cushion-25", label: "Teal and gold triangle print", type: "Cushions", src: "p025.jpg" },
      { design: "26", slug: "cushion-26", label: "Songbird and bloom print", type: "Cushions", src: "p026.jpg", featured: true },
      { design: "27", slug: "cushion-27", label: "Lagoon leaf print", type: "Cushions", src: "p027.jpg" },
      { design: "28", slug: "cushion-28", label: "Ochre and grey triangle print", type: "Cushions", src: "p028.jpg" },
      { design: "29", slug: "cushion-29", label: "Hummingbird and peony print", type: "Cushions", src: "p030.jpg" },
      { design: "30", slug: "cushion-30", label: "Indigo tile-work print", type: "Cushions", src: "p031.jpg" },
      { design: "31", slug: "cushion-31", label: "Scarlet spot print", type: "Cushions", src: "p032.jpg" },
      { design: "32", slug: "chair-pad-01", label: "Tufted pads in blue and pink", type: "Chair Pads", src: "p033.jpg", featured: true },
      { design: "33", slug: "chair-pad-02", label: "Ivory tufted pad stack", type: "Chair Pads", src: "p034.jpg" },
      { design: "34", slug: "chair-pad-03", label: "Assorted tufted pads", type: "Chair Pads", src: "p035.jpg" },
      { design: "35", slug: "chair-pad-04", label: "Buttoned pad pair in print", type: "Chair Pads", src: "p036.jpg" },
      { design: "36", slug: "chair-pad-05", label: "Chair pad colourcard, six colourways", type: "Chair Pads", src: "p037.jpg" },
      { design: "37", slug: "chair-pad-06", label: "Scarlet check pad with ivory stack", type: "Chair Pads", src: "p038.jpg" },
      { design: "38", slug: "chair-pad-07", label: "Navy stripe tie-on pads", type: "Chair Pads", src: "p039.jpg" },
      { design: "39", slug: "chair-pad-08", label: "Seafoam stripe and charcoal check pads", type: "Chair Pads", src: "p040.jpg" },
      { design: "40", slug: "chair-pad-09", label: "Scarlet stripe round pad", type: "Chair Pads", src: "p041.jpg" },
      { design: "41", slug: "chair-pad-10", label: "Showroom pad assortment", type: "Chair Pads", src: "p042.jpg" },
      { design: "42", slug: "chair-pad-11", label: "Seafoam quilted pad", type: "Chair Pads", src: "p043.jpg" },
      { design: "43", slug: "chair-pad-12", label: "Cranberry quilted pad", type: "Chair Pads", src: "p044.jpg" },
      { design: "44", slug: "chair-pad-13", label: "Charcoal round quilted pad", type: "Chair Pads", src: "p045.jpg" },
      { design: "45", slug: "chair-pad-14", label: "Grey stripe round quilted pad", type: "Chair Pads", src: "p046.jpg" },
    ],
  },
  {
    dir: "textiles-product",
    series: "Textiles Programme",
    source: "TEXTILES - PRODUCT PPT",
    collections: ["city", "waterfall", "lake", "mountain", "aurora"],
    entries: [
      { design: "SC-2001", slug: "sc-2001", label: "Aqua and white striped cushion", type: "Cushions", src: "17_01_image21.jpeg", featured: true },
      { design: "SC-2002", slug: "sc-2002", label: "Orange floral cushion", type: "Cushions", src: "17_02_image22.jpeg" },
      { design: "SC-2003", slug: "sc-2003", label: "Heart print cushion", type: "Cushions", src: "17_03_image23.jpeg" },
      { design: "SC-2004", slug: "sc-2004", label: "Scarlet toile cushion", type: "Cushions", src: "17_06_image26.jpeg", featured: true },
      { design: "SC-2005", slug: "sc-2005", label: "Ivory embroidered cushion", type: "Cushions", src: "17_05_image25.jpeg" },
      { design: "SC-2006", slug: "sc-2006", label: "Multicolour paisley cushion", type: "Cushions", src: "17_04_image24.jpeg" },
      { design: "SC-2007", slug: "sc-2007", label: "Black ikat cushion", type: "Cushions", src: "18_01_image27.jpeg" },
      { design: "SC-2008", slug: "sc-2008", label: "Yellow and blue heart cushion", type: "Cushions", src: "18_02_image28.jpeg" },
      { design: "SC-2009", slug: "sc-2009", label: "Blush swirl cushion", type: "Cushions", src: "18_03_image29.jpeg" },
      { design: "SC-3001", slug: "sc-3001", label: "Cloth material set with swatch book", type: "Cloth Materials", src: "19_01_image30.jpeg" },
      { design: "SC-3002", slug: "sc-3002", label: "Charcoal grid weave fabric", type: "Cloth Materials", src: "20_03_image35.jpeg" },
      { design: "SC-3003", slug: "sc-3003", label: "Scarlet Christmas place mats", type: "Place Mats", src: "20_01_image33.jpeg", featured: true },
      { design: "SC-3004", slug: "sc-3004", label: "Grey stripe weave fabric", type: "Cloth Materials", src: "20_04_image36.jpeg" },
      { design: "SC-3005", slug: "sc-3005", label: "Forest green washed fabric", type: "Cloth Materials", src: "20_02_image34.jpeg" },
      { design: "SC-4001", slug: "sc-4001", label: "Kraft hang tag with cotton string", type: "Hang Tags", src: "19_03_image32.png" },
      { design: "01", slug: "textile-towel-01", label: "Rolled-hem towel set in grey and scarlet", type: "Towels", src: "06_01_image6.jpeg" },
      { design: "02", slug: "textile-cloth-01", label: "Checked grid-weave cloth on the bed", type: "Cloth Materials", src: "12_01_image12.jpeg" },
      { design: "03", slug: "textile-napkin-01", label: "Napkin set in four colourways", type: "Napkins", src: "13_01_image14.jpeg" },
      { design: "04", slug: "textile-chair-pad-01", label: "Striped seat cushion", type: "Chair Pads", src: "13_02_image15.jpeg" },
      { design: "05", slug: "textile-runner-03", label: "Grey medallion print runner", type: "Printed Table Runners", src: "14_01_image16.jpeg" },
      { design: "06", slug: "textile-towel-02", label: "Reindeer kitchen towel pair", type: "Towels", src: "15_02_image19.jpeg" },
      { design: "07", slug: "textile-towel-05", label: "Typography print kitchen towel", type: "Towels", src: "15_01_image18.jpeg" },
      { design: "08", slug: "textile-towel-03", label: "Fringed stripe towelling sets, five colourways", type: "Towels", src: "16_01_image20.png" },
      { design: "09", slug: "textile-cushion-01", label: "Emerald stripe cushion", type: "Cushions", src: "22_01_image37.jpeg" },
      { design: "10", slug: "textile-cushion-02", label: "Charcoal trellis cushion", type: "Cushions", src: "22_02_image38.jpeg" },
      { design: "11", slug: "textile-cushion-03", label: "Butterfly and bloom cushion", type: "Cushions", src: "23_01_image39.jpeg" },
      { design: "12", slug: "textile-cushion-04", label: "Seafoam cotton cushion", type: "Cushions", src: "23_02_image40.jpeg" },
      { design: "13", slug: "textile-blanket-01", label: "Natural plaid throw pair with tassels", type: "Blankets", src: "24_01_image41.jpeg" },
      { design: "14", slug: "textile-blanket-02", label: "Indigo patchwork throw with check pair", type: "Blankets", src: "24_02_image42.jpeg" },
      { design: "15", slug: "textile-blanket-03", label: "Denim and navy knit throw pair", type: "Blankets", src: "25_01_image43.jpeg" },
      { design: "16", slug: "textile-blanket-04", label: "Ivory boucle throw with fringed edge", type: "Blankets", src: "25_02_image44.jpeg" },
      { design: "17", slug: "textile-towel-06", label: "Rainbow stripe towel stack", type: "Towels", src: "26_01_image45.jpeg" },
      { design: "18", slug: "textile-runner-04", label: "Teal toile runner on pink cloth", type: "Printed Table Runners", src: "26_02_image46.jpeg" },
      { design: "19", slug: "textile-runner-01", label: "Ivory leaf print runner on mauve cloth", type: "Printed Table Runners", src: "27_01_image47.jpeg" },
      { design: "20", slug: "textile-runner-02", label: "Grey weave runner with leather belt", type: "Printed Table Runners", src: "27_02_image48.jpeg" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

function specsFor(entry: DeckEntry, deck: Deck, copy: TypeCopy, code: string): ProductSpec[] {
  return [
    { label: "Size", value: copy.size },
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
