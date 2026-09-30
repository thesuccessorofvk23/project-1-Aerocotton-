import { z } from "zod";
import {
  CATEGORY_OPTIONS,
  INTEREST_OPTIONS,
  PRIORITY_OPTIONS,
  QUANTITY_OPTIONS,
} from "./options";

/**
 * The two form contracts, shared by the client components and by anything that
 * needs to reason about a submission before it is posted.
 *
 * Field names match public/api/lib/forms.php exactly, so an error the server
 * returns lands against the right input without a translation table. The rules
 * are deliberately the same on both sides; the browser copy exists for a fast
 * answer, the server's is the one that counts.
 */

/** Optional free text: an empty string is a valid answer, not a missing one. */
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

const phone = optionalText(32, "Phone number looks too long.");
const company = optionalText(120, "Company name is too long.");

/** Bots fill this; people never see it. */
const honeypot = z.string().max(0, "Something went wrong.").optional().or(z.literal(""));

const turnstile = z.string().optional().or(z.literal(""));

const select = (options: readonly string[], message: string) =>
  z.string().trim().refine((value) => (options as readonly string[]).includes(value), message);

export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is longer than we can store."),
  company: z
    .string()
    .trim()
    .min(2, "Please enter your company name.")
    .max(120, "Company name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(160, "That email is too long."),
  phone,
  country: z
    .string()
    .trim()
    .min(2, "Please enter your country.")
    .max(80, "That country name is longer than we can store."),
  interest: select(INTEREST_OPTIONS, "Please choose what you are interested in."),
  quantity: select(QUANTITY_OPTIONS, "Please choose an estimated quantity."),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more about your requirement — at least 20 characters.")
    .max(5000, "That message is too long."),
  website: honeypot,
  turnstileToken: turnstile,
});

export const supportSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is longer than we can store."),
  company,
  email: z.string().trim().email("Please enter a valid email address.").max(160, "That email is too long."),
  phone,
  orderId: optionalText(60, "That reference is longer than we can store."),
  category: select(CATEGORY_OPTIONS, "Please choose a support category."),
  priority: select(PRIORITY_OPTIONS, "Please choose a priority."),
  subject: z
    .string()
    .trim()
    .min(3, "Please give your request a subject.")
    .max(140, "That subject is too long."),
  description: z
    .string()
    .trim()
    .min(20, "Please describe what happened — at least 20 characters.")
    .max(5000, "That description is too long."),
  website: honeypot,
  turnstileToken: turnstile,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type SupportInput = z.infer<typeof supportSchema>;

export const EMPTY_ENQUIRY: EnquiryInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  interest: "",
  quantity: "",
  message: "",
  website: "",
  turnstileToken: "",
};

export const EMPTY_SUPPORT: SupportInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  orderId: "",
  category: "",
  priority: "Normal",
  subject: "",
  description: "",
  website: "",
  turnstileToken: "",
};

/** Flatten a zod error into one message per field, which is all the UI needs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
