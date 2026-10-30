"use client";

import { useEffect, useState } from "react";
import {
  Honeypot,
  RequiredNote,
  fieldAria,
  inputClass,
  labelClass,
} from "@/components/forms/form-kit";
import { FormError, FormReceipt } from "@/components/forms/FormReceipt";
import { TURNSTILE_SITE_KEY, TurnstileField } from "@/components/forms/TurnstileField";
import { useSubmission } from "@/components/forms/use-submission";
import { INTEREST_OPTIONS } from "@/lib/forms/options";
import {
  EMPTY_ENQUIRY,
  enquirySchema,
  fieldErrors,
  type EnquiryInput,
} from "@/lib/forms/schema";
import { buildMailtoFallback } from "@/lib/forms/submit";

/**
 * The homepage enquiry ("Start with a brief") form.
 *
 * It is the same enquiry as the Contact page's, so it posts to the same place
 * through the same tested path: `POST /api/submit.php?form=contact`, with the
 * identical field names and the same server-side validation. The visitor is
 * told success only after the mail server has accepted the message, and gets a
 * reference number they can quote.
 *
 * The form asks one extra question the Contact page does not — customization
 * requirements — which is folded into the message body rather than invented as
 * a server field, so nothing the visitor types is silently dropped.
 *
 * This used to hand the browser a `mailto:` link built from
 * NEXT_PUBLIC_RFQ_EMAIL. That address is not configured on the deployed site,
 * so the form could only ever answer "Enquiry delivery is not configured yet",
 * and no enquiry could reach the inbox at all.
 */

export function RfqForm({
  preselectedProduct,
  variant = "full",
}: {
  preselectedProduct?: string;
  variant?: "full" | "compact";
}) {
  const [values, setValues] = useState<EnquiryInput>({
    ...EMPTY_ENQUIRY,
    interest:
      preselectedProduct && (INTEREST_OPTIONS as readonly string[]).includes(preselectedProduct)
        ? preselectedProduct
        : "",
  });
  const [customization, setCustomization] = useState("");
  const { status, outcome, errors, setErrors, submit, reset } = useSubmission("contact");

  // Product pages deep-link with ?product=… and ?interest=…; on a static export
  // that query string only exists in the browser.
  useEffect(() => {
    if (variant !== "compact") return;
    const requested = new URLSearchParams(window.location.search).get("product");
    if (requested && (INTEREST_OPTIONS as readonly string[]).includes(requested)) {
      setValues((current) => ({ ...current, interest: requested }));
    }
  }, [variant]);

  const set =
    (key: keyof EnquiryInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  /** What the endpoint will actually receive, so validation judges that. */
  function withCustomization(input: EnquiryInput) {
    const extra = customization.trim();
    if (extra === "") return input;
    return { ...input, message: `${input.message}\n\nCustomization requirements: ${extra}`.trim() };
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = enquirySchema.safeParse(withCustomization(values));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    await submit(parsed.data as unknown as Record<string, string>);
  }

  const err = (key: keyof EnquiryInput) => errors[key];

  if (status === "success" && outcome) {
    return (
      <FormReceipt outcome={outcome} onReset={reset} resetLabel="Send another enquiry" />
    );
  }

  const submitting = status === "sending";
  const failure =
    status === "error" && outcome ? (
      <FormError outcome={outcome} fallbackHref={buildMailtoFallback("contact", values)} />
    ) : null;

  if (variant === "compact") {
    return (
      <form onSubmit={onSubmit} noValidate className="grid gap-7" aria-busy={submitting}>
        <div>
          <label htmlFor="rfq-name" className={labelClass}>Full name *</label>
          <input id="rfq-name" name="name" type="text" autoComplete="name" required
            disabled={submitting}
            className={inputClass} value={values.name} onChange={set("name")}
            {...fieldAria("rfq-name", err("name"))} />
        </div>
        <div>
          <label htmlFor="rfq-email" className={labelClass}>Business email *</label>
          <input id="rfq-email" name="email" type="email" autoComplete="email" required
            disabled={submitting}
            className={inputClass} value={values.email} onChange={set("email")}
            {...fieldAria("rfq-email", err("email"))} />
        </div>
        <div>
          <label htmlFor="rfq-product" className={labelClass}>Product / collection</label>
          <select id="rfq-product" name="interest" className={inputClass} value={values.interest}
            onChange={set("interest")} disabled={submitting}
            {...fieldAria("rfq-product", err("interest"))}>
            <option value="">General enquiry</option>
            {INTEREST_OPTIONS.filter((option) => option !== "General enquiry").map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rfq-message" className={labelClass}>Message *</label>
          <textarea id="rfq-message" name="message" rows={3} required
            placeholder="What are you sourcing, and at what scale?"
            className={inputClass} value={values.message} onChange={set("message")}
            disabled={submitting}
            {...fieldAria("rfq-message", err("message"))} />
        </div>

        <Honeypot id="rfq-website" value={values.website ?? ""} onChange={set("website")} />

        {TURNSTILE_SITE_KEY ? (
          <TurnstileField
            siteKey={TURNSTILE_SITE_KEY}
            onToken={(token) => setValues((current) => ({ ...current, turnstileToken: token }))}
          />
        ) : null}

        {failure}

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex cursor-pointer items-center gap-4 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-brass-deep text-lg text-brass-deep transition-colors duration-300 group-hover:bg-brass-deep group-hover:text-ivory" aria-hidden="true">
              {submitting ? "•" : "→"}
            </span>
            <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brass-deep transition-colors duration-300 group-hover:text-ink">
              {submitting ? "Sending…" : "Send request"}
            </span>
          </button>
          <RequiredNote />
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={submitting}>
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        <div>
          <label htmlFor="rfq-name" className={labelClass}>Name *</label>
          <input id="rfq-name" name="name" type="text" autoComplete="name" required
            disabled={submitting}
            className={inputClass} value={values.name} onChange={set("name")}
            {...fieldAria("rfq-name", err("name"))} />
          {err("name") ? <p id="rfq-name-error" role="alert" className="mt-2 text-xs text-red-800">{err("name")}</p> : null}
        </div>
        <div>
          <label htmlFor="rfq-company" className={labelClass}>Company *</label>
          <input id="rfq-company" name="company" type="text" autoComplete="organization" required
            disabled={submitting}
            className={inputClass} value={values.company} onChange={set("company")}
            {...fieldAria("rfq-company", err("company"))} />
          {err("company") ? <p id="rfq-company-error" role="alert" className="mt-2 text-xs text-red-800">{err("company")}</p> : null}
        </div>
        <div>
          <label htmlFor="rfq-email" className={labelClass}>Business email *</label>
          <input id="rfq-email" name="email" type="email" autoComplete="email" required
            disabled={submitting}
            className={inputClass} value={values.email} onChange={set("email")}
            {...fieldAria("rfq-email", err("email"))} />
          {err("email") ? <p id="rfq-email-error" role="alert" className="mt-2 text-xs text-red-800">{err("email")}</p> : null}
        </div>
        <div>
          <label htmlFor="rfq-phone" className={labelClass}>Phone / WhatsApp</label>
          <input id="rfq-phone" name="phone" type="tel" autoComplete="tel"
            disabled={submitting}
            className={inputClass} value={values.phone} onChange={set("phone")}
            {...fieldAria("rfq-phone", err("phone"))} />
          {err("phone") ? <p id="rfq-phone-error" role="alert" className="mt-2 text-xs text-red-800">{err("phone")}</p> : null}
        </div>
        <div>
          <label htmlFor="rfq-country" className={labelClass}>Country *</label>
          <input id="rfq-country" name="country" type="text" autoComplete="country-name" required
            disabled={submitting}
            className={inputClass} value={values.country} onChange={set("country")}
            {...fieldAria("rfq-country", err("country"))} />
          {err("country") ? <p id="rfq-country-error" role="alert" className="mt-2 text-xs text-red-800">{err("country")}</p> : null}
        </div>
        <div>
          <label htmlFor="rfq-product" className={labelClass}>Product / collection *</label>
          <select id="rfq-product" name="interest" required className={inputClass}
            value={values.interest} onChange={set("interest")} disabled={submitting}
            {...fieldAria("rfq-product", err("interest"))}>
            <option value="" disabled>Select…</option>
            {INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {err("interest") ? <p id="rfq-product-error" role="alert" className="mt-2 text-xs text-red-800">{err("interest")}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="rfq-customization" className={labelClass}>
            Customization requirements
          </label>
          {/* No name attribute: this value is folded into the message below,
              so it is never posted as a field of its own. */}
          <textarea id="rfq-customization" rows={2}
            placeholder="Colours, sizes, private label, packaging…"
            className={inputClass} value={customization} disabled={submitting}
            onChange={(event) => setCustomization(event.target.value)} />
          <p className="mt-2 text-xs text-taupe">
            Optional. Sent with your message.
          </p>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="rfq-message" className={labelClass}>Message *</label>
          <textarea id="rfq-message" name="message" rows={5} required
            placeholder="Tell us about your programme, timelines and target market."
            className={inputClass} value={values.message} onChange={set("message")}
            disabled={submitting}
            {...fieldAria("rfq-message", err("message"))} />
          {err("message") ? <p id="rfq-message-error" role="alert" className="mt-2 text-xs text-red-800">{err("message")}</p> : null}
        </div>
      </div>

      <Honeypot id="rfq-website" value={values.website ?? ""} onChange={set("website")} />

      {TURNSTILE_SITE_KEY ? (
        <TurnstileField
          siteKey={TURNSTILE_SITE_KEY}
          onToken={(token) => setValues((current) => ({ ...current, turnstileToken: token }))}
        />
      ) : null}

      {failure}

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center gap-3 bg-ink px-9 py-4.5 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition-colors duration-300 hover:bg-cocoa disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Request a quote"}
          {!submitting && <span aria-hidden>→</span>}
        </button>
        <RequiredNote />
      </div>
    </form>
  );
}
