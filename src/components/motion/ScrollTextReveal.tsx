"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-paced text reveal: words light up one by one as the paragraph
 * travels through the viewport. The animation is scrub-linked to scroll
 * position (not time), so it always stays in sync with the reader's pace.
 *
 * Progressive enhancement: words are server-rendered at full opacity, so
 * the text is fully present in static HTML and readable without JS. The
 * dimmed start state is applied by GSAP at hydration only, and skipped
 * entirely under `prefers-reduced-motion`.
 */
export function ScrollTextReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-story-word]", el);
      if (words.length === 0) return;

      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          duration: 1,
          stagger: 0.35,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 55%",
            scrub: 0.6,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <p ref={ref} className={cn("text-pretty", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i} data-story-word="">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </p>
  );
}
