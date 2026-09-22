"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const homepageVideo = "/hero/video_watermark_removed.mp4";

export function CinematicLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    // Warm the hero video while the doors are still closed.
    const heroPreload = document.createElement("video");
    heroPreload.src = homepageVideo;
    heroPreload.preload = "auto";
    heroPreload.muted = true;
    heroPreload.playsInline = true;
    heroPreload.load();

    const release = () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      setDone(true);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", overwrite: "auto" },
        onComplete: release,
      });

      gsap.set(
        [
          ".cinematic-intro__doors",
          ".cinematic-intro__small-left",
          ".cinematic-intro__small-right",
          ".cinematic-intro__large-left",
          ".cinematic-intro__large-right",
        ],
        { force3D: true },
      );

      if (reduceMotion) {
        timeline
          .set(".cinematic-intro__lockup", { opacity: 1 })
          .to(".cinematic-intro__doors", { opacity: 0, duration: 0.45, ease: "power2.in" });
        return;
      }

      timeline
        .fromTo(
          ".cinematic-intro__small",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
          0.35,
        )
        .fromTo(
          ".cinematic-intro__large",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.65 },
          0.7,
        )
        .to(
          ".cinematic-intro__seam",
          { scaleY: 1, opacity: 1, duration: 0.45, ease: "power2.out" },
          1.25,
        )
        // Hold the brand on screen, then split the lockup and open the doors
        // so the whole sequence lands at roughly 3.9s.
        .to(
          [".cinematic-intro__small-left", ".cinematic-intro__large-left"],
          { xPercent: -100, duration: 0.8 },
          2.6,
        )
        .to(
          [".cinematic-intro__small-right", ".cinematic-intro__large-right"],
          { xPercent: 100, duration: 0.8 },
          2.6,
        )
        .to(".cinematic-intro__lockup", { opacity: 0, duration: 0.55, ease: "power2.out" }, 2.6)
        .to(".cinematic-intro__doors-left", { xPercent: -100, duration: 0.8 }, 2.6)
        .to(".cinematic-intro__doors-right", { xPercent: 100, duration: 0.8 }, 2.6)
        .to(".cinematic-intro__seam", { opacity: 0, duration: 0.45 }, 2.8);
    }, layer);

    // Safety net: never trap the visitor behind the doors if the timeline stalls.
    const fallback = window.setTimeout(release, 6000);

    return () => {
      context.revert();
      window.clearTimeout(fallback);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      heroPreload.removeAttribute("src");
      heroPreload.load();
    };
  }, []);

  if (done) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div
        ref={layerRef}
        className="cinematic-intro"
        role="status"
        aria-label="Opening Aero Cotton"
      >
        <div className="cinematic-intro__doors cinematic-intro__doors-left" aria-hidden="true" />
        <div className="cinematic-intro__doors cinematic-intro__doors-right" aria-hidden="true" />
        <div className="cinematic-intro__seam" aria-hidden="true" />
        <div className="cinematic-intro__lockup" aria-hidden="true">
          <div className="cinematic-intro__row cinematic-intro__small">
            <span className="cinematic-intro__part cinematic-intro__small-left">Aero</span>
            <span className="cinematic-intro__part cinematic-intro__small-right">Cotton</span>
          </div>
          <div className="cinematic-intro__row cinematic-intro__large">
            <span className="cinematic-intro__part cinematic-intro__large-left">Aero</span>
            <span className="cinematic-intro__part cinematic-intro__large-right">Cotton</span>
          </div>
        </div>
        <p className="sr-only">Opening Aero Cotton</p>
      </div>
    </>
  );
}
