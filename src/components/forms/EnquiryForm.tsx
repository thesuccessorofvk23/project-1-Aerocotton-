"use client";

import { useEffect, useState } from "react";
import {
  Field,
  Honeypot,
  RequiredNote,
  SubmitButton,
  UploadField,
  fieldAria,
  inputClass,
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
 * The Contact Us enquiry.
 *
 * Validation runs twice on purpose: here for an immediate answer, and again in
 * public/api/submit.php, which is the copy that actually decides. Nothing about
 * where the mail goes lives in this file.
 */
export function EnquiryForm() {
  const [values, setValues] = useState<EnquiryInput>(EMPTY_ENQUIRY);
  const { status, outcome, errors, setErrors, files, addFiles, removeFile, submit, reset } =
    useSubmission("contact");

  // Product and collection pages deep-link here with ?product=…; on a static
  // export that query string only exists in the browser.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("interest") ?? params.get("product");
    if (requested && (INTEREST_OPTIONS as readonly string[]).includes(requested)) {
      setValues((current) => ({ ...current, interest: requested }));
    }
  }, []);

  const set =
    (key: keyof EnquiryInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    await submit(parsed.data as unknown as Record<string, string>);
  }

  if (status === "success" && outcome) {
    return (
      <FormReceipt outcome={outcome} onReset={reset} resetLabel="Send another enquiry" />
    );
  }

  const err = (key: keyof EnquiryInput) => errors[key];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-7" aria-busy={status === "sending"}>
      <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
        <Field id="enquiry-name" label="Name" required error={err("name")}>
          <input
            id="enquiry-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.name}
            onChange={set("name")}
            {...fieldAria("enquiry-name", err("name"))}
          />
        </Field>

        <Field id="enquiry-company" label="Company" required error={err("company")}>
          <input
            id="enquiry-company"
            name="company"
            type="text"
            autoComplete="organization"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.company}
            onChange={set("company")}
            {...fieldAria("enquiry-company", err("company"))}
          />
        </Field>

        <Field id="enquiry-email" label="Email" required error={err("email")}>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.email}
            onChange={set("email")}
            {...fieldAria("enquiry-email", err("email"))}
          />
        </Field>

        <Field
          id="enquiry-phone"
          label="Phone / WhatsApp"
          error={err("phone")}
          hint="Optional"
        >
          <input
            id="enquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={status === "sending"}
            className={inputClass}
            value={values.phone}
            onChange={set("phone")}
            {...fieldAria("enquiry-phone", err("phone"), "Optional")}
          />
        </Field>

        <Field id="enquiry-country" label="Country" required error={err("country")}>
          <input
            id="enquiry-country"
            name="country"
            type="text"
            autoComplete="country-name"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.country}
            onChange={set("country")}
            {...fieldAria("enquiry-country", err("country"))}
          />
        </Field>

        <Field
          id="enquiry-interest"
          label="Product / service interest"
          required
          error={err("interest")}
        >
          <select
            id="enquiry-interest"
            name="interest"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.interest}
            onChange={set("interest")}
            {...fieldAria("enquiry-interest", err("interest"))}
          >
            <option value="" disabled>
              Select…
            </option>
            {INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="enquiry-message"
          label="Message"
          required
          error={err("message")}
          hint="Products, quantities, colours and timelines all help."
          className="md:col-span-2"
        >
          <textarea
            id="enquiry-message"
            name="message"
            rows={5}
            required
            disabled={status === "sending"}
            placeholder="Tell us about your programme, timelines and target market."
            className={inputClass}
            value={values.message}
            onChange={set("message")}
            {...fieldAria("enquiry-message", err("message"), "Products, quantities, colours and timelines all help.")}
          />
        </Field>

        <div className="md:col-span-2">
          <UploadField
            id="enquiry-files"
            files={files}
            error={errors.files}
            disabled={status === "sending"}
            onAdd={addFiles}
            onRemove={removeFile}
          />
        </div>
      </div>

      <Honeypot id="enquiry-website" value={values.website ?? ""} onChange={set("website")} />

      {TURNSTILE_SITE_KEY ? (
        <TurnstileField
          siteKey={TURNSTILE_SITE_KEY}
          onToken={(token) => setValues((current) => ({ ...current, turnstileToken: token }))}
        />
      ) : null}

      {status === "error" && outcome ? (
        <FormError outcome={outcome} fallbackHref={buildMailtoFallback("contact", values)} />
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4">
        <SubmitButton sending={status === "sending"} label="Send enquiry" />
        <RequiredNote />
      </div>
    </form>
  );
}
