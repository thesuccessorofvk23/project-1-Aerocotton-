"use client";

import { ButtonLink } from "@/components/ui/Button";
import type { SubmissionOutcome } from "@/lib/forms/submit";

/**
 * What the visitor sees when the mail server has accepted their submission.
 *
 * Shown only after the endpoint has confirmed delivery — the reference number
 * here is the same one written into the notification and the acknowledgement
 * email, so quoting it reaches the right enquiry.
 */
export function FormReceipt({
  outcome,
  onReset,
  resetLabel,
}: {
  outcome: SubmissionOutcome;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border border-outline bg-linen px-6 py-8 sm:px-9 sm:py-10"
    >
      <p className="text-2xs font-semibold uppercase tracking-[0.3em] text-taupe">Aerocotton</p>

      <h3 className="mt-4 font-display text-display-sm text-ink">Request Received</h3>

      <p className="mt-5 max-w-prose text-sm/loose text-umber">
        Thank you. Your request has been successfully submitted. Our team will review
        it and get back to you shortly.
      </p>

      {outcome.reference ? (
        <div className="mt-8 border-t border-brass pt-6">
          <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-taupe">
            Your reference
          </p>
          <p className="mt-3 font-display text-2xl tracking-[0.04em] text-ink">
            {outcome.reference}
          </p>
          <p className="mt-3 text-xs/relaxed text-umber">
            Quote this number in any follow-up so we can find your request straight
            away.
            {outcome.acknowledged
              ? " A confirmation has been emailed to you."
              : null}
          </p>
        </div>
      ) : null}

      {outcome.submittedAt ? (
        <p className="mt-6 text-2xs uppercase tracking-[0.14em] text-taupe">
          Submitted {outcome.submittedAt}
        </p>
      ) : null}

      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
        <ButtonLink href="/" variant="solid" size="md">
          Back to home
        </ButtonLink>
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer text-2xs font-semibold uppercase tracking-[0.18em] text-taupe transition-colors hover:text-ink"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * A failure the visitor can act on. Nothing here is a success in disguise: if
 * the mail server did not accept the message, the form stays on screen with
 * everything they typed still in it.
 */
export function FormError({
  outcome,
  fallbackHref,
}: {
  outcome: SubmissionOutcome;
  fallbackHref: string | null;
}) {
  return (
    <div
      role="alert"
      className="mt-8 border border-red-800/40 bg-red-50 px-6 py-5 text-sm text-red-900"
    >
      <p className="font-semibold">Your request was not sent.</p>
      <p className="mt-2 text-sm/relaxed">{outcome.message}</p>
      {outcome.reference ? (
        <p className="mt-2 text-xs/relaxed">
          Your details were recorded on our server under reference{" "}
          <strong>{outcome.reference}</strong>.
        </p>
      ) : null}
      {outcome.unreachable && fallbackHref ? (
        <p className="mt-3 text-xs/relaxed">
          You can also{" "}
          <a href={fallbackHref} className="font-semibold underline underline-offset-4">
            send this by email
          </a>
          , though attachments will need to be added by hand.
        </p>
      ) : null}
      {outcome.retryable ? (
        <p className="mt-3 text-xs/relaxed">
          Everything you entered is still here — press send to try again.
        </p>
      ) : null}
    </div>
  );
}
