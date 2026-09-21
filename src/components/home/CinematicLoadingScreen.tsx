"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function CinematicLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const release = window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      setVisible(false);
    }, 900);

    return () => window.clearTimeout(release);
  }, []);

  return (
    <>
      {children}
      {visible && mounted
        ? createPortal(
            <div
              className="cinematic-intro"
              role="status"
              aria-label="Loading Aero Cotton"
            >
              <div className="cinematic-intro__lockup" aria-hidden="true">
                <span className="cinematic-intro__part">Aero Cotton</span>
                <small>Loading</small>
              </div>
              <p className="sr-only">Loading Aero Cotton</p>
            </div>,
            document.body
          )
        : null}
    </>
  );
}