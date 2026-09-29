"use client";

import { useEffect, useRef } from "react";

/**
 * Beat sheet, in milliseconds from the moment `intro-armed` lands on <html>:
 * the lockup rises, the seam draws, then the two doors part from the centre
 * while the hero settles out of its own slight zoom. The CSS in `globals.css`
 * carries the same numbers as keyframes and is what normally plays.
 */
const SMALL_RISE = { at: 200, dur: 450 };
const LARGE_RISE = { at: 400, dur: 650 };
const SEAM_DRAW = { at: 750, dur: 500 };
const SEAM_FADE = { at: 2300, dur: 500 };
const LOCKUP_FADE = { at: 2150, dur: 600 };
const PART = { at: 2150, dur: 850 };
const END = PART.at + PART.dur;
/** How long to wait before deciding the host cannot tick CSS animations. */
const STALL_CHECK = 320;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (n: number) => 1 - Math.pow(1 - clamp01(n), 3);
const easeInOut = (n: number) => {
  const t = clamp01(n);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const eased = (t: number, beat: { at: number; dur: number }) =>
  easeOut((t - beat.at) / beat.dur);

type Beat = { at: number; dur: number };

/**
 * The homepage opening: two grain-textured ivory doors hold the Aero Cotton
 * lockup, then part from the centre to reveal the hero.
 *
 * `globals.css` owns the look and the beat sheet, and the before-paint script
 * in `src/app/layout.tsx` owns the timing — this component only exists for the
 * one case CSS cannot cover: a host that never advances the animation clock
 * (headless or software-rendered viewports do this), where keyframes would
 * leave the doors frozen shut. If the doors have not moved shortly after
 * arming, it drives the identical beats from a plain timer instead.
 */
export function CinematicLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const curtainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("intro-armed")) return;
    const curtain = curtainRef.current;
    if (!curtain) return;

    const armer = Number(root.dataset.introStart);
    const start = Number.isFinite(armer) && armer > 0 ? armer : performance.now();
    const stage = document.querySelector<HTMLElement>("[data-intro-stage]");
    const pick = (selector: string) => curtain.querySelector<HTMLElement>(selector);

    const doorLeft = pick(".cinematic-intro__doors-left");
    const doorRight = pick(".cinematic-intro__doors-right");
    const seam = pick(".cinematic-intro__seam");
    const lockup = pick(".cinematic-intro__lockup");
    const smallLeft = pick(".cinematic-intro__small-left");
    const smallRight = pick(".cinematic-intro__small-right");
    const largeLeft = pick(".cinematic-intro__large-left");
    const largeRight = pick(".cinematic-intro__large-right");

    const slide = (el: HTMLElement | null, percent: number) => {
      if (el) el.style.transform = `translate3d(${percent.toFixed(3)}%, 0, 0)`;
    };
    const word = (
      el: HTMLElement | null,
      beat: Beat,
      direction: -1 | 1,
      t: number,
      opening: number,
    ) => {
      if (!el) return;
      el.style.opacity = eased(t, beat).toFixed(3);
      el.style.transform = `translate3d(${(direction * 100 * opening).toFixed(3)}%, ${((1 - eased(t, beat)) * 10).toFixed(2)}px, 0)`;
    };

    const paint = (t: number) => {
      const opening = easeInOut((t - PART.at) / PART.dur);

      slide(doorLeft, -100 * opening);
      slide(doorRight, 100 * opening);
      word(smallLeft, SMALL_RISE, -1, t, opening);
      word(smallRight, SMALL_RISE, 1, t, opening);
      word(largeLeft, LARGE_RISE, -1, t, opening);
      word(largeRight, LARGE_RISE, 1, t, opening);

      if (lockup) lockup.style.opacity = (1 - eased(t, LOCKUP_FADE)).toFixed(3);
      if (seam) {
        const drawn = eased(t, SEAM_DRAW);
        seam.style.transform = `translateX(-50%) scaleY(${drawn.toFixed(4)})`;
        seam.style.opacity = (drawn * (1 - eased(t, SEAM_FADE))).toFixed(3);
      }
      if (stage) {
        stage.style.transform = `scale(${(0.94 + 0.06 * opening).toFixed(4)})`;
        stage.style.opacity = (0.72 + 0.28 * opening).toFixed(3);
      }
    };

    /** Hand every element back to its unanimated state and retire the curtain. */
    const finish = () => {
      root.classList.remove("intro-armed");
      root.classList.add("intro-done");
      [doorLeft, doorRight, seam, lockup, smallLeft, smallRight, largeLeft, largeRight]
        .forEach((el) => el?.removeAttribute("style"));
      if (stage) {
        stage.style.removeProperty("transform");
        stage.style.removeProperty("opacity");
      }
    };

    let frame = 0;
    let driving = false;
    const drive = () => {
      if (driving) return;
      driving = true;
      root.classList.add("intro-js");
      const step = () => {
        const t = performance.now() - start;
        paint(t);
        if (t < END) {
          frame = window.setTimeout(step, 16);
          return;
        }
        finish();
      };
      step();
    };

    // A running animation has moved off 0 by now; a frozen clock never will.
    const stallCheck = window.setTimeout(() => {
      if (typeof document.getAnimations !== "function") return;
      const door = document
        .getAnimations()
        .find((a) => (a as CSSAnimation).animationName === "aero-intro-door-left");
      if (!door || !door.currentTime) drive();
    }, STALL_CHECK);

    return () => {
      window.clearTimeout(stallCheck);
      window.clearTimeout(frame);
    };
  }, []);

  return (
    <>
      <div
        ref={curtainRef}
        className="cinematic-intro"
        role="status"
        aria-label="Opening Aero Cotton"
      >
        <div
          className="cinematic-intro__doors cinematic-intro__doors-left"
          aria-hidden="true"
        />
        <div
          className="cinematic-intro__doors cinematic-intro__doors-right"
          aria-hidden="true"
        />
        <div className="cinematic-intro__seam" aria-hidden="true" />
        <div className="cinematic-intro__lockup" aria-hidden="true">
          <div className="cinematic-intro__row cinematic-intro__small">
            <span className="cinematic-intro__part cinematic-intro__small-left">
              Aero
            </span>
            <span className="cinematic-intro__part cinematic-intro__small-right">
              Cotton
            </span>
          </div>
          <div className="cinematic-intro__row cinematic-intro__large">
            <span className="cinematic-intro__part cinematic-intro__large-left">
              Aero
            </span>
            <span className="cinematic-intro__part cinematic-intro__large-right">
              Cotton
            </span>
          </div>
        </div>
        <p className="sr-only">Opening Aero Cotton</p>
      </div>
      {children}
    </>
  );
}
