"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS, CONTACT_HREF } from "@/lib/site";
import { cn } from "@/lib/cn";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [overHero, setOverHero] = useState(pathname === "/");

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const update = () => {
      const hero = document.querySelector(".hero-editorial");
      setOverHero(
        pathname === "/" && (hero?.getBoundingClientRect().bottom ?? 0) > 8
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // Lock scroll + Escape to close while open.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [...NAV_ITEMS, { href: CONTACT_HREF, label: "Contact" }] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className={cn(
          "flex flex-col items-end gap-1.5 p-2 lg:hidden",
          overHero ? "text-white" : "text-ink"
        )}
      >
        <span className="sr-only">Open menu</span>
        <span aria-hidden className={cn("block h-px w-7", overHero ? "bg-white" : "bg-ink")} />
        <span aria-hidden className={cn("block h-px w-5", overHero ? "bg-white" : "bg-ink")} />
      </button>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-cocoa text-ivory",
          open && "page-enter"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold uppercase tracking-[0.16em]">
            Aero Cotton
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 text-xs font-bold uppercase tracking-[0.16em] text-fog hover:text-ivory"
          >
            Close
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-2 px-8">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-display text-4xl leading-tight",
                pathname === item.href ? "text-brass" : "text-ivory hover:text-brass"
              )}
            >
              <span className="mr-4 font-sans text-2xs tracking-[0.2em] text-fog">
                0{i + 1}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="px-8 pb-10 text-2xs uppercase tracking-[0.2em] text-fog">
          Karur · Tamil Nadu · India
        </p>
      </div>
    </>
  );
}
