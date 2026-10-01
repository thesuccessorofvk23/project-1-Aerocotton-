"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTACT_HREF } from "@/lib/site";
import { company } from "@/content/company";

const footerLinks = [
  ["Home", "/"],
  ["About", "/about"],
  ["Collections", "/products"],
  ["Customer care", "/customer-care"],
] as const;

/** Tabler outline icons (MIT) — the reference footer's icon set. */
function SocialIcon({ name }: { name: "whatsapp" | "instagram" | "linkedin" | "youtube" }) {
  const paths: Record<string, React.ReactNode> = {
    whatsapp: (
      <>
        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
      </>
    ),
    instagram: (
      <>
        <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        <path d="M16.5 7.5v.01" />
      </>
    ),
    linkedin: (
      <>
        <path d="M8 11v5" />
        <path d="M8 8v.01" />
        <path d="M12 16v-5" />
        <path d="M16 16v-3a2 2 0 1 0 -4 0" />
        <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
      </>
    ),
    youtube: (
      <>
        <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
        <path d="M10 9l5 3l-5 3z" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* Upper row: brand lockup · nav · social rail */}
        <div className="site-footer__top">
          <div className="site-footer__identity">
            <img
              src="/brand/aerocotton-mark.png"
              alt="Aero Cotton"
              width={295}
              height={191}
              className="site-footer__logo"
            />
            <p className="site-footer__brandword" aria-hidden="true">
              <span className="site-footer__brandword-aero">AERO</span>
              <span className="site-footer__brandword-cotton">COTTON</span>
            </p>
            <p className="site-footer__tagline">Textiles for a brighter tomorrow</p>
          </div>

          <nav aria-label="Footer" className="site-footer__nav">
            {footerLinks.map(([label, href]) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="site-footer__navlink"
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="site-footer__social">
            <span className="site-footer__social-rule" aria-hidden="true" />
            <ul className="site-footer__social-list">
              {(
                [
                  ["whatsapp", company.socials.whatsapp],
                  ["instagram", company.socials.instagram],
                  ["linkedin", company.socials.linkedin],
                  ["youtube", company.socials.youtube],
                ] as const
              ).map(([name, href]) =>
                href ? (
                  <li key={name}>
                    <a
                      className="site-footer__social-link"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Aerocotton on ${name}`}
                    >
                      <SocialIcon name={name} />
                    </a>
                  </li>
                ) : (
                  <li key={name}>
                    <span className="site-footer__social-link site-footer__social-link--pending" aria-hidden="true">
                      <SocialIcon name={name} />
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Lower row: copyright · legal links */}
        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} AEROCOTTON. ALL RIGHTS RESERVED.
          </p>
          <div className="site-footer__legal">
            <Link href="/customer-care/privacy-policy">Privacy policy</Link>
            <span className="site-footer__legal-sep" aria-hidden="true">
              |
            </span>
            {/* The terms page was removed with the content prune — render as
                plain text until a terms page exists again. */}
            <span>Terms &amp; conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
