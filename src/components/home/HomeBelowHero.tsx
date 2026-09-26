import Link from "next/link";
import { collections } from "@/content/collections";
import { confirmedStats, company } from "@/content/company";
import { RfqForm } from "@/components/rfq/RfqForm";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const featuredCollections = [collections[0], collections[1], collections[2], collections[3]];
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
  { collection: collections[0], title: "Everyday throws", meta: "Throws & blankets", year: "Established 2010", image: "/images/editorial/campaign-nature.jpg", alt: "Nature collection throw in a calm interior", layout: "photo-first" },
  { collection: collections[1], title: "Woven blankets", meta: "Throws & blankets", year: "International 2015", image: "/images/editorial/woven-texture.jpg", alt: "Close weave of a Mountain collection blanket", layout: "copy-first" },
  { collection: collections[2], title: "Flatweave towels", meta: "Towels", year: "Crafted in Karur", image: "/images/editorial/textile-interior.jpg", alt: "Beach collection towels in an airy interior", layout: "photo-first" },
  { collection: collections[3], title: "Terry towel sets", meta: "Towels", year: "Built to brief", image: "/images/editorial/workshop-detail.jpg", alt: "City collection terry towel in the workshop", layout: "photo-first" },
  { collection: collections[4], title: "Waffle robes", meta: "Robes", year: "Quality checked", image: "/images/editorial/quiet-bedroom.jpg", alt: "Forest collection waffle robes in a bedroom", layout: "photo-first" },
] as const;
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
  ["What products do you manufacture?", "Towels, throws, blankets, bedding, robes and other cotton home textiles."],
  ["Can dimensions and colours be customized?", "Yes. Size, palette, weight, finish and selected details can be discussed around the programme."],
  ["Do you support private label?", "Private-label woven labels and programme-specific packaging are available for suitable orders."],
  ["What are your minimum order quantities?", "MOQ depends on the product, construction, dimensions and finish. Share your brief and we will confirm."],
  ["Do you ship internationally?", "Aerocotton entered international markets in 2015 and works with export-minded requirements."],
  ["How do buyers request a quotation?", "Use the form below with your product intent, quantities, palette and delivery timeline."],
] as const;

function ProductCard({ collection, index }: { collection: (typeof featuredCollections)[number]; index: number }) {
  const product = collection.products[0];
  return <Link href={`/products/${collection.slug}`} className="aero-campaign-card group">
    <div className={`aero-campaign-card__visual aero-campaign-card__visual--${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true" /></div>
    <div className="aero-campaign-card__meta"><strong>{product.name}</strong><small>{collection.name} · {product.category}</small><em>{product.variants[0] ?? "Natural"}</em><div className="aero-campaign-card__actions"><span>View collection</span><span aria-hidden="true">→</span></div></div>
  </Link>;
}

function Campaign({ index, title, body }: { index: number; title: string; body: string }) {
  return <section data-luxury-section="campaign" className={`aero-campaign aero-campaign--${index + 1} ${index === 0 ? "aero-campaign--primary" : ""}`}>
    <div className="aero-campaign__shell">
      <img src="/images/editorial/campaign-nature.jpg" alt="A calm textile-led lifestyle scene" />
      <div className="aero-campaign__veil" />
      <Container className="relative z-10"><Reveal className="aero-campaign__copy"><p className="eyebrow !text-ivory/80">0{index + 3} / Collection story</p><h2 className="mt-4 max-w-xl font-sans text-[clamp(3rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.055em] text-ivory">{title}</h2><p className="mt-5 max-w-sm text-sm/relaxed text-ivory/80">{body}</p></Reveal><div className="aero-campaign__rail">{featuredCollections.map((item, itemIndex) => <ProductCard key={item.slug} collection={item} index={itemIndex} />)}</div></Container>
    </div>
  </section>;
}

export function HomeBelowHero() {
  return <div className="aero-home-lower overflow-hidden">
    <section data-luxury-section="origin" className="aero-origin bg-ivory py-24 md:py-36"><Container><Reveal className="aero-origin__inner"><p className="aero-origin__label">[ About Aero Cotton ]</p><span className="aero-origin__drop" aria-hidden="true" /><h2 className="aero-origin__statement">We make cotton textiles with clarity and care &mdash; considered materials, dependable processes, everyday comfort.</h2><Link href="/about" className="aero-arrow-link aero-origin__link">Learn more <span aria-hidden="true">&rarr;</span></Link></Reveal></Container></section>
    <section data-luxury-section="editorial" className="aero-why bg-ivory py-20 md:py-28"><Container><div className="aero-why__grid"><Reveal className="aero-why__visual"><img src="/images/editorial/quiet-bedroom.jpg" alt="Bedroom styled with Aerocotton bedspreads and cushions" /><div className="aero-why__veil" aria-hidden="true" /><div className="aero-why__visual-copy"><p className="eyebrow !text-ivory/75">02 / Why buyers choose us</p><h2 className="mt-4 font-sans text-[clamp(2.1rem,3.4vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.05em] text-ivory">Why buyers choose us.</h2></div><p className="aero-why__visual-note">Karur / Tamil Nadu · Since {company.founded}</p></Reveal><div className="aero-why__cards">{whyCards.map((card, index) => <Reveal key={card.title} delay={index * 60}><article className={`aero-why-card aero-why-card--${card.tone}`}><span className="aero-why-card__icon" aria-hidden="true">{card.icon}</span><h3>{card.title}</h3><p>{card.body}</p></article></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="feature" className="aero-feature-strip border-y border-hairline bg-linen py-10"><Container><div className="aero-feature-strip__grid">{[["01", "Material honesty", "100% cotton programmes"], ["02", "Karur made", "Tamil Nadu, India"], ["03", "Built to brief", "Size, palette and finish"], ["04", "Export minded", "International since 2015"]].map(([number, title, body]) => <div key={number}><span>{number}</span><strong>{title}</strong><small>{body}</small></div>)}</div></Container></section>
    <Campaign index={0} title="Nature, in the everyday." body="Botanical greens and soft constructions for the textiles that get reached for daily." />
    <section data-luxury-section="guide" className="aero-guide bg-ivory py-28 md:py-44"><Container><div className="aero-guide__heading"><Reveal><p className="eyebrow">04 / Textile guide</p><h2 className="mt-5 max-w-2xl font-display text-display-lg text-ink">A closer look at cotton.</h2></Reveal><Reveal delay={100}><Link href="/care-guide" className="aero-guide__cta">Browse the guide <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-guide__grid mt-14">{guideCards.map((card, index) => <Reveal key={card.number} delay={index * 70}><Link href="/care-guide" className="aero-guide-card"><div className="aero-guide-card__media"><img src={card.image} alt={card.alt} /><div className="aero-guide-card__shade" aria-hidden="true" /><span className="aero-guide-card__pill">{card.pill}</span><span className="aero-guide-card__arrow" aria-hidden="true">↗</span><p className="aero-guide-card__caption"><strong>{card.number}/</strong> {card.title}</p></div><span className="aero-guide-card__more">Read the note <span aria-hidden="true">→</span></span></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="catalogue" className="aero-catalogue bg-ivory py-24 md:py-32"><Container><div className="aero-catalogue__head"><Reveal className="aero-catalogue__head-cell"><p className="eyebrow">05 / Catalogue</p></Reveal><Reveal delay={60} className="aero-catalogue__head-cell"><h2 className="aero-catalogue__title">Catalogue</h2></Reveal><Reveal delay={120} className="aero-catalogue__head-cell"><nav aria-label="Catalogue links" className="aero-catalogue__nav"><Link href="/products">Search</Link><Link href="/contact">Contact</Link></nav></Reveal><div className="aero-catalogue__head-cell" aria-hidden="true" /></div><div className="aero-catalogue__grid">{catalogueRows.map(({ collection, title, meta, year, image, alt, layout }, index) => <Reveal key={collection.slug} delay={index * 40} className="aero-catalogue-item"><Link href={`/products/${collection.slug}`} className={`aero-catalogue-row aero-catalogue-row--${layout}`}><div className="aero-catalogue-row__media"><img src={image} alt={alt} loading="lazy" /></div><div className="aero-catalogue-row__copy"><small className="aero-catalogue-row__kicker">{collection.name} collection</small><div className="aero-catalogue-row__body"><h3>{title}</h3><p className="aero-catalogue-row__meta">{collection.intro}</p><p className="aero-catalogue-row__foot">{meta}<br />{year}</p></div></div></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="insights" className="aero-insights bg-ivory py-20 md:py-32"><Container><div className="aero-insights__grid"><Reveal className="aero-insights__intro"><p className="eyebrow">06 / Textile insights</p><h2 className="mt-6 font-sans text-[clamp(2.8rem,5vw,5.8rem)] font-medium leading-[0.92] tracking-[-0.055em] text-ink">Latest insights<br />and craft.</h2><p className="mt-6 max-w-xs text-sm/relaxed text-umber">A closer look at the materials, decisions and standards that shape a finished textile.</p></Reveal><div className="aero-insights__list">{makingStages.slice(0, 4).map(([number, title, body], index) => <Reveal key={number} delay={index * 70}><Link href="/care-guide" className="aero-insight-row"><div className={`aero-insight-row__image aero-insight-row__image--${index + 1}`}><img src={index % 2 === 0 ? "/images/editorial/woven-texture.jpg" : "/images/editorial/workshop-detail.jpg"} alt="" /></div><div className="aero-insight-row__content"><small>TEXTILE NOTE · {number}</small><h3>{title}: {body.split(".")[0]}</h3><span aria-hidden="true">→</span></div></Link></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="proof" className="aero-proof-collage bg-parchment py-20 md:py-28"><Container><div className="aero-proof-collage__grid"><Reveal className="aero-proof-collage__visual"><img src="/images/editorial/workshop-detail.jpg" alt="Aero Cotton textile manufacturing" /><span>Inside the making</span></Reveal><Reveal delay={100} className="aero-proof-collage__copy"><p className="eyebrow">07 / An established standard</p><h2 className="mt-5 font-display text-display-lg text-ink">Built with experience. Delivered to specification.</h2><div className="aero-proof-collage__stats">{confirmedStats.slice(0, 4).map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><p className="mt-7 text-sm/relaxed text-umber">{company.tagline}. From fibre selection to export packing, every programme is shaped around consistency, quality and the buyer&apos;s brief.</p></Reveal></div></Container></section>
    <section data-luxury-section="faq" className="aero-faq border-t border-hairline bg-linen py-20 md:py-28"><Container><div className="aero-faq__grid"><div><p className="eyebrow">08 / Questions, answered</p><h2 className="mt-5 font-display text-display-md text-ink">Before the first order.</h2><p className="mt-5 max-w-sm text-base/loose text-umber">The practical details buyers usually want to understand first.</p></div><div className="aero-faq__list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></Container></section>
    <section data-luxury-section="final" className="aero-final relative overflow-hidden bg-ink py-20 text-ivory md:py-28"><div className="aero-final__wash" aria-hidden="true" /><Container className="relative z-10"><p className="eyebrow !text-fog">09 / Begin a programme</p><h2 className="mt-5 max-w-4xl font-display text-display-xl text-ivory">Textiles made with clarity.</h2><p className="mt-5 max-w-lg text-lg/loose text-fog">From Karur to spaces around the world, made around the way your textile needs to work.</p><ButtonLink href="/contact" variant="outline" className="!border-white/30 !text-ivory hover:!border-white hover:!bg-white hover:!text-ink mt-8">Request a quote</ButtonLink></Container></section>
    <section data-luxury-section="quote" className="aero-quote bg-parchment py-20 md:py-28"><Container><div className="grid gap-12 lg:grid-cols-12"><div className="lg:col-span-4"><p className="eyebrow">10 / Tell us what you are making</p><h2 className="mt-5 font-display text-display-md text-ink">Start with a brief.</h2><p className="mt-5 text-base/loose text-umber">Share the product intent, quantity, palette and delivery timeline.</p></div><div className="lg:col-span-7 lg:col-start-6"><RfqForm /></div></div></Container></section>
  </div>;
}
