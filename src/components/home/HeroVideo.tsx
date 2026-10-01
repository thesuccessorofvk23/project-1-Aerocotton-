"use client";

import { useEffect, useRef } from "react";

/**
 * The hero film is meant to run for as long as the page is open. The `loop`
 * attribute wraps it at the seam, and this guard covers what the attribute
 * alone does not: a host that suspends playback when the tab sleeps, a
 * codec that stops on the last frame instead of wrapping, or a stray
 * `pause()` from an extension. Whenever playback is taken away it is simply
 * re-asserted — including while the hero is scrolled offscreen. A rejected
 * `play()` (the browser's autoplay policy) is swallowed and retried on the
 * next interaction.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let asking = false;
    const resume = () => {
      if (asking || !video.paused) return;
      asking = true;
      const attempt = video.play();
      if (attempt) {
        attempt
          .catch(() => {
            /* autoplay policy; the next user gesture retries */
          })
          .finally(() => {
            asking = false;
          });
      } else {
        asking = false;
      }
    };

    /** Belt and braces: tick the clock back to the start if it lands on the end. */
    const wrap = () => {
      if (video.duration > 0 && video.currentTime >= video.duration - 0.05) {
        try {
          video.currentTime = 0;
        } catch {
          /* seek refused — `loop` still wraps it */
        }
      }
      resume();
    };

    video.loop = true;
    video.addEventListener("pause", resume);
    video.addEventListener("ended", wrap);
    video.addEventListener("stalled", resume);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    resume();

    return () => {
      video.removeEventListener("pause", resume);
      video.removeEventListener("ended", wrap);
      video.removeEventListener("stalled", resume);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-editorial__video absolute inset-0 h-full w-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label="Cotton fields, raw fleece and loom weaving"
    >
      <source src="/hero/hero-cotton-intro.mp4" type="video/mp4" />
    </video>
  );
}
