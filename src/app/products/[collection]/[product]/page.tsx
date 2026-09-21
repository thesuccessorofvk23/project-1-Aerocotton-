import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta, breadcrumbsJsonLd, productJsonLd } from "@/lib/seo";
import {
  collections,
  getCollection,
  getProduct,
  relatedProducts,
} from "@/content/collections";
import { company } from "@/content/company";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { editorialImage } from "@/lib/editorial";

/** Pre-render every product page at build time. */
export function generateStaticParams() {
  return collections.flatMap((c) =>
    c.products.map((p) => ({ collection: c.slug, product: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; product: string }>;
}): Promise<Metadata> {
  const { collection: cSlug, product: pSlug } = await params;
  const product = getProduct(cSlug, pSlug);
  if (!product) return {};
  return pageMeta({
    title: `${product.name} — ${product.collectionName} Collection`,
    description: product.description,
    path: `/products/${cSlug}/${pSlug}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ collection: string; product: string }>;
}) {
  const { collection: cSlug, product: pSlug } = await params;
  const product = getProduct(cSlug, pSlug);
  if (!product) notFound();

  const collection = getCollection(cSlug)!;
  const related = relatedProducts(product);

  const crumbs = breadcrumbsJsonLd([
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: collection.name, href: `/products/${collection.slug}` },
    { name: product.name, href: `/products/${collection.slug}/${product.slug}` },
  ]);
  const schema = productJsonLd({
    name: product.name,
    description: product.description,
    image: product.image,
    category: product.category,
    brand: company.name,
  });

  const rfqHref = `/contact?product=${encodeURIComponent(
    `${product.name} — ${collection.name} collection`
  )}`;

  return (
    <div className={collection.dyeClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Product hero */}
      <section className="aero-page-hero border-b border-hairline bg-ivory pb-16 pt-40">
        <Container>
          <nav aria-label="Breadcrumb" className="text-2xs uppercase tracking-[0.2em] text-taupe">
            <Link href="/products" className="hover:text-ink">Products</Link>
            <span className="mx-2 text-brass-deep">/</span>
            <Link href={`/products/${collection.slug}`} className="hover:text-ink">
              {collection.name}
            </Link>
            <span className="mx-2 text-brass-deep">/</span>
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <div className="aspect-[4/5] w-full overflow-hidden border border-hairline bg-cotton">
              <img src={editorialImage(collection.name)} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <div className="flex flex-col justify-center">
              <p className="eyebrow">{collection.name} collection</p>
              <h1 className="font-display mt-5 text-display-lg text-ink">
                {product.name}
              </h1>
              <p className="mt-3 font-display text-xl italic text-dye">
                {product.tagline}
              </p>
              <p className="mt-6 max-w-lg text-base/loose text-umber">
                {product.description}
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-hairline pt-6">
                <div>
                  <dt className="text-2xs uppercase tracking-[0.2em] text-taupe">Category</dt>
                  <dd className="mt-1 text-sm text-ink">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-2xs uppercase tracking-[0.2em] text-taupe">Materials</dt>
                  <dd className="mt-1 text-sm text-ink">{product.materials.join(" · ")}</dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-wrap gap-4">
                <ButtonLink href={rfqHref} size="lg">
                  Request a quote
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline" size="lg">
                  Request swatches
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Details */}
      <section className="bg-linen py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            <Reveal>
              <div>
                <h2 className="font-display text-2xl text-ink">Applications</h2>
                <ul className="mt-5 space-y-2">
                  {product.applications.map((a) => (
                    <li key={a} className="flex items-start gap-3 text-sm/relaxed text-umber">
                      <span className="mt-2 h-px w-4 flex-none bg-brass" aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <h2 className="font-display text-2xl text-ink">Available variations</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span
                      key={variant}
                      className="border border-outline bg-ivory px-4 py-2 text-2xs font-semibold uppercase tracking-[0.16em] text-umber"
                    >
                      {variant}
                    </span>
                  ))}
                </div>
                <h3 className="font-display mt-8 text-lg text-ink">Customization</h3>
                <p className="mt-3 text-sm/relaxed text-umber">{product.customization}</p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div>
                <h2 className="font-display text-2xl text-ink">Specifications</h2>
                <dl className="mt-5 divide-y divide-hairline border-y border-hairline">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-6 py-3">
                      <dt className="text-2xs uppercase tracking-[0.16em] text-taupe">
                        {spec.label}
                      </dt>
                      <dd className="text-right text-sm text-ink">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Related products */}
      <section className="bg-ivory py-20">
        <Container>
          <p className="eyebrow">Related products</p>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/products/${rel.collectionSlug}/${rel.slug}`}
                className={`group block ${rel.collectionSlug === product.collectionSlug ? collection.dyeClass : "dye-beach"}`}
              >
                <div className="aspect-[4/5] overflow-hidden border border-hairline bg-cotton">
                  <img src={editorialImage(rel.collectionName)} alt={rel.name} className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]" />
                </div>
                <p className="mt-4 text-2xs uppercase tracking-[0.2em] text-brass-deep">
                  {rel.collectionName}
                </p>
                <h3 className="font-display mt-1 text-xl text-ink">{rel.name}</h3>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* RFQ CTA */}
      <section className="bg-ink py-24 text-ivory">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <h2 className="font-display max-w-2xl text-display-sm text-ivory">
              Programme the {product.name} for your market.
            </h2>
            <ButtonLink
              href={rfqHref}
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
