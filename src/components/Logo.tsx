import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Height/width of the dove mark in px. The wordmark scales from this. */
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  orientation?: "horizontal" | "vertical";
}

/**
 * The ivangel brand lockup: the dove mark (public/dove-mark.png) paired with
 * the "ivangel" wordmark rendered as live Playfair text so it stays crisp at
 * every size and matches the rest of the UI. Use this everywhere the brand
 * appears instead of ad-hoc dot + wordmark markup.
 */
export function Logo({
  className,
  size = 28,
  showWordmark = true,
  showTagline = false,
  orientation = "horizontal",
}: LogoProps) {
  const vertical = orientation === "vertical";
  return (
    <div
      className={cn(
        "flex select-none items-center",
        vertical ? "flex-col gap-3" : "gap-2.5",
        className
      )}
    >
      <img
        src="/dove-mark.png"
        // When the wordmark is visible it carries the accessible name, so the
        // mark is decorative; otherwise the mark names the brand itself.
        alt={showWordmark ? "" : "ivangel"}
        aria-hidden={showWordmark || undefined}
        width={size}
        height={size}
        style={{ height: size, width: size }}
        className="shrink-0 object-contain"
        draggable={false}
      />
      {showWordmark && (
        <div className={cn("flex flex-col", vertical && "items-center")}>
          <span
            className="font-playfair font-bold leading-none tracking-tight text-foreground"
            style={{ fontSize: Math.round(size * (vertical ? 1.15 : 0.92)) }}
          >
            ivangel
          </span>
          {showTagline && (
            <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Create. Connect. Community.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
