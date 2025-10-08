import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, FileText, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/library", label: "Library", icon: FileText },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="font-playfair text-2xl font-bold text-primary">
            Church Content
          </Link>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Button
                  key={item.to}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to={item.to}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
