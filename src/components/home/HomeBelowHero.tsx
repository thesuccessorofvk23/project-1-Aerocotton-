import Link from "next/link";
import { allProducts } from "@/content/collections";
import { confirmedStats, company } from "@/content/company";
import { RfqForm } from "@/components/rfq/RfqForm";
import { CollectionGallery } from "@/components/home/CollectionGallery";
import { ModelShowcase, type ShowcasePiece } from "@/components/home/ModelShowcase";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";

const makingStages = [
  ["01", "Fibre", "Selected by grade, staple and hand-feel."],
  ["02", "Yarn", "Specified for the expected drape and strength."],
  ["03", "Weaving", "Built to the right structure, density and width."],
  ["04", "Processing", "Prepared for colour, finish and consistency."],
  ["05", "Finishing", "Refined for the exact application."],
  ["06", "Inspection", "Checked for shade, dimensions and construction."],
  ["07", "Packaging", "Prepared for safe shipment and delivery."],
] as const;
const guideCards = [
  { number: "01", pill: "Weaves", title: "Choosing the right weave", body: "Flatweave, terry, waffle and woven constructions.", image: "/images/editorial/woven-texture.jpg", alt: "Close view of woven cotton texture" },
  { number: "02", pill: "Weight", title: "Understanding GSM", body: "How weight changes drape, absorbency and warmth.", image: "/images/editorial/workshop-detail.jpg", alt: "Textile work in the weaving workshop" },
  { number: "03", pill: "Care", title: "Caring for cotton", body: "Simple habits that protect hand-feel and colour.", image: "/images/editorial/quiet-bedroom.jpg", alt: "Bedroom styled with cotton bedspreads" },
];
const catalogueRows = [
  { product: allProducts.find((prod) => prod.slug === "apron-design-01"), title: "Printed aprons", meta: "Apron with Gloves", year: "70 × 90 cm", image: "/images/products/apron-design-01.jpg", alt: "Apron Design-01 from the Kitchen & Table Presentation catalogue", layout: "photo-first" },
  { product: allProducts.find((prod) => prod.slug === "kitchen-towel-set-03"), title: "Kitchen towel sets", meta: "Towels", year: "50 × 70 cm · Set of 2", image: "/images/products/kitchen-towel-design-03.jpg", alt: "Kitchen Towel Set Design-03 with striped and printed towels", layout: "copy-first" },
  { product: allProducts.find((prod) => prod.slug === "cushion-design-05"), title: "Printed cushions", meta: "Cushions", year: "40 × 40 cm", image: "/images/products/cushion-design-05.jpg", alt: "Cushion Design-05 from the Kitchen & Table Presentation catalogue", layout: "photo-first" },
  { product: allProducts.find((prod) => prod.slug === "tablecloth-natural"), title: "Printed tablecloths", meta: "Table Top Cover", year: "100 × 100 cm", image: "/images/products/tablecloth-natural.jpg", alt: "Natural print tablecloth from the Kitchen & Table Presentation catalogue", layout: "copy-first" },
] as const;
/**
 * Every line-sheet item that ships with a 3D model, in catalogue order. The
 * showcase renders whatever this returns, so a new `product.model` appears in
 * section 04 without touching the section itself.
 */
const modelledPieces: ShowcasePiece[] = allProducts
  .filter((product) => product.model)
  .map((product) => ({
    href: `/products/${product.collectionSlug}/${product.slug}`,
    name: product.name,
    collectionName: product.collectionName,
    image: product.image,
    model: product.model as string,
    spec: product.specs.find((spec) => spec.label === "3D model")?.value ?? "Realtime 3D",
  }));

const whyCards = [
  {
    tone: "sky",
    title: "Material honesty",
    body: "Fibre, weave and finish are specified openly, so the cloth in hand always matches the quote.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="2.5" /><path d="M5.5 12h13M12 5.5v13" opacity="0.5" /></svg>,
  },
  {
    tone: "parchment",
    title: "Built to brief",
    body: "Dimensions, palettes, weights and finishes developed around each client's programme.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19l1.2-3.9L16.4 4.9a1.9 1.9 0 0 1 2.7 2.7L8.9 17.8 5 19z" /><path d="M14.6 6.7l2.7 2.7" /></svg>,
  },
  {
    tone: "desert",
    title: "Made under one roof",
    body: "Own weaving and stitching in Karur, with every programme checked before it is packed.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><path d="M4.5 9.8h15M4.5 14.7h15M9.8 4.5v15M14.7 4.5v15" opacity="0.7" /></svg>,
  },
  {
    tone: "moss",
    title: "Export minded",
    body: `Serving international buyers since ${company.exportingSince} with prompt, dependable delivery.`,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5" /><path d="M4.5 12h15M12 4.5c2.9 2.5 2.9 12.5 0 15M12 4.5c-2.9 2.5-2.9 12.5 0 15" opacity="0.7" /></svg>,
  },
];
const faqs = [
  ["What products do you manufacture?", "Cushion covers, table cloths, table runners, napkins, rugs, mats, curtains, bedspreads, aprons and other home textiles — woven, printed and stitched in Karur."],
  ["Can dimensions and colours be customized?", "Yes. Size, palette, weight, finish and selected details can be discussed around the programme."],
  ["Do you support private label?", "Private-label woven labels and programme-specific packaging are available for suitable orders."],
  ["What are your minimum order quantities?", "MOQ depends on the product, construction, dimensions and finish. Share your brief and we will confirm."],
  ["Do you ship internationally?", "Aerocotton entered international markets in 2015 and works with export-minded requirements."],
  ["How do buyers request a quotation?", "Use the form below with your product intent, quantities, palette and delivery timeline."],
] as const;

/**
 * Location — the client's own keyless Google Maps embed for the Karur works,
 * kept verbatim so the pin stays the one they checked. The address text on the
 * page is generated from `company.address` instead of duplicated here.
 */
const mapEmbedSrc =
  "https://maps.google.com/maps?width=600&height=400&hl=en&q=No-6%2C%20MaruthamuthuThottam%2C%20%20Vengamedu%2C%20%20Karur%20%E2%80%93%20639006%20%20Tamil%20Nadu%20%20INDIA&t=&z=15&ie=UTF8&iwloc=B&output=embed";
const mapAddressLine = [company.address.line1, company.address.line2, company.address.city, company.address.region, company.address.country].join(", ");
const mapDirectionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddressLine)}`;

export function HomeBelowHero() {
  return <div className="aero-home-lower overflow-hidden">
    <section data-luxury-section="origin" className="aero-origin bg-ivory py-24 md:py-36"><Container><Reveal className="aero-origin__inner"><p className="aero-origin__label">[ About Aero Cotton ]</p><span className="aero-origin__drop" aria-hidden="true" /><h2 className="aero-origin__statement">We make cotton textiles with clarity and care &mdash; considered materials, dependable processes, everyday comfort.</h2><Link href="/about" className="aero-arrow-link aero-origin__link">Learn more <span aria-hidden="true">&rarr;</span></Link></Reveal></Container></section>
    <section data-luxury-section="editorial" className="aero-why bg-ivory py-20 md:py-28"><Container><div className="aero-why__grid"><Reveal className="aero-why__visual"><img src="/images/editorial/quiet-bedroom.jpg" alt="Bedroom styled with Aerocotton bedspreads and cushions" /><div className="aero-why__veil" aria-hidden="true" /><div className="aero-why__visual-copy"><p className="eyebrow !text-ivory/75">02 / Why buyers choose us</p><h2 className="mt-4 font-sans text-[clamp(2.1rem,3.4vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.05em] text-ivory">Why buyers choose us.</h2></div><p className="aero-why__visual-note">Karur / Tamil Nadu · Since {company.founded}</p></Reveal><div className="aero-why__cards">{whyCards.map((card, index) => <Reveal key={card.title} delay={index * 60}><article className={`aero-why-card aero-why-card--${card.tone}`}><span className="aero-why-card__icon" aria-hidden="true">{card.icon}</span><h3>{card.title}</h3><p>{card.body}</p></article></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="feature" className="aero-feature-strip border-y border-hairline bg-linen py-10"><Container><div className="aero-feature-strip__grid">{[["01", "Material honesty", "100% cotton programmes"], ["02", "Karur made", "Tamil Nadu, India"], ["03", "Built to brief", "Size, palette and finish"], ["04", "Export minded", "International since 2015"]].map(([number, title, body]) => <div key={number}><span>{number}</span><strong>{title}</strong><small>{body}</small></div>)}</div></Container></section>
    <section data-luxury-section="campaign" className="aero-gallery-section bg-ivory py-20 md:py-28"><Container><Reveal><p className="eyebrow text-center">03 / New collection</p><h2 className="aero-gallery__heading">NEW COLLECTION</h2></Reveal><CollectionGallery /><Reveal delay={80}><div className="mt-10 flex justify-center"><Link href="/products" className="aero-gallery__view-all">VIEW ALL</Link></div></Reveal></Container></section>
    <section data-luxury-section="models" className="aero-models bg-ivory py-20 md:py-28"><Container><div className="aero-models__heading"><Reveal><p className="eyebrow">04 / Realtime 3D</p><h2 className="aero-models__title">Turn the sample over.</h2><p className="aero-models__note">Every modelled piece in the catalogue is drawn realtime in the browser from the sample&apos;s own file. Drag any one to turn it over — check the gusset depth, the fringe, the fall of the print — before a swatch is cut.</p></Reveal><Reveal delay={80}><Link href="/products" className="aero-models__cta">Browse the catalogue <span aria-hidden="true">&rarr;</span></Link></Reveal></div><ModelShowcase pieces={modelledPieces} /></Container></section>
    <section data-luxury-section="guide" className="aero-guide bg-ivory py-28 md:py-44"><Container><div className="aero-guide__heading"><Reveal><p className="eyebrow">05 / Textile guide</p><h2 className="mt-5 max-w-2xl font-display text-display-lg text-ink">A closer look at cotton.</h2></Reveal><Reveal delay={100}><Link href="/care-guide" className="aero-guide__cta">Browse the guide <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-guide__grid mt-14">{guideCards.map((card, index) => <Reveal key={card.number} delay={index * 70}><Link href="/care-guide" className="aero-guide-card"><div className="aero-guide-card__media"><img src={card.image} alt={card.alt} /><div className="aero-guide-card__shade" aria-hidden="true" /><span className="aero-guide-card__pill">{card.pill}</span><span className="aero-guide-card__arrow" aria-hidden="true">↗</span><p className="aero-guide-card__caption"><strong>{card.number}/</strong> {card.title}</p></div><span className="aero-guide-card__more">Read the note <span aria-hidden="true">→</span></span></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="catalogue" className="aero-catalogue bg-ivory py-24 md:py-32"><Container><div className="aero-catalogue__heading"><Reveal><p className="eyebrow">06 / Catalogue</p><h2 className="mt-5 max-w-2xl font-display text-display-lg text-ink">Every weave we make.</h2></Reveal><Reveal delay={100}><Link href="/products" className="aero-catalogue__cta">Browse the catalogue <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-catalogue__grid">{catalogueRows.map(({ product, title, meta, year, image, alt, layout }, index) => product && <Reveal key={product.slug} delay={index * 40} className="aero-catalogue-item"><Link href={`/products/${product.collectionSlug}/${product.slug}`} className={`aero-catalogue-row aero-catalogue-row--${layout}`}><div className="aero-catalogue-row__media"><img src={image} alt={alt} loading="lazy" /></div><div className="aero-catalogue-row__copy"><small className="aero-catalogue-row__kicker">{product.collectionName} collection</small><div className="aero-catalogue-row__body"><h3>{title}</h3><p className="aero-catalogue-row__meta">{product.name}</p><p className="aero-catalogue-row__foot">{meta}<br />{year}</p></div></div></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="insights" className="aero-insights bg-ivory py-20 md:py-32"><Container><div className="aero-insights__grid"><Reveal className="aero-insights__intro"><p className="eyebrow">07 / Textile insights</p><h2 className="mt-6 font-sans text-[clamp(2.8rem,5vw,5.8rem)] font-medium leading-[0.92] tracking-[-0.055em] text-ink">Latest insights<br />and craft.</h2><p className="mt-6 max-w-xs text-sm/relaxed text-umber">A closer look at the materials, decisions and standards that shape a finished textile.</p></Reveal><div className="aero-insights__list">{makingStages.slice(0, 4).map(([number, title, body], index) => <Reveal key={number} delay={index * 70}><Link href="/care-guide" className="aero-insight-row"><div className={`aero-insight-row__image aero-insight-row__image--${index + 1}`}><img src={index % 2 === 0 ? "/images/editorial/woven-texture.jpg" : "/images/editorial/workshop-detail.jpg"} alt="" /></div><div className="aero-insight-row__content"><small>TEXTILE NOTE · {number}</small><h3>{title}: {body.split(".")[0]}</h3><span aria-hidden="true">→</span></div></Link></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="proof" className="aero-proof-collage bg-parchment py-20 md:py-28"><Container><div className="aero-proof-collage__grid"><Reveal className="aero-proof-collage__visual"><img src="/images/editorial/workshop-detail.jpg" alt="Aero Cotton textile manufacturing" /><span>Inside the making</span></Reveal><Reveal delay={100} className="aero-proof-collage__copy"><p className="eyebrow">08 / An established standard</p><h2 className="mt-5 font-display text-display-lg text-ink">Built with experience. Delivered to specification.</h2><div className="aero-proof-collage__stats">{confirmedStats.slice(0, 4).map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><p className="mt-7 text-sm/relaxed text-umber">{company.tagline}. From fibre selection to export packing, every programme is shaped around consistency, quality and the buyer&apos;s brief.</p></Reveal></div></Container></section>
    <section data-luxury-section="faq" className="aero-faq border-t border-hairline bg-linen py-20 md:py-28"><Container><div className="aero-faq__grid"><div><p className="eyebrow">09 / Questions, answered</p><h2 className="mt-5 font-display text-display-md text-ink">Before the first order.</h2><p className="mt-5 max-w-sm text-base/loose text-umber">The practical details buyers usually want to understand first.</p></div><div className="aero-faq__list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></Container></section>
    <section data-luxury-section="location" className="aero-location bg-ivory py-20 md:py-28"><Container><div className="aero-location__grid"><Reveal className="aero-location__copy"><p className="eyebrow">10 / Where we are</p><h2 className="mt-5 font-display text-display-md text-ink">Karur, Tamil Nadu.</h2><p className="mt-5 max-w-sm text-base/loose text-umber">Own weaving, printing and stitching units, working under one roof in Karur &mdash; the textile capital of India.</p><address className="aero-location__address"><span>{company.address.line1}</span><span>{company.address.line2}</span><span>{company.address.city}</span><span>{company.address.region}, {company.address.country}</span></address><a className="aero-location__link" href={mapDirectionsHref} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a></Reveal><Reveal delay={80} className="aero-location__map"><iframe title={`Aerocotton on Google Maps — ${mapAddressLine}`} src={mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></Reveal></div></Container></section>
    <section data-luxury-section="final" className="aero-final bg-ivory"><div className="aero-final__copy"><Reveal className="aero-final__inner"><span className="aero-final__wordmark">AEROCOTTON</span><p className="aero-final__kicker">11 / Manufacturer &amp; exporter</p><h2 className="aero-final__title">Textiles made with clarity.</h2><p className="aero-final__body">From Karur to spaces around the world, made around the way your textile needs to work &mdash; fibre selected, woven and finished under one roof.</p><Link href="/contact" className="aero-final__cta">Request a quote <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-final__media"><img src="/images/editorial/cotton-fleece-rolls.jpg" alt="Rolled bolts of cream and cocoa cotton fleece" loading="lazy" /><span className="aero-final__caption">Karur / Tamil Nadu · Since {company.founded}</span></div></section>
    <section data-luxury-section="quote" className="aero-quote bg-parchment py-20 md:py-28"><Container><div className="grid gap-12 lg:grid-cols-12"><div className="lg:col-span-4"><p className="eyebrow">12 / Tell us what you are making</p><h2 className="mt-5 font-display text-display-md text-ink">Start with a brief.</h2><p className="mt-5 text-base/loose text-umber">Share the product intent, quantity, palette and delivery timeline.</p></div><div className="lg:col-span-7 lg:col-start-6"><RfqForm /></div></div></Container></section>
  </div>;
}
