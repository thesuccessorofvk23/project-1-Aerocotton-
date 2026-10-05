/**
 * The choices the two public forms offer.
 *
 * Every list here is mirrored in public/api/lib/forms.php, which validates
 * against its own copy — the server is the authority. Add an option in one
 * place and you must add it in the other, or the browser will offer a choice
 * the server rejects.
 */

export const INTEREST_OPTIONS = [
  "General enquiry",
  "Nature collection",
  "Mountain collection",
  "Beach collection",
  "City collection",
  "Forest collection",
  "Lake collection",
  "Desert collection",
  "Waterfall collection",
  "Snow collection",
  "Aurora collection",
  "Custom manufacturing",
  "Private label / OEM",
  "Samples and swatches",
  "Other",
] as const;

export const CATEGORY_OPTIONS = [
  "Order status / tracking",
  "Delivery or shipment",
  "Product quality",
  "Returns or replacement",
  "Product or care question",
  "Documentation or billing",
  "Other",
] as const;

export const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number];
export type SupportCategory = (typeof CATEGORY_OPTIONS)[number];
export type Priority = (typeof PRIORITY_OPTIONS)[number];

/**
 * Attachment rules. These mirror the endpoint's own limits, which enforce them
 * again server-side — the browser check is there to give a fast answer, not to
 * be trusted.
 */
export const UPLOAD_LIMITS = {
  maxFiles: 3,
  maxBytes: 4 * 1024 * 1024,
  maxTotalBytes: 6 * 1024 * 1024,
  /** Passed to the file input's accept attribute. */
  accept: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.heic",
  /** Content types the endpoint will keep. */
  mimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/msword",
    "text/csv",
    "text/plain",
  ],
  description: "PDF, Word, Excel, CSV or image · up to 4 MB each, 3 files",
} as const;
