"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * One-shot scroll reveal: fades/rises children in when they enter the
 * viewport. Purely presentational — content is in the HTML either way,
 * and the hidden state only applies when JS is present (`.js` gate), so
 * no-JS and reduced-motion users always see the full content.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.classList.contains("js")) {
      el.classList.add("reveal");
    }
    if (el.style.transitionDelay !== undefined) {
      el.style.transitionDelay = `${delay}ms`;
    }

    // Items already in view reveal on the next frame; the rest on entry.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
