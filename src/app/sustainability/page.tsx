import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = pageMeta({
  title: "Sustainability — responsible production, stated carefully",
  description:
    "Aerocotton's approach to materials, production practices and resource management in Karur, Tamil Nadu. Certification details shared on request.",
  path: "/sustainability",
});

export default function SustainabilityPage() {
  return (
    <>
      <section className="aero-page-hero border-b border-hairline bg-linen pb-20 pt-40">
        <Container>
          <p className="eyebrow">Sustainability</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-xl text-ink">
            Stated carefully,
            <br />
            practised daily.
          </h1>
          <p className="mt-8 max-w-2xl text-lg/loose text-umber">
            Environmental claims are easy to make and hard to keep. This page
            describes how we work; certifications and audit summaries are shared
            directly with buyers during enquiries, where they can be verified in
            context.
          </p>
        </Container>
      </section>

      <section className="bg-ivory py-24 md:py-32">
        <Container>
          <div className="grid gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-2">
            {[
              {
                title: "Materials",
                body: "Cotton is selected by grade and staple for longevity — a textile that lasts twice as long halves its own footprint. Programme-specific fibre documentation is available to buyers.",
              },
              {
                title: "Responsible production",
                body: "Dyeing and finishing are run to buyer specifications with colourfastness targets, reducing rejection and rework — the least glamorous and most effective form of waste reduction.",
              },
              {
                title: "Resource management",
                body: "Water and energy discipline is part of daily mill management in Karur's climate. Detailed usage practices are discussed openly during facility visits and audits.",
              },
              {
                title: "Waste reduction",
                body: "Specification-first production means fewer rejected lots; offcuts and seconds are sorted and channelled to appropriate secondary uses rather than landfill.",
              },
              {
                title: "Packaging",
                body: "Export packing is engineered for protection with minimal material: buyer-labelled cartons, container-optimised loading, and packaging specifications agreed per programme.",
              },
              {
                title: "Future initiatives",
                body: "Certification pathways and formalised sustainability reporting are under evaluation with our buyers' requirements. This space will state achievements only once they are audited.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 100}>
                <div className="h-full bg-ivory p-10">
                  <p className="font-display text-3xl text-brass-deep">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-display mt-4 text-2xl text-ink">{item.title}</h2>
                  <p className="mt-4 text-sm/relaxed text-umber">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Honest note */}
      <section className="border-y border-hairline bg-parchment py-16">
        <Container>
          <Reveal>
            <div className="max-w-3xl">
              <p className="eyebrow">A note on claims</p>
              <p className="mt-4 text-base/loose text-umber">
                You will not find certification badges on this page yet. When
                Aerocotton holds certifications, they will be listed with their
                issuing bodies and scope — until then, we would rather show you
                the mill than a logo.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-ink py-24 text-ivory">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <Reveal>
              <h2 className="font-display max-w-xl text-display-sm text-ivory">
                Ask us the hard questions directly.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <ButtonLink
                href="/contact?product=General%20enquiry"
                size="lg"
                className="!bg-ivory !text-ink hover:!bg-brass hover:!text-ivory"
              >
                Contact the mill
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
