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
const guideTopics = [
  ["01", "Choosing the right weave", "Flatweave, terry, waffle and woven constructions."],
  ["02", "Understanding GSM", "How weight changes drape, absorbency and warmth."],
  ["03", "Caring for cotton", "Simple habits that protect hand-feel and colour."],
  ["04", "A hospitality programme", "A practical starting point for a consistent range."],
] as const;
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
    <section data-luxury-section="origin" className="aero-origin bg-ivory py-20 md:py-32"><Container><div className="aero-origin__grid"><Reveal className="aero-origin__copy"><p className="eyebrow">01 / About Aero Cotton</p><h2 className="mt-7 max-w-4xl font-sans text-[clamp(2.8rem,5.4vw,6.3rem)] font-medium leading-[0.92] tracking-[-0.06em] text-ink">We make cotton textiles with clarity and care.</h2><p className="mt-7 max-w-xl text-base/relaxed text-umber">From Karur to spaces around the world, we bring considered materials, dependable processes and everyday comfort together.</p><ButtonLink href="/about" className="mt-9">Learn more</ButtonLink></Reveal><Reveal delay={120} className="aero-origin__panel"><div className="aero-origin__panel-top"><span>Performance</span><small>Established {company.founded}</small></div><div className="aero-origin__metric">15<sup>+</sup></div><p className="aero-origin__metric-label">years of textile craft</p><div className="aero-origin__tags"><span>Material-led</span><span>Karur made</span><span>Export minded</span><span>Built to brief</span><span>Quality checked</span><span>Made to last</span></div></Reveal></div></Container></section>
    <section data-luxury-section="editorial" className="aero-editorial-statement bg-ivory py-20 md:py-28"><Container><div className="aero-editorial-statement__grid"><Reveal className="aero-editorial-statement__copy"><p className="eyebrow">02 / The material</p><h2 className="mt-5 font-display text-display-lg text-ink">Made with attention. Designed for everyday use.</h2><p className="mt-5 max-w-md text-base/loose text-umber">From fibre selection to final inspection, every decision is made around how a textile will feel, perform and belong in the spaces around it.</p><Link href="/about" className="aero-arrow-link mt-8">Our point of view <span aria-hidden="true">↗</span></Link></Reveal><Reveal delay={100} className="aero-editorial-statement__visual"><img src="/images/editorial/workshop-detail.jpg" alt="Textile work in a manufacturing workshop" /><span>Karur / Tamil Nadu</span></Reveal></div></Container></section>
    <section data-luxury-section="feature" className="aero-feature-strip border-y border-hairline bg-linen py-10"><Container><div className="aero-feature-strip__grid">{[["01", "Material honesty", "100% cotton programmes"], ["02", "Karur made", "Tamil Nadu, India"], ["03", "Built to brief", "Size, palette and finish"], ["04", "Export minded", "International since 2015"]].map(([number, title, body]) => <div key={number}><span>{number}</span><strong>{title}</strong><small>{body}</small></div>)}</div></Container></section>
    <Campaign index={0} title="Nature, in the everyday." body="Botanical greens and soft constructions for the textiles that get reached for daily." />
    <section data-luxury-section="guide" className="aero-guide bg-ivory py-28 md:py-44"><Container><div className="aero-guide__heading"><div><p className="eyebrow">04 / Textile guide</p><h2 className="mt-5 font-display text-display-lg text-ink">A closer look at cotton.</h2></div><p className="max-w-sm text-base/loose text-umber">Useful context for choosing, specifying and caring for a textile programme.</p></div><div className="aero-guide__grid mt-12">{guideTopics.map(([number, title, body], index) => <Reveal key={number} delay={index * 60}><Link href="/care-guide" className="aero-guide-card"><div className={`aero-guide-card__image aero-guide-card__image--${index + 1}`}><span>{number}</span></div><p className="eyebrow mt-4">Guide / {number}</p><h3 className="mt-2 font-display text-display-sm text-ink">{title}</h3><p className="mt-2 text-sm/relaxed text-umber">{body}</p></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="insights" className="aero-insights bg-ivory py-20 md:py-32"><Container><div className="aero-insights__grid"><Reveal className="aero-insights__intro"><p className="eyebrow">05 / Textile insights</p><h2 className="mt-6 font-sans text-[clamp(2.8rem,5vw,5.8rem)] font-medium leading-[0.92] tracking-[-0.055em] text-ink">Latest insights<br />and craft.</h2><p className="mt-6 max-w-xs text-sm/relaxed text-umber">A closer look at the materials, decisions and standards that shape a finished textile.</p></Reveal><div className="aero-insights__list">{makingStages.slice(0, 4).map(([number, title, body], index) => <Reveal key={number} delay={index * 70}><Link href="/care-guide" className="aero-insight-row"><div className={`aero-insight-row__image aero-insight-row__image--${index + 1}`}><img src={index % 2 === 0 ? "/images/editorial/woven-texture.jpg" : "/images/editorial/workshop-detail.jpg"} alt="" /></div><div className="aero-insight-row__content"><small>TEXTILE NOTE · {number}</small><h3>{title}: {body.split(".")[0]}</h3><span aria-hidden="true">→</span></div></Link></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="proof" className="aero-proof-collage bg-parchment py-20 md:py-28"><Container><div className="aero-proof-collage__grid"><Reveal className="aero-proof-collage__visual"><img src="/images/editorial/workshop-detail.jpg" alt="Aero Cotton textile manufacturing" /><span>Inside the making</span></Reveal><Reveal delay={100} className="aero-proof-collage__copy"><p className="eyebrow">06 / An established standard</p><h2 className="mt-5 font-display text-display-lg text-ink">Built with experience. Delivered to specification.</h2><div className="aero-proof-collage__stats">{confirmedStats.slice(0, 4).map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><p className="mt-7 text-sm/relaxed text-umber">{company.tagline}. From fibre selection to export packing, every programme is shaped around consistency, quality and the buyer&apos;s brief.</p></Reveal></div></Container></section>
    <section data-luxury-section="faq" className="aero-faq border-t border-hairline bg-linen py-20 md:py-28"><Container><div className="aero-faq__grid"><div><p className="eyebrow">07 / Questions, answered</p><h2 className="mt-5 font-display text-display-md text-ink">Before the first order.</h2><p className="mt-5 max-w-sm text-base/loose text-umber">The practical details buyers usually want to understand first.</p></div><div className="aero-faq__list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></Container></section>
    <section data-luxury-section="final" className="aero-final relative overflow-hidden bg-ink py-20 text-ivory md:py-28"><div className="aero-final__wash" aria-hidden="true" /><Container className="relative z-10"><p className="eyebrow !text-fog">08 / Begin a programme</p><h2 className="mt-5 max-w-4xl font-display text-display-xl text-ivory">Textiles made with clarity.</h2><p className="mt-5 max-w-lg text-lg/loose text-fog">From Karur to spaces around the world, made around the way your textile needs to work.</p><ButtonLink href="/contact" variant="outline" className="!border-white/30 !text-ivory hover:!border-white hover:!bg-white hover:!text-ink mt-8">Request a quote</ButtonLink></Container></section>
    <section data-luxury-section="quote" className="aero-quote bg-parchment py-20 md:py-28"><Container><div className="grid gap-12 lg:grid-cols-12"><div className="lg:col-span-4"><p className="eyebrow">09 / Tell us what you are making</p><h2 className="mt-5 font-display text-display-md text-ink">Start with a brief.</h2><p className="mt-5 text-base/loose text-umber">Share the product intent, quantity, palette and delivery timeline.</p></div><div className="lg:col-span-7 lg:col-start-6"><RfqForm /></div></div></Container></section>
  </div>;
}
