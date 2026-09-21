import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { company, journey, values } from "@/content/company";

export const metadata: Metadata = pageMeta({
  title: "About — a family-run cotton house",
  description:
    "Established in 2010, Aerocotton is a family-run manufacturer and exporter of premium home textile products based in Karur, Tamil Nadu, India.",
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
            Established in {company.founded}, Aerocotton is a family-run
            manufacturer and exporter of premium home textile products based in
            Karur, Tamil Nadu, India.
          </p>
        </Container>
      </section>

      {/* Our story */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow">Our story</p>
                <h2 className="font-display mt-5 text-display-md text-ink">
                  Started for the craft. Kept for the people.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal delay={120}>
                <p className="text-lg/loose text-umber">
                  The mill began with a small set of looms and a conviction that
                  cotton, woven honestly, sells itself. The first years were
                  spent supplying Indian homes; by {company.exportingSince} the
                  same cloth was crossing oceans — and holding its own in
                  markets that test every seam.
                </p>
                <p className="mt-6 text-base/loose text-umber">
                  Growth was deliberately slow. Capacity was added only when
                  quality could be held; clients were added only when delivery
                  promises could be kept without excuses. Fifteen years on, the
                  business is measured less by its machinery count than by how
                  many buyers return each season.
                </p>
              </Reveal>
            </div>
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

      {/* Philosophy */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <Reveal>
            <blockquote className="mx-auto max-w-4xl text-center">
              <p className="font-display text-display-md text-ink">
                "Quality is remembered long after the price is forgotten. We
                weave for the memory."
              </p>
              <footer className="mt-8 text-2xs uppercase tracking-[0.24em] text-taupe">
                — The founding family, Aerocotton
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
                  Quality commitment: every programme is inspected at weaving,
                  dyeing and finishing stages, with specified tolerances and
                  documentation that matches the product.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline bg-parchment py-20">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <Reveal>
              <h2 className="font-display max-w-xl text-display-sm text-ink">
                Judge the cotton yourself.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <div className="flex flex-wrap gap-4">
                <ButtonLink href="/products">Explore collections</ButtonLink>
                <ButtonLink href="/contact" variant="outline">
                  Request a quote
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
