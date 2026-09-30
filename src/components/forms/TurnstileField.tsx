"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, rendered only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is
 * set — so the forms work on the honeypot, timing check and rate limiter alone
 * until someone opts in.
 *
 * The token is handed back to the form and posted with the submission; the
 * endpoint verifies it against the matching secret, which never leaves the
 * server.
 */

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset?: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileField({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // Kept in a ref so a new inline callback does not re-render the widget.
  const handler = useRef(onToken);
  handler.current = onToken;

  useEffect(() => {
    if (!siteKey || !container.current || widget.current) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || widget.current || !container.current || !window.turnstile) return;
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token: string) => handler.current(token),
        "error-callback": () => handler.current(""),
        "expired-callback": () => handler.current(""),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>("script[data-aero-turnstile]");
      if (existing) {
        existing.addEventListener("load", render);
      } else {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.dataset.aeroTurnstile = "true";
        script.addEventListener("load", render);
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  return <div ref={container} className="min-h-px" />;
}

/** The public site key, or an empty string when CAPTCHA is switched off. */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
