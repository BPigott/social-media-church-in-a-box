import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { List } from "phosphor-react";

const Index = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter">
      {/* Abstract background shapes */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: "hsl(var(--primary))" }}
      />
      <div
        className="absolute top-[-5%] right-[-10%] w-[450px] h-[450px] rounded-full mix-blend-multiply blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: "hsl(var(--secondary))" }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="px-6 md:px-12 py-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary" />
            <span className="font-playfair font-bold text-xl text-foreground">Ivangel</span>
          </div>

          {/* Desktop center nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              FAQ
            </a>
          </div>

          {/* Right: CTA + mobile hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button asChild>
                <Link to={user ? "/dashboard" : "/signup"}>
                  {user ? "Go to Dashboard" : "Start Free Trial"}
                </Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    className="p-2 text-foreground hover:text-primary transition-colors"
                    aria-label="Open menu"
                  >
                    <List size={24} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-6 pt-8">
                    <a
                      href="#how-it-works"
                      onClick={() => setMobileOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    >
                      How It Works
                    </a>
                    <a
                      href="#features"
                      onClick={() => setMobileOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    >
                      Features
                    </a>
                    <a
                      href="#pricing"
                      onClick={() => setMobileOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    >
                      Pricing
                    </a>
                    <a
                      href="#faq"
                      onClick={() => setMobileOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    >
                      FAQ
                    </a>
                    <Button asChild className="mt-2">
                      <Link to={user ? "/dashboard" : "/signup"} onClick={() => setMobileOpen(false)}>
                        {user ? "Go to Dashboard" : "Start Free Trial"}
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 px-6 md:px-12 pt-16 pb-20 md:pb-28 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left side */}
          <div className="flex-1">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-6 bg-secondary/20 text-secondary">
              For Church Communications Teams
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold leading-[1.05] tracking-tight mb-6 text-foreground">
              Your sermon satisfies Sunday.<br />What about the other six days?
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mb-8">
              Ivangel transforms your sermon into social posts, study guides, devotionals, newsletters, and more — in 15+ languages. Text content only, ready to copy and publish.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start your 14-day free trial"}
              </Link>
            </Button>
          </div>

          {/* Right side — decorative cards, hidden on mobile */}
          <div className="flex-1 hidden md:block">
            <div className="relative w-full h-[400px]">
              {/* White/card — tilted right */}
              <div
                className="absolute top-8 right-8 w-72 p-6 bg-card rounded-2xl rotate-3 z-10"
                style={{
                  boxShadow:
                    "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)",
                }}
              >
                <div className="w-8 h-8 rounded-full bg-accent mb-4" />
                <p className="font-medium text-card-foreground mb-4">Daily Devotional</p>
                <div className="w-full h-2 bg-muted rounded-full mb-2" />
                <div className="w-full h-2 bg-muted rounded-full mb-2" />
                <div className="w-full h-2 bg-muted rounded-full" />
              </div>

              {/* Sage card — tilted left */}
              <div
                className="absolute top-32 left-0 w-64 p-6 bg-secondary text-secondary-foreground rounded-2xl -rotate-6 z-20"
                style={{
                  boxShadow:
                    "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)",
                }}
              >
                <div className="w-8 h-8 rounded-full bg-white/30 mb-4" />
                <p className="font-medium mb-4">Guía de Estudio</p>
                <div className="w-full h-2 bg-white/20 rounded-full mb-2" />
                <div className="w-full h-2 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Index;
