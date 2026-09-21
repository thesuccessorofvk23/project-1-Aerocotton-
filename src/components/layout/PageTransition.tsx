"use client";

import { usePathname } from "next/navigation";

/**
 * Re-mounts its subtree on every route change, re-running the ~450ms
 * page-enter animation. Deliberately lightweight (no exit animation, no
 * blocking cover) so navigation always feels instant.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
