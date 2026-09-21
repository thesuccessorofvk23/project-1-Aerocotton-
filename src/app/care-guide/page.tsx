import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { careSections } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Care guide",
  description: "Practical washing, drying, ironing and stain-care guidance for Aero Cotton textiles.",
  path: "/care-guide",
});

export default function CareGuidePage() {
  return <PolicyPage eyebrow="Care guide" title="Good cotton gets better with care." intro="Simple habits protect the colour, hand and useful life of your Aero Cotton textiles." sections={careSections} />;
}