import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { shippingSections } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Shipping and returns",
  description: "Aero Cotton shipping, delivery, cancellation, return and exchange policy.",
  path: "/customer-care/shipping-returns-policy",
});

export default function ShippingReturnsPage() {
  return <PolicyPage eyebrow="Shipping & returns" title="From Karur to your door." intro="Delivery and returns depend on the order, destination and textile programme. These are the principles we apply to every shipment." sections={shippingSections} />;
}