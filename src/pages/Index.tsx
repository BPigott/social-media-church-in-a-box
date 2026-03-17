import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      {/* Problem Statement */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-8">
            Sunday's message deserves more than a Monday morning scramble.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Your communications volunteer spends hours every week reformatting the sermon into social posts, translating for your multilingual community, and drafting study materials. By Wednesday, the momentum is gone.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            What if all of that was done before they finished their Monday morning coffee?
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-card relative z-10">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-center mb-16">
            Three steps. Five minutes.
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <span className="text-5xl font-playfair font-bold text-primary block mb-4">1</span>
              <h3 className="text-xl font-bold mb-2">Paste your transcript</h3>
              <p className="text-muted-foreground">Upload, paste, or type your sermon. That's it.</p>
            </div>
            <div className="text-center">
              <span className="text-5xl font-playfair font-bold text-primary block mb-4">2</span>
              <h3 className="text-xl font-bold mb-2">Choose your content</h3>
              <p className="text-muted-foreground">Social posts, study guides, devotionals, newsletters, podcast descriptions — pick what you need.</p>
            </div>
            <div className="text-center">
              <span className="text-5xl font-playfair font-bold text-primary block mb-4">3</span>
              <h3 className="text-xl font-bold mb-2">Edit and publish</h3>
              <p className="text-muted-foreground">Review, tweak if you like, then copy or export. Done in minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Tabbed Showcase */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-center mb-4">
            One sermon. Six ways to reach your community.
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Choose the content types you need — Ivangel generates them all from a single transcript.
          </p>

          <Tabs defaultValue="social" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
              <TabsTrigger value="social" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Social Media Posts
              </TabsTrigger>
              <TabsTrigger value="study" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Bible Study Guides
              </TabsTrigger>
              <TabsTrigger value="devotional" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Daily Devotionals
              </TabsTrigger>
              <TabsTrigger value="podcast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Podcast Descriptions
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Email Newsletters
              </TabsTrigger>
              <TabsTrigger value="event" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                Event Promotions
              </TabsTrigger>
            </TabsList>

            {/* Social Media Posts */}
            <TabsContent value="social">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Social Media Posts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Platform-optimised posts for Facebook, Instagram, TikTok, and X. Multiple variations, hashtags included.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm rotate-2"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent" />
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">Grace Community Church</p>
                        <p className="text-xs text-muted-foreground">@gracechurch</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-muted rounded-full" />
                      <div className="w-5/6 h-2 bg-muted rounded-full" />
                      <div className="w-4/6 h-2 bg-muted rounded-full" />
                    </div>
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <span className="text-xs text-primary">#faith</span>
                      <span className="text-xs text-primary">#sermon</span>
                      <span className="text-xs text-primary">#community</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bible Study Guides */}
            <TabsContent value="study">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Bible Study Guides</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Discussion questions, scripture references, and application points. Ready for your small group leaders.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm -rotate-1"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <p className="font-semibold text-card-foreground mb-4">Discussion Questions</p>
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="flex gap-3 items-start">
                          <span className="text-xs font-bold text-primary mt-0.5">{n}.</span>
                          <div className="flex-1 space-y-1">
                            <div className="w-full h-2 bg-muted rounded-full" />
                            <div className="w-4/5 h-2 bg-muted rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Daily Devotionals */}
            <TabsContent value="devotional">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Daily Devotionals</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A week of devotionals from one sermon. Blended format with scripture and reflection.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm rotate-1"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Day 1</p>
                    <p className="font-semibold text-card-foreground mb-4">Monday Devotional</p>
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-muted rounded-full" />
                      <div className="w-full h-2 bg-muted rounded-full" />
                      <div className="w-3/4 h-2 bg-muted rounded-full" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground italic">Reflection prompt below...</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Podcast Descriptions */}
            <TabsContent value="podcast">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Podcast Descriptions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Episode summaries with timestamps, tags, and SEO-friendly descriptions. 150–250 words.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm -rotate-2"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Episode 42</p>
                    <p className="font-semibold text-card-foreground mb-4">[Sermon Title Here]</p>
                    <div className="space-y-2 mb-4">
                      <div className="w-full h-2 bg-muted rounded-full" />
                      <div className="w-full h-2 bg-muted rounded-full" />
                      <div className="w-5/6 h-2 bg-muted rounded-full" />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">faith</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">church</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Email Newsletters */}
            <TabsContent value="newsletter">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Email Newsletters</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Subject line, preview text, and full draft. 400–600 words, structured sections.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm rotate-1"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subject</p>
                        <p className="text-sm font-medium text-card-foreground">This Week at [Church Name]</p>
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="w-full h-2 bg-muted rounded-full" />
                        <div className="w-full h-2 bg-muted rounded-full" />
                        <div className="w-4/5 h-2 bg-muted rounded-full" />
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="w-full h-2 bg-muted rounded-full" />
                        <div className="w-3/5 h-2 bg-muted rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Event Promotions */}
            <TabsContent value="event">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-playfair font-bold mb-4">Event Promotions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Not from a sermon — structured event fields for announcements, outreach, and special services.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-card rounded-2xl p-6 w-full max-w-sm -rotate-1"
                    style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                  >
                    <p className="font-semibold text-card-foreground mb-4">Easter Sunday Service</p>
                    <div className="space-y-3">
                      {[
                        { label: "Date", value: "April 20, 2025" },
                        { label: "Time", value: "9:00 AM & 11:00 AM" },
                        { label: "Location", value: "Main Sanctuary" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">{label}</span>
                          <span className="text-card-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;
