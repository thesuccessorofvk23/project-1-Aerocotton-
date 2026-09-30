import { UPLOAD_LIMITS } from "./options";

/**
 * Posting a submission to the mail endpoint.
 *
 * Everything here runs in the browser, so nothing in this file may hold a
 * credential: the endpoint URL is public, and the destination inbox, the
 * mailbox password and the CAPTCHA secret all live server-side in
 * public/api/config.php. The browser only ever learns whether the mail server
 * accepted the message.
 */

export type FormName = "contact" | "support";

export interface SubmissionOutcome {
  ok: boolean;
  /** One sentence for the visitor. */
  message: string;
  reference?: string;
  submittedAt?: string;
  acknowledged?: boolean;
  /** Per-field messages, keyed exactly as the inputs are named. */
  errors: Record<string, string>;
  /** Whether trying again could plausibly succeed. */
  retryable: boolean;
  /** True when the endpoint itself could not be reached. */
  unreachable: boolean;
}

/**
 * Where submissions are posted. The default is the endpoint that ships beside
 * the site; point NEXT_PUBLIC_FORMS_ENDPOINT at an absolute URL if the forms
 * are ever served from a host that cannot run PHP (the endpoint allows the
 * site's own origins through CORS).
 */
export const FORMS_ENDPOINT =
  process.env.NEXT_PUBLIC_FORMS_ENDPOINT?.trim() || "/api/submit.php";

/** The address a visitor can fall back to if the endpoint is unreachable. */
const FALLBACK_EMAIL = process.env.NEXT_PUBLIC_RFQ_EMAIL?.trim() || "";

/** A generous ceiling: a submission with attachments over a slow connection. */
const TIMEOUT_MS = 60_000;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Check the chosen attachments before anything is uploaded, so an obviously
 * oversized or wrong-typed file never costs the visitor a slow round trip.
 * Returns a message to show, or null when everything is acceptable.
 */
export function validateFiles(files: File[]): string | null {
  if (files.length > UPLOAD_LIMITS.maxFiles) {
    return `Please attach at most ${UPLOAD_LIMITS.maxFiles} files.`;
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > UPLOAD_LIMITS.maxTotalBytes) {
    return `Your attachments add up to more than ${formatBytes(UPLOAD_LIMITS.maxTotalBytes)}. Please attach fewer or smaller files.`;
  }

  for (const file of files) {
    if (file.size > UPLOAD_LIMITS.maxBytes) {
      return `“${file.name}” is larger than ${formatBytes(UPLOAD_LIMITS.maxBytes)}.`;
    }
    if (file.type && !(UPLOAD_LIMITS.mimeTypes as readonly string[]).includes(file.type)) {
      return `“${file.name}” is not a file type we accept.`;
    }
  }

  return null;
}

function isOutcome(value: unknown): value is Partial<SubmissionOutcome> {
  return typeof value === "object" && value !== null;
}

/** Post one submission. Never throws; every failure comes back as an outcome. */
export async function submitForm(
  form: FormName,
  values: Record<string, string>,
  files: File[],
  elapsedMs: number
): Promise<SubmissionOutcome> {
  const body = new FormData();
  for (const [key, value] of Object.entries(values)) {
    body.append(key, value);
  }
  body.append("elapsed", String(Math.max(0, Math.round(elapsedMs))));
  // The name matters: PHP only builds an array for a `files[]` field, and
  // anything else silently keeps just the last file.
  for (const file of files) {
    body.append("files[]", file, file.name);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${FORMS_ENDPOINT}?form=${form}`, {
      method: "POST",
      body,
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return {
      ok: false,
      message:
        "We could not reach the server. Please check your connection and try again.",
      errors: {},
      retryable: true,
      unreachable: true,
    };
  }
  clearTimeout(timer);

  // A static host will happily serve the endpoint's source back as a file
  // rather than running it. Treating that as an unreachable endpoint keeps the
  // visitor from ever seeing a success we cannot stand behind.
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      message:
        "The enquiry service is not responding from this address. Please try again in a moment.",
      errors: {},
      retryable: false,
      unreachable: true,
    };
  }

  if (!isOutcome(payload)) {
    return {
      ok: false,
      message: "We could not read the server's reply. Please try again.",
      errors: {},
      retryable: true,
      unreachable: false,
    };
  }

  if (payload.ok === true) {
    return {
      ok: true,
      message:
        payload.message ??
        "Thank you. Your request has been successfully submitted. Our team will review it and get back to you shortly.",
      reference: payload.reference,
      submittedAt: payload.submittedAt,
      acknowledged: payload.acknowledged,
      errors: {},
      retryable: false,
      unreachable: false,
    };
  }

  const retryable = response.status !== 400 && response.status !== 403;

  return {
    ok: false,
    message:
      payload.message ??
      "Something went wrong and your request was not sent. Please try again.",
    reference: payload.reference,
    errors: payload.errors ?? {},
    // A validation failure is fixed by editing the form, not by resubmitting —
    // the form is still on screen, so it is not something to "retry" blind.
    retryable: retryable && response.status !== 422,
    unreachable: false,
  };
}

/**
 * A mailto draft of the same submission, offered only when the endpoint cannot
 * be reached and a public enquiry address has been configured. It is a
 * graceful degradation, never the primary route.
 */
export function buildMailtoFallback(
  form: FormName,
  values: Record<string, string>
): string | null {
  if (!FALLBACK_EMAIL) return null;

  const lines: string[] = [];
  if (form === "contact") {
    lines.push(
      "New Contact Inquiry",
      "",
      `Name: ${values.name || ""}`,
      `Company: ${values.company || ""}`,
      `Email: ${values.email || ""}`,
      `Phone: ${values.phone || "Not provided"}`,
      `Country: ${values.country || ""}`,
      `Product / Service Interest: ${values.interest || ""}`,
      `Estimated Quantity: ${values.quantity || ""}`,
      "",
      "Message:",
      values.message || ""
    );
  } else {
    lines.push(
      "New Support Request",
      "",
      `Name: ${values.name || ""}`,
      `Company: ${values.company || "Not provided"}`,
      `Email: ${values.email || ""}`,
      `Phone: ${values.phone || "Not provided"}`,
      `Customer / Order ID: ${values.orderId || "Not provided"}`,
      `Support Category: ${values.category || ""}`,
      `Priority: ${values.priority || ""}`,
      `Subject: ${values.subject || ""}`,
      "",
      "Description:",
      values.description || ""
    );
  }
  lines.push("", "Sent from the Aerocotton website (attachments must be added manually).");

  const subject =
    form === "contact"
      ? `New Contact Inquiry - ${values.company || values.name || "Website"}`
      : `New Support Request - ${values.priority || "Normal"} - ${values.subject || "Website"}`;

  return `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
