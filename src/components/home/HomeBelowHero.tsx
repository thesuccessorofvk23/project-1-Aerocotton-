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

const mapEmbedSrc =
  "https://maps.google.com/maps?width=600&height=400&hl=en&q=No-6%2C%20MaruthamuthuThottam%2C%20%20Vengamedu%2C%20%20Karur%20%E2%80%93%20639006%20%20Tamil%20Nadu%20%20INDIA&t=&z=15&ie=UTF8&iwloc=B&output=embed";
const mapAddressLine = [company.address.line1, company.address.line2, company.address.city, company.address.region, company.address.country].join(", ");
const mapDirectionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddressLine)}`;

export function HomeBelowHero() {
  return <div className="aero-home-lower overflow-hidden">
    <section data-luxury-section="origin" className="aero-origin bg-ivory py-24 md:py-36"><Container><Reveal className="aero-origin__inner"><p className="aero-origin__label">[ About Aero Cotton ]</p><span className="aero-origin__drop" aria-hidden="true" /><h2 className="aero-origin__statement">We make cotton textiles with clarity and care &mdash; considered materials, dependable processes, everyday comfort.</h2><Link href="/about" className="aero-arrow-link aero-origin__link">Learn more <span aria-hidden="true">&rarr;</span></Link></Reveal></Container></section>
    <section data-luxury-section="feature" className="aero-feature-strip border-y border-hairline bg-linen py-10"><Container><div className="aero-feature-strip__grid">{[["01", "Material honesty", "100% cotton programmes"], ["02", "Karur made", "Tamil Nadu, India"], ["03", "Built to brief", "Size, palette and finish"], ["04", "Export minded", "International since 2015"]].map(([number, title, body]) => <div key={number}><span>{number}</span><strong>{title}</strong><small>{body}</small></div>)}</div></Container></section>
    <section data-luxury-section="campaign" className="aero-gallery-section bg-ivory py-20 md:py-28"><Container><Reveal><p className="eyebrow text-center">01 / New collection</p><h2 className="aero-gallery__heading">NEW COLLECTION</h2></Reveal><CollectionGallery /><Reveal delay={80}><div className="mt-10 flex justify-center"><Link href="/products" className="aero-gallery__view-all">VIEW ALL</Link></div></Reveal></Container></section>
    <section data-luxury-section="models" className="aero-models bg-ivory py-20 md:py-28"><Container><div className="aero-models__heading"><Reveal><p className="eyebrow">02 / Realtime 3D</p><h2 className="aero-models__title">Turn the sample over.</h2><p className="aero-models__note">Every modelled piece in the catalogue is drawn realtime in the browser from the sample&apos;s own file. Drag any one to turn it over — check the gusset depth, the fringe, the fall of the print — before a swatch is cut.</p></Reveal><Reveal delay={80}><Link href="/products" className="aero-models__cta">Browse the catalogue <span aria-hidden="true">&rarr;</span></Link></Reveal></div><ModelShowcase pieces={modelledPieces} /></Container></section>
    <section data-luxury-section="catalogue" className="aero-catalogue bg-ivory py-24 md:py-32"><Container><div className="aero-catalogue__heading"><Reveal><p className="eyebrow">03 / Catalogue</p><h2 className="mt-5 max-w-2xl font-display text-display-lg text-ink">Every weave we make.</h2></Reveal><Reveal delay={100}><Link href="/products" className="aero-catalogue__cta">Browse the catalogue <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-catalogue__grid">{catalogueRows.map(({ product, title, meta, year, image, alt, layout }, index) => product && <Reveal key={product.slug} delay={index * 40} className="aero-catalogue-item"><Link href={`/products/${product.collectionSlug}/${product.slug}`} className={`aero-catalogue-row aero-catalogue-row--${layout}`}><div className="aero-catalogue-row__media"><img src={image} alt={alt} loading="lazy" /></div><div className="aero-catalogue-row__copy"><small className="aero-catalogue-row__kicker">{product.collectionName} collection</small><div className="aero-catalogue-row__body"><h3>{title}</h3><p className="aero-catalogue-row__meta">{product.name}</p><p className="aero-catalogue-row__foot">{meta}<br />{year}</p></div></div></Link></Reveal>)}</div></Container></section>
    <section data-luxury-section="insights" className="aero-insights bg-ivory py-20 md:py-32"><Container><div className="aero-insights__grid"><Reveal className="aero-insights__intro"><p className="eyebrow">04 / Textile insights</p><h2 className="mt-6 font-sans text-[clamp(2.8rem,5vw,5.8rem)] font-medium leading-[0.92] tracking-[-0.055em] text-ink">Latest insights<br />and craft.</h2><p className="mt-6 max-w-xs text-sm/relaxed text-umber">A closer look at the materials, decisions and standards that shape a finished textile.</p></Reveal><div className="aero-insights__list">{makingStages.slice(0, 4).map(([number, title, body], index) => <Reveal key={number} delay={index * 70}><Link href="/about" className="aero-insight-row"><div className={`aero-insight-row__image aero-insight-row__image--${index + 1}`}><img src={index % 2 === 0 ? "/images/editorial/woven-texture.jpg" : "/images/editorial/workshop-detail.jpg"} alt="" /></div><div className="aero-insight-row__content"><small>TEXTILE NOTE · {number}</small><h3>{title}: {body.split(".")[0]}</h3><span aria-hidden="true">→</span></div></Link></Reveal>)}</div></div></Container></section>
    <section data-luxury-section="proof" className="aero-proof-collage bg-parchment py-20 md:py-28"><Container><div className="aero-proof-collage__grid"><Reveal className="aero-proof-collage__visual"><img src="/images/editorial/workshop-detail.jpg" alt="Aero Cotton textile manufacturing" /><span>Inside the making</span></Reveal><Reveal delay={100} className="aero-proof-collage__copy"><p className="eyebrow">05 / An established standard</p><h2 className="mt-5 font-display text-display-lg text-ink">Built with experience. Delivered to specification.</h2><div className="aero-proof-collage__stats">{confirmedStats.slice(0, 4).map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><p className="mt-7 text-sm/relaxed text-umber">{company.tagline}. From fibre selection to export packing, every programme is shaped around consistency, quality and the buyer&apos;s brief.</p></Reveal></div></Container></section>
    <section data-luxury-section="location" className="aero-location bg-ivory py-20 md:py-28"><Container><div className="aero-location__grid"><Reveal className="aero-location__copy"><p className="eyebrow">06 / Where we are</p><h2 className="mt-5 font-display text-display-md text-ink">Karur, Tamil Nadu.</h2><p className="mt-5 max-w-sm text-base/loose text-umber">Own weaving, printing and stitching units, working under one roof in Karur &mdash; the textile capital of India.</p><address className="aero-location__address"><span>{company.address.line1}</span><span>{company.address.line2}</span><span>{company.address.city}</span><span>{company.address.region}, {company.address.country}</span></address><a className="aero-location__link" href={mapDirectionsHref} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a></Reveal><Reveal delay={80} className="aero-location__map"><iframe title={`Aerocotton on Google Maps — ${mapAddressLine}`} src={mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></Reveal></div></Container></section>
    <section data-luxury-section="final" className="aero-final bg-ivory"><div className="aero-final__copy"><Reveal className="aero-final__inner"><span className="aero-final__wordmark">AEROCOTTON</span><p className="aero-final__kicker">07 / Manufacturer &amp; exporter</p><h2 className="aero-final__title">Textiles made with clarity.</h2><p className="aero-final__body">From Karur to spaces around the world, made around the way your textile needs to work &mdash; fibre selected, woven and finished under one roof.</p><Link href="/contact" className="aero-final__cta">Request a quote <span aria-hidden="true">→</span></Link></Reveal></div><div className="aero-final__media"><img src="/images/editorial/cotton-fleece-rolls.jpg" alt="Rolled bolts of cream and cocoa cotton fleece" loading="lazy" /><span className="aero-final__caption">Karur / Tamil Nadu · Since {company.founded}</span></div></section>
    <section data-luxury-section="quote" className="aero-quote bg-parchment py-20 md:py-28"><Container><div className="grid gap-12 lg:grid-cols-12"><div className="lg:col-span-4"><p className="eyebrow">08 / Tell us what you are making</p><h2 className="mt-5 font-display text-display-md text-ink">Start with a brief.</h2><p className="mt-5 text-base/loose text-umber">Share the product intent, quantity, palette and delivery timeline.</p></div><div className="lg:col-span-7 lg:col-start-6"><RfqForm /></div></div></Container></section>
  </div>;
}
