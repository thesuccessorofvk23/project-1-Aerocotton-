import Link from "next/link";
import { CONTACT_HREF, SITE_URL } from "@/lib/site";
import { company } from "@/content/company";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

const companyLinks = [
  ["About", "/about"],
  ["Manufacturing", "/manufacturing"],
  ["Sustainability", "/sustainability"],
] as const;

const collectionLinks = [
  ["Collections", "/products"],
  ["Global presence", "/global-presence"],
  ["Customer care", "/customer-care"],
  ["Care guide", "/care-guide"],
] as const;

const connectLinks = [
  ["Contact", CONTACT_HREF],
  ["Request a quote", CONTACT_HREF],
  ["404 / Lost", "/404"],
  ["Shipping & returns", "/customer-care/shipping-returns-policy"],
] as const;

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="site-footer__link">
      <span>{label}</span>
      <span className="site-footer__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <nav aria-label={title} className="site-footer__group">
      <p className="site-footer__label">{title}</p>
      <ul className="site-footer__links">
        {links.map(([label, href]) => <li key={`${label}-${href}`}><FooterLink label={label} href={href} /></li>)}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__inner">
        <Reveal>
          <div className="site-footer__top">
            <div className="site-footer__identity">
              <p className="site-footer__logo">Aero Cotton</p>
              <p className="site-footer__description">{company.tagline}. Woven in Karur, Tamil Nadu.</p>
              <address className="site-footer__address">
                {company.address.line1}<br />
                {company.address.line2}, {company.address.city}<br />
                {company.address.region}, {company.address.country}
              </address>
              <Link href={CONTACT_HREF} className="site-footer__contact">Start a conversation <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="site-footer__navigation">
              <FooterLinkGroup title="Company" links={companyLinks} />
              <FooterLinkGroup title="Collections & care" links={collectionLinks} />
              <FooterLinkGroup title="Connect" links={connectLinks} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="site-footer__wordmark" aria-hidden="true">AEROCOTTON</div>
        </Reveal>

        <div className="site-footer__bottom">
          <div className="site-footer__legal">
            <Link href="/customer-care/privacy-policy">Privacy policy</Link>
            <Link href="/customer-care/terms-conditions">Terms &amp; conditions</Link>
            <Link href="/customer-care/shipping-returns-policy">Shipping &amp; returns</Link>
          </div>
          <div className="site-footer__copyright">
            <a href={SITE_URL}>aerocotton.in</a>
            <span>© {new Date().getFullYear()} {company.legalName}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
