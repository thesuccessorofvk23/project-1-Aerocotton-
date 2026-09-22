"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT_HREF } from "@/lib/site";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/cn";

const leftNav = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Catalogue" },
];

const rightNav = [
  { href: CONTACT_HREF, label: "Contact" },
  { href: CONTACT_HREF, label: "Request a Quote" },
];

export function Header() {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const updateHeader = () => {
      const hero = document.querySelector(".hero-editorial");
      setCondensed(
        pathname !== "/" || !hero || hero.getBoundingClientRect().bottom <= 8
      );
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        condensed
          ? "border-b border-hairline bg-ivory/90 backdrop-blur-md"
          : "border-b border-white/15 bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-10">
        <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center justify-start gap-7 lg:flex">
          {leftNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              data-magnetic
              className={cn(
                "text-[0.84rem] font-bold uppercase tracking-[0.17em] transition-colors duration-300",
                !condensed
                  ? "text-white/90 hover:text-white"
                  : isActive(item.href)
                    ? "text-brass-deep"
                    : "text-umber hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="Aero Cotton — home"
          data-magnetic
          className={cn(
            "flex-shrink-0 font-display text-lg font-semibold uppercase tracking-[0.28em] md:text-xl",
            condensed ? "text-ink" : "text-white"
          )}
        >
          Aero&nbsp;Cotton
        </Link>

        <nav aria-label="Secondary" className="hidden min-w-0 flex-1 items-center justify-end gap-7 lg:flex">
          {rightNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              data-magnetic
              className={cn(
                "text-[0.84rem] font-bold uppercase tracking-[0.17em] transition-colors duration-300",
                item.label === "Request a Quote"
                  ? condensed
                    ? "border border-outline px-5 py-2.5 text-brass-deep hover:border-ink hover:text-ink"
                    : "border border-white/60 px-5 py-2.5 text-white hover:border-white hover:bg-white hover:text-ink"
                  : !condensed
                    ? "text-white/90 hover:text-white"
                    : isActive(item.href)
                      ? "text-brass-deep"
                      : "text-umber hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
