import { company } from "@/content/company";

interface RfqEmail {
  name: string;
  company: string;
  email: string;
  phone?: string;
  country: string;
  product: string;
  quantity: string;
  customization?: string;
  message: string;
}

/** Escape user text for safe interpolation into the HTML email body. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 16px;border-bottom:1px solid #e3dcd0;font-family:sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a7d70;">${esc(label)}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #e3dcd0;font-family:sans-serif;font-size:14px;color:#171614;">${esc(value)}</td>
    </tr>`;
}

export function buildRfqEmail(data: RfqEmail): string {
  const rows = [
    row("Name", data.name),
    row("Company", data.company),
    row("Email", data.email),
    data.phone ? row("Phone", data.phone) : "",
    row("Country", data.country),
    row("Product / Collection", data.product),
    row("Estimated quantity", data.quantity),
    data.customization ? row("Customization", data.customization) : "",
  ].join("");

  return `
  <div style="background:#f4f0e8;padding:32px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3dcd0;">
      <div style="padding:24px 32px;border-bottom:2px solid #b08d57;">
        <p style="margin:0;font-family:sans-serif;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#8a7d70;">New enquiry — aerocotton.in</p>
        <p style="margin:8px 0 0;font-family:sans-serif;font-size:20px;color:#171614;">Request for quotation</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="padding:20px 32px 28px;">
        <p style="margin:0 0 8px;font-family:sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a7d70;">Message</p>
        <p style="margin:0;font-family:sans-serif;font-size:14px;line-height:1.7;color:#171614;white-space:pre-line;">${esc(data.message)}</p>
      </div>
      <div style="padding:16px 32px;background:#f4f0e8;border-top:1px solid #e3dcd0;">
        <p style="margin:0;font-family:sans-serif;font-size:12px;color:#8a7d70;">Reply directly to this email to reach ${esc(data.name)} at ${esc(data.company)}.</p>
      </div>
    </div>
  </div>`;
}

export interface SendResult {
  ok: boolean;
  /** Shown to the user when delivery is dev-simulated. */
  simulated?: boolean;
  error?: string;
}

/**
 * Send the RFQ. With RESEND_API_KEY configured this delivers a real email
 * with reply-to set to the enquirer. Without a key (local dev / staging)
 * it logs the enquiry and reports success so the flow stays testable.
 */
export async function sendRfqEmail(data: RfqEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RFQ_TO_EMAIL;
  const from = process.env.RFQ_FROM_EMAIL ?? "Aerocotton Website <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.info("[rfq] RESEND not configured — logging enquiry instead:", {
      from: data.email,
      product: data.product,
      quantity: data.quantity,
    });
    return { ok: true, simulated: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const html = buildRfqEmail(data);
    const subject = `RFQ — ${data.product} — ${data.company} (${data.country})`;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email,
      subject,
      html,
    });

    if (error) {
      console.error("[rfq] Resend delivery failed:", error);
      return { ok: false, error: "Delivery failed. Please email us directly." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[rfq] Unexpected delivery error:", err);
    return { ok: false, error: "Delivery failed. Please email us directly." };
  }
}
