import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = pageMeta({
  title: "Manufacturing — from fibre to export carton",
  description:
    "How Aerocotton weaves: eight stages from material selection to export packing, with inspection at every gate. Karur, Tamil Nadu.",
  path: "/manufacturing",
});

const STAGES = [
  {
    title: "Material selection",
    body: "Cotton is chosen by staple, grade and hand-feel for each programme. Yarn is specified before the first warp is dressed — the cloth is decided before it exists.",
  },
  {
    title: "Weaving",
    body: "Looms are set to buyer tolerance: weave structure, density, width. First-piece approval is standard before a run proceeds.",
  },
  {
    title: "Dyeing",
    body: "Reactive dyeing to buyer lab-dips, with colourfastness targets specified per programme. Shade approval happens at the lab, not after the fact.",
  },
  {
    title: "Cutting",
    body: "Panels are cut to specified dimensions with documented allowances, so a towel ordered at 70 × 140 cm arrives at 70 × 140 cm.",
  },
  {
    title: "Stitching",
    body: "Hems, borders and bindings are sewn to stitch specification. Edge work is where premium cloth is won or lost, and it is checked as its own stage.",
  },
  {
    title: "Finishing",
    body: "Singe, mercerise, calender — finishing is applied only as specified, because a finish that was never asked for is a defect with good lighting.",
  },
  {
    title: "Quality control",
    body: "Piece-by-piece inspection at the checking tables: dimensions, weight, shade, construction, and appearance. Failures are mended or pulled, never shipped with a note.",
  },
  {
    title: "Packaging & export",
    body: "Export-grade packing, buyer-labelled, container-loaded and documented in-house. The carton that leaves Karur is the carton that opens in the buyer's warehouse.",
  },
] as const;

export default function ManufacturingPage() {
  return (
    <>
      <section className="aero-page-hero border-b border-hairline bg-linen pb-20 pt-40">
        <Container>
          <p className="eyebrow">Manufacturing</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-xl text-ink">
            Eight gates.
            <br />
            No shortcuts.
          </h1>
          <p className="mt-8 max-w-2xl text-lg/loose text-umber">
            Every programme passes the same eight stages — each with a defined
            specification and an owner. Capacity figures and machinery counts
            are shared on request during enquiries; this page describes how the
            mill thinks, not just what it owns.
          </p>
        </Container>
      </section>

      {/* Process stages */}
      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The process"
              title="Material to carton, in order."
            />
          </Reveal>
          <ol className="mt-16 border-t border-hairline">
            {STAGES.map((stage, i) => (
              <Reveal key={stage.title} delay={Math.min(i * 60, 240)}>
                <li className="group grid gap-4 border-b border-hairline py-10 md:grid-cols-12 md:items-baseline">
                  <p className="font-display text-3xl text-brass-deep md:col-span-2">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-2xl text-ink md:col-span-4">
                    {stage.title}
                  </h3>
                  <p className="max-w-xl text-sm/relaxed text-umber md:col-span-6">
                    {stage.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
          <p className="mt-8 text-2xs uppercase tracking-[0.2em] text-taupe">
            Scroll — each stage is one gate the cloth must pass.
          </p>
        </Container>
      </section>

      {/* QC commitment */}
      <section className="bg-cocoa py-24 text-ivory md:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow !text-fog">Quality control</p>
              <h2 className="font-display mt-5 text-display-md text-ivory">
                The spec sheet is the contract.
              </h2>
              <p className="mt-7 max-w-lg text-base/loose text-fog">
                Buyers receive what was specified — GSM, dimensions, shade,
                construction — with inspection records available per programme.
                If a specification cannot be met, we say so before the order,
                not after the shipment.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <ul className="space-y-5 border-l-2 border-brass/50 pl-8">
                {[
                  "Specifications agreed in writing before weaving begins",
                  "In-process checks at weave, dye and finishing stages",
                  "Final piece-by-piece inspection before packing",
                  "Buyer inspections and third-party audits welcomed",
                ].map((item) => (
                  <li key={item} className="text-sm/relaxed text-fog">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Custom manufacturing */}
      <section className="bg-parchment py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <Reveal>
              <p className="eyebrow">Custom manufacturing</p>
              <h2 className="font-display mt-4 max-w-xl text-display-sm text-ink">
                Bring a spec sheet, a sketch, or a swatch.
              </h2>
              <p className="mt-5 max-w-xl text-base/loose text-umber">
                Buyer palettes, private-label weaving, custom constructions and
                packaging are part of the mill's normal work — not a special
                favour.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <ButtonLink href="/contact?product=Custom%20manufacturing" size="lg">
                Discuss a programme
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
