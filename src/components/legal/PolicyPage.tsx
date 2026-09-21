import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { PolicySection } from "@/content/policies";

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
  effectiveDate = "13 September 2026",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
  effectiveDate?: string;
}) {
  return (
    <>
      <section className="aero-page-hero border-b border-hairline bg-linen pb-16 pt-40">
        <Container>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-lg text-ink">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg/loose text-umber">{intro}</p>
          <p className="mt-8 text-2xs uppercase tracking-[0.2em] text-taupe">
            Effective {effectiveDate}
          </p>
        </Container>
      </section>

      <section className="bg-ivory py-20 md:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <p className="eyebrow">Customer care</p>
              <nav aria-label="Customer care pages" className="mt-6 border-l border-hairline pl-5">
                <ul className="space-y-3 text-sm">
                  <li><Link className="text-umber hover:text-brass-deep" href="/customer-care">Customer care</Link></li>
                  <li><Link className="text-umber hover:text-brass-deep" href="/care-guide">Care guide</Link></li>
                  <li><Link className="text-umber hover:text-brass-deep" href="/customer-care/shipping-returns-policy">Shipping &amp; returns</Link></li>
                  <li><Link className="text-umber hover:text-brass-deep" href="/customer-care/terms-conditions">Terms &amp; conditions</Link></li>
                  <li><Link className="text-umber hover:text-brass-deep" href="/customer-care/privacy-policy">Privacy policy</Link></li>
                </ul>
              </nav>
            </aside>

            <div className="lg:col-span-8 lg:col-start-5">
              <div className="space-y-12">
                {sections.map((section) => (
                  <section key={section.title} className="border-t border-hairline pt-6">
                    <h2 className="font-display text-display-sm text-ink">{section.title}</h2>
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph} className="mt-5 text-base/loose text-umber">{paragraph}</p>
                    ))}
                    {section.bullets ? (
                      <ul className="mt-5 list-disc space-y-3 pl-5 text-base/loose text-umber">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              <div className="mt-16 border-t border-hairline pt-8 text-sm/relaxed text-umber">
                Questions about an order or this policy? <Link className="text-brass-deep underline underline-offset-4" href="/contact">Contact Aero Cotton</Link>.
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}