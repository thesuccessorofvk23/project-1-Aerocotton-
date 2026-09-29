# Aero Cotton — Premium Digital Experience

The new aerocotton.in: a multi-page B2B platform for a family-run cotton
home-textile manufacturer in Karur, Tamil Nadu, exporting since 2015.

Brand concept — **"Ten Landscapes, One Thread"**: the ten existing collections
(Nature, Mountain, Beach, City, Forest, Lake, Desert, Waterfall, Snow, Aurora)
are treated as named landscapes. Each carries a dye palette that drives the
procedural WebGL fabric hero and every page accent. One shader, ten moods.

## Running the site

```bash
npm install
npm run dev        # http://localhost:3000
 npm run build      # production build; exports the site to out/
npm run typecheck  # strict TypeScript, no emit
```

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, OG | for production |
| `RESEND_API_KEY` + `RFQ_TO_EMAIL` + `RFQ_FROM_EMAIL` | RFQ email delivery | for production (without it, enquiries log to the server console) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Form spam protection | optional but recommended |

## Architecture

- **Next.js 16 App Router** — static-first; only `/contact` renders per-request.
- **TypeScript strict**, Tailwind CSS v4 (tokens in `src/styles/tokens.css`).
- **Procedural fabric hero** — vanilla three.js in a single lazy chunk
  (`src/components/three/`). No textures: folds are fbm noise in the vertex
  shader, weave is procedural in the fragment shader. Dye palettes crossfade via
  the `uDissolve` uniform.
- **Realtime product models** — the only real geometry on the site: a Wavefront
  `.obj` or a textured `.glb` under `public/models/`, drawn by `ModelCanvas.tsx`
  (vanilla three.js + `OBJLoader`/`GLTFLoader` behind a dynamic import, drag to
  turn, idle drift, paused offscreen). It rides the same fallback ladder as the
  hero and sits on top of the product's still image, which stays whenever WebGL
  is unavailable.
- **Fallback ladder** — full WebGL → light WebGL (small geometry, clamped DPR)
  → pure-CSS drape → reduced-motion static frame. `src/components/three/capabilities.ts`.
- **Content layer** — `src/content/`. Pages consume `Collection`/`Product`
  types, never files. Company facts live in `src/content/company.ts` with
  CONFIRMED vs PENDING clearly separated. Migrating to a CMS later means
  replacing the loaders, not the UI.
- **RFQ pipeline** — shared zod schema (client + server) → honeypot →
  IP rate limiting (in-memory, swap for Redis when scaling out) → optional
  Turnstile → Resend email with reply-to. `src/lib/rfq/`.
- **Motion** — ~450 ms page transitions, one-shot IntersectionObserver reveals,
  all gated on a `.js` class and `prefers-reduced-motion` in `globals.css`.
- **Opening curtain** — first-visit-per-session brand moment (~3 s, home page
  only, `src/components/home/CinematicLoadingScreen.tsx` + the `.cinematic-intro`
  block in `globals.css`): two grain-textured ivory doors hold a staggered
  AERO COTTON lockup and a brass-thin seam, then part outward to reveal the
  page as the lockup halves ride with them. It is CSS-only, driven by the
  before-paint script in `src/app/layout.tsx` that adds `intro-armed` to
  `<html>` once `sessionStorage` says the session is new — append `?intro` to
  the homepage URL to replay it for review. Repeat visits, reduced-motion
  visitors, other routes and JavaScript-less visitors never see it. The overlay is `pointer-events: none` and scroll is locked only while
  the doors are shut, so it can never gate the page.

## Client fact inventory — required before launch

Everything rendered today is either **confirmed from the live site** (est. 2010,
family-run, Karur; exporting since 2015; ten collections; tagline) or is
**placeholder editorial copy** written to be replaced. The following must be
collected and swapped in:

| Item | Where it lands | Current state |
| --- | --- | --- |
| Phone, email, WhatsApp Business number | `src/content/company.ts` → footer, contact aside, RFQ | `null` placeholders; graceful "lines being connected" state |
| Product categories + real SKUs per collection | `src/content/collections.ts`, `src/content/catalogue.ts` | Real client designs and SKUs (SC-2001 … SC-4001) imported from the decks; sizes, weaves and colourway names are editorial |
| Certification list (or absence) | Sustainability page | Deliberately not rendered; honest-claims note shown |
| Export market list | Global Presence page | Marked `[ pending client confirmation ]` |
| Machinery / capacity figures | Manufacturing page | Omitted; "shared on request" |
| Timeline milestones between 2015 and today | `journey` in `company.ts` | One `[CLIENT]` slot reserved |
| Brand assets (logo, packaging, product photography) | Tokens + imagery | Product photography now real (157 deck images + 31 line-sheet images); editorial plates remain for facility/campaign imagery. Logo artwork supplied and in place in the header, mobile menu and footer (`public/brand/`); vector source still worth requesting |
| 3D samples (cloth bag, block-printed runner) | `public/models/`, both product entries | Buyer-supplied scans; the still on each product page and its card thumbnail are rendered from the model. Confirm the pieces may be shown, whether dimensions may be published, and that the block-printed runner is filed under the right product type |
| Registrations (IEC / GSTIN) | Footer / schema | Not rendered |

**Rule enforced throughout:** nothing unverifiable ships as a claim. Search
`[pending`, `[CLIENT]`, and "placeholder" to find every swap point.

## The catalogue

190 products, each with its own page at `/products/[collection]/[slug]`. Three
sources feed the collections:

| Source | Where | Count |
| --- | --- | --- |
| Hand-written line sheets (Kitchen & Table Presentation, Kitchen Towels CAD, Table Presentation) | `src/content/collections.ts` | 31 |
| Client decks imported from the source files | `src/content/catalogue.ts` | 157 |
| The modelled pieces (cotton tote bag, Beach / block-printed runner, Lake) | `src/content/collections.ts` + `public/models/` | 2 |

Deck imports, with the series facet each one adds to `/products`:

| Deck | Series | Designs | Types |
| --- | --- | --- | --- |
| AUTUMN CUSHION 2026 | Autumn Cushions 2026 | 18 | Cushions |
| Blankets | Blankets | 24 | Blankets |
| PLACE MATS & RUNNERS | Place Mats & Runners | 35 | Runners, place mats |
| CUSHIONS -1 & CHAIR PADS | Cushions & Chair Pads | 45 | Cushions, chair pads |
| TEXTILES - PRODUCT PPT | Textiles Programme | 35 | Cushions, towels, throws, runners, napkins, cloth materials, hang tags |

`Kitchen Towels CAD` arrives again as a re-download; it is already catalogued
from the earlier pass and was not imported twice.

Every deck product spreads across the ten landscape collections in deck order
(see `collections:` on each deck in `catalogue.ts`), so each collection page
carries a mix of programmes. Product copy generated from the deck tables is
placeholder-grade — sizes, weaves and colourway names are editorial — and the
client's SKU codes (SC-2001 … SC-4001) are used verbatim where the deck labels
them.

### Re-importing a deck

The client decks live as `.pptx` (with PDF exports) outside the repo. The
pipeline is three scripts, all Node built-ins + `sharp`:

```bash
# 1. pull every embedded image out of the PDF export
node scripts/pdf-images.mjs extract "<deck>.pdf" --out .pdf-work/raw

# 2. normalise slide order (uses the .pptx when available, for full quality)
unzip -oq "<deck>.pptx" -d .pdf-work/pptx/<deck>
node scripts/pptx-catalog.mjs .pdf-work/pptx/<deck>
node scripts/normalize-media.mjs

# 3. add the deck to src/content/catalogue.ts, then write the shipped images
node scripts/build-catalogue-images.mjs --check   # verifies every source resolves
node scripts/build-catalogue-images.mjs           # writes public/images/products/<deck>/
```

`scripts/montage.mjs` builds labelled review sheets from any image folder.

### The brand lockup

The client's logo export is a flattened RGB file on a light studio plate, so it
cannot sit on the cocoa footer or over the hero film as delivered.
`scripts/import-brand-logo.mjs` keys the plate out to real alpha — alpha from
plate deviation, then unpremultiplied so anti-aliased edges keep their colour —
and writes the two files the site ships:

- `public/brand/aerocotton-mark.png` — the monogram, used in the header and the
  mobile menu (the wordmark is illegible at nav scale)
- `public/brand/aerocotton-lockup-dark.png` — the full lockup with its strap-line
  re-inked light, used in the footer

```bash
node scripts/import-brand-logo.mjs "<LOGO.png>"
```

### The hero film

The home page's `<video>` plays `public/hero/hero-cotton-intro.mp4`. Masters
arrive straight out of an editor — 1080p at ~22 Mbps — which is ten to twenty
times the bitrate the page can justify: GitHub warns above 50 MiB per file and
rejects anything over 100 MiB, so a raw master cannot be pushed at all.
`scripts/import-hero-video.mjs` re-encodes it to CRF 22 (measured SSIM ~0.985
against the master — under 1% mean pixel difference), which lands around 4 Mbps
at 1080p:

```bash
node scripts/import-hero-video.mjs "<master.mp4>"
```

ffmpeg is not a project dependency; the script uses `$FFMPEG`, then `ffmpeg` on
`PATH`, then a scratch install at `.pdf-work/tools/` (`npm install ffmpeg-static@5`).
Editor exports also tend to carry zero-duration duplicate frames in their `stts`
table, which the encode drops on the way to a clean 30 fps timeline — see the
header of the script before changing its flags.

### The modelled pieces

Two products carry a `model` field — `Cotton Tote Bag` (Beach, an untextured
`.obj`) and `Block-Printed Fringed Runner` (Lake, a textured `.glb`).
`src/content/types.ts` defines it as an optional path; when it is set, the
product page renders `ProductModel` in place of the still photograph, and
section 03's centre card on the home page links to the tote bag's product page
instead of to its collection.

A `.glb` keeps its own material and embedded base-colour/ORM/normal textures.
An `.obj` from the converter carries neither, so the surface colour is the
house cotton material's job, not the file's. To add another model:

```bash
# 1. ship the geometry
cp "<scan>.glb" public/models/<slug>.glb

# 2. render a catalogue-style thumbnail from it (no CAD software needed)
node scripts/render-mesh-preview.mjs public/models/<slug>.glb \
  --out public/images/products/<range>/<slug>.jpg \
  --yaw -1.35 --pitch 0.06 --zoom 0.86 --w 900 --h 1125 --bg f5f1ea

# 3. add the Product with `model: "/models/<slug>.glb"` and rebuild
```

`scripts/render-mesh-preview.mjs` is a software rasteriser written for exactly
this: it parses an `.obj` (`v`/`vt`/`vn`/`f`) or a `.glb` (glTF accessors, node
transforms), interpolates the model's own vertex normals per pixel, lights the
result with a key + fill pair and, for a GLB, samples the embedded base-colour
texture through the model's UVs. A low-poly scan therefore reads as a soft clay
render rather than as faceted triangles, and a textured one keeps its print.
`--views all` prints a four-angle contact sheet — the fastest way to identify a
model before anything is wired in, and `--flat` forces the untinted silhouette
path. Pass `--tint <hex>` to colour an untextured model.

### Adding a single product

1. Add the image under `public/images/products/`.
2. Either add a `Product` entry to the collection in `src/content/collections.ts`,
   or — for deck imports — add one line to the deck's `entries` in
   `src/content/catalogue.ts` and run `scripts/build-catalogue-images.mjs`.
3. Rebuild. Routes, sitemap entries, breadcrumbs, JSON-LD and related-product
   links are all derived automatically.

## Design system quick reference

- Palette: ivory `#f4f0e8` base, charcoal `#171614` ink, brass `#b08d57`
  accent, deep-green `#354a42` alternative. Collection palettes in
  `tokens.css` (`--dye-a/b/c` per `.dye-*` class).
- Type: Fraunces (display, SOFT axis) + Manrope (UI), self-hosted via
  `next/font` in `src/app/fonts.ts`.
- Spacing rhythm and section patterns: reuse `SectionHeading`, `Container`,
  `ButtonLink`, `Reveal` — every page composes from these.

## Launch checklist (short form)

1. Confirm every fact-inventory item above.
2. Commission photography (facility, hands, weave macros, per-collection
   flat-lays) and replace placeholder plates — the current gradients are
   explicitly temporary.
3. Set production env vars; send a live RFQ to verify email delivery.
4. Verify 301s from legacy aerocotton.in URLs and submit the new sitemap in
   Search Console.
5. SPF/DKIM/DMARC on the sending domain so RFQ replies don't land in spam.
