"use server";

import { headers } from "next/headers";
import { rfqSchema, type RfqInput } from "./schema";
import { rateLimit } from "./rate-limit";
import { sendRfqEmail } from "./send";

/** Verify Cloudflare Turnstile token when the secret is configured. */
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — skip
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch {
    // Fail closed on network errors — do not accept unverifiable submissions.
    return false;
  }
}

export interface RfqActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export async function submitRfq(input: RfqInput): Promise<RfqActionResult> {
  // 1. Honeypot — silently accept and discard bot submissions.
  if (input.website && input.website.length > 0) {
    return { ok: true, message: "Thank you — your enquiry has been received." };
  }

  // 2. Schema validation (shared with the client form).
  const parsed = rfqSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      fieldErrors,
    };
  }
  const data = parsed.data;

  // 3. Rate limit by IP.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const limit = rateLimit(`rfq:${ip}`);
  if (!limit.ok) {
    return {
      ok: false,
      message: `Too many enquiries from this network. Please try again in about ${limit.retryAfterMin ?? 10} minutes.`,
    };
  }

  // 4. Turnstile (only enforced when configured).
  const human = await verifyTurnstile(data.turnstileToken || undefined);
  if (!human) {
    return {
      ok: false,
      message: "Spam check failed. Please refresh the page and try again.",
    };
  }

  // 5. Deliver.
  const result = await sendRfqEmail({
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone || undefined,
    country: data.country,
    product: data.product,
    quantity: data.quantity,
    customization: data.customization || undefined,
    message: data.message,
  });

  if (!result.ok) {
    return { ok: false, message: result.error ?? "Something went wrong. Please try again." };
  }

  return {
    ok: true,
    message: result.simulated
      ? "Enquiry received (delivery simulated — RESEND_API_KEY not configured)."
      : "Thank you — your enquiry has been received. Our team will reply within two business days.",
  };
}
