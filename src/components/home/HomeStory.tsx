"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";

const storyChapters = [
  {
    eyebrow: "The material",
    title: "Where every textile begins.",
    copy:
      "Cotton is the first chapter of the fabric story — a field of fibre, a thread of intent, and the softness that carries material truth into the home.",
  },
  {
    eyebrow: "The making",
    title: "Precision at every stage.",
    copy:
      "From yarn to loom, the factory engages in controlled motion — measured tension, deliberate rhythm, and the patient craft of industrial expertise.",
  },
  {
    eyebrow: "The craft",
    title: "Human hands. Industrial precision.",
    copy:
      "A textile is shaped by both machine logic and human attention — the subtle checks that make softness consistent, durable, and beautiful.",
  },
  {
    eyebrow: "The standard",
    title: "Quality without compromise.",
    copy:
      "Every fold, weave and finish is judged for an exacting standard so that the final fabric feels as honest as it looks.",
  },
];

export function HomeStory() {
  const ref = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const total = node.offsetHeight - window.innerHeight;
      const p = total > 0 ? (window.innerHeight - rect.top) / total : 0;
      setProgress(Math.min(Math.max(p, 0), 1));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const activeIndex = Math.min(
    storyChapters.length - 1,
    Math.floor(progress * storyChapters.length)
  );

  return (
    <section ref={ref} className="relative h-[220vh] overflow-hidden border-t border-hairline bg-ink text-ivory">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_18%,rgba(176,141,87,0.28),transparent_18%),radial-gradient(circle_at_80%_70%,rgba(77,95,82,0.3),transparent_32%),linear-gradient(135deg,#141311,#34271e 48%,#1a211e)]" />
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:120px_100%]" />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-8 z-10 hidden items-center md:flex">
          <p className="font-display text-[0.7rem] uppercase tracking-[0.38em] text-fog/80 [writing-mode:vertical-rl] [transform:rotate(180deg)]">
            From fiber to form.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-8 z-10 hidden items-center md:flex">
          <div className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.32em] text-fog/75">
            <span>Scroll to explore</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm text-brass">↓</span>
          </div>
        </div>

        <Container className="relative z-10">
          <div className="grid min-h-[72vh] items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl">
              {storyChapters.map((chapter, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={chapter.eyebrow}
                    className="transition-all duration-700 ease-out-soft"
                    style={{
                      opacity: isActive ? 1 : 0.08,
                      transform: `translateY(${isActive ? 0 : 30}px)`,
                      pointerEvents: "none",
                    }}
                  >
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.4em] text-fog/80">
                      {chapter.eyebrow}
                    </p>
                    <h2 className="mt-6 max-w-[10ch] font-display text-[clamp(3rem,8vw,8.6rem)] leading-[0.9] tracking-[-0.06em] text-ivory">
                      {chapter.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-fog md:text-lg">
                      {chapter.copy}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="ml-auto w-full max-w-md rounded-[1.6rem] border border-white/10 bg-black/12 p-5 shadow-[0_25px_100px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-brass">
                Aero Cotton story
              </p>
              <div className="mt-6 space-y-5">
                {storyChapters.map((chapter, index) => (
                  <div key={chapter.eyebrow} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 rounded-full border border-brass/70"
                      style={{
                        backgroundColor: index === activeIndex ? "var(--color-brass)" : "transparent",
                      }}
                    />
                    <div>
                      <p className="text-[0.58rem] uppercase tracking-[0.28em] text-taupe">
                        {chapter.eyebrow}
                      </p>
                      <p className="mt-1 text-sm text-fog">{chapter.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
