import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[2520px] px-6 md:px-10 lg:px-16", className)}>
      {children}
    </div>
  );
}
