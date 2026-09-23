"use client";

import { cn } from "@/lib/cn";

/**
 * Plain presentational wrapper kept for layout compatibility.
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
