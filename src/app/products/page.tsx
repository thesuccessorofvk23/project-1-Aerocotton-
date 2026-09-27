import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { CatalogueExplorer } from "@/components/catalogue/CatalogueExplorer";
import { allProducts, collections } from "@/content/collections";
import { editorialImage } from "@/lib/editorial";

export const metadata: Metadata = pageMeta({
  title: "Products — ten collections of cotton home textiles",
  description:
    "Explore Aerocotton's premium home textile products across ten collections, made by a family-run manufacturer and exporter in Karur, India.",
  path: "/products",
});

/** GSM pulled from a product's spec list ("~350 GSM" → 350). */
function gsmOf(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d{3,4})/);
  return match ? Number(match[1]) : null;
}

const WEAVE_TAGS = [
  "Percale",
  "Sateen",
  "Jacquard",
  "Terry",
  "Waffle",
  "Flatweave",
  "Dobby",
  "Structure weave",
  "Quilted",
];

export default function ProductsPage() {
  const products = allProducts.map((product) => {
    const weight = product.specs.find((s) => s.label === "Weight")?.value;
    const weave =
      WEAVE_TAGS.find((tag) =>
        product.specs.some(
          (s) => s.label === "Weave" && s.value.toLowerCase().includes(tag.toLowerCase())
        )
      ) ??
      WEAVE_TAGS.find((tag) => product.materials.some((m) => m.toLowerCase().includes(tag.toLowerCase()))) ??
      "Woven";
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      collection: product.collectionName,
      collectionSlug: product.collectionSlug,
      productSlug: product.slug,
      image: editorialImage(product.collectionName),
      spec: `${weight ? `${weight.replace(/^~\s*/, "").replace(" GSM", " GSM")} · ` : ""}${product.materials[0] ?? "100% cotton"}`,
      gsm: gsmOf(weight),
      weaveTag: weave,
      materialTag: product.materials[0] ?? "100% cotton",
      featured: Boolean(product.featured),
      variants: product.variants,
    };
  });

  const categoryNames = [...new Set(products.map((p) => p.category))];
  const categories = categoryNames.map((name) => {
    const inCategory = products.filter((p) => p.category === name);
    const slug = inCategory[0]?.collectionSlug;
    const collection = collections.find((c) => c.slug === slug);
    return {
      name,
      count: inCategory.length,
      image: collection
        ? editorialImage(collection.name)
        : "/images/editorial/woven-texture.jpg",
    };
  });

  return (
    <>
      {/* Photo hero band */}
      <section className="aero-plp-hero">
        <img
          src="/images/editorial/woven-texture.jpg"
          alt=""
          className="aero-plp-hero__img"
          aria-hidden="true"
        />
        <Container className="aero-plp-hero__inner">
          <p className="aero-plp-hero__eyebrow">Product catalogue</p>
          <h1 className="aero-plp-hero__title">Our Collection</h1>
          <p className="aero-plp-hero__lede">
            Explore our range of premium home textile products, crafted for
            quality, comfort and modern living.
          </p>
        </Container>
      </section>

      <CatalogueExplorer products={products} categories={categories} />

      {/* Custom manufacturing CTA — kept from the previous page */}
      <section className="aero-plp__custom bg-ink py-20 text-ivory">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow justify-center !text-fog">Custom manufacturing</p>
            <h2 className="font-display mt-5 text-display-md text-ivory">
              Don&apos;t see it? It&apos;s probably a programme we already run.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base/loose text-fog">              Buyer palettes, private-label weaving, custom sizes, packaging —
              the catalogue is the starting point, not the limit.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
