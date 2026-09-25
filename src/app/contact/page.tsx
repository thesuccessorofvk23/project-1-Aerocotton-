import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { company } from "@/content/company";
import { RfqForm } from "@/components/rfq/RfqForm";

export const metadata: Metadata = pageMeta({
  title: "Contact — request a quote",
  description:
    "Request a quotation from Aerocotton: product, estimated quantity, customization requirements. We reply within two business days.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="aero-contact">
      <section className="aero-contact__frame">
        {/* Photo panel */}
        <div className="aero-contact__visual">
          <img
            src="/images/editorial/textile-interior.jpg"
            alt="Airy interior styled with Aerocotton textiles"
          />
          <div className="aero-contact__visual-veil" aria-hidden="true" />
          <p className="aero-contact__wordmark">
            <span>Aero&nbsp;Cotton</span>
          </p>
          <p className="aero-contact__visual-caption">
            Karur / Tamil Nadu · Since {company.founded}
          </p>
        </div>

        {/* Content panel */}
        <div className="aero-contact__panel">
          <div className="aero-contact__intro">
            <h1 className="aero-contact__title">Contact</h1>
            <p className="aero-contact__lede">
              Quotations, sample boxes and custom programmes — one enquiry
              reaches the right people at the mill. We reply within two
              business days.
            </p>
          </div>

          <div className="aero-contact__columns">
            {/* Mill direct */}
            <div className="aero-contact__direct">
              <h2>Mill direct</h2>
              <address className="aero-contact__address">
                <p className="aero-contact__address-name">{company.legalName}</p>
                <p>
                  {company.address.line1}, {company.address.line2}
                </p>
                <p>
                  {company.address.city}, {company.address.region}
                </p>
                <p>{company.address.country}</p>
              </address>

              <div className="aero-contact__channels">
                {company.contact.email ? (
                  <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
                ) : null}
                {company.contact.phone ? (
                  <a href={`tel:${company.contact.phone}`}>{company.contact.phone}</a>
                ) : null}
                {company.contact.whatsapp ? (
                  <a
                    href={`https://wa.me/${company.contact.whatsapp}?text=${encodeURIComponent(
                      "Hello Aerocotton — I would like to enquire about your collections."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp the mill
                  </a>
                ) : null}
                {!company.contact.email && !company.contact.phone && !company.contact.whatsapp ? (
                  <p className="aero-contact__channels-note">
                    Direct lines are being connected — the form reaches us
                    immediately.
                  </p>
                ) : null}
              </div>

              <p className="aero-contact__direct-note">
                Manufacturer &amp; exporter since {company.founded} ·
                International shipping since {company.exportingSince}
              </p>
            </div>

            {/* Enquiry form */}
            <div className="aero-contact__form">
              <h2>Trade enquiries</h2>
              <RfqForm variant="compact" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
