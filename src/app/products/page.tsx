import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { CatalogueExplorer } from "@/components/catalogue/CatalogueExplorer";
import { allProducts, collections } from "@/content/collections";
import { PRODUCT_TAXONOMY } from "@/content/product-taxonomy";
import { editorialImage } from "@/lib/editorial";

export const metadata: Metadata = pageMeta({
  title: "Products — printed kitchen, table and home textiles from Karur",
  description:
    "Browse Aerocotton's catalogue of printed aprons, kitchen towels, cushions, chair pads, blankets, place mats, table runners and table linen, made by a family-run manufacturer and exporter in Karur, India.",
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
      department: product.department ?? "Miscellaneous",
      category: product.category,
      productType: product.productType,
      collection: product.collectionName,
      collectionSlug: product.collectionSlug,
      productSlug: product.slug,
      image: product.image.startsWith("/images/products/")
        ? product.image
        : editorialImage(product.collectionName),
      tagline: product.tagline,
      spec: `${weight ? `${weight.replace(/^~\s*/, "").replace(" GSM", " GSM")} · ` : ""}${product.materials[0] ?? "100% cotton"}`,
      gsm: gsmOf(weight),
      weaveTag: weave,
      materialTag: product.materials[0] ?? "100% cotton",
      featured: Boolean(product.featured),
      model: Boolean(product.model),
      variants: product.variants,
    };
  });

  const typeCategories = PRODUCT_TAXONOMY.flatMap(({ department, categories }) =>
    categories.map((name) => {
      const inType = products.filter((p) => p.productType === name);
      const realPhoto = inType.find((p) => p.image.startsWith("/images/products/"));
      return {
        name,
        department,
        count: inType.length,
        image:
          realPhoto?.image ??
          (inType[0] ? editorialImage(inType[0].collection) : "/images/editorial/woven-texture.jpg"),
      };
    })
  );

  const departmentCategories = PRODUCT_TAXONOMY.map(({ department }) => {
    const inDepartment = products.filter((p) => p.department === department);
    const realPhoto = inDepartment.find((p) => p.image.startsWith("/images/products/"));
    return {
      name: department,
      count: inDepartment.length,
      image:
        realPhoto?.image ??
        (inDepartment[0] ? editorialImage(inDepartment[0].collection) : "/images/editorial/woven-texture.jpg"),
    };
  });

  /** Series facet — the client's line-sheet series, kept in sheet order. */
  const SERIES_ORDER = [
    "Kitchen & Table Presentation",
    "Kitchen Towels CAD",
    "Table Presentation",
    "Autumn Cushions 2026",
    "Blankets",
    "Place Mats & Runners",
    "Cushions & Chair Pads",
    "Textiles Programme",
    "Cloth Bags",
  ];
  const seriesNames = [...new Set(products.map((p) => p.category))].sort(
    (a, b) => SERIES_ORDER.indexOf(a) - SERIES_ORDER.indexOf(b)
  );
  const seriesCategories = seriesNames.map((name) => ({
    name,
    count: products.filter((p) => p.category === name).length,
  }));

  return (
    <>
      {/* Photo hero band */}
      <section className="aero-plp-hero">
        <img
          src="/images/editorial/collection-banner.jpg"
          alt=""
          className="aero-plp-hero__img"
          aria-hidden="true"
        />
        <Container className="aero-plp-hero__inner">
          <p className="aero-plp-hero__eyebrow">Product catalogue</p>
          <h1 className="aero-plp-hero__title">Our Collection</h1>
          <p className="aero-plp-hero__lede">
            The current catalogue across nine programmes — kitchen and table
            presentation, kitchen towels, cushions and chair pads, blankets,
            place mats and runners, the textiles programme and cloth bags —
            woven, printed and stitched in Karur. Three pieces are modelled in
            three dimensions, so a buyer can turn the sample over before asking
            for it.
          </p>
        </Container>
      </section>

      <CatalogueExplorer
        products={products}
        departmentCategories={departmentCategories}
        typeCategories={typeCategories}
        seriesCategories={seriesCategories}
      />
    </>
  );
}
