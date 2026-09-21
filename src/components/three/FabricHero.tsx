"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { FabricDye } from "./FabricCanvas";
import { cn } from "@/lib/cn";

const FabricCanvas = dynamic(
  () => import("./FabricCanvas").then((m) => m.FabricCanvas),
  { ssr: false }
);

export type { FabricDye };

export type FabricPaletteMap = Record<string, FabricDye>;

interface Props {
  /** Dye palettes keyed by collection slug; the first key is the default. */
  palettes: FabricPaletteMap;
  className?: string;
}

/**
 * FabricHero — shell around the WebGL canvas.
 *
 * - Owns the active palette slug (for collection re-dye interactions) and
 *   mirrors it as a `dye-*` class so CSS accents follow the cloth.
 * - Canvas is dynamically imported (ssr: false) so three.js stays out of the
 *   initial bundle; the CSS drape layer renders immediately beneath it.
 * - Fallback ladder: full WebGL → light WebGL → CSS drape; reduced-motion
 *   gets a static frame (canvas) or static gradient.
 */
export function FabricHero({ palettes, className }: Props) {
  const slugs = Object.keys(palettes);
  const [slug, setSlug] = useState(slugs[0]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const dye = palettes[slug];

  return (
    <div className={className}>
      <div className={cn("fabric-canvas", `dye-${slug}`, reduced && "fabric-static")}>
        <FabricCanvas dye={dye} reducedMotion={reduced} />
      </div>
      {/* Palette control surface — wired to collection navigation in Phase 6. */}
      <FabricPaletteSwitcher slugs={slugs} active={slug} onChange={setSlug} />
    </div>
  );
}

function FabricPaletteSwitcher({
  slugs,
  active,
  onChange,
}: {
  slugs: string[];
  active: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
      <span className="sr-only" role="status">{active} palette</span>
      <div role="tablist" aria-label="Collection dye palettes" className="flex gap-3">
      {slugs.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={s === active}
          aria-label={`Dye: ${s}`}
          onClick={() => onChange(s)}
          className={`dye-${s} h-3 w-3 rounded-full border border-ivory/50 transition-transform duration-300 hover:scale-125 ${
            s === active ? "scale-125 ring-1 ring-brass ring-offset-2 ring-offset-cocoa" : ""
          }`}
          style={{ backgroundColor: "var(--dye-a)" }}
        />
      ))}
      </div>
    </div>
  );
}
