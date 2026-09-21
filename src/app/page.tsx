import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { HomeBelowHero } from "@/components/home/HomeBelowHero";

export const metadata: Metadata = pageMeta({
  title: "Premium Cotton Home Textiles from Karur, India",
  description:
    "Aerocotton is a family-run manufacturer and exporter of premium home textile products based in Karur, Tamil Nadu, India, established in 2010.",
  path: "",
});

export default function HomePage() {
  return (
  <>
      <section data-luxury-section="hero" className="hero-editorial relative flex min-h-[100svh] overflow-hidden bg-cotton text-ink">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/editorial/workshop-detail.jpg"
          alt="Cotton textile work in a manufacturing workshop"
        />
        <div className="hero-editorial__grid absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 flex min-h-[100svh] w-full flex-col px-6 pb-8 pt-28 md:px-10 md:pb-10 md:pt-32">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-between">
            <div className="grid grid-cols-12 items-start gap-4 border-t border-ink/15 pt-4">
              <p className="col-span-12 text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-umber">
                Karur / India · Since 2010
              </p>
            </div>

            <div className="relative grid grid-cols-12 items-end gap-4 pb-6 md:pb-2">
              <div className="col-span-12 text-center">
                <h1 className="hero-editorial__title font-display text-[clamp(3rem,7vw,7rem)] font-medium leading-[0.95] tracking-[-0.03em] text-white">
                  <span className="block normal-case">Rare Fibre</span>
                  <span className="mt-3 block font-sans text-[clamp(0.8rem,1.3vw,1.15rem)] font-normal normal-case tracking-[0.02em]">Functional Textile</span>
                </h1>
              </div>
            </div>

            <div className="flex items-end justify-end border-t border-ink/15 pt-4 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-umber">
              <Link href="/products">
                <span className="inline-flex min-h-11 items-center">Enter collection <span aria-hidden="true" className="ml-2 text-base">→</span></span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <HomeBelowHero />
    </>
  );
}
