import type { Metadata } from "next";
import { customerCareSections } from "@/content/policies";
import { pageMeta } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = pageMeta({
  title: "Customer care",
  description: "Answers about Aero Cotton orders, samples, delivery, quality and textile care.",
  path: "/customer-care",
});

export default function CustomerCarePage() {
  return <section className="aero-faq-page bg-ivory"><Container><div className="aero-faq-page__top"><p className="aero-faq-page__label">FAQ</p><span className="aero-faq-page__mark" aria-hidden="true">A</span></div><div className="aero-faq-page__layout"><div className="aero-faq-page__intro"><h1>Questions,<br />answered.</h1><p>We&apos;ve put together the most common questions about sourcing, ordering and caring for Aero Cotton textiles.</p><p>If you have a question that you can&apos;t find here, please contact us directly for more information.</p><ButtonLink href="/contact" variant="outline">Contact us</ButtonLink></div><div className="aero-faq-page__list">{customerCareSections.map((section) => <details key={section.title}><summary>{section.title}<span aria-hidden="true">+</span></summary><div>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</div></details>)}</div></div></Container></section>;
}