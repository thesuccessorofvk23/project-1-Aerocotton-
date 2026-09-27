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

/** Line icons for the three principle cards (stroke style, rendered white). */
const principleIcons = [
  // Weave — own weaving & stitching
  <svg key="weave" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h14M3 10h14M3 14h14M6 3v14M10 3v14M14 3v14" opacity="0.9" />
  </svg>,
  // Print roller — network of printing
  <svg key="print" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="14" height="5" rx="1.5" />
    <path d="M6 9v3a2 2 0 0 0 2 2h4" />
    <path d="M10 14v3" />
  </svg>,
  // Pen & rule — bespoke developments
  <svg key="bespoke" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12.5 3.5l4 4L7 17H3v-4l9.5-9.5z" />
    <path d="M10.5 5.5l4 4" />
  </svg>,
] as const;

/** Team floor cards — activities named in the facility copy, real photography. */
const teamFloors = [
  { caption: "Weaving floor", image: "/images/editorial/workshop-detail.jpg", alt: "Textile work on the weaving floor" },
  { caption: "Stitching lines", image: "/images/editorial/textile-interior.jpg", alt: "Stitched textiles in an airy interior" },
  { caption: "Checking & packing", image: "/images/editorial/woven-texture.jpg", alt: "Close view of woven cotton being checked" },
] as const;

export default function AboutPage() {
  return (
    <>
      {/* Hero — dark rounded photo card */}
      <section className="aero-about-hero-wrap">
        <Container>
          <Reveal>
            <div className="aero-about-hero">
              <img
                src="/images/editorial/workshop-detail.jpg"
                alt=""
                aria-hidden="true"
                className="aero-about-hero__img"
              />
              <span className="aero-about-hero__brand">AERO&nbsp;COTTON</span>
              <h1 className="aero-about-hero__title">About Us</h1>
              <p className="aero-about-hero__sub">
                A family, a town, and one fibre &mdash; {company.city},{" "}
                {company.region}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Principles — light rounded panel with statement + three cards */}
      <section className="aero-about-panel-wrap">
        <Container>
          <Reveal>
            <div className="aero-about-panel">
              <span className="aero-about-pill">Principles</span>
              <p className="aero-about-statement">
                Aerocotton is built on a simple idea:{" "}
                <span>quality should be specified, never claimed.</span> We
                focus on how real cloth is made.
              </p>
              <div className="aero-about-cards">
                {aboutCapabilities.map((capability, i) => (
                  <article key={capability.title} className="aero-about-card">
                    <span className="aero-about-card__icon" aria-hidden="true">
                      {principleIcons[i]}
                    </span>
                    <h3>{capability.title}</h3>
                    <p>{capability.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Our Team */}
      <section className="aero-about-team">
        <Container>
          <Reveal>
            <span className="aero-about-pill">Our Team</span>
            <h2 className="aero-about-team__heading">
              People behind every metre of cloth.
            </h2>
          </Reveal>
          <div className="aero-about-team__grid">
            {teamFloors.map((floor, i) => (
              <Reveal key={floor.caption} delay={i * 80}>
                <figure className="aero-about-team__card">
                  <img src={floor.image} alt={floor.alt} loading="lazy" />
                  <figcaption>{floor.caption}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="aero-about-team__copy">
              <p>
                Our Karur facility pairs loom floors with in-house checking,
                mending and packing. Buyers are welcome to visit &mdash; seeing
                the cloth made has closed more orders than any brochure.
              </p>
              <p>
                Behind it stands a team with more than 15 years of experience
                across every aspect of the textile export business, in a
                continuous process of expansion and enhancement &mdash;
                incorporating the latest technological innovations so customers
                get the best quality at competitive prices.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Our story */}
      <section className="aero-about-story">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="aero-about-pill">Our Story</span>
                <h2 className="aero-about-team__heading mt-5">
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
      <section className="aero-about-range">
        <Container>
          <Reveal>
            <span className="aero-about-pill">What we make</span>
            <h2 className="aero-about-team__heading mt-5 max-w-3xl">
              One range, woven every way the trade asks for.
            </h2>
          </Reveal>
          <ul className="mt-10 flex flex-wrap gap-3">
            {productRange.map((item) => (
              <li key={item} className="aero-about-chip">
                {item}
              </li>
            ))}
          </ul>
          <Reveal delay={120}>
            <p className="mt-8 max-w-2xl text-base/loose text-umber">
              Woven plain, striped, checked and in dobby and jacquard &mdash;
              solid and multicolour, printed by pigment and rotary, embroidered
              on very large hook designs, and finished with lurex products,
              fancy fringes and beads.
            </p>
          </Reveal>
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
                &mdash; {aboutQuote.author}, {aboutQuote.role}
              </footer>
            </blockquote>
          </Reveal>
        </Container>
      </section>

      {/* Values — reference card language */}
      <section className="aero-about-values">
        <Container>
          <Reveal>
            <span className="aero-about-pill">Our values</span>
            <h2 className="aero-about-team__heading mt-5">
              Four rules the looms answer to.
            </h2>
          </Reveal>
          <div className="aero-about-cards aero-about-cards--values mt-12">
            {values.map((value, i) => (
              <article key={value.title} className="aero-about-card">
                <span className="aero-about-card__icon" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Letter CTA */}
      <section className="aero-about-letter">
        <Container>
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <Reveal>
              <div className="max-w-xl">
                <span className="aero-about-pill">A note from Aerocotton</span>
                <p className="mt-5 text-lg/loose text-umber">
                  &ldquo;{aboutLetter}&rdquo;
                </p>
                <p className="mt-4 text-2xs uppercase tracking-[0.24em] text-taupe">
                  &mdash; {aboutQuote.author}, {aboutQuote.role}, Aerocotton
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
