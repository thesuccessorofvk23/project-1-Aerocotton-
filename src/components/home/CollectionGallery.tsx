import Link from "next/link";
import { collections } from "@/content/collections";

/**
 * The "New collection" row — a five-panel curved hover gallery.
 *
 * Five equal vertical panels on a subtle upward arch; hovering (or keyboard
 * focusing) a panel expands it while the others contract. Pure CSS flex-grow
 * transition — no client JS, no layout shift outside the row.
 *
 * Each panel is a way into the catalogue rather than a single sample: it
 * shows the category (the collection's own name and how many designs sit in
 * it) and links to that collection's page.
 */

export type GalleryPanel = {
  image: string;
  /** The category this panel stands for. */
  name: string;
  /** Category-level line — how many designs the collection holds. */
  count: string;
  intro: string;
  href: string;
  /** Corner flag on the media — set where the category holds a modelled piece. */
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

/** Exactly five panels — the first five mapped collections, as categories. */
const panels: GalleryPanel[] = collections
  .filter((collection) => PANEL_IMAGES[collection.slug])
  .slice(0, 5)
  .map((collection) => {
    const pieces = collection.products.length;
    return {
      image: PANEL_IMAGES[collection.slug],
      name: collection.name,
      count: `${pieces} ${pieces === 1 ? "design" : "designs"}`,
      intro: collection.intro,
      href: `/products/${collection.slug}`,
      badge: collection.products.some((product) => product.model) ? "3D" : undefined,
      ariaLabel: `${collection.name} collection — view all ${pieces} designs`,
    };
  });

export function CollectionGallery() {
  return (
    <div className="aero-gallery__row" role="list" aria-label="New collection categories">
      {panels.map((panel, index) => (
        <div key={panel.href} role="listitem" className="aero-gallery__panel">
          <Link href={panel.href} className="aero-gallery__link" aria-label={panel.ariaLabel}>
            <span className="aero-gallery__media">
              <img
                src={panel.image}
                alt={`${panel.name} collection`}
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              {panel.badge && <span className="aero-gallery__badge">{panel.badge}</span>}
            </span>
            <span className="aero-gallery__info">
              <strong>{panel.name}</strong>
              <small>{panel.count}</small>
              <span className="aero-gallery__intro" aria-hidden="true">
                {panel.intro}
              </span>
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
