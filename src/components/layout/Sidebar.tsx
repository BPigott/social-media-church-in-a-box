import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { House, FileText, Gear, CreditCard, SignOut, CaretLeft, CaretRight } from "phosphor-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarNavItem } from "./SidebarNavItem";

const COLLAPSE_KEY = "ivangel:sidebarCollapsed";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: House },
  { to: "/library", label: "Library", icon: FileText },
  { to: "/settings", label: "Settings", icon: Gear },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function subscriptionLabel(
  sub: ReturnType<typeof useSubscription>
): string {
  if (sub.isExempt) return "Active";
  if (sub.isTrial) {
    const days = sub.daysLeftInTrial ?? 0;
    return `Trial · ${days} day${days === 1 ? "" : "s"} left`;
  }
  if (sub.isActive) return "Active";
  const status = sub.subscription?.status;
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { primaryChurch } = useChurch(user?.id);
  const subscription = useSubscription();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  const churchName = primaryChurch?.name ?? "Your church";
  const subLabel = subscriptionLabel(subscription);
  const initials = churchName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "z-50 flex flex-col border-r border-sidebar-border bg-sidebar-background px-3 py-4",
          "md:sticky md:top-0 md:h-screen transition-[width] duration-200",
          collapsed ? "md:w-[64px]" : "md:w-[200px]",
          "fixed inset-y-0 left-0 w-[240px] transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand + collapse toggle */}
        <div
          className={cn(
            "mb-5 flex items-center gap-2 px-1",
            collapsed && "md:justify-center"
          )}
        >
          <div className="h-4 w-4 shrink-0 rounded-full bg-primary" />
          {!collapsed && (
            <span className="font-playfair text-lg font-bold text-foreground">
              Ivangel
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:block"
          >
            {collapsed ? <CaretRight size={14} /> : <CaretLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1" onClick={onMobileClose}>
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={location.pathname === item.to}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Church anchor + sign out */}
        <div className="mt-auto flex flex-col gap-2">
          {collapsed ? (
            <div
              title={`${churchName}${subLabel ? ` — ${subLabel}` : ""}`}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
            >
              {initials}
            </div>
          ) : (
            <div className="rounded-xl border border-sidebar-border bg-card p-3">
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                Signed in as
              </p>
              <p className="truncate text-xs font-bold text-foreground">
                {churchName}
              </p>
              {subLabel && (
                <p className="mt-1 text-[10px] font-semibold text-secondary">
                  ● {subLabel}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "md:justify-center md:px-0"
            )}
          >
            <SignOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
