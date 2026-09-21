import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { termsSections } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Terms and conditions",
  description: "Terms for using the Aero Cotton website and placing enquiries or textile orders.",
  path: "/customer-care/terms-conditions",
});

export default function TermsPage() {
  return <PolicyPage eyebrow="Terms & conditions" title="Clear terms for good work." intro="These terms explain how the Aero Cotton website, quotations and orders work together." sections={termsSections} />;
}