"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ShowcasePiece = {
  /** Product page for the piece — the caption links there. */
  href: string;
  name: string;
  collectionName: string;
  /** Still shot: paints immediately, and holds the panel on devices without WebGL. */
  image: string;
  model: string;
  /** Line-sheet fact, e.g. "Realtime OBJ — 4,706 faces" — for the spec rail only. */
  spec: string;
};

/** Section 04 — modelled pieces: one per catalogue item that ships a model.
 * Each panel shows its still shot and links to the product page; the viewers
 * are not mounted, so no WebGL geometry loads here.
 */
export function ModelShowcase({ pieces }: { pieces: ShowcasePiece[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = row.current;
    if (!el) return;

    let opened = false;
    let io: IntersectionObserver | null = null;

    const open = () => {
      if (opened) return;
      opened = true;
      setLive(true);
      io?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };

    const check = () => {
      const margin = window.innerHeight * 0.6;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + margin && rect.bottom > -margin) open();
    };

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) open();
        },
        { rootMargin: "60% 0px" }
      );
      io.observe(el);
    }

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check(); // already within a screen of the fold, or no IntersectionObserver

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div ref={row} className="aero-models__grid" role="list" aria-label="Modelled pieces">
      {pieces.map((piece) => (
        <Piece key={piece.href} piece={piece} live={live} />
      ))}
    </div>
  );
}

function Piece({ piece, live }: { piece: ShowcasePiece; live: boolean }) {
  // The still shows directly — no WebGL viewer is mounted on the showcase.
  return (
    <figure role="listitem" className="aero-models__piece">
      <div className="aero-models__media">
        <img
          src={piece.image}
          alt={`${piece.name} — ${piece.collectionName} collection`}
          loading="lazy"
          draggable={false}
          className="aero-models__still"
        />
      </div>
      <figcaption className="aero-models__caption">
        <h3>{piece.name}</h3>
        <small>{piece.collectionName} collection</small>
        <span className="aero-models__spec">{piece.spec}</span>
        <Link href={piece.href} className="aero-models__link">
          Open the piece <span aria-hidden="true">→</span>
        </Link>
      </figcaption>
    </figure>
  );
}
