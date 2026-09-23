"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Subtle scroll parallax: the image drifts a few percent against the scroll
 * while its frame passes through the viewport (Sobha-style depth). The img
 * is slightly oversized so the drift never exposes a gap. Static without JS;
 * disabled under `prefers-reduced-motion`.
 */
export function ScrollParallax({
  children,
  className,
  amount = 8,
}: {
  children: React.ReactNode;
  className?: string;
  /** Drift range in percent of the frame height. */
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [amount]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
