import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { company } from "@/content/company";

export const metadata: Metadata = pageMeta({
  title: "Global presence — exporting from Karur since 2015",
  description:
    "Aerocotton has exported premium home textile products internationally from Karur, Tamil Nadu since 2015.",
  path: "/global-presence",
});

export default function GlobalPresencePage() {
  return (
    <>
      <section className="aero-page-hero border-b border-hairline bg-linen pb-20 pt-40">
        <Container>
          <p className="eyebrow">Global presence</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-xl text-ink">
            Woven in Karur.
            <br />
            At home in the world.
          </h1>
          <p className="mt-8 max-w-2xl text-lg/loose text-umber">
            Aerocotton has exported internationally since {company.exportingSince}.
            Our premium home textile products have reached homes around the
            globe from our base in Karur, Tamil Nadu.
          </p>
          <p className="mt-6 text-2xs uppercase tracking-[0.2em] text-taupe">
            [ Export market list — pending client confirmation ]
          </p>
        </Container>
      </section>

      {/* Origin */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow">The origin</p>
              <h2 className="font-display mt-5 text-display-md text-ink">
                Karur, Tamil Nadu.
              </h2>
              <p className="mt-6 max-w-lg text-base/loose text-umber">
                Karur is one of the great home-textile towns of the world — a
                place where weaving knowledge passes through families, and where
                the supply chain for cotton goods runs deeper than almost
                anywhere else. Being from here is not a coincidence we trade on;
                it is an advantage we maintain.
              </p>
              <p className="mt-4 text-sm text-taupe">
                {company.address.line1}, {company.address.line2},{" "}
                {company.address.city}, {company.address.region}, {company.address.country}
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="editorial-media-frame aspect-square w-full border border-hairline bg-cotton">
                <img src="/images/editorial/textile-interior.jpg" alt="Textile-led interior" className="h-full w-full object-cover" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* International customers / sectors */}
      <section className="bg-parchment py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Who we ship to"
              title="Buyers, by sector."
              lede="The same cloth, three kinds of partners — each with its own tolerances, documents and expectations."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Importers & distributors",
                body: "Container programmes across our ten collections, with documentation and continuity of supply as the first requirement.",
              },
              {
                title: "Hospitality",
                body: "Towels, robes and bedding built to laundry-cycle specifications, with programme sizing and repeat-order consistency.",
              },
              {
                title: "Retail & private label",
                body: "Collections and custom programmes under buyer labels — palettes, sizes and packaging engineered to the buyer's shelf.",
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 100}>
                <div className="h-full border border-outline bg-ivory p-8">
                  <h3 className="font-display text-2xl text-ink">{card.title}</h3>
                  <p className="mt-4 text-sm/relaxed text-umber">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Logistics / export capability */}
      <section className="bg-cocoa py-24 text-ivory md:py-32">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Export capability"
              title="The carton leaves Karur correctly."
              tone="ivory"
            />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Export packing",
                body: "Moisture-protected, container-optimised packing specified per programme.",
              },
              {
                title: "Documentation",
                body: "Commercial invoices, packing lists, certificates of origin — prepared in-house.",
              },
              {
                title: "Logistics coordination",
                body: "Freight terms (FOB / CIF / EXW) coordinated with buyer-forwarders or ours.",
              },
              {
                title: "Quality expectations",
                body: "Pre-shipment inspection to buyer standards; third-party inspection welcome.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="border-t-2 border-brass/60 pt-6">
                  <h3 className="font-display text-xl text-ivory">{item.title}</h3>
                  <p className="mt-3 text-sm/relaxed text-fog">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-ivory py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <Reveal>
              <h2 className="font-display max-w-2xl text-display-sm text-ink">
                Bring Aerocotton to your market.
              </h2>
              <p className="mt-4 max-w-xl text-base/loose text-umber">
                Tell us your market and sector — we will respond with relevant
                programmes, references and a swatch proposal.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <ButtonLink href="/contact" size="lg">
                Become a partner
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
