"use client";

import gsap from "gsap";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

const homepageVideo = "/hero/hero-loom-gwr.mp4";
const introStorageKey = "aero-cotton-intro-seen";

export function CinematicLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);
  const hasInitialized = useRef(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setMounted(true);

    const hasSeenIntro = window.sessionStorage.getItem(introStorageKey) === "true";
    if (hasSeenIntro) {
      setVisible(false);
      return;
    }

    window.sessionStorage.setItem(introStorageKey, "true");
    window.localStorage.removeItem(introStorageKey);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!mounted || !visible) return;
    const layer = layerRef.current;
    if (!layer || hasRun.current) return;
    hasRun.current = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const heroPreload = document.createElement("video");
    heroPreload.src = homepageVideo;
    heroPreload.preload = "auto";
    heroPreload.muted = true;
    heroPreload.playsInline = true;
    heroPreload.load();

    const release = () => {
      if (!hasRun.current) return;
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      setVisible(false);
    };

    const releaseFallback = window.setTimeout(release, reduceMotion ? 1200 : 3200);

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
        { force3D: true }
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
          0.35
        )
        .fromTo(
          ".cinematic-intro__large",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.65 },
          0.7
        )
        .to(
          ".cinematic-intro__seam",
          { scaleY: 1, opacity: 1, duration: 0.45, ease: "power2.out" },
          1.25
        )
        .to(
          [".cinematic-intro__small-left", ".cinematic-intro__large-left"],
          { xPercent: -100, duration: 0.8 },
          2.15
        )
        .to(
          [".cinematic-intro__small-right", ".cinematic-intro__large-right"],
          { xPercent: 100, duration: 0.8 },
          2.15
        )
        .to(
          ".cinematic-intro__lockup",
          { opacity: 0, duration: 0.55, ease: "power2.out" },
          2.15
        )
        .to(".cinematic-intro__doors-left", { xPercent: -100, duration: 0.8 }, 2.15)
        .to(".cinematic-intro__doors-right", { xPercent: 100, duration: 0.8 }, 2.15)
        .to(".cinematic-intro__seam", { opacity: 0, duration: 0.45 }, 2.35);
    }, layer);

    return () => {
      context.revert();
      window.clearTimeout(releaseFallback);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      heroPreload.removeAttribute("src");
      heroPreload.load();
    };
  }, [mounted, visible]);

  return (
    <>
      {children}
      {visible && mounted
        ? createPortal(
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
            </div>,
            document.body
          )
        : null}
    </>
  );
}