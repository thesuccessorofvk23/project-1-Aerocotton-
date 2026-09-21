"use client";

import React, { useEffect, useRef, useState, type FC, type ReactNode } from "react";
import gsap from "gsap";
import { vec2, type Vector2 } from "vecteur";

interface MagneticCursorProps {
  children: ReactNode;
  magneticFactor?: number;
  lerpAmount?: number;
  hoverPadding?: number;
  hoverAttribute?: string;
  cursorSize?: number;
  cursorColor?: string;
  blendMode?: "difference" | "exclusion" | "normal" | "screen" | "overlay";
  cursorClassName?: string;
  shape?: "circle" | "square" | "rounded-square";
  disableOnTouch?: boolean;
  speedMultiplier?: number;
  maxScaleX?: number;
  maxScaleY?: number;
  contrastBoost?: number;
}

interface CursorState {
  el: HTMLDivElement | null;
  pos: {
    current: Vector2;
    target: Vector2;
    previous: Vector2;
  };
  hover: { isHovered: boolean };
  isDetaching: boolean;
}

export const MagneticCursor: FC<MagneticCursorProps> = ({
  children,
  lerpAmount = 0.1,
  magneticFactor = 0.2,
  hoverPadding = 12,
  hoverAttribute = "data-magnetic",
  cursorSize = 24,
  cursorColor = "white",
  blendMode = "exclusion",
  cursorClassName = "",
  shape = "circle",
  disableOnTouch = true,
  speedMultiplier = 0.02,
  maxScaleX = 1,
  maxScaleY = 0.3,
  contrastBoost = 1.5,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorStateRef = useRef<CursorState | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const configRef = useRef({
    magneticFactor,
    speedMultiplier,
    maxScaleX,
    maxScaleY,
    cursorSize,
    lerpAmount,
    hoverPadding,
  });

  useEffect(() => {
    configRef.current = {
      magneticFactor,
      speedMultiplier,
      maxScaleX,
      maxScaleY,
      cursorSize,
      lerpAmount,
      hoverPadding,
    };
  }, [magneticFactor, speedMultiplier, maxScaleX, maxScaleY, cursorSize, lerpAmount, hoverPadding]);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (disableOnTouch && isTouchDevice) return;

    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    gsap.set(cursorEl, { xPercent: -50, yPercent: -50 });
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const detachDuration = prefersReducedMotion ? 0.1 : 0.35;

    cursorStateRef.current ??= {
      el: cursorEl,
      pos: {
        current: vec2(-100, -100),
        target: vec2(-100, -100),
        previous: vec2(-100, -100),
      },
      hover: { isHovered: false },
      isDetaching: false,
    };

    const update = () => {
      const state = cursorStateRef.current;
      if (!state || state.hover.isHovered) return;

      const { speedMultiplier: speed, maxScaleX, maxScaleY, lerpAmount } = configRef.current;
      const effectiveLerp = prefersReducedMotion ? 1 : lerpAmount;
      state.pos.current.lerp(state.pos.target, effectiveLerp);
      const delta = state.pos.current.clone().sub(state.pos.previous);
      state.pos.previous.copy(state.pos.current);

      const movement = Math.sqrt(delta.x * delta.x + delta.y * delta.y) * speed;
      gsap.set(state.el, {
        x: state.pos.current.x,
        y: state.pos.current.y,
        rotate: state.isDetaching ? 0 : Math.atan2(delta.y, delta.x) * (180 / Math.PI),
        scaleX: state.isDetaching ? 1 : 1 + Math.min(movement, maxScaleX),
        scaleY: state.isDetaching ? 1 : 1 - Math.min(movement, maxScaleY),
        overwrite: "auto",
      });
    };

    const initializePosition = (event: PointerEvent) => {
      const state = cursorStateRef.current;
      if (!state) return;
      state.pos.current.set(event.clientX, event.clientY);
      state.pos.target.set(event.clientX, event.clientY);
      state.pos.previous.set(event.clientX, event.clientY);
      gsap.set(cursorEl, { x: event.clientX, y: event.clientY, opacity: 1 });
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = cursorStateRef.current;
      if (!state) return;
      state.pos.target.set(event.clientX, event.clientY);
      const inViewport = event.clientX >= 0 && event.clientX <= window.innerWidth && event.clientY >= 0 && event.clientY <= window.innerHeight;
      gsap.to(cursorEl, { opacity: inViewport ? 1 : 0, duration: 0.2, overwrite: "auto" });
    };

    const handleMouseLeave = () => gsap.to(cursorEl, { opacity: 0, duration: 0.3 });
    const handleMouseEnter = () => gsap.to(cursorEl, { opacity: 1, duration: 0.3 });
    const cleanupFunctions: Array<() => void> = [];
    const boundElements = new Set<HTMLElement>();
    const selector = `[${hoverAttribute}], button:not([disabled])`;

    const bindElement = (element: HTMLElement) => {
      if (boundElements.has(element)) return;
      boundElements.add(element);
      const xTo = gsap.quickTo(element, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
      const yTo = gsap.quickTo(element, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

      const handlePointerEnter = () => {
        const state = cursorStateRef.current;
        if (!state) return;
        const { magneticFactor, hoverPadding } = configRef.current;
        const bounds = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const dynamicPadding = hoverPadding * (1 + magneticFactor);
        state.hover.isHovered = true;
        state.isDetaching = false;
        element.classList.add("magnetic-active");

        gsap.killTweensOf(cursorEl);
        gsap.to(cursorEl, {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
          width: bounds.width + dynamicPadding * 2,
          height: bounds.height + dynamicPadding * 2,
          borderRadius: computedStyle.borderRadius,
          backgroundColor: element.getAttribute("data-magnetic-color") || cursorColor,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
          duration: 0.3,
          ease: "power3.out",
          overwrite: true,
        });
      };

      const handlePointerLeave = () => {
        const state = cursorStateRef.current;
        if (!state) return;
        const currentX = Number(gsap.getProperty(cursorEl, "x"));
        const currentY = Number(gsap.getProperty(cursorEl, "y"));
        state.pos.current.set(currentX, currentY);
        state.pos.previous.set(currentX, currentY);
        state.hover.isHovered = false;
        state.isDetaching = true;
        element.classList.remove("magnetic-active");

        gsap.killTweensOf(cursorEl);
        gsap.to(cursorEl, {
          width: configRef.current.cursorSize,
          height: configRef.current.cursorSize,
          borderRadius: shape === "circle" ? "50%" : shape === "square" ? "0" : "8px",
          backgroundColor: cursorColor,
          scaleX: 1,
          scaleY: 1,
          duration: detachDuration,
          ease: "power3.out",
          overwrite: true,
          onComplete: () => { state.isDetaching = false; },
        });
      };

      const handlePointerMove = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        const { magneticFactor } = configRef.current;
        xTo((event.clientX - (bounds.left + bounds.width / 2)) * magneticFactor);
        yTo((event.clientY - (bounds.top + bounds.height / 2)) * magneticFactor);
      };

      const handlePointerOut = () => { xTo(0); yTo(0); };
      element.addEventListener("pointerenter", handlePointerEnter);
      element.addEventListener("pointerleave", handlePointerLeave);
      element.addEventListener("pointermove", handlePointerMove);
      element.addEventListener("pointerout", handlePointerOut);

      cleanupFunctions.push(() => {
        element.removeEventListener("pointerenter", handlePointerEnter);
        element.removeEventListener("pointerleave", handlePointerLeave);
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerout", handlePointerOut);
        element.classList.remove("magnetic-active");
      });
    };

    const bindMatchingElements = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLElement>(selector).forEach(bindElement);
    };

    bindMatchingElements();
    const observer = new MutationObserver(() => bindMatchingElements());
    observer.observe(document.body, { childList: true, subtree: true });

    gsap.ticker.add(update);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointermove", initializePosition, { once: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      observer.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [disableOnTouch, isTouchDevice, hoverAttribute, cursorColor, shape]);

  if (disableOnTouch && isTouchDevice) return <>{children}</>;

  const styles: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 9999,
    pointerEvents: "none",
    willChange: "transform, width, height, border-radius",
    backgroundColor: cursorColor,
    mixBlendMode: blendMode,
    width: cursorSize,
    height: cursorSize,
    borderRadius: shape === "circle" ? "50%" : shape === "square" ? "0" : "8px",
    backdropFilter: contrastBoost !== 1 ? `contrast(${contrastBoost})` : "none",
    WebkitBackdropFilter: contrastBoost !== 1 ? `contrast(${contrastBoost})` : "none",
  };

  return (
    <>
      <div ref={cursorRef} className={`magnetic-cursor ${cursorClassName}`} style={styles} aria-hidden="true" />
      {children}
    </>
  );
};