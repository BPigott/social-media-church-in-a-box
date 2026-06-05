import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Icon } from "phosphor-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: Icon;
  active: boolean;
  collapsed: boolean;
}

export function SidebarNavItem({ to, label, icon: IconCmp, active, collapsed }: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/navitem relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-[0_7px_16px_-7px_hsl(var(--primary)/0.6)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <IconCmp size={18} weight={active ? "fill" : "regular"} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 z-50 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md group-hover/navitem:block"
        >
          {label}
        </span>
      )}
    </Link>
  );
}
