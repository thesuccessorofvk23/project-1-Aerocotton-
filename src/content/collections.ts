/**
 * AERO COTTON — the catalogue: real products from the client's line sheets.
 *
 * Written out below are the items from three client catalogues, with
 * photography extracted from those documents (public/images/products/…):
 *   — "Kitchen & Table Presentation" (designs 01–09 + tablecloth colourways)
 *   — "Kitchen Towels CAD" (printed kitchen-towel designs 01–09)
 *   — "Table Presentation" (printed table-linen designs 01–10)
 *
 * The five decks added later (autumn cushions, blankets, place mats & runners,
 * cushions & chair pads, textiles programme) live in `./catalogue.ts` as
 * compact deck tables and are merged into the collections at the foot of this
 * file — 157 designs, one product page each.
 *
 * Two further entries are not from any deck: the cotton tote bag (Beach) and the
 * block-printed runner (Lake), the catalogue's first modelled pieces, shipped
 * with realtime geometry under `public/models/` instead of a photograph. A
 * third modelled piece — the autumn print cushion (Desert) — joined later from
 * a client-supplied 3D scan.
 * Product copy beyond the confirmed design numbers is placeholder-grade,
 * to be confirmed by Aerocotton.
 *
 * Each product sits in one of the ten landscape collections (Nature,
 * Mountain, Beach, City, Forest, Lake, Desert, Waterfall, Snow, Aurora).
 * Palettes are PLACEHOLDER design intent, to be re-extracted from confirmed
 * product photography at the photography milestone.
 */

import type { Collection, Product } from "./types";
import { catalogueByCollection } from "./catalogue";
import { classifyProduct } from "./product-taxonomy";

const p = (product: Product): Product => product;

const lineSheets: Collection[] = [
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
      p({
        id: "nature-tp-design-01",
        slug: "tp-design-01",
        name: "Table Presentation Design-01",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-01.",
        description:
          "Design-01 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-01" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-01.jpg",
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
      p({
        id: "mountain-kt-cad-01",
        slug: "kt-cad-01",
        name: "Kitchen Towel CAD Design-01",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-01.",
        description:
          "Design-01 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. One of nine printed designs developed for retail and promotional programmes.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-01" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-01.jpg",
      }),
      p({
        id: "mountain-tp-design-02",
        slug: "tp-design-02",
        name: "Table Presentation Design-02",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-02.",
        description:
          "Design-02 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-02" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-02.jpg",
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
      p({
        id: "beach-kt-cad-02",
        slug: "kt-cad-02",
        name: "Kitchen Towel CAD Design-02",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-02.",
        description:
          "Design-02 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Colours matched across repeat runs for programme continuity.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-02" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-02.jpg",
      }),
      p({
        id: "beach-tp-design-03",
        slug: "tp-design-03",
        name: "Table Presentation Design-03",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-03.",
        description:
          "Design-03 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-03" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-03.jpg",
      }),
      //
      // The catalogue's first 3D piece. Unlike every other line-sheet entry the
      // model itself is the asset: buyers rotate the sample in the browser
      // before a physical swatch is cut. Thumbnail still is rendered from that
      // model by `scripts/render-mesh-preview.mjs`.
      p({
        id: "beach-cotton-tote-bag",
        slug: "cotton-tote-bag",
        name: "Cotton Tote Bag",
        category: "Cloth Bags",
        productType: "Cloth Bags",
        tagline: "Turn the sample over in realtime.",
        description:
          "A stitched cotton tote cut with a flat gusset and twin self-fabric handles, finished in Karur. This is the first piece in the catalogue modelled in three dimensions — the view above is the sample itself, drawn realtime in the browser, so a buyer can check the gusset depth, the handle drop and the fall of the cloth before asking for anything to be couriered.",
        materials: ["100% cotton"],
        applications: ["Retail totes", "Gifting", "Promotional"],
        specs: [
          { label: "Construction", value: "Flat gusset, twin self-fabric handles" },
          { label: "Colour", value: "Natural cotton, print to buyer artwork" },
          { label: "Series", value: "Cloth Bags" },
          { label: "3D model", value: "Realtime OBJ — 4,706 faces" },
        ],
        variants: [],
        customization:
          "Sizes, gusset depth, handle drop and print artwork to programme; the 3D file is supplied on request for buyer-side visualisation.",
        model: "/models/cotton-tote-bag.obj",
        image: "/images/products/cloth-bags/cotton-tote-bag.jpg",
        featured: true,
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
      p({
        id: "city-kt-cad-03",
        slug: "kt-cad-03",
        name: "Kitchen Towel CAD Design-03",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-03.",
        description:
          "Design-03 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Woven and printed under our own roof in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-03" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-03.jpg",
      }),
      p({
        id: "city-tp-design-04",
        slug: "tp-design-04",
        name: "Table Presentation Design-04",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-04.",
        description:
          "Design-04 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-04" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-04.jpg",
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
      p({
        id: "forest-kt-cad-04",
        slug: "kt-cad-04",
        name: "Kitchen Towel CAD Design-04",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-04.",
        description:
          "Design-04 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Woven and printed under our own roof in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-04" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-04.jpg",
      }),
      p({
        id: "forest-tp-design-05",
        slug: "tp-design-05",
        name: "Table Presentation Design-05",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-05.",
        description:
          "Design-05 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-05" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-05.jpg",
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
      p({
        id: "lake-kt-cad-05",
        slug: "kt-cad-05",
        name: "Kitchen Towel CAD Design-05",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-05.",
        description:
          "Design-05 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. High absorbency, low lint, colours matched across runs.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-05" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-05.jpg",
      }),
      p({
        id: "lake-tp-design-06",
        slug: "tp-design-06",
        name: "Table Presentation Design-06",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-06.",
        description:
          "Design-06 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-06" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-06.jpg",
      }),
      //
      // The second 3D piece — an indigo block-printed runner, shipped as a
      // textured `.glb` and photographed on a display rail (the rail is part of
      // the scan). Thumbnail still rendered from the model by
      // `scripts/render-mesh-preview.mjs`.
      p({
        id: "lake-block-printed-runner",
        slug: "block-printed-runner",
        name: "Block-Printed Fringed Runner",
        category: "Place Mats & Runners",
        productType: "Printed Table Runners",
        tagline: "Indigo block print, knotted fringe — turn it over.",
        description:
          "A printed cotton runner in a dense indigo block-print check, with a knotted fringe closing both ends. It is modelled here folded over a display rail, exactly as the sample reaches a buyer, so the print reads at true scale and the fringe can be inspected before a swatch is cut. The indigo came out of the vat deeper than the sheet shows — the model keeps the sample's own texture.",
        materials: ["100% cotton", "Block print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Print", value: "Indigo block check, cream ground" },
          { label: "Finish", value: "Knotted fringe, both ends" },
          { label: "Series", value: "Place Mats & Runners" },
          { label: "3D model", value: "Realtime GLB — 4,814 faces, textured" },
        ],
        variants: [],
        customization:
          "Length, width and print scale to programme; fringe or hemmed ends, and the 3D file is supplied on request for buyer-side visualisation.",
        model: "/models/block-printed-runner.glb",
        image: "/images/products/fringed-runner/block-printed-runner.jpg",
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
      //
      // The third 3D piece — a client-supplied scan of an autumn-print sample
      // cushion (puffy face, orange leaf-and-bloom motifs on a white ground).
      // Arrived as a 43 MB Tripo PBR export; the realtime file is decimated to
      // ~67k faces by `scripts/decimate-glb.mjs`, which also keeps the scan's
      // own colour texture byte-for-byte and writes a cloth-safe material.
      // The still below is rendered from that same model by
      // `scripts/render-mesh-preview.mjs`.
      p({
        id: "desert-autumn-print-cushion",
        slug: "autumn-print-cushion",
        name: "Autumn Print Cushion",
        category: "Autumn Cushions 2026",
        productType: "Cushions",
        tagline: "Orange autumn print on white — turn the sample over.",
        description:
          "A 40 × 40 cm printed cushion cover in an autumn print — scattered orange leaf and bloom motifs with fine dark accents on a white ground. Modelled here from a scan of the sample itself, so the print can be inspected from every side before a swatch is cut; the realtime viewer keeps the sample's own colour texture.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Living rooms", "Retail", "Gifting"],
        specs: [
          { label: "Size", value: "40 × 40 cm" },
          { label: "Colourway", value: "Orange on white" },
          { label: "Series", value: "Autumn Cushions 2026" },
          { label: "3D model", value: "Realtime GLB — 66,882 faces, textured" },
        ],
        variants: ["Tangerine", "White"],
        customization:
          "Cover-only or with inserts; print recolours, sizes and coordinated sets to programme; the 3D file is supplied on request for buyer-side visualisation.",
        model: "/models/autumn-print-cushion.glb",
        image: "/images/products/cushions-chair-pads/autumn-print-cushion.jpg",
      }),
      p({
        id: "desert-kt-cad-06",
        slug: "kt-cad-06",
        name: "Kitchen Towel CAD Design-06",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-06.",
        description:
          "Design-06 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Woven and printed under our own roof in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-06" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-06.jpg",
      }),
      p({
        id: "desert-tp-design-07",
        slug: "tp-design-07",
        name: "Table Presentation Design-07",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-07.",
        description:
          "Design-07 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-07" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-07.jpg",
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
      p({
        id: "waterfall-kt-cad-07",
        slug: "kt-cad-07",
        name: "Kitchen Towel CAD Design-07",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-07.",
        description:
          "Design-07 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Woven and printed under our own roof in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-07" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-07.jpg",
      }),
      p({
        id: "waterfall-tp-design-08",
        slug: "tp-design-08",
        name: "Table Presentation Design-08",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-08.",
        description:
          "Design-08 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-08" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-08.jpg",
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
      p({
        id: "snow-tp-design-09",
        slug: "tp-design-09",
        name: "Table Presentation Design-09",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-09.",
        description:
          "Design-09 from the Table Presentation series: printed table linen developed in Karur on our own ground cloth. One of ten catalogue designs for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-09" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-09.jpg",
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
      p({
        id: "aurora-kt-cad-08",
        slug: "kt-cad-08",
        name: "Kitchen Towel CAD Design-08",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-08.",
        description:
          "Design-08 from the Kitchen Towels CAD series: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground. Woven and printed under our own roof in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-08" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-08.jpg",
      }),
      p({
        id: "aurora-kt-cad-09",
        slug: "kt-cad-09",
        name: "Kitchen Towel CAD Design-09",
        category: "Kitchen Towels CAD",
        productType: "Towels",
        tagline: "CAD print, 50 × 70 cm, Design-09.",
        description:
          "Design-09 closes the Kitchen Towels CAD run: a 50 × 70 cm kitchen towel carrying CAD-printed artwork on an absorbent cotton ground, printed in Karur.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Size", value: "50 × 70 cm" },
          { label: "Design", value: "Design-09" },
          { label: "Series", value: "Kitchen Towels CAD" },
        ],
        variants: [],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/products/kt-cad-09.jpg",
      }),
      p({
        id: "aurora-tp-design-10",
        slug: "tp-design-10",
        name: "Table Presentation Design-10",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Printed table linen, Design-10.",
        description:
          "Design-10 closes the Table Presentation run: printed table linen developed in Karur on our own ground cloth, for retail and hospitality tables.",
        materials: ["100% cotton", "Pigment print"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Design", value: "Design-10" },
          { label: "Series", value: "Table Presentation" },
        ],
        variants: [],
        customization:
          "Sizes, prints and hem finishes to programme; napery sets matched on request.",
        image: "/images/products/tp-design-10.jpg",
      }),
    ],
  },
];

/**
 * The ten landscape collections, each one carrying its hand-written line-sheet
 * items plus the slice of the catalogue decks assigned to it.
 */
export const collections: Collection[] = lineSheets.map((collection) => ({
  ...collection,
  products: [
    ...collection.products,
    ...(catalogueByCollection[collection.slug] ?? []),
  ].map(classifyProduct),
}));

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
