"use client";

import { useEffect, useRef } from "react";
import type * as THREEType from "three";
import { createFabricMaterial } from "./fabricMaterial";
import { detectFabricTier, isLowEndDevice, type FabricTier } from "./capabilities";

export interface FabricDye {
  a: string;
  b: string;
  c: string;
}

interface Props {
  dye: FabricDye;
  reducedMotion: boolean;
  className?: string;
}

/**
 * The procedural fabric engine. Vanilla three.js for a minimal bundle:
 * one plane, one shader program, no textures, no models, no post.
 *
 * - Idle: slow fold undulation + loom-light sweep.
 * - Pointer: movement eases fold scale/height — cloth responds gently.
 * - Dye change (prop): uDissolve dips to 0 and back while colors swap,
 *   a ~650ms "re-dip in the vat" crossfade.
 * - Pauses via IntersectionObserver + document.visibilitychange.
 * - Reduced motion: renders exactly one frame, no loop, instant dye swap.
 */
export function FabricCanvas({ dye, reducedMotion, className }: Props) {
  const holder = useRef<HTMLDivElement>(null);

  // Keep latest dye for the async engine bootstrap.
  const dyeRef = useRef(dye);
  dyeRef.current = dye;

  useEffect(() => {
    const container = holder.current;
    if (!container) return;

    let disposed = false;
    let cleanups: Array<() => void> = [];

    const run = async () => {
      const tier: FabricTier = detectFabricTier();
      if (tier === "none") return; // CSS gradient fallback stays visible

      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "full" ? 1.75 : 1.25));
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      const segments = tier === "full" && !isLowEndDevice() ? 128 : 48;
      const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
      const material = createFabricMaterial();
      scene.add(new THREE.Mesh(geometry, material));

      const applyNow = (d: FabricDye) => {
        (material.uniforms.uDyeA.value as THREEType.Color).set(d.a);
        (material.uniforms.uDyeB.value as THREEType.Color).set(d.b);
        (material.uniforms.uDyeC.value as THREEType.Color).set(d.c);
      };

      applyNow(dyeRef.current);

      let dyeRaf: number | null = null;
      const setDyeAnimated = (d: FabricDye) => {
        if (reducedMotion) {
          applyNow(d);
          renderOnce();
          return;
        }
        if (dyeRaf !== null) cancelAnimationFrame(dyeRaf);
        // Set targets, dip to invisible, rise with the new colors.
        applyNow(d);
        const u = material.uniforms;
        u.uDissolve.value = 1;
        const t0 = performance.now();
        const dur = 650;
        const step = (now: number) => {
          const t = Math.min((now - t0) / dur, 1);
          u.uDissolve.value = 1 - t;
          dyeRaf = t < 1 ? requestAnimationFrame(step) : null;
        };
        dyeRaf = requestAnimationFrame(step);
      };

      // ── Sizing ──────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      });
      ro.observe(container);
      cleanups.push(() => ro.disconnect());

      // ── Pointer ─────────────────────────────────────────────────────────
      const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
      const onPointer = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.tx = (e.clientX - rect.left) / Math.max(rect.width, 1);
        pointer.ty = (e.clientY - rect.top) / Math.max(rect.height, 1);
      };
      if (!reducedMotion) {
        container.addEventListener("pointermove", onPointer, { passive: true });
        cleanups.push(() => container.removeEventListener("pointermove", onPointer));
      }

      // ── Visibility gating ───────────────────────────────────────────────
      let visible = true;
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0 }
      );
      io.observe(container);
      cleanups.push(() => io.disconnect());

      const onVis = () => {
        visible = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVis);
      cleanups.push(() => document.removeEventListener("visibilitychange", onVis));

      // ── Render loop ─────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      let raf = 0;
      const renderOnce = () => {
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
        material.uniforms.uTime.value = clock.getElapsedTime();
        material.uniforms.uFoldScale.value = 1.6 + Math.sin(pointer.x * Math.PI) * 0.35;
        material.uniforms.uFoldHeight.value = 0.55 + (0.5 - pointer.y) * 0.22;
        renderer.render(scene, camera);
      };
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible) return; // offscreen or tab hidden — skip GPU work
        renderOnce();
      };

      if (reducedMotion) {
        renderOnce(); // a single honest frame, no motion
      } else {
        loop();
      }

      cleanups.push(() => {
        if (dyeRaf !== null) cancelAnimationFrame(dyeRaf);
        cancelAnimationFrame(raf);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      });

      // Publish the imperative dye hook on the DOM node for the prop effect.
      (container as FabricHost).__setDye = setDyeAnimated;
    };

    run();

    return () => {
      disposed = true;
      delete (holder.current as FabricHost | null)?.__setDye;
      cleanups.forEach((fn) => fn());
      cleanups = [];
    };
    // Engine setup depends only on reducedMotion; dye changes flow via prop below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // React to palette changes from the parent. The engine publishes its
  // imperative hook on the DOM node once the async boot completes.
  useEffect(() => {
    const api = (holder.current as FabricHost | null)?.__setDye;
    api?.(dye);
  }, [dye]);

  return <div ref={holder} className={className} aria-hidden="true" />;
}

type FabricHost = HTMLDivElement & {
  __setDye?: (d: FabricDye) => void;
};
