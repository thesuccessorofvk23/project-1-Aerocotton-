import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import {
  company,
  journey,
  values,
  aboutStory,
  aboutCapabilities,
  aboutQuote,
  aboutLetter,
  productRange,
} from "@/content/company";

export const metadata: Metadata = pageMeta({
  title: "About — a family-run cotton house",
  description:
    "Aerocotton is a manufacturer and exporter of home textiles based in Karur, Tamil Nadu, India — with its own weaving and stitching units, a network of printing, and over 15 years of textile export experience.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="aero-page-hero border-b border-hairline bg-linen pb-20 pt-40">
        <Container>
          <p className="eyebrow">About Aerocotton</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-xl text-ink">
            A family, a town,
            <br />
            and one fibre.
          </h1>
          <p className="mt-8 max-w-2xl text-lg/loose text-umber">
            Aerocotton is a manufacturer and exporter of premium home textiles
            based in {company.city} — the textile capital of India — with its
            own weaving and stitching units and a network of printing.
          </p>
        </Container>
      </section>

      {/* Our story — scroll-paced word reveal */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow">Our story</p>
                <h2 className="font-display mt-5 text-display-md text-ink">
                  Started for the craft. Kept for the people.
                </h2>
                <p className="mt-6 text-2xs uppercase tracking-[0.24em] text-taupe">
                  From {company.city}, {company.region}
                </p>
              </Reveal>
            </div>
            <div className="space-y-10 lg:col-span-7 lg:col-start-6">
              {aboutStory.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "text-xl/loose text-ink"
                      : "text-lg/loose text-umber"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Product range */}
      <section className="border-y border-hairline bg-parchment py-20 md:py-24">
        <Container>
          <Reveal>
            <p className="eyebrow">What we make</p>
            <h2 className="font-display mt-5 max-w-3xl text-display-md text-ink">
              One range, woven every way the trade asks for.
            </h2>
          </Reveal>
          <ul className="mt-12 flex flex-wrap gap-3">
            {productRange.map((item, i) => (
              <li
                key={item}
                className="border border-hairline bg-ivory px-5 py-2.5 text-sm text-umber"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                {item}
              </li>
            ))}
          </ul>
          <Reveal delay={120}>
            <p className="mt-8 max-w-2xl text-base/loose text-umber">
              Woven plain, striped, checked and in dobby and jacquard — solid
              and multicolour, printed by pigment and rotary, embroidered on
              very large hook designs, and finished with lurex products, fancy
              fringes and beads.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Capabilities */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Capabilities"
              title="Equipped from yarn to export carton."
              lede="Vertical control under our own roof, backed by a network of printing partners — so the cloth a buyer approves is the cloth that ships."
            />
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-3">
            {aboutCapabilities.map((capability, i) => (
              <div key={capability.title} className="bg-ivory p-10">
                <p className="font-display text-3xl text-brass-deep">
                  0{i + 1}
                </p>
                <h3 className="font-display mt-4 text-2xl text-ink">
                  {capability.title}
                </h3>
                <p className="mt-4 text-sm/relaxed text-umber">
                  {capability.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Journey timeline */}
      <section className="bg-cocoa py-24 text-ivory md:py-32">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Our journey"
              title="Milestones, honestly kept."
              tone="ivory"
            />
          </Reveal>
          <ol className="mt-16 grid gap-10 md:grid-cols-4">
            {journey.map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <li className="border-t-2 border-brass/60 pt-6">
                  <p className="font-display text-3xl text-brass">{item.year}</p>
                  <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-ivory">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm/relaxed text-fog">{item.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Quote — from the company profile letter */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <Reveal>
            <blockquote className="mx-auto max-w-4xl text-center">
              <p className="font-display text-display-md text-ink">
                &ldquo;{aboutQuote.text}&rdquo;
              </p>
              <footer className="mt-8 text-2xs uppercase tracking-[0.24em] text-taupe">
                — {aboutQuote.author}, {aboutQuote.role}
              </footer>
            </blockquote>
          </Reveal>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-linen py-24 md:py-32">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Our values"
              title="Four rules the looms answer to."
            />
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-2">
            {values.map((value, i) => (
              <div key={value.title} className="bg-ivory p-10">
                <p className="font-display text-3xl text-brass-deep">0{i + 1}</p>
                <h3 className="font-display mt-4 text-2xl text-ink">{value.title}</h3>
                <p className="mt-4 text-sm/relaxed text-umber">{value.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Facility + quality commitment */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="editorial-media-frame aspect-[4/3] w-full border border-hairline bg-cotton">
                <img src="/images/editorial/workshop-detail.jpg" alt="Textile workshop detail" className="h-full w-full object-cover" />
              </div>
            </Reveal>
            <div>
              <Reveal delay={120}>
                <p className="eyebrow">The facility</p>
                <h2 className="font-display mt-5 text-display-sm text-ink">
                  Where the cloth is born.
                </h2>
                <p className="mt-6 text-base/loose text-umber">
                  Our Karur facility pairs loom floors with in-house checking,
                  mending and packing. Buyers are welcome to visit — seeing the
                  cloth made has closed more orders than any brochure.
                </p>
                <p className="mt-4 text-base/loose text-umber">
                  Behind it stands a team with more than 15 years of experience
                  across every aspect of the textile export business, in a
                  continuous process of expansion and enhancement —
                  incorporating the latest technological innovations so
                  customers get the best quality at competitive prices.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Letter CTA */}
      <section className="border-t border-hairline bg-parchment py-20">
        <Container>
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <Reveal>
              <div className="max-w-xl">
                <p className="eyebrow">A note from Aerocotton</p>
                <p className="mt-5 text-lg/loose text-umber">
                  &ldquo;{aboutLetter}&rdquo;
                </p>
                <p className="mt-4 text-2xs uppercase tracking-[0.24em] text-taupe">
                  — {aboutQuote.author}, {aboutQuote.role}, Aerocotton
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="flex flex-wrap gap-4">
                <ButtonLink href="/products">Explore collections</ButtonLink>
                <ButtonLink href="/contact" variant="outline">
                  Request samples
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
