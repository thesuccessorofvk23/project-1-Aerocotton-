import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import {
  company,
  values,
  aboutStory,
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

/**
 * Team floor cards — activities named in the facility copy, real photography.
 * Each card is a wide, short crop of a landscape photograph, so `focus` keeps
 * the crop window on the person in frame rather than on the frame's centre.
 */
const teamFloors = [
  { caption: "Weaving floor", image: "/images/editorial/weaving-floor.jpg", alt: "A weaver working the warp on the weaving floor", focus: "50% 44%" },
  { caption: "Stitching lines", image: "/images/editorial/textile-interior.jpg", alt: "Stitched textiles in an airy interior", focus: "50% 50%" },
  { caption: "Checking & packing", image: "/images/editorial/checking-packing.jpg", alt: "Folding checked cotton into a carton at the packing table", focus: "50% 42%" },
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
                src="/images/editorial/batik-linen-swirl.jpg"
                alt=""
                aria-hidden="true"
                className="aero-about-hero__img"
              />
              <span className="aero-about-hero__brand">AERO&nbsp;COTTON</span>
              <h1 className="aero-about-hero__title">About Us</h1>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Word from the managing director — sits directly below the banner */}
      <section className="aero-about-quote">
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
                  <img
                    src={floor.image}
                    alt={floor.alt}
                    style={{ objectPosition: floor.focus }}
                    loading="lazy"
                  />
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
