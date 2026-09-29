"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/cn";

const ModelCanvas = dynamic(
  () => import("./ModelCanvas").then((m) => m.ModelCanvas),
  { ssr: false }
);

interface Props {
  /** Wavefront .obj under /public. */
  src: string;
  /** Still product shot — shown until the model's first frame, and forever without WebGL. */
  image: string;
  alt: string;
  className?: string;
}

/**
 * Hero media for a product that ships with a 3D model.
 *
 * The still image is the honest fallback and paints immediately; the realtime
 * canvas fades in over it once three.js has drawn the model. On devices without
 * WebGL, or if the `.obj` fails to load, nothing changes for the visitor — they
 * simply keep the photograph.
 */
export function ProductModel({ src, image, alt, className }: Props) {
  const [ready, setReady] = useState(false);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <img
        src={image}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-1000 ease-out-soft",
          ready && "opacity-0"
        )}
        draggable={false}
      />
      <ModelCanvas src={src} onReady={() => setReady(true)} className="absolute inset-0" />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-4 left-4 border border-hairline bg-ivory/85 px-3 py-1.5 text-2xs uppercase tracking-[0.2em] text-umber backdrop-blur-sm transition-opacity duration-700",
          ready ? "opacity-100" : "opacity-0"
        )}
      >
        Realtime 3D — drag to turn
      </span>
    </div>
  );
}
