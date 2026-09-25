/**
 * AERO COTTON — company facts.
 *
 * CONFIRMED facts below were taken from the live site (aerocotton.in, Sept 2026)
 * and are safe to render. Items listed in PENDING must not be displayed until
 * Aerocotton confirms them in writing — they are tracked in the handover
 * fact inventory (README) and block specific pages:
 *
 *   PENDING: certifications (GOTS / OEKO-TEX / ISO…)   → Sustainability
 *   PENDING: export country list                        → Global Presence
 *   PENDING: machinery / capacity figures               → (Manufacturing page removed)
 *   PENDING: product categories per collection          → Products copy
 *   PENDING: phone, email, registrations (IEC/GSTIN)    → Contact, Footer
 */

export const company = {
  name: "Aero Cotton",
  legalName: "Aerocotton",
  tagline: "Luxury Comfort in Every Thread",
  city: "Karur",
  region: "Tamil Nadu",
  country: "India",
  /** CONFIRMED — "Established in 2010" (live site). */
  founded: 2010,
  /** CONFIRMED — "entering the international market in 2015" (live site). */
  exportingSince: 2015,
  /** CONFIRMED — family-run (live site). */
  familyRun: true,
  address: {
    line1: "No 6, Maruthamuthu Thottam",
    line2: "Vengamedu",
    city: "Karur 639006",
    region: "Tamil Nadu",
    country: "India",
  },
  /**
   * PLACEHOLDER contact routes — replace with confirmed details before launch.
   * The site renders gracefully without them (form + WhatsApp only).
   */
  contact: {
    email: null as string | null,
    phone: null as string | null,
    /** WhatsApp Business deep link target — number required before launch. */
    whatsapp: null as string | null,
  },
} as const;

/** Facts rendered as narrative stats (home, about). CONFIRMED only. */
export const confirmedStats = [
  {
    value: "2010",
    label: "Established in Karur, Tamil Nadu",
  },
  {
    value: "2015",
    label: "First international shipment",
  },
  {
    value: "15+",
    label: "Years of textile craft",
  },
  {
    value: "10",
    label: "Signature collections",
  },
] as const;

/**
 * Journey timeline (About page). CONFIRMED anchors only; intermediate
 * milestones are [CLIENT] prompts to be filled in the discovery workshop.
 */
export const journey = [
  {
    year: "2010",
    title: "The first loom",
    body: "Aerocotton is established in Karur by a family of weavers, beginning with a simple conviction: cotton, done properly, speaks for itself.",
  },
  {
    year: "2015",
    title: "Crossing waters",
    body: "The first international order ships. Quality built for Indian homes proves itself in markets with far less patience for shortcuts.",
  },
  {
    year: "[CLIENT]",
    title: "Milestone — to confirm",
    body: "[Reserved for a confirmed milestone: capacity expansion, first flagship client, certification, or facility move.]",
  },
  {
    year: "Today",
    title: "Ten landscapes, one thread",
    body: "Ten signature collections — each named for a landscape — carry the same Karur cotton to homes and businesses around the world.",
  },
] as const;

/** Values (About page). Editorial; safe — no verifiable claims. */
export const values = [
  {
    title: "Material honesty",
    body: "We specify what the cloth is and let it perform. No embellishment of fibre, count, or origin — the product must survive its label being checked.",
  },
  {
    title: "Quiet precision",
    body: "Measurements, tolerances, finishing. Craft shows itself most clearly in the details a customer never has to think about.",
  },
  {
    title: "Long relationships",
    body: "Family-run means we plan in decades, not seasons. Buyers return because the eighth order matches the first.",
  },
  {
    title: "Continuous care",
    body: "From fibre selection to export packing, every stage is owned by someone whose name we know. Responsibility that doesn't outsource.",
  },
] as const;

/* ────────────────────────────────────────────────────────────────────────
 * About page — company profile content.
 * CONFIRMED via client-provided company profile (Sept 2026). Product range,
 * capabilities, quality & delivery claims and the quoted note are taken
 * directly from Aerocotton's own profile text.
 * ──────────────────────────────────────────────────────────────────────── */

/** Story paragraphs (About page) — rendered with the scroll-paced text reveal. */
export const aboutStory = [
  "Aerocotton is a prominent manufacturer and exporter of home textiles, based in Karur — the textile capital of India. We are highly equipped with a network of printing and our own weaving and stitching units, producing cloth that crosses oceans and holds its own.",
  "Our range spans bedspreads, curtains, cushion covers, table cloths, table runners, napkins, rugs, mats, furnishing fabrics and carpets — woven plain, striped, checked, in dobby and jacquard, in solid and multicolour, printed by pigment and rotary, embroidered on very large hook designs, and finished with lurex, fancy fringes and beads.",
  "We also undertake any specific developments our clients require. A continuous process of expansion, enhancement and the latest technological innovations ensures the best quality items at competitive prices — robust quality checking and prompt delivery until the customer is fully satisfied.",
] as const;

/** Capability cards (About page). */
export const aboutCapabilities = [
  {
    title: "Own weaving & stitching unit",
    body: "Vertical control from yarn to finished made-up. Cloth is woven, cut and stitched under our own roof in Karur, then checked before it is packed for export.",
  },
  {
    title: "Network of printing",
    body: "Pigment and rotary printing across plains, stripes, checks, dobby and jacquard weaves — in solid and multicolour, matched to each client's brief.",
  },
  {
    title: "Bespoke developments",
    body: "We undertake any specific developments a client may require — from construction and colour to embroidery — with samples sent for quality evaluation on request.",
  },
] as const;

/** Product range chips (About page). From the confirmed profile product list. */
export const productRange = [
  "Bedspreads",
  "Curtains",
  "Cushion covers",
  "Table cloths",
  "Table runners",
  "Napkins",
  "Rugs",
  "Mats",
  "Furnishing fabrics",
  "Carpets",
  "Baby products",
  "Tote bags",
] as const;

/** Quoted line (About page). From the profile letter. */
export const aboutQuote = {
  text: "The success behind Aerocotton is maintaining good relationships with customers, timely production and prompt ETD.",
  author: "Mrs. Rooba. S",
  role: "Managing Director",
} as const;

/** Letter excerpt (About page). From the profile letter. */
export const aboutLetter =
  "We are capable of supplying large as well as small quantities as per our client's requirement. If you would like to see our samples for quality evaluation, we will send samples to you very soon." as const;
