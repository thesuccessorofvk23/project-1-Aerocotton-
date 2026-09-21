import { cn } from "@/lib/cn";

/**
 * Editorial section heading: eyebrow + serif title + optional lede.
 * Used by nearly every page section for consistent rhythm.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "ink",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  tone?: "ink" | "ivory";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className={cn("eyebrow", tone === "ivory" && "text-fog")}>{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "font-display text-display-lg mt-5",
          tone === "ivory" ? "text-ivory" : "text-ink"
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-6 text-base/loose md:text-lg/loose",
            tone === "ivory" ? "text-fog" : "text-umber"
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
