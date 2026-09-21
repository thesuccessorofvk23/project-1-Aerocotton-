import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { company } from "@/content/company";
import { Container } from "@/components/ui/Container";
import { RfqForm } from "@/components/rfq/RfqForm";

export const metadata: Metadata = pageMeta({
  title: "Contact — request a quote",
  description:
    "Request a quotation from Aerocotton: product, estimated quantity, customization requirements. We reply within two business days.",
  path: "/contact",
});

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { product?: string };
}) {
  const product = typeof searchParams?.product === "string" ? searchParams.product : undefined;

  return (
    <>
      <section className="border-b border-hairline bg-linen pb-16 pt-40">
        <Container>
          <p className="eyebrow">Contact</p>
          <h1 className="font-display mt-6 max-w-4xl text-display-lg text-ink">
            Tell us what you're sourcing.
          </h1>
          <p className="mt-6 max-w-2xl text-lg/loose text-umber">
            Quotations, sample boxes, custom programmes — one structured enquiry
            reaches the right people at the mill.
          </p>
        </Container>
      </section>

      <section className="bg-ivory py-20 md:py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-12">
            {/* Form */}
            <div className="lg:col-span-8">
              <RfqForm preselectedProduct={product} />
            </div>

            {/* Direct details */}
            <aside className="lg:col-span-4">
              <div className="border border-hairline bg-linen p-8">
                <h2 className="font-display text-xl text-ink">Direct</h2>
                <address className="mt-5 space-y-1 text-sm/relaxed not-italic text-umber">
                  <p className="font-semibold text-ink">{company.legalName}</p>
                  <p>{company.address.line1}, {company.address.line2}</p>
                  <p>{company.address.city}, {company.address.region}</p>
                  <p>{company.address.country}</p>
                </address>

                <div className="mt-6 space-y-3 border-t border-hairline pt-6 text-sm">
                  {company.contact.email ? (
                    <p>
                      <span className="text-2xs uppercase tracking-[0.18em] text-taupe">Email — </span>
                      <a className="text-brass-deep hover:underline" href={`mailto:${company.contact.email}`}>
                        {company.contact.email}
                      </a>
                    </p>
                  ) : null}
                  {company.contact.phone ? (
                    <p>
                      <span className="text-2xs uppercase tracking-[0.18em] text-taupe">Phone — </span>
                      <a className="text-brass-deep hover:underline" href={`tel:${company.contact.phone}`}>
                        {company.contact.phone}
                      </a>
                    </p>
                  ) : null}
                  {company.contact.whatsapp ? (
                    <p>
                      <span className="text-2xs uppercase tracking-[0.18em] text-taupe">WhatsApp — </span>
                      <a className="text-brass-deep hover:underline"
                        href={`https://wa.me/${company.contact.whatsapp}?text=${encodeURIComponent(
                          "Hello Aerocotton — I would like to enquire about your collections."
                        )}`}
                        target="_blank" rel="noopener noreferrer">
                        Message the mill
                      </a>
                    </p>
                  ) : null}
                  {!company.contact.email && !company.contact.phone && !company.contact.whatsapp ? (
                    <p className="text-2xs uppercase tracking-[0.16em] text-taupe">
                      Direct lines are being connected — the form reaches us immediately.
                    </p>
                  ) : null}
                </div>

                <p className="mt-6 border-t border-hairline pt-6 text-2xs/relaxed text-taupe">
                  Manufacturer &amp; exporter since {company.founded} ·
                  International shipping since {company.exportingSince}
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
