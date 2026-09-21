import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta, breadcrumbsJsonLd } from "@/lib/seo";
import { collections, getCollection } from "@/content/collections";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

/** Pre-render all ten collection pages at build time. */
export function generateStaticParams() {
  return collections.map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection: slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};
  return pageMeta({
    title: `${collection.name} Collection — ${collection.intro}`,
    description: collection.story,
    path: `/products/${collection.slug}`,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const jsonLd = breadcrumbsJsonLd([
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: collection.name, href: `/products/${collection.slug}` },
  ]);

  const others = collections.filter((c) => c.slug !== collection.slug).slice(0, 4);

  return (
    <div className={collection.dyeClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero — dyed by this collection's palette */}
      <section className="aero-page-hero border-b border-hairline bg-ivory pb-16 pt-40">
        <Container>
          <nav aria-label="Breadcrumb" className="text-2xs uppercase tracking-[0.2em] text-taupe">
            <Link href="/products" className="hover:text-ink">
              Products
            </Link>
            <span className="mx-2 text-brass-deep">/</span>
            <span className="text-ink">{collection.name}</span>
          </nav>
          <h1 className="font-display mt-8 text-display-xl text-ink">
            {collection.name}
          </h1>
          <p className="mt-4 font-display text-2xl text-dye italic">
            {collection.landscape}
          </p>
          <p className="mt-7 max-w-2xl text-lg/loose text-umber">{collection.story}</p>
        </Container>
      </section>

      {/* Products in this collection */}
      <section className="bg-ivory py-20">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {collection.products.map((product, i) => (
              <Reveal key={product.id} delay={i * 80}>
                <ProductCard
                  product={{ ...product, collectionName: collection.name }}
                  href={`/products/${collection.slug}/${product.slug}`}
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Applications / customization note */}
      <section className="border-y border-hairline bg-parchment py-16">
        <Container>
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="eyebrow">Variations</p>
              <p className="mt-4 text-sm/relaxed text-umber">
                Colourways across this collection:{" "}
                {[...new Set(collection.products.flatMap((p) => p.variants))].join(" · ")}.
              </p>
            </div>
            <div>
              <p className="eyebrow">Customization</p>
              <p className="mt-4 text-sm/relaxed text-umber">
                {collection.products[0]?.customization}
              </p>
            </div>
            <div>
              <p className="eyebrow">Sample requests</p>
              <p className="mt-4 text-sm/relaxed text-umber">
                Swatch boxes covering this collection ship on request — judge
                the hand-feel before you commit a programme.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Related collections */}
      <section className="bg-ivory py-20">
        <Container>
          <p className="eyebrow">Continue through the landscapes</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {others.map((c) => (
              <Link
                key={c.slug}
                href={`/products/${c.slug}`}
                className={`group border border-hairline p-5 transition-colors hover:border-ink ${c.dyeClass}`}
              >
                <span
                  className="block h-6 w-6 rounded-full border border-outline"
                  style={{ backgroundColor: "var(--dye-a)" }}
                  aria-hidden
                />
                <span className="mt-3 block font-display text-lg text-ink">{c.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-ink py-24 text-ivory">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <h2 className="font-display max-w-2xl text-display-sm text-ivory">
              Source the {collection.name} collection.
            </h2>
            <ButtonLink
              href={`/contact?product=${encodeURIComponent(`${collection.name} collection`)}`}
              size="lg"
              className="!bg-ivory !text-ink hover:!bg-brass hover:!text-ivory"
            >
              Request a quote
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
