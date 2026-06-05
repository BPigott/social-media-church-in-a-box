import { cn } from "@/lib/utils";

interface SectionMarkerProps {
  /** Two-digit string, e.g. "01" */
  numeral: string;
  title: string;
  /** Accent colour for the numeral. Defaults to terracotta (primary). */
  tone?: "primary" | "secondary";
  className?: string;
}

export function SectionMarker({ numeral, title, tone = "primary", className }: SectionMarkerProps) {
  return (
    <div className={cn("flex items-baseline gap-3 mb-5", className)}>
      <span
        className={cn(
          "font-playfair italic leading-none text-3xl md:text-4xl opacity-55 select-none",
          tone === "primary" ? "text-primary" : "text-secondary"
        )}
        aria-hidden="true"
      >
        {numeral}
      </span>
      <h2 className="font-playfair font-bold text-lg md:text-xl text-foreground">{title}</h2>
    </div>
  );
}
