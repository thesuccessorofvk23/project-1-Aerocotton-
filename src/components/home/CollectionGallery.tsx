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

/** Exactly five panels — the first five mapped collections' lead products. */
const products: GalleryProduct[] = collections
  .filter((collection) => PANEL_IMAGES[collection.slug])
  .slice(0, 5)
  .map((collection) => ({
    image: PANEL_IMAGES[collection.slug],
    name: `${collection.name} — ${collection.products[0].name}`,
    price: `From ${
      collection.products[0].specs.find((spec) => spec.label === "Weight")?.value ??
      "made to order"
    }`,
    intro: collection.intro,
    href: `/products/${collection.slug}`,
  }));

export function CollectionGallery() {
  return (
    <div className="aero-gallery__row" role="list" aria-label="New collection highlights">
      {products.map((product, index) => (
        <div key={product.href} role="listitem" className="aero-gallery__panel">
          <Link
            href={product.href}
            className="aero-gallery__link"
            aria-label={`${product.name} — view the collection`}
          >
            <span className="aero-gallery__media">
              <img
                src={product.image}
                alt={product.name}
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />
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
