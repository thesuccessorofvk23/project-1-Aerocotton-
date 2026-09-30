import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { company } from "@/content/company";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

/** The client's own keyless Google Maps embed for the Karur works. */
const mapEmbedSrc =
  "https://maps.google.com/maps?width=600&height=400&hl=en&q=No-6%2C%20MaruthamuthuThottam%2C%20%20Vengamedu%2C%20%20Karur%20%E2%80%93%20639006%20%20Tamil%20Nadu%20%20INDIA&t=&z=15&ie=UTF8&iwloc=B&output=embed";
const mapAddressLine = [company.address.line1, company.address.line2, company.address.city, company.address.region, company.address.country].join(", ");
const mapDirectionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddressLine)}`;

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
          <img
            src="/brand/aerocotton-lockup-dark.png"
            alt="Aero Cotton — Textiles & Home Furnishing"
            width={720}
            height={659}
            className="aero-contact__wordmark"
          />
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
              reaches the right people at the mill. Every enquiry is
              acknowledged by email with a reference number, and we reply within
              two business days.
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
              <EnquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* Where we are — the Karur address beside the client's Google map */}
      <section className="aero-location bg-ivory py-20 md:py-28">
        <Container>
          <div className="aero-location__grid">
            <Reveal className="aero-location__copy">
              <p className="eyebrow">Where we are</p>
              <h2 className="mt-5 font-display text-display-md text-ink">Karur, Tamil Nadu.</h2>
              <p className="mt-5 max-w-sm text-base/loose text-umber">
                Own weaving, printing and stitching units, working under one
                roof in Karur &mdash; the textile capital of India.
              </p>
              <address className="aero-location__address">
                <span>{company.address.line1}</span>
                <span>{company.address.line2}</span>
                <span>{company.address.city}</span>
                <span>{company.address.region}, {company.address.country}</span>
              </address>
              <a className="aero-location__link" href={mapDirectionsHref} target="_blank" rel="noreferrer">
                Open in Google Maps <span aria-hidden="true">↗</span>
              </a>
            </Reveal>
            <Reveal delay={80} className="aero-location__map">
              <iframe
                title={`Aerocotton on Google Maps — ${mapAddressLine}`}
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </Reveal>
          </div>
        </Container>
      </section>
    </div>
  );
}
