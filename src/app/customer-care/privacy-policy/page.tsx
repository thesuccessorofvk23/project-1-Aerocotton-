import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { privacySections } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Privacy policy",
  description: "How Aero Cotton collects, uses, protects and retains personal information.",
  path: "/customer-care/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return <PolicyPage eyebrow="Privacy policy" title="Your information, handled with care." intro="This policy explains what Aero Cotton collects, why we use it and the choices available to you." sections={privacySections} />;
}