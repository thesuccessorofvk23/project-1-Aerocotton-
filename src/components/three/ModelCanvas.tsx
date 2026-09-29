"use client";

import { useEffect, useRef } from "react";
import type * as THREEType from "three";
import { detectFabricTier, isLowEndDevice } from "./capabilities";

interface Props {
  /** Path to the Wavefront .obj under /public. */
  src: string;
  /** Fires once the model's first frame is on screen — the shell fades the still out. */
  onReady?: () => void;
  className?: string;
}

/**
 * Realtime product model — the one place in the site that loads real geometry.
 *
 * Vanilla three.js plus `OBJLoader` or `GLTFLoader` (picked from the file
 * extension), all dynamically imported, so the loader chunk is fetched only by
 * pages that actually carry a model (`product.model`).
 *
 * - Drag to turn the piece; it drifts slowly on its own when left alone.
 * - A textured `.glb` keeps its own materials; an untextured `.obj` gets matte
 *   cotton (Standard, roughness ≈ 0.9). Both are lit by a hemisphere plus a
 *   key/fill/rim trio and drawn double-sided, because a scanned cloth shell has
 *   no thickness — rendering both faces keeps the inside reading as cloth.
 * - WebGL ladder matches the fabric hero: full WebGL2 gets antialiased pixels
 *   at a clamped DPR, weaker devices get a smaller buffer, no WebGL (or a GPU
 *   that refuses a context) leaves the still image the shell renders beneath.
 * - Reduced motion: exactly one frame, no drift loop.
 * - Pauses via IntersectionObserver + `visibilitychange`.
 */
export function ModelCanvas({ src, onReady, className }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const container = holder.current;
    if (!container) return;

    const tier = detectFabricTier();
    if (tier === "none") return; // the still image carries the page

    let disposed = false;
    let cleanups: Array<() => void> = [];

    // `.glb`/`.gltf` carry their own materials and textures; `.obj` from the
    // converter has neither, so it gets the house cotton material instead.
    const wantsGltf = /\.(glb|gltf)(\?|$)/i.test(src);

    const boot = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let renderer: THREEType.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: tier === "full",
          alpha: true,
          powerPreference: "low-power",
        });
      } catch {
        return; // no usable context — the still image stays
      }

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, isLowEndDevice() ? 1 : tier === "full" ? 1.75 : 1.25)
      );
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      // Colour pipeline: draw in sRGB and tone-map neutrally. Without these the
      // bright studio rig clips highlights to white and the print reads washed
      // out — the "faded colour" effect. NeutralToneMapping preserves hue and
      // saturation while rolling highlights off like a camera would.
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "none";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        32,
        (container.clientWidth || 1) / (container.clientHeight || 1),
        0.01,
        100
      );

      /* ── Light: hemisphere wash + key/fill/rim, no environment map ───── */
      /* Sum ≈ 2.5 — tuned for 1.0 exposure with tone mapping. The old rig ran
       * near 6.0, which blew the base colour toward white (faded prints). */
      scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b6152, 1.45));
      const key = new THREE.DirectionalLight(0xfff4e4, 1.55);
      key.position.set(2.2, 3.4, 2.6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xeef2f6, 0.5);
      fill.position.set(-2.6, 0.8, 1.6);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.45);
      rim.position.set(-1.2, 1.4, -2.8);
      scene.add(rim);

      /* ── Model ───────────────────────────────────────────────────────── */
      const pivot = new THREE.Group();
      scene.add(pivot);

      const material = new THREE.MeshStandardMaterial({
        color: 0xe9e1d3, // natural cotton ground
        roughness: 0.92,
        metalness: 0,
        side: THREE.DoubleSide,
      });

      let geometry: THREEType.BufferGeometry | null = null;
      let mesh: THREEType.Object3D | null = null;
      let frameDistance = 3;

      /** Fit the piece's bounding box in view, portrait aspect included. */
      const frameModel = (object: THREEType.Object3D) => {
        object.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        object.position.set(-center.x, -center.y, -center.z); // centre on the origin

        const fov = (camera.fov * Math.PI) / 180;
        const halfHeight = Math.max(size.y, size.z) / 2;
        const halfWidth = Math.max(size.x, size.z) / 2;
        const forHeight = halfHeight / Math.tan(fov / 2);
        const forWidth = halfWidth / (Math.tan(fov / 2) * camera.aspect);
        frameDistance = Math.max(forHeight, forWidth) * (tier === "full" ? 1.24 : 1.34) || 1;
      };

      /* ── Interaction: drag to turn, plus a slow idle drift ───────────── */
      const yaw = { value: -0.9, target: -0.9 };
      const pitch = { value: 0.16, target: 0.16 };
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let idleSince = performance.now();
      let raf = 0;
      let lastFrame = 0;
      let firstFrame = true;

      const step = (dt: number) => {
        if (!dragging && !reducedMotion && performance.now() - idleSince > 2600) {
          yaw.target += dt * 0.16; // announce that the piece is turnable
        }
        const ease = Math.min(1, dt * 6) || 1;
        yaw.value += (yaw.target - yaw.value) * ease;
        pitch.value += (pitch.target - pitch.value) * ease;
        pivot.rotation.y = yaw.value;
        pivot.rotation.x = pitch.value;
        camera.position.set(0, 0, frameDistance);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);

        if (firstFrame) {
          firstFrame = false;
          readyRef.current?.();
        }
      };

      /** Re-fit the buffer and the framing (container resized). */
      const resize = () => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (mesh) frameModel(mesh);
        if (reducedMotion) step(0);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(container);
      cleanups.push(() => ro.disconnect());

      const onPointerDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = "grabbing";
        try {
          renderer.domElement.setPointerCapture(e.pointerId);
        } catch {
          // Pointer already released (or a synthetic id) — drag still works.
        }
        if (reducedMotion) step(0);
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        yaw.target += (e.clientX - lastX) * 0.009;
        pitch.target = clamp(pitch.target + (e.clientY - lastY) * 0.006, -1.1, 1.1);
        lastX = e.clientX;
        lastY = e.clientY;
        idleSince = performance.now();
        if (reducedMotion) step(0);
      };
      const endDrag = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        idleSince = performance.now();
        container.style.cursor = "grab";
        try {
          renderer.domElement.releasePointerCapture(e.pointerId);
        } catch {
          // Nothing captured — nothing to release.
        }
      };

      container.style.cursor = "grab";
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", endDrag);
      container.addEventListener("pointercancel", endDrag);
      cleanups.push(() => {
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", endDrag);
        container.removeEventListener("pointercancel", endDrag);
      });

      /* ── Visibility gating ───────────────────────────────────────────── */
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

      /* ── Load ────────────────────────────────────────────────────────── */
      const onLoaded = (object: THREEType.Object3D) => {
        if (disposed) return;
        object.traverse((child) => {
          const piece = child as THREEType.Mesh;
          if (!piece.isMesh || !piece.geometry) return;
          if (wantsGltf) {
            // A scanned cloth is an open shell: render both faces.
            const materials = Array.isArray(piece.material) ? piece.material : [piece.material];
            for (const entry of materials) {
              if (!entry) continue;
              const mat = entry as THREEType.MeshStandardMaterial;
              mat.side = THREE.DoubleSide;
              // Cloth never reads as metal. Scanned PBR files often ship
              // metallic ≈ 1 — with no environment map that turns the print
              // dark and desaturated (another way colour "fades"). Forcing
              // dielectric + high roughness keeps the albedo dominant.
              if (mat.isMeshStandardMaterial) {
                mat.metalness = 0;
                mat.roughness = Math.max(mat.roughness, 0.85);
                mat.needsUpdate = true;
              }
            }
          } else {
            piece.material = material;
          }
          geometry = piece.geometry;
          if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
        });
        mesh = object;
        pivot.add(object);
        resize();
        frameModel(object);

        // Draw once straight away, whatever the tab is doing: a viewer that
        // loads offscreen (or in a background tab, where rAF is parked) still
        // shows the model the moment the visitor looks at it.
        step(0);
        lastFrame = performance.now();

        if (!reducedMotion) {
          const loop = () => {
            raf = requestAnimationFrame(loop);
            if (!visible) return; // offscreen or tab hidden — skip GPU work
            const now = performance.now();
            step(Math.min((now - lastFrame) / 1000, 0.05));
            lastFrame = now;
          };
          loop();
        }
      };

      // Network or parse failure: the still image stays exactly as it was.
      const onError = () => {};

      if (wantsGltf) {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        if (disposed) return;
        new GLTFLoader().load(src, (gltf) => onLoaded(gltf.scene), undefined, onError);
      } else {
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
        if (disposed) return;
        new OBJLoader().load(src, onLoaded, undefined, onError);
      }

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        geometry?.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        container.style.cursor = "";
      });
    };

    boot();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      cleanups = [];
    };
  }, [src]);

  return <div ref={holder} className={className} aria-hidden="true" />;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
