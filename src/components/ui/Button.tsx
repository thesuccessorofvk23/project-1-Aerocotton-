import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-3 font-sans font-semibold uppercase " +
  "tracking-[0.18em] transition-colors duration-300 cursor-pointer select-none";

const variants: Record<Variant, string> = {
  solid:
    "bg-ink text-ivory hover:bg-cocoa",
  outline:
    "border border-outline text-ink hover:border-ink bg-transparent",
  ghost:
    "text-ink hover:text-brass-deep",
};

const sizes: Record<Size, string> = {
  md: "text-2xs px-6 py-3.5",
  lg: "text-xs px-8 py-4.5",
};

export function ButtonLink({
  href,
  variant = "solid",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      data-magnetic
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-300 ease-out-soft group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
