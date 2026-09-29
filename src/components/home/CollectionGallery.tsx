import Link from "next/link";
import { collections } from "@/content/collections";

/**
 * Section 03 — "New collection" — a five-panel curved hover gallery.
 *
 * Five equal vertical panels on a subtle upward arch; hovering (or keyboard
 * focusing) a panel expands it while the others contract. Pure CSS flex-grow
 * transition — no client JS, no layout shift outside the row.
 */

export type GalleryProduct = {
  image: string;
  name: string;
  price: string;
  intro: string;
  href: string;
  /** Corner flag on the media — set for the 3D piece. */
  badge?: string;
  ariaLabel: string;
};

/** Real photography mapped per landscape. */
const PANEL_IMAGES: Record<string, string> = {
  nature: "/images/editorial/campaign-nature.jpg",
  mountain: "/images/editorial/woven-texture.jpg",
  beach: "/images/editorial/linen-folds.jpg",
  city: "/images/editorial/workshop-detail.jpg",
  forest: "/images/editorial/quiet-bedroom.jpg",
  lake: "/images/editorial/textile-interior.jpg",
};

/**
 * The centre panel is the row's focal point, so it carries the catalogue's 3D
 * piece and links straight to that product's page — where the sample can be
 * turned over — rather than to its collection.
 */
const FEATURED = { collection: "beach", product: "cotton-tote-bag" } as const;

/** Exactly five panels — the first five mapped collections' lead products. */
const products: GalleryProduct[] = collections
  .filter((collection) => PANEL_IMAGES[collection.slug])
  .slice(0, 5)
  .map((collection) => {
    const featured =
      collection.slug === FEATURED.collection
        ? collection.products.find((item) => item.slug === FEATURED.product)
        : undefined;

    if (featured) {
      return {
        image: featured.image,
        name: `${collection.name} — ${featured.name}`,
        price: "Realtime 3D",
        intro: featured.tagline,
        href: `/products/${collection.slug}/${featured.slug}`,
        badge: "3D",
        ariaLabel: `${featured.name} — open the 3D product page`,
      };
    }

    return {
      image: PANEL_IMAGES[collection.slug],
      name: `${collection.name} — ${collection.products[0].name}`,
      price: `From ${
        collection.products[0].specs.find((spec) => spec.label === "Weight")?.value ??
        "made to order"
      }`,
      intro: collection.intro,
      href: `/products/${collection.slug}`,
      ariaLabel: `${collection.name} — view the collection`,
    };
  });

export function CollectionGallery() {
  return (
    <div className="aero-gallery__row" role="list" aria-label="New collection highlights">
      {products.map((product, index) => (
        <div key={product.href} role="listitem" className="aero-gallery__panel">
          <Link href={product.href} className="aero-gallery__link" aria-label={product.ariaLabel}>
            <span className="aero-gallery__media">
              <img
                src={product.image}
                alt={product.name}
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              {product.badge && <span className="aero-gallery__badge">{product.badge}</span>}
            </span>
            <span className="aero-gallery__info">
              <strong>{product.name}</strong>
              <small>{product.price}</small>
              <span className="aero-gallery__intro" aria-hidden="true">
                {product.intro}
              </span>
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
