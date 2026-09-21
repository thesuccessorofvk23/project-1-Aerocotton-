"use client";

import { cn } from "@/lib/cn";

/**
 * One-shot scroll reveal: fades/rises children in when they enter the
 * viewport. Purely presentational — content is in the HTML either way,
 * and the hidden state only applies when JS is present (`.js` gate).
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
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
