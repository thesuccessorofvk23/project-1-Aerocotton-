"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collections } from "@/content/collections";

/**
 * Section 03 — "New collection" — a five-card curved 3D carousel.
 *
 * One base card size; apparent size/depth differences come purely from
 * transforms (scale / translate / rotate / z-index) so the active card can
 * expand forward out of the exact element that previously sat beside it.
 * Pure CSS transitions — no animation library.
 */

export type CarouselProduct = {
  image: string;
  name: string;
  price: string;
  href: string;
};

/** The visible arc — relative position → transform. */
const POSITIONS = [-2, -1, 0, 1, 2] as const;

const POSITION_STYLES: Record<
  number,
  { x: string; y: string; scale: number; rotate: number; z: number; opacity: number }
> = {
  [-2]: { x: "-152%", y: "7%", scale: 0.62, rotate: -10, z: 1, opacity: 0.55 },
  [-1]: { x: "-76%", y: "3.5%", scale: 0.8, rotate: -5, z: 2, opacity: 0.85 },
  [0]: { x: "0%", y: "0%", scale: 1, rotate: 0, z: 5, opacity: 1 },
  [1]: { x: "76%", y: "3.5%", scale: 0.8, rotate: 5, z: 2, opacity: 0.85 },
  [2]: { x: "152%", y: "7%", scale: 0.62, rotate: 10, z: 1, opacity: 0.55 },
};

/** One feed entry per collection — real photography mapped per landscape. */
const CARD_IMAGES: Record<string, string> = {
  nature: "/images/editorial/campaign-nature.jpg",
  mountain: "/images/editorial/woven-texture.jpg",
  beach: "/images/editorial/linen-folds.jpg",
  city: "/images/editorial/workshop-detail.jpg",
  forest: "/images/editorial/quiet-bedroom.jpg",
  lake: "/images/editorial/textile-interior.jpg",
};

/** Pull the mapped collections' lead products into the carousel feed. */
const products: CarouselProduct[] = collections
  .filter((collection) => CARD_IMAGES[collection.slug])
  .map((collection) => ({
    image: CARD_IMAGES[collection.slug],
    name: `${collection.name} — ${collection.products[0].name}`,
    price: `From ${
      collection.products[0].specs.find((spec) => spec.label === "Weight")?.value ??
      "made to order"
    }`,
    href: `/products/${collection.slug}`,
  }));

export function CollectionCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const step = useCallback((direction: 1 | -1) => {
    setActive((current) => (current + direction + products.length) % products.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => step(1), 4600);
    return () => window.clearInterval(timer);
  }, [paused, step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!visible) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return (
    <div
      className="aero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={stageRef}
        className="aero-carousel__stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="New collection"
        tabIndex={0}
        onTouchStart={(event) => {
          touchX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(delta) < 32) return;
          step(delta < 0 ? 1 : -1);
        }}
      >
        {POSITIONS.map((position) => {
          const productIndex = (active + position + products.length) % products.length;
          const product = products[productIndex];
          const style = POSITION_STYLES[position];
          const isCenter = position === 0;
          return (
            <div
              key={product.href}
              className={`aero-carousel__card${isCenter ? " is-active" : ""}`}
              style={{
                transform: `translate(-50%, -50%) translate(${style.x}, ${style.y}) rotate(${style.rotate}deg) scale(${style.scale})`,
                zIndex: style.z,
                opacity: style.opacity,
              }}
              data-position={position}
              aria-hidden={position !== 0 ? "true" : undefined}
            >
              {isCenter ? (
                <Link
                  href={product.href}
                  className="aero-carousel__card-inner"
                  aria-label={`${product.name} — view the collection`}
                />
              ) : (
                <button
                  type="button"
                  className="aero-carousel__card-inner"
                  onClick={() => setActive(productIndex)}
                  aria-label={`Show ${product.name}`}
                />
              )}
              <span className="aero-carousel__media">
                <img
                  src={product.image}
                  alt={isCenter ? product.name : ""}
                  loading={isCenter ? "eager" : "lazy"}
                  draggable={false}
                />
              </span>
              <span className="aero-carousel__info" aria-hidden={position !== 0 ? "true" : undefined}>
                <strong>{product.name}</strong>
                <small>{product.price}</small>
              </span>
            </div>
          );
        })}
      </div>

      <div className="aero-carousel__controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous product">←</button>
        <button type="button" onClick={() => step(1)} aria-label="Next product">→</button>
      </div>
    </div>
  );
}
