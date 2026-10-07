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

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* Upper row: brand lockup · nav */}
        <div className="site-footer__top">
          <div className="site-footer__identity">
            <img
              src="/brand/aerocotton-lockup-footer.png"
              alt="Aerocotton — Textiles & Home Furnishing"
              width={760}
              height={487}
              className="site-footer__logo"
            />

            {/* Client contact block — address, lines and mailtos under the lockup. */}
            <address className="site-footer__contact">
              <p className="site-footer__contact-address">
                {company.address.line1},<br />
                {company.address.line2},<br />
                {company.address.city},<br />
                {company.address.region}, {company.address.country}
              </p>
              <dl className="site-footer__contact-list">
                <div className="site-footer__contact-row">
                  <dt>Tele / Fax</dt>
                  <dd>
                    <a href={`tel:${company.contact.phone.replace(/[^+\d]/g, "")}`}>
                      {company.contact.phone}
                    </a>
                  </dd>
                </div>
                <div className="site-footer__contact-row">
                  <dt>Mobile &amp; WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${company.contact.mobile.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {company.contact.mobile}
                    </a>
                  </dd>
                </div>
                <div className="site-footer__contact-row">
                  <dt>Web</dt>
                  <dd>
                    <a href="https://aerocotton.in" target="_blank" rel="noopener noreferrer">
                      {company.contact.website}
                    </a>
                  </dd>
                </div>
                <div className="site-footer__contact-row">
                  <dt>Email</dt>
                  <dd>
                    {company.contact.emails.map((email) => (
                      <a key={email} href={`mailto:${email}`}>
                        {email}
                      </a>
                    ))}
                  </dd>
                </div>
              </dl>
            </address>
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
