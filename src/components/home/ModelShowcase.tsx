"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const ModelCanvas = dynamic(
  () => import("@/components/three/ModelCanvas").then((m) => m.ModelCanvas),
  { ssr: false }
);

export type ShowcasePiece = {
  /** Product page for the piece — the caption links there. */
  href: string;
  name: string;
  collectionName: string;
  /** Still shot: paints immediately, and holds the panel on devices without WebGL. */
  image: string;
  model: string;
  /** Line-sheet fact, e.g. "Realtime OBJ — 4,706 faces". */
  spec: string;
};

/**
 * Section 04 — "Realtime 3D" — every modelled piece in the catalogue in one
 * row, each drawn live from its own file.
 *
 * A row of three carries megabytes of geometry, so the viewers are mounted when
 * the row is still a screen away rather than with the page: until then each
 * panel is its still shot, which is also what a visitor with no WebGL keeps.
 * Dragging the media turns that piece, and the link lives in the caption — so a
 * drag never fights a navigation.
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

    // IntersectionObserver is the cheap trigger, but its notifications ride
    // along with a rendered frame: a host that produces none (an embedded or
    // offscreen webview) would leave the viewers unmounted for good. The plain
    // geometry check on scroll/resize backs it up — both paths land in `open`.
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
  // The still fades out over the canvas only once the model's first frame is
  // drawn — the same handover the product page hero makes.
  const [ready, setReady] = useState(false);

  return (
    <figure role="listitem" className="aero-models__piece">
      <div className="aero-models__media">
        <img
          src={piece.image}
          alt={`${piece.name} — ${piece.collectionName} collection`}
          loading="lazy"
          draggable={false}
          className={cn("aero-models__still", ready && "is-drawn")}
        />
        {live && (
          <ModelCanvas
            src={piece.model}
            onReady={() => setReady(true)}
            className="aero-models__canvas"
          />
        )}
        <span className="aero-models__badge">3D</span>
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
