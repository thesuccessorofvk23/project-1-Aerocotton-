"use client";

import { useState } from "react";
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
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from "@/lib/forms/options";
import {
  EMPTY_SUPPORT,
  fieldErrors,
  supportSchema,
  type SupportInput,
} from "@/lib/forms/schema";
import { buildMailtoFallback } from "@/lib/forms/submit";

/**
 * The Request Support form.
 *
 * Posts to the same endpoint as the contact form, which recognises the priority
 * and puts it in the notification's subject line so the inbox can be triaged
 * without opening the message.
 */
export function SupportForm() {
  const [values, setValues] = useState<SupportInput>(EMPTY_SUPPORT);
  const { status, outcome, errors, setErrors, files, addFiles, removeFile, submit, reset } =
    useSubmission("support");

  const set =
    (key: keyof SupportInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = supportSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    await submit(parsed.data as unknown as Record<string, string>);
  }

  if (status === "success" && outcome) {
    return <FormReceipt outcome={outcome} onReset={reset} resetLabel="Send another request" />;
  }

  const err = (key: keyof SupportInput) => errors[key];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-7" aria-busy={status === "sending"}>
      <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
        <Field id="support-name" label="Name" required error={err("name")}>
          <input
            id="support-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.name}
            onChange={set("name")}
            {...fieldAria("support-name", err("name"))}
          />
        </Field>

        <Field
          id="support-company"
          label="Company"
          error={err("company")}
          hint="Optional"
        >
          <input
            id="support-company"
            name="company"
            type="text"
            autoComplete="organization"
            disabled={status === "sending"}
            className={inputClass}
            value={values.company}
            onChange={set("company")}
            {...fieldAria("support-company", err("company"), "Optional")}
          />
        </Field>

        <Field id="support-email" label="Email" required error={err("email")}>
          <input
            id="support-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.email}
            onChange={set("email")}
            {...fieldAria("support-email", err("email"))}
          />
        </Field>

        <Field
          id="support-phone"
          label="Phone / WhatsApp"
          error={err("phone")}
          hint="Optional"
        >
          <input
            id="support-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={status === "sending"}
            className={inputClass}
            value={values.phone}
            onChange={set("phone")}
            {...fieldAria("support-phone", err("phone"), "Optional")}
          />
        </Field>

        <Field
          id="support-order-id"
          label="Customer / order ID"
          error={err("orderId")}
          hint="Optional — from your order confirmation or invoice."
        >
          <input
            id="support-order-id"
            name="orderId"
            type="text"
            autoComplete="off"
            disabled={status === "sending"}
            className={inputClass}
            value={values.orderId}
            onChange={set("orderId")}
            {...fieldAria(
              "support-order-id",
              err("orderId"),
              "Optional — from your order confirmation or invoice."
            )}
          />
        </Field>

        <Field id="support-category" label="Support category" required error={err("category")}>
          <select
            id="support-category"
            name="category"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.category}
            onChange={set("category")}
            {...fieldAria("support-category", err("category"))}
          >
            <option value="" disabled>
              Select…
            </option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field id="support-priority" label="Priority" required error={err("priority")} className="md:col-span-2">
          <select
            id="support-priority"
            name="priority"
            required
            disabled={status === "sending"}
            className={inputClass}
            value={values.priority}
            onChange={set("priority")}
            {...fieldAria("support-priority", err("priority"))}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field id="support-subject" label="Subject" required error={err("subject")} className="md:col-span-2">
          <input
            id="support-subject"
            name="subject"
            type="text"
            required
            disabled={status === "sending"}
            placeholder="A short summary — “Four blankets missing from pallet 3”."
            className={inputClass}
            value={values.subject}
            onChange={set("subject")}
            {...fieldAria("support-subject", err("subject"))}
          />
        </Field>

        <Field
          id="support-description"
          label="Description"
          required
          error={err("description")}
          hint="What happened, when, and what you would like us to do."
          className="md:col-span-2"
        >
          <textarea
            id="support-description"
            name="description"
            rows={6}
            required
            disabled={status === "sending"}
            placeholder="Include order numbers, dates and anything you have already tried."
            className={inputClass}
            value={values.description}
            onChange={set("description")}
            {...fieldAria(
              "support-description",
              err("description"),
              "What happened, when, and what you would like us to do."
            )}
          />
        </Field>

        <div className="md:col-span-2">
          <UploadField
            id="support-files"
            files={files}
            error={errors.files}
            disabled={status === "sending"}
            onAdd={addFiles}
            onRemove={removeFile}
          />
        </div>
      </div>

      <Honeypot id="support-website" value={values.website ?? ""} onChange={set("website")} />

      {TURNSTILE_SITE_KEY ? (
        <TurnstileField
          siteKey={TURNSTILE_SITE_KEY}
          onToken={(token) => setValues((current) => ({ ...current, turnstileToken: token }))}
        />
      ) : null}

      {status === "error" && outcome ? (
        <FormError outcome={outcome} fallbackHref={buildMailtoFallback("support", values)} />
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4">
        <SubmitButton sending={status === "sending"} label="Send request" />
        <RequiredNote>* Required. We acknowledge every request by email.</RequiredNote>
      </div>
    </form>
  );
}
