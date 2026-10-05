import { z } from "zod";

/**
 * RFQ form contract — used by both the client form and the server action,
 * so validation can never drift between the two.
 */
export const rfqSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  company: z.string().trim().min(2, "Please enter your company name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(24, "Phone number looks too long.")
    .optional()
    .or(z.literal("")),
  country: z.string().trim().min(2, "Please enter your country."),
  product: z.string().trim().min(1, "Please choose a product or collection."),
  customization: z.string().trim().max(2000).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more about your requirement (min. 20 characters).")
    .max(5000, "Message is too long."),
  /** Honeypot — must stay empty. Bots fill it; humans never see it. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** Turnstile token (only required when the server key is configured). */
  turnstileToken: z.string().optional().or(z.literal("")),
});

export type RfqInput = z.infer<typeof rfqSchema>;

export const PRODUCT_OPTIONS = [
  "General enquiry",
  ...[
    "Nature",
    "Mountain",
    "Beach",
    "City",
    "Forest",
    "Lake",
    "Desert",
    "Waterfall",
    "Snow",
    "Aurora",
  ].map((name) => `${name} collection`),
  "Custom manufacturing",
] as const;
