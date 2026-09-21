# AERO COTTON — PREMIUM DIGITAL EXPERIENCE
## Action Plan Report

**Project:** aerocotton.in rebuild — premium multi-page B2B platform for a family-run cotton
home-textile manufacturer in Karur, Tamil Nadu (established 2010, exporting since 2015).

**Brand concept — "Ten Landscapes, One Thread":** the ten existing collections (Nature,
Mountain, Beach, City, Forest, Lake, Desert, Waterfall, Snow, Aurora) are treated as named
landscapes. Each carries a dye palette that drives the procedural WebGL fabric hero and every
page accent. One shader, ten moods — the 3D becomes the product story, not a gimmick.

**Status key:** ✅ done · 🟡 partially done (client input outstanding) · ⬜ pending

---

## Phase 0 — Client Fact Inventory (Step Zero)

**Objective:** establish the verifiable fact base before any claim ships. The brief forbids
invented statistics, certifications, export markets, and capacities.

**Deliverables**
- `[VERIFY]` tagging convention in all content files (`src/content/`)
- Placeholder policy: structural product/SKU entries render the full design, ready for real data
- Fact-inventory questionnaire for the client workshop

**Exit criteria:** every number, certification, export market, capacity, and spec in the
codebase is either client-confirmed or flagged `[VERIFY]`.

**Status:** 🟡 — convention shipped in code; the client workshop has not been held yet.

---

## Phase 1 — Brand & Design System Lock

**Decisions locked**
- Type: **Fraunces** (display serif; its SOFT axis literally encodes softness) + **Manrope**
  (body/interface). Self-hosted via `next/font` — zero layout shift, no runtime requests.
- Color: warm ivory/charcoal base + **single accent (brass)**. Six-color palettes go muddy;
  per-landscape dye palettes supply the variety instead.
- Tokens in `src/styles/tokens.css`; paper-grain texture; base components
  (Container, Button, SectionHeading) in `src/components/ui/`.

**Exit criteria:** tokens drive everything; no raw hex values in components; typecheck clean.
**Status:** ✅

---

## Phase 2 — Technical Foundation & Scaffold

- Next.js 16 + React 19 + TypeScript strict + Tailwind CSS v4 + three.js
- npm scripts: `dev` / `build` / `start` / `typecheck`
- `.env.example`, `.gitignore`, `next.config.ts`, `postcss.config.mjs`

**Exit criteria:** `npm run typecheck` and `npm run build` both clean.
**Status:** ✅ (build: 33 pages pre-rendered)

---

## Phase 3 — Content Architecture & Data Contracts

- `src/content/types.ts` — `Collection`, `Product`, `CompanyFacts` contracts
- `src/content/company.ts` — confirmed facts only, everything else `[VERIFY]`
- `src/content/collections.ts` — ten landscape collections + structural placeholder products

**Principle:** components consume **types**, never files — migrating to a CMS later touches
only the loader, not one component. CMS decision answered by contract, not by product.

**Exit criteria:** every page renders from data; zero hardcoded copy in components.
**Status:** ✅

---

## Phase 4 — Application Shell, Navigation & Motion

- Header (desktop nav + scroll behavior), MobileNav, Footer
- **Preloader:** fixed ~0.9 s ceiling, skipped on repeat visits via `sessionStorage` — never gates on anything
- **Page transitions:** ~200 ms fade/rise (client wrapper); the full AERO COTTON mark transition was deliberately *not* applied to every navigation — it compounds into a slow-feeling site. Reserved for hero→collection moments.
- `Reveal` motion primitives; `prefers-reduced-motion` respected globally

**Exit criteria:** keyboard-navigable, visible focus states, no layout shift.
**Status:** ✅

---

## Phase 5 — Signature 3D Hero ("Ten Landscapes, One Thread")

- Procedural fabric shader — **no downloadable 3D models**; pointer-reactive drape, lighting response
- Palette re-dye: switching collection tabs crossfades the shader via `--dye-a`/`--dye-b` uniforms (one uniform swap, ~zero cost) — and the CSS fallback tier re-dyes in sync
- **Four-tier performance ladder:** WebGL → static CSS gradient fallback → reduced-motion → reduced geometry on mobile

**Exit criteria:** renders smoothly on mid-range hardware; graceful fallback verified; the canvas-sizing regression found during QA (1×1 px canvas) is fixed and covered.
**Status:** ✅ (verified live: canvas 1112×806, tab → dye crossfade + screen-reader announce working)

---

## Phase 6 — Discovery Pages (Home, About, Products)

- **Home:** 7 sections — a gateway, not an encyclopedia (hero → intro → collections → craft → capability → global → CTA)
- **About:** story, journey/timeline, philosophy, values, facility, quality commitment
- **Products index:** collection grid; `/products/[collection]` and `/products/[collection]/[product]` routes
- Product detail: description, materials, applications, variations, customization, specs, related products, RFQ CTA — **no shopping cart**

**Exit criteria:** all routes pre-render; breadcrumbs + structured data on product pages.
**Status:** ✅ (verified live: products index + Beach collection render with correct dye accent)

---

## Phase 7 — Capability & Conversion Pages

- **Manufacturing:** 8-stage scroll story (material selection → weaving → dyeing → cutting → stitching → finishing → QC → packaging/export)
- **Sustainability:** responsible-production narrative with **zero invented certifications**
- **Global Presence:** export story; markets flagged `[VERIFY]` until confirmed
- **Contact/RFQ:** structured form — name, company, email, phone, country, product/collection (preselectable via URL), estimated quantity, customization, message
- **404** page

**Exit criteria:** RFQ funnel verified end-to-end: validation → server action → rate limit → delivery → success state → form reset.
**Status:** ✅ (funnel verified live in preview; delivery dev-simulated until `RESEND_API_KEY` is set)

---

## Phase 8 — RFQ Pipeline & Security

- Server-side **zod** validation; input sanitization
- Honeypot field + in-memory rate limiting (Turnstile recommended at launch)
- **Resend** transactional email; API key server-only, never shipped to the client
- Deliberately **no Supabase in v1** — fewer secrets, smaller security surface; add it only if an enquiries dashboard is requested

**Exit criteria:** no client-exposed secrets; all spam surfaces closed.
**Status:** ✅ (Turnstile + analytics pending client accounts)

---

## Phase 9 — SEO, Metadata & Performance

- Per-page metadata, canonical URLs, Open Graph (+ generated OG image), `sitemap.ts`, `robots.ts`, SVG icon
- JSON-LD Organization schema; semantic heading hierarchy; alt-text policy
- Self-hosted fonts, lazy-loaded 3D, code-split client bundles

**Exit criteria:** 33 static pages, unique title/description per route, clean production build.
**Status:** ✅

---

## Phase 10 — QA, Visual Verification & Handover

- Typecheck + production build clean
- Live verification via preview: homepage (canvas, fonts, preloader, nav), products index, collection page with dye switch, full RFQ flow, 404
- `README.md` handover doc with client fact inventory and deployment steps

**Exit criteria:** handover doc shipped; only client-dependent items remain open.
**Status:** ✅

---

## Client Input Register (blocks launch, not the build)

| # | Input | Where it lands |
|---|-------|----------------|
| 1 | Real product categories, SKUs, specs per collection | `src/content/collections.ts` |
| 2 | Certifications (OEKO-TEX / GOTS / etc.) + certificates | Sustainability, product pages |
| 3 | Confirmed export markets list | Global Presence page |
| 4 | Production capacity numbers | Manufacturing page |
| 5 | Real photography (per landscape + facility) | All imagery; dye palettes re-extracted |
| 6 | Phone, email, WhatsApp Business number | Header, footer, RFQ page |
| 7 | GSTIN / IEC / legal copy (privacy, terms) | Footer, legal pages |
| 8 | SPF / DKIM / DMARC records on aerocotton.in | Enquiry deliverability |
| 9 | Analytics + RFQ conversion events | Measurement from day one |
| 10 | Final logo / brand assets | Header, OG image, favicon |

## Launch Checklist

- [ ] Replace all `[VERIFY]` placeholders with confirmed facts
- [ ] Swap placeholder photography; re-extract the ten dye palettes from final images
- [ ] Set `RESEND_API_KEY` + route enquiries to the sales inbox
- [ ] Add Cloudflare Turnstile to the RFQ form
- [ ] WhatsApp Business click-to-chat on RFQ + footer
- [ ] Privacy policy + terms pages
- [ ] Lighthouse pass (mobile performance target ≥ 90)
- [ ] DNS email-auth records live
- [ ] Analytics + RFQ conversion tracking
- [ ] Footer reclaimed from the old agency; final brand assets in place
