import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { company } from "@/content/company";
import { CONTACT_HREF } from "@/lib/site";
import { SupportForm } from "@/components/forms/SupportForm";

export const metadata: Metadata = pageMeta({
  title: "Support — request help",
  description:
    "Raise a support request with Aerocotton: order status, delivery, quality, returns or product questions. Every request is acknowledged by email with a reference number.",
  path: "/support",
});

/** What we aim for, by the priority the customer chooses. */
const responseTimes = [
  ["Urgent", "Same working day, India time"],
  ["High", "Within one business day"],
  ["Normal", "Within two business days"],
  ["Low", "Within two business days"],
] as const;

export default function SupportPage() {
  return (
    <div className="aero-contact">
      <section className="aero-contact__frame">
        {/* Photo panel */}
        <div className="aero-contact__visual">
          <img
            src="/images/editorial/workshop-detail.jpg"
            alt="Detail of the weaving floor at the Aerocotton mill in Karur"
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
            Karur / Tamil Nadu · Customer care
          </p>
        </div>

        {/* Content panel */}
        <div className="aero-contact__panel">
          <div className="aero-contact__intro">
            <h1 className="aero-contact__title">Support</h1>
            <p className="aero-contact__lede">
              Something wrong with an order, a delivery or a product? Send it here
              and it reaches the people who can act on it. You will get a reference
              number the moment it is accepted.
            </p>
          </div>

          <div className="aero-contact__columns">
            {/* How we respond */}
            <div className="aero-contact__direct">
              <h2>How we aim to respond</h2>

              <dl className="grid gap-3">
                {responseTimes.map(([priority, window]) => (
                  <div
                    key={priority}
                    className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2"
                  >
                    <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-taupe">
                      {priority}
                    </dt>
                    <dd className="text-right text-xs/relaxed text-umber">{window}</dd>
                  </div>
                ))}
              </dl>

              <div className="aero-contact__channels">
                <Link href="/customer-care">Answers to common questions</Link>
                <Link href={CONTACT_HREF}>Trade enquiry instead</Link>
              </div>

              <p className="aero-contact__direct-note">
                Have your order ID to hand — it lets us find the consignment without
                a round trip. Attach photos if the issue is visible.
              </p>
            </div>

            {/* Request form */}
            <div className="aero-contact__form">
              <h2>Raise a request</h2>
              <SupportForm />
            </div>
          </div>
        </div>
      </section>

      <p className="sr-only">
        {company.legalName} customer support, {company.address.city},{" "}
        {company.address.region}, {company.address.country}.
      </p>
    </div>
  );
}
