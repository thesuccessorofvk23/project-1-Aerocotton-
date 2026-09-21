"use client";

import { useState } from "react";
import {
  rfqSchema,
  PRODUCT_OPTIONS,
  QUANTITY_OPTIONS,
  type RfqInput,
} from "@/lib/rfq/schema";

interface RfqActionResult {
  ok: boolean;
  message: string;
}

const EMPTY: RfqInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  product: "",
  quantity: "",
  customization: "",
  message: "",
  website: "",
  turnstileToken: "",
};

const inputClass =
  "w-full border-0 border-b border-outline bg-transparent py-3 text-sm text-ink placeholder:text-fog focus:border-brass-deep focus:outline-none focus:ring-0 transition-colors";

const labelClass =
  "block text-2xs font-semibold uppercase tracking-[0.18em] text-taupe";

export function RfqForm({ preselectedProduct }: { preselectedProduct?: string }) {
  const [values, setValues] = useState<RfqInput>({
    ...EMPTY,
    product:
      preselectedProduct && PRODUCT_OPTIONS.includes(preselectedProduct as never)
        ? preselectedProduct
        : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RfqActionResult | null>(null);

  const set = (key: keyof RfqInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    // Read Turnstile token if the widget is present.
    let turnstileToken = values.turnstileToken;
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      const tw = (window as unknown as { turnstile?: { getResponse?: () => string } })
        .turnstile;
      turnstileToken = tw?.getResponse?.() ?? "";
    }

    // Client-side validation with the shared schema.
    const parsed = rfqSchema.safeParse({ ...values, turnstileToken });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const recipient = process.env.NEXT_PUBLIC_RFQ_EMAIL;
    if (!recipient) {
      setResult({
        ok: false,
        message: "Enquiry delivery is not configured yet. Please add NEXT_PUBLIC_RFQ_EMAIL before launch.",
      });
      setSubmitting(false);
      return;
    }

    const subject = encodeURIComponent(`Quote request from ${parsed.data.company}`);
    const body = encodeURIComponent([
      `Name: ${parsed.data.name}`,
      `Company: ${parsed.data.company}`,
      `Business email: ${parsed.data.email}`,
      `Phone / WhatsApp: ${parsed.data.phone || "Not provided"}`,
      `Country: ${parsed.data.country}`,
      `Product / collection: ${parsed.data.product}`,
      `Estimated quantity: ${parsed.data.quantity}`,
      `Customization: ${parsed.data.customization || "Not provided"}`,
      "",
      parsed.data.message,
    ].join("\n"));

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    const actionResult: RfqActionResult = {
      ok: true,
      message: "Your email app is opening with the enquiry details ready to send.",
    };
    setResult(actionResult);
    setSubmitting(false);
    if (actionResult.ok) {
      setValues(EMPTY);
    }
  }

  const err = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} role="alert" className="mt-2 text-xs text-red-800">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        <div>
          <label htmlFor="rfq-name" className={labelClass}>Name *</label>
          <input id="rfq-name" type="text" autoComplete="name" required
            className={inputClass} value={values.name} onChange={set("name")}
            aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="rfq-company" className={labelClass}>Company *</label>
          <input id="rfq-company" type="text" autoComplete="organization" required
            className={inputClass} value={values.company} onChange={set("company")}
            aria-invalid={!!errors.company} aria-describedby={errors.company ? "company-error" : undefined} />
          {err("company")}
        </div>
        <div>
          <label htmlFor="rfq-email" className={labelClass}>Business email *</label>
          <input id="rfq-email" type="email" autoComplete="email" required
            className={inputClass} value={values.email} onChange={set("email")}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="rfq-phone" className={labelClass}>Phone / WhatsApp</label>
          <input id="rfq-phone" type="tel" autoComplete="tel"
            className={inputClass} value={values.phone} onChange={set("phone")} />
        </div>
        <div>
          <label htmlFor="rfq-country" className={labelClass}>Country *</label>
          <input id="rfq-country" type="text" autoComplete="country-name" required
            className={inputClass} value={values.country} onChange={set("country")}
            aria-invalid={!!errors.country} aria-describedby={errors.country ? "country-error" : undefined} />
          {err("country")}
        </div>
        <div>
          <label htmlFor="rfq-product" className={labelClass}>Product / collection *</label>
          <select id="rfq-product" required className={inputClass} value={values.product}
            onChange={set("product")}
            aria-invalid={!!errors.product} aria-describedby={errors.product ? "product-error" : undefined}>
            <option value="" disabled>Select…</option>
            {PRODUCT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {err("product")}
        </div>
        <div>
          <label htmlFor="rfq-quantity" className={labelClass}>Estimated quantity *</label>
          <select id="rfq-quantity" required className={inputClass} value={values.quantity}
            onChange={set("quantity")}
            aria-invalid={!!errors.quantity} aria-describedby={errors.quantity ? "quantity-error" : undefined}>
            <option value="" disabled>Select…</option>
            {QUANTITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {err("quantity")}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="rfq-customization" className={labelClass}>
            Customization requirements
          </label>
          <textarea id="rfq-customization" rows={2}
            placeholder="Colours, sizes, private label, packaging…"
            className={inputClass} value={values.customization}
            onChange={set("customization")} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="rfq-message" className={labelClass}>Message *</label>
          <textarea id="rfq-message" rows={5} required
            placeholder="Tell us about your programme, timelines and target market."
            className={inputClass} value={values.message} onChange={set("message")}
            aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />
          {err("message")}
        </div>
      </div>

      {/* Honeypot — hidden from humans, catnip for bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="rfq-website">Website</label>
        <input id="rfq-website" type="text" tabIndex={-1} autoComplete="off"
          value={values.website} onChange={set("website")} />
      </div>

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <div
          className="cf-turnstile mt-8"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      ) : null}

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-3 bg-ink px-9 py-4.5 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition-colors duration-300 hover:bg-cocoa disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Request a quote"}
          {!submitting && <span aria-hidden>→</span>}
        </button>
        <p className="text-2xs text-taupe">
          * Required. We reply within two business days.
        </p>
      </div>

      {result ? (
        <p
          role="status"
          className={`mt-8 border px-6 py-4 text-sm ${
            result.ok
              ? "border-brass bg-linen text-ink"
              : "border-red-800 bg-red-50 text-red-900"
          }`}
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
