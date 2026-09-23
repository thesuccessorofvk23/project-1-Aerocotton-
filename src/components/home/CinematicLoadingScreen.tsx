/**
 * Plain passthrough for the home page. Previously played a GSAP
 * "cinematic doors" intro; all animation has been removed.
 */
export function CinematicLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
