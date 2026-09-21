"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function createHeroMotion(section: HTMLElement) {
  const video = section.querySelector(".hero-editorial__video");
  const grid = section.querySelector(".hero-editorial__grid");

  if (!video || !grid) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: 1.3,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(
      video,
      { scale: 1.18, yPercent: 8, filter: "brightness(0.72) saturate(0.82)" },
      { scale: 1.06, yPercent: -7, filter: "brightness(1) saturate(1)" },
      0
    )
    .fromTo(
      grid,
      { opacity: 0.5, x: -24 },
      { opacity: 1, x: 0 },
      0
    );
}

function createOriginMotion(section: HTMLElement) {
  const copy = section.querySelector(".aero-origin__copy");
  const panel = section.querySelector(".aero-origin__panel");
  const metric = section.querySelector(".aero-origin__metric");
  const tags = section.querySelectorAll(".aero-origin__tags span");

  if (!copy || !panel || !metric) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 85%",
      end: "bottom 15%",
      scrub: 1.35,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(copy, { y: 50, opacity: 0.35 }, { y: 0, opacity: 1 }, 0)
    .fromTo(panel, { y: 52, rotateX: 8, opacity: 0.5 }, { y: 0, rotateX: 0, opacity: 1 }, 0.1)
    .fromTo(metric, { y: 28, scale: 0.96, opacity: 0.7 }, { y: 0, scale: 1, opacity: 1 }, 0.18)
    .from(tags, { y: 18, opacity: 0, stagger: 0.08, duration: 0.75, ease: "power2.out" }, 0.2);
}

function createEditorialMotion(section: HTMLElement) {
  const copy = section.querySelector(".aero-editorial-statement__copy");
  const visual = section.querySelector(".aero-editorial-statement__visual");
  const image = visual?.querySelector("img");

  if (!copy || !visual) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1.4,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(copy, { x: -48, opacity: 0.3 }, { x: 0, opacity: 1 }, 0)
    .fromTo(visual, { y: 48, opacity: 0.5 }, { y: 0, opacity: 1 }, 0.08)
    .fromTo(image ?? visual, { scale: 1.14, filter: "brightness(0.82) saturate(0.8)" }, { scale: 1.04, filter: "brightness(1) saturate(1)" }, 0.1)
    .fromTo(visual.querySelector("span"), { x: 18, opacity: 0 }, { x: 0, opacity: 1 }, 0.2);
}

function createFeatureStripMotion(section: HTMLElement) {
  const items = section.querySelectorAll(".aero-feature-strip__grid div");
  if (!items.length) return;

  gsap.fromTo(
    items,
    { y: 26, opacity: 0.2 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        end: "bottom 15%",
        scrub: 1.15,
        invalidateOnRefresh: true,
      },
    }
  );
}

function createCampaignMotion(section: HTMLElement) {
  const image = section.querySelector(".aero-campaign__shell > img");
  const copy = section.querySelector(".aero-campaign__copy");
  const rail = section.querySelector(".aero-campaign__rail");
  const cards = section.querySelectorAll(".aero-campaign-card");

  if (!image || !copy || !rail) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1.4,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(image, { scale: 1.16, y: 36, filter: "brightness(0.72) saturate(0.7)" }, { scale: 1.05, y: -12, filter: "brightness(1) saturate(1)" }, 0)
    .fromTo(copy, { y: 42, opacity: 0.2 }, { y: 0, opacity: 1 }, 0.12)
    .fromTo(rail, { y: 40, opacity: 0.7 }, { y: 0, opacity: 1 }, 0.18)
    .fromTo(cards, { y: 22, rotateX: 8, opacity: 0.4 }, { y: 0, rotateX: 0, opacity: 1, stagger: 0.08 }, 0.2);
}

function createGuideMotion(section: HTMLElement) {
  const heading = section.querySelector(".aero-guide__heading");
  const cards = section.querySelectorAll(".aero-guide-card");

  if (!heading || !cards.length) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 82%",
      end: "bottom 18%",
      scrub: 1.25,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(heading, { y: 36, opacity: 0.4 }, { y: 0, opacity: 1 }, 0)
    .fromTo(cards, { y: 30, rotateX: 10, opacity: 0.25 }, { y: 0, rotateX: 0, opacity: 1, stagger: 0.09 }, 0.08)
    .fromTo(cards[0], { scale: 1.04 }, { scale: 1 }, 0.18);
}

function createInsightsMotion(section: HTMLElement) {
  const intro = section.querySelector(".aero-insights__intro");
  const rows = section.querySelectorAll(".aero-insight-row");

  if (!intro || !rows.length) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 15%",
      scrub: 1.4,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(intro, { x: -38, opacity: 0.2 }, { x: 0, opacity: 1 }, 0)
    .fromTo(rows, { x: 34, opacity: 0.2 }, { x: 0, opacity: 1, stagger: 0.1 }, 0.12)
    .fromTo(rows, { y: 22 }, { y: 0, stagger: 0.1 }, 0.2);
}

function createProofMotion(section: HTMLElement) {
  const visual = section.querySelector(".aero-proof-collage__visual");
  const copy = section.querySelector(".aero-proof-collage__copy");
  const stats = section.querySelectorAll(".aero-proof-collage__stats div");
  const image = visual?.querySelector("img");

  if (!visual || !copy) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 82%",
      end: "bottom 18%",
      scrub: 1.35,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(visual, { x: -50, opacity: 0.2 }, { x: 0, opacity: 1 }, 0)
    .fromTo(image ?? visual, { scale: 1.14, filter: "brightness(0.8) saturate(0.8)" }, { scale: 1.02, filter: "brightness(1) saturate(1)" }, 0.08)
    .fromTo(copy, { x: 42, opacity: 0.2 }, { x: 0, opacity: 1 }, 0.12)
    .fromTo(stats, { y: 18, opacity: 0.3 }, { y: 0, opacity: 1, stagger: 0.08 }, 0.16);
}

function createFaqMotion(section: HTMLElement) {
  const intro = section.querySelector(".aero-faq__grid > :first-child");
  const list = section.querySelector(".aero-faq__list");
  const items = section.querySelectorAll(".aero-faq__list details");

  if (!intro || !list) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1.2,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(intro, { x: -28, opacity: 0.3 }, { x: 0, opacity: 1 }, 0)
    .fromTo(list, { y: 30, opacity: 0.5 }, { y: 0, opacity: 1 }, 0.08)
    .fromTo(items, { y: 18, opacity: 0.35 }, { y: 0, opacity: 1, stagger: 0.08 }, 0.14);
}

function createFinalMotion(section: HTMLElement) {
  const wash = section.querySelector(".aero-final__wash");
  const title = section.querySelector(".aero-final h2");
  const copy = section.querySelector(".aero-final p");
  const cta = section.querySelector(".aero-final a") as HTMLElement | null;

  if (!wash || !title || !copy) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 75%",
      end: "bottom 15%",
      scrub: 1.45,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(wash, { opacity: 0.08, scale: 0.98 }, { opacity: 0.38, scale: 1.06 }, 0)
    .fromTo(title, { y: 42, opacity: 0.3, clipPath: "inset(0 0 100% 0)" }, { y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)" }, 0.08)
    .fromTo(copy, { y: 20, opacity: 0.3 }, { y: 0, opacity: 1 }, 0.16)
    .fromTo(cta, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, 0.25);
}

function createQuoteMotion(section: HTMLElement) {
  const heading = section.querySelector(".aero-quote > .container > .grid > div:first-child") as HTMLElement | null;
  const form = section.querySelector(".aero-quote > .container > .grid > div:last-child") as HTMLElement | null;

  if (!heading || !form) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 15%",
      scrub: 1.2,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(heading, { y: 26, opacity: 0.3 }, { y: 0, opacity: 1 }, 0)
    .fromTo(form, { y: 30, opacity: 0.4 }, { y: 0, opacity: 1 }, 0.1);
}

const motionMap = {
  hero: createHeroMotion,
  origin: createOriginMotion,
  editorial: createEditorialMotion,
  feature: createFeatureStripMotion,
  campaign: createCampaignMotion,
  guide: createGuideMotion,
  insights: createInsightsMotion,
  proof: createProofMotion,
  faq: createFaqMotion,
  final: createFinalMotion,
  quote: createQuoteMotion,
};

export function LuxuryHomeMotion() {
  return null;
}
