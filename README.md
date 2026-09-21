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
  (`src/components/three/`). No 3D models, no textures: folds are fbm noise in
  the vertex shader, weave is procedural in the fragment shader. Dye palettes
  crossfade via the `uDissolve` uniform.
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
- **Preloader** — first-visit-per-session brand moment (~1.5 s + curtain-part
  exit, `src/components/layout/Preloader.tsx`): staggered serif wordmark,
  brass thread draw, tagline, origin + eased counter, then the cocoa curtain
  parts to reveal the page. Repeat visits skip it entirely (head script checks
  `sessionStorage`); reduced-motion users get a ~120 ms near-instant release.
  Scroll is locked only while the curtain is up.

## Client fact inventory — required before launch

Everything rendered today is either **confirmed from the live site** (est. 2010,
family-run, Karur; exporting since 2015; ten collections; tagline) or is
**placeholder editorial copy** written to be replaced. The following must be
collected and swapped in:

| Item | Where it lands | Current state |
| --- | --- | --- |
| Phone, email, WhatsApp Business number | `src/content/company.ts` → footer, contact aside, RFQ | `null` placeholders; graceful "lines being connected" state |
| Product categories + real SKUs per collection | `src/content/collections.ts` | Structural placeholders with realistic copy |
| Certification list (or absence) | Sustainability page | Deliberately not rendered; honest-claims note shown |
| Export market list | Global Presence page | Marked `[ pending client confirmation ]` |
| Machinery / capacity figures | Manufacturing page | Omitted; "shared on request" |
| Timeline milestones between 2015 and today | `journey` in `company.ts` | One `[CLIENT]` slot reserved |
| Brand assets (logo, packaging, product photography) | Tokens + imagery | Palette derived from the brief; placeholder plates throughout |
| Registrations (IEC / GSTIN) | Footer / schema | Not rendered |

**Rule enforced throughout:** nothing unverifiable ships as a claim. Search
`[pending`, `[CLIENT]`, and "placeholder" to find every swap point.

## Adding a product

1. Add images under `public/images/collections/`.
2. Add a `Product` entry to the collection in `src/content/collections.ts`
   (id, slug, name, category, copy, specs, variants, customization).
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
