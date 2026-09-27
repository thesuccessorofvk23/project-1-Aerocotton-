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
        category: "Blankets & Throws",
        productType: "Blankets",
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
      p({
        id: "nature-dobby-cushion",
        slug: "dobby-cushion",
        name: "Dobby Cushion Cover",
        category: "Cushions & Chair Pads",
        productType: "Cushions",
        tagline: "Woven texture for composed seating.",
        description:
          "A dobby-woven cushion cover in botanical green, with a concealed zip and mitred corners. Sold as covers alone or with feather inserts, it lines up cleanly across a retail wall or a guest suite.",
        materials: ["100% cotton", "Dobby woven"],
        applications: ["Living rooms", "Retail programmes", "Gifting"],
        specs: [
          { label: "Sizes", value: "40 × 40 cm · 45 × 45 cm" },
          { label: "Weight", value: "~300 GSM" },
          { label: "Weave", value: "Dobby with tonal stripe" },
          { label: "Closure", value: "Concealed zip" },
        ],
        variants: ["Sage", "Ivory", "Charcoal"],
        customization:
          "Sizes, weaves and inserts to programme; piping and embroidered details available.",
        image: "/images/collections/nature-cushion.svg",
      }),
      p({
        id: "nature-cotton-pillow",
        slug: "cotton-pillow",
        name: "Cotton Pillow",
        category: "Textiles – Product Range",
        productType: "Pillows",
        tagline: "Combed-cotton case, resilient fill.",
        description:
          "A cotton pillow with a tightly woven cambric case and a resilient cotton-blend fill that keeps its shape through commercial laundering. Covered for hospitality programmes and retail pairs alike.",
        materials: ["100% cotton shell", "Cotton-blend fill"],
        applications: ["Bedding", "Hospitality", "Retail"],
        specs: [
          { label: "Sizes", value: "50 × 75 cm" },
          { label: "Weight", value: "~800 GSM fill" },
          { label: "Case", value: "Downproof cambric" },
          { label: "Finish", value: "Piped edge" },
        ],
        variants: ["White", "Ivory"],
        customization:
          "Fill weights, case fabrics and size sets to programme; hospitality label options.",
        image: "/images/collections/nature-pillow.svg",
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
        category: "Blankets & Throws",
        productType: "Blankets",
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
      p({
        id: "mountain-kitchen-towel",
        slug: "stripe-kitchen-towel",
        name: "Stripe Kitchen Towel",
        category: "Kitchen Towels",
        productType: "Towels",
        tagline: "Yarn-dyed stripes, everyday utility.",
        description:
          "A yarn-dyed kitchen towel with a terry reverse and a hanging loop. Absorbent enough for a working kitchen and tidy enough for an open shelf — the towel buyers reorder by the dozen.",
        materials: ["100% cotton", "Yarn-dyed"],
        applications: ["Kitchen linens", "Retail", "Promotional"],
        specs: [
          { label: "Sizes", value: "50 × 70 cm" },
          { label: "Weight", value: "~420 GSM" },
          { label: "Weave", value: "Terry reverse, flatweave face" },
          { label: "Details", value: "Hanging loop, mitred hem" },
        ],
        variants: ["Slate", "Fog", "Ivory"],
        customization:
          "Stripe palettes, woven-in logos and retail hanging options to programme.",
        image: "/images/collections/mountain-kitchen-towel.svg",
      }),
      p({
        id: "mountain-canvas-tote",
        slug: "canvas-tote-bag",
        name: "Canvas Tote Bag",
        category: "Textiles – Product Range",
        productType: "Cloth Bags",
        tagline: "Heavy duck cotton, built to carry.",
        description:
          "A tote in heavyweight duck cotton with reinforced handles and a flat base that stands while it is packed. Screen-print or embroidered branding; the bag that outlives the campaign it was made for.",
        materials: ["100% cotton canvas"],
        applications: ["Retail", "Promotional", "Gifting"],
        specs: [
          { label: "Sizes", value: "38 × 42 cm" },
          { label: "Weight", value: "~340 GSM" },
          { label: "Weave", value: "Heavy duck canvas" },
          { label: "Details", value: "Reinforced handles, flat base" },
        ],
        variants: ["Natural", "Slate", "Charcoal"],
        customization:
          "Sizes, handle styles and printed or embroidered branding to programme.",
        image: "/images/collections/mountain-tote.svg",
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
        category: "Textiles – Product Range",
        productType: "Towels",
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
      p({
        id: "beach-placemat-set",
        slug: "woven-placemat-set",
        name: "Woven Place Mat Set",
        category: "Place Mats & Runners",
        productType: "Printed Table Runners",
        tagline: "Sun-bleached weave for the table.",
        description:
          "Flatwoven place mats in sun-bleached neutrals, finished with a knotted fringe. Sturdy under daily service and soft enough to roll for storage; sold in sets of four or six.",
        materials: ["100% cotton", "Flatweave"],
        applications: ["Table linen", "Retail", "Gifting"],
        specs: [
          { label: "Sizes", value: "33 × 48 cm" },
          { label: "Weight", value: "~280 GSM" },
          { label: "Weave", value: "Flatweave with band" },
          { label: "Edge", value: "Knotted fringe" },
        ],
        variants: ["Sand", "Brass", "Ivory"],
        customization:
          "Set sizes, weaves and palettes to programme; matching runners available.",
        image: "/images/collections/beach-placemat.svg",
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
        category: "Textiles – Product Range",
        productType: "Towels",
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
      p({
        id: "city-chair-pad",
        slug: "checked-chair-pad",
        name: "Checked Chair Pad",
        category: "Cushions & Chair Pads",
        productType: "Chair Pads",
        tagline: "Yarn-dyed checks with a cushioned seat.",
        description:
          "A yarn-dyed chair pad with a cotton-filled seat and ties that hold it square through daily use. Sits well with matching table linen and comes out of the wash none the worse.",
        materials: ["100% cotton", "Cotton fill"],
        applications: ["Dining", "Retail", "Hospitality"],
        specs: [
          { label: "Sizes", value: "40 × 40 cm" },
          { label: "Weight", value: "~480 GSM" },
          { label: "Fill", value: "Cotton wadding, channel stitched" },
          { label: "Details", value: "Corner ties, piped edge" },
        ],
        variants: ["Stone", "Charcoal", "Ivory"],
        customization:
          "Check palettes, fill weights and tie details to programme.",
        image: "/images/collections/city-chair-pad.svg",
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
        category: "Textiles – Product Range",
        productType: "Cloth Materials",
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
      p({
        id: "forest-workshop-apron",
        slug: "workshop-apron",
        name: "Workshop Apron",
        category: "Kitchen & Table Presentation",
        productType: "Apron with Gloves",
        tagline: "Deep-green duck canvas, built to work.",
        description:
          "A cross-back apron in heavyweight woven cotton with adjustable neck and waist ties. Deep pockets take tools or towels; the weave takes whatever a working kitchen or studio throws at it.",
        materials: ["100% cotton canvas", "Machine washable"],
        applications: ["Kitchens", "Studios & workshops", "Retail"],
        specs: [
          { label: "Sizes", value: "One size (adjustable)" },
          { label: "Weight", value: "~260 GSM" },
          { label: "Weave", value: "Heavy duck weave" },
          { label: "Details", value: "Cross-back, three pockets" },
        ],
        variants: ["Forest", "Natural", "Charcoal"],
        customization:
          "Colourways, strap finishes, embroidered branding and a matching oven glove to programme.",
        image: "/images/collections/forest-apron.svg",
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
        category: "Textiles – Product Range",
        productType: "Cloth Materials",
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
      p({
        id: "lake-sateen-tablecloth",
        slug: "sateen-tablecloth",
        name: "Sateen Tablecloth",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Still blues with a quiet sheen.",
        description:
          "A mercerised sateen tablecloth with a soft drape and a calm, even surface. Stain-finished for service and pressed to hold a crease — the cloth a table deserves on the good days.",
        materials: ["100% cotton sateen", "Stain finish"],
        applications: ["Table linen", "Hospitality", "Gifting"],
        specs: [
          { label: "Sizes", value: "150 × 230 cm · 180 × 300 cm" },
          { label: "Weight", value: "~220 GSM" },
          { label: "Weave", value: "Sateen" },
          { label: "Edge", value: "Hemmed, mitred corners" },
        ],
        variants: ["Lake", "Mist", "Ivory"],
        customization:
          "Sizes, palettes and embroidery to programme; napery sets matched on request.",
        image: "/images/collections/lake-tablecloth.svg",
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
        category: "Place Mats & Runners",
        productType: "Printed Table Runners",
        tagline: "Woven, then printed to last.",
        description:
          "A jacquard-woven table runner finished with buyer artwork — the ground carries the weave, the surface carries the print. No fading, no worn finish: a table piece that survives its decade.",
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
          "Custom jacquard grounds and prints from buyer artwork; napery sets matched on request.",
        image: "/images/collections/desert-runner.svg",
        featured: false,
      }),
      p({
        id: "desert-autumn-cushion",
        slug: "autumn-cushion-cover",
        name: "Autumn Cushion Cover",
        category: "Autumn Cushion 2026",
        productType: "Cushions",
        tagline: "The Autumn 2026 series, in baked earth tones.",
        description:
          "The seasonal cushion of the Autumn 2026 series: jacquard-woven textures in ochre, rust and cocoa with a self-bound edge. A capsule programme refreshed each season for retail floors and festive gifting.",
        materials: ["100% cotton", "Jacquard woven"],
        applications: ["Seasonal retail", "Festive gifting", "Living rooms"],
        specs: [
          { label: "Sizes", value: "45 × 45 cm · 50 × 50 cm" },
          { label: "Weight", value: "~320 GSM" },
          { label: "Weave", value: "Jacquard with tonal relief" },
          { label: "Closure", value: "Concealed zip" },
        ],
        variants: ["Ochre", "Rust", "Cocoa"],
        customization:
          "Seasonal palettes and weave patterns developed with buyer design teams; inserts available.",
        image: "/images/collections/desert-autumn-cushion.svg",
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
        category: "Textiles – Product Range",
        productType: "Towels",
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
      p({
        id: "waterfall-cad-tea-towel",
        slug: "cad-print-tea-towel",
        name: "CAD Print Tea Towel",
        category: "Kitchen Towels",
        productType: "Towels",
        tagline: "Studio artwork, printed crisp.",
        description:
          "A combed-cotton tea towel carrying CAD-printed artwork — buyer designs sampled fast and matched across repeat runs. High absorbency, low lint, and a dobby border that frames the print.",
        materials: ["100% combed cotton", "Pigment print"],
        applications: ["Kitchen linens", "Promotional", "Retail"],
        specs: [
          { label: "Sizes", value: "50 × 70 cm" },
          { label: "Weight", value: "~400 GSM" },
          { label: "Weave", value: "Terry with print panel" },
          { label: "Edge", value: "Double-needle hem" },
        ],
        variants: ["Seafoam", "Ivory", "Waterfall"],
        customization:
          "Buyer artwork reproduced from CAD files; colour matching and sampling before bulk.",
        image: "/images/collections/waterfall-tea-towel.svg",
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
        category: "Textiles – Product Range",
        productType: "Cloth Materials",
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
      p({
        id: "snow-furnishing-fabric",
        slug: "furnishing-fabric",
        name: "Furnishing Fabric",
        category: "Textiles – Product Range",
        productType: "Cloth Materials",
        tagline: "The metre-cloth behind the made-ups.",
        description:
          "Woven furnish cloth sold by the metre — plains, stripes, checks, dobby and jacquard in solid and multicolour. The same constructions behind our made-ups, available to buyers who cut and stitch their own.",
        materials: ["100% cotton", "Yarn-dyed"],
        applications: ["Upholstery", "Soft furnishings", "Trade"],
        specs: [
          { label: "Widths", value: "150 cm" },
          { label: "Weight", value: "~280 GSM" },
          { label: "Weave", value: "Plain, dobby & jacquard" },
          { label: "Finish", value: "Singe, calender" },
        ],
        variants: ["White", "Ivory", "Natural"],
        customization:
          "Constructions, palettes and finishes woven to buyer artwork; sampling on request.",
        image: "/images/collections/snow-fabric.svg",
      }),
      p({
        id: "snow-hemstitch-napkin",
        slug: "hemstitch-napkin-set",
        name: "Hemstitch Napkin Set",
        category: "Table Presentation",
        productType: "Table Top Cover",
        tagline: "Honest white, drawn-thread hem.",
        description:
          "Undyed cotton napkins with a drawn-thread hemstitch — the kind of detail read at arm's length. Pressed flat, packed in dozens, and matched to the sateen tablecloth on request.",
        materials: ["100% cotton", "Hemstitch finish"],
        applications: ["Table linen", "Hospitality", "Retail"],
        specs: [
          { label: "Sizes", value: "45 × 45 cm · 55 × 55 cm" },
          { label: "Weight", value: "~200 GSM" },
          { label: "Weave", value: "Plain weave" },
          { label: "Edge", value: "Drawn-thread hemstitch" },
        ],
        variants: ["White", "Ivory"],
        customization:
          "Sizes, thread counts and monogramming to programme; matched napery sets available.",
        image: "/images/collections/snow-napkins.svg",
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
        category: "Blankets & Throws",
        productType: "Blankets",
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
      p({
        id: "aurora-table-gift-set",
        slug: "table-gift-set",
        name: "Table Gift Set",
        category: "Kitchen & Table Presentation",
        productType: "Table Top Cover",
        tagline: "A signature set for festive tables.",
        description:
          "A boxed presentation set pairing a dimensional-weave runner with matched napkins and place mats. Special weaves and finishes from the Aurora programme, packed for festive and corporate gifting.",
        materials: ["100% cotton", "Structure weave"],
        applications: ["Festive gifting", "Retail", "Corporate gifting"],
        specs: [
          { label: "Contents", value: "Runner · 4 place mats · 4 napkins" },
          { label: "Weight", value: "Assorted" },
          { label: "Weave", value: "Dimensional structure weave" },
          { label: "Packaging", value: "Gift box, sleeve" },
        ],
        variants: ["Aurora", "Storm", "Moss"],
        customization:
          "Set composition, weave structures and packaging developed with buyer design teams.",
        image: "/images/collections/aurora-gift-set.svg",
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
