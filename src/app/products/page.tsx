import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { collections, featuredProducts } from "@/content/collections";

export const metadata: Metadata = pageMeta({
  title: "Products — ten collections of cotton home textiles",
  description:
    "Explore Aerocotton's premium home textile products across ten collections, made by a family-run manufacturer and exporter in Karur, India.",
  path: "/products",
});

export default function ProductsPage() {
  const categories = [...new Set(featuredProducts.map((p) => p.category))];

  return (
    <>
      <section className="aero-page-hero border-b border-hairline bg-linen pb-16 pt-40">
        <Container>
          <p className="eyebrow">Products</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-xl text-ink">
            The catalogue.
          </h1>
          <p className="mt-7 max-w-2xl text-lg/loose text-umber">
            Premium home textile products presented across ten collections,
            each named for a landscape and shaped by Aerocotton's commitment to
            quality, creativity and sustainability.
          </p>
        </Container>
      </section>

      {/* Collection navigation — the landscape palette row */}
      <section className="border-b border-hairline bg-ivory py-12">
        <Container>
          <p className="text-2xs uppercase tracking-[0.24em] text-taupe">
            Browse by collection
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={`/products/${c.slug}`}
                className={`group border border-hairline p-4 transition-colors hover:border-ink ${c.dyeClass}`}
              >
                <span
                  className="block h-8 w-8 rounded-full border border-outline"
                  style={{ backgroundColor: "var(--dye-a)" }}
                  aria-hidden
                />
                <span className="mt-3 block font-display text-lg text-ink">
                  {c.name}
                </span>
                <span className="mt-1 block text-2xs text-taupe">
                  {c.products.length} product{c.products.length === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured products */}
      <section className="bg-ivory py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Featured"
              title="Where buyers usually start."
            />
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, i) => (
              <Reveal key={product.id} delay={i * 80}>
                <ProductCard
                  product={product}
                  href={`/products/${product.collectionSlug}/${product.slug}`}
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="bg-parchment py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Categories"
              title="By use, not just by look."
              lede="Programmes are built around product families; mix collections within a category to fill a container."
            />
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="border border-outline bg-ivory px-5 py-2.5 text-2xs font-semibold uppercase tracking-[0.18em] text-umber"
              >
                {cat}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Custom CTA */}
      <section className="bg-ink py-24 text-ivory">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="eyebrow justify-center !text-fog">Custom manufacturing</p>
              <h2 className="font-display mt-5 text-display-md text-ivory">
                Don't see it? It's probably a programme we already run.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base/loose text-fog">
                Buyer palettes, private-label weaving, custom sizes, packaging —
                the catalogue is the starting point, not the limit.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink
                  href="/contact"
                  size="lg"
                  className="!bg-ivory !text-ink hover:!bg-brass hover:!text-ivory"
                >
                  Start a custom enquiry
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
