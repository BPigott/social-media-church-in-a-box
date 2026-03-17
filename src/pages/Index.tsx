import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { List, CheckCircle } from "phosphor-react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const languageNodes = [
  { id: 'en', name: 'English', color: 'hsl(100 13% 54%)', text: "Don't just broadcast. Converse. Bring your community closer, no matter what language they speak at home.", pos: { top: '40%', left: '50%' } },
  { id: 'es', name: 'Español', color: 'hsl(10 56% 54%)', text: "No solo transmitas. Conversa. Acerca a tu comunidad, sin importar el idioma que hablen en casa.", pos: { top: '15%', left: '25%' } },
  { id: 'kr', name: '한국어', color: 'hsl(36 62% 57%)', text: "단순히 방송하지 마십시오. 대화하십시오. 집에서 어떤 언어를 사용하든 커뮤니티를 더 가깝게 만드십시오.", pos: { top: '65%', left: '80%' } },
  { id: 'ar', name: 'العربية', color: 'hsl(24 14% 42%)', text: "لا تكتفِ بالبث. تواصل. قرّب مجتمعك، بغض النظر عن اللغة التي يتحدثون بها في المنزل.", pos: { top: '20%', left: '70%' } },
  { id: 'cy', name: 'Cymraeg', color: 'hsl(10 56% 54%)', text: "Peidiwch â darlledu yn unig. Sgwrsiwch. Dewch â'ch cymuned yn nes, ni waeth pa iaith y maent yn ei siarad gartref.", pos: { top: '70%', left: '20%' } },
];

const Index = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(languageNodes[0]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const problemRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const contentTypesRef = useScrollReveal();
  const tapestryRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-15px) rotate(2deg); }
          100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
        }
        .floating-node { animation: float 6s ease-in-out infinite; }
        .floating-node:nth-child(2) { animation-delay: -2s; animation-duration: 7s; }
        .floating-node:nth-child(3) { animation-delay: -4s; animation-duration: 5s; }
        .floating-node:nth-child(4) { animation-delay: -1s; animation-duration: 8s; }
        .floating-node:nth-child(5) { animation-delay: -3s; animation-duration: 6.5s; }
      `}</style>
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
      <nav className={`sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-6 bg-secondary/20 text-secondary transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              For Church Communications Teams
            </span>
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-playfair font-bold leading-[1.05] tracking-tight mb-6 text-foreground transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              Your sermon satisfies Sunday.<br />What about the other six days?
            </h1>
            <p className={`text-xl text-muted-foreground leading-relaxed max-w-xl mb-8 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              Ivangel transforms your sermon into social posts, study guides, devotionals, newsletters, and more — in 15+ languages. Text content only, ready to copy and publish.
            </p>
            <Button asChild size="lg" className={`text-lg px-8 py-6 transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start your 14-day free trial"}
              </Link>
            </Button>
          </div>

          {/* Right side — decorative cards, hidden on mobile */}
          <div className={`flex-1 hidden md:block transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
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
        <div ref={problemRef} className="max-w-3xl mx-auto px-6 md:px-12 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
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
        <div ref={howItWorksRef} className="max-w-5xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
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
        <div ref={contentTypesRef} className="max-w-5xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
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

      {/* Tapestry Map — Language Feature */}
      <section className="py-20 md:py-28 bg-card relative z-10">
        <div ref={tapestryRef} className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col items-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
          {/* Section header */}
          <div className="text-center max-w-2xl mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
              Speak to their heart.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hover over a language to see how your pastoral voice translates across cultures. 15+ languages supported.
            </p>
          </div>

          {/* Interactive Map Area */}
          <div className="w-full max-w-4xl h-[500px] relative bg-background rounded-3xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(58,53,47,0.1),0_2px_10px_-2px_rgba(58,53,47,0.05)] border border-border/50">

            {/* Central Display Card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-card p-8 rounded-2xl shadow-[0_10px_40px_-10px_rgba(58,53,47,0.1)] z-30 transition-all duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeLang.color }} />
                <span className="font-bold text-lg" style={{ color: activeLang.color }}>{activeLang.name}</span>
              </div>
              <p className="text-xl font-medium leading-relaxed" dir={activeLang.id === 'ar' ? 'rtl' : 'ltr'}>
                "{activeLang.text}"
              </p>
            </div>

            {/* Floating Nodes */}
            {languageNodes.map((lang) => (
              <button
                key={lang.id}
                onMouseEnter={() => setActiveLang(lang)}
                onClick={() => setActiveLang(lang)}
                className={`floating-node absolute w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg transition-transform duration-300 hover:scale-110 focus:outline-none z-40 ${activeLang.id === lang.id ? 'ring-4 ring-white ring-offset-2 ring-offset-background scale-110' : ''}`}
                style={{
                  backgroundColor: lang.color,
                  top: lang.pos.top,
                  left: lang.pos.left,
                  boxShadow: `0 10px 20px -5px ${lang.color}80`
                }}
                aria-label={`View translation in ${lang.name}`}
              >
                {lang.id.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Note below map */}
          <p className="text-muted-foreground text-center mt-6 text-sm">
            Also available in: French, Portuguese, German, Mandarin, Hindi, Tagalog, and more.
          </p>
        </div>
      </section>

      {/* Features — 3 Focused Blocks */}
      <section id="features" className="py-20 md:py-28 relative z-10">
        <div ref={featuresRef} className="max-w-6xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">

          {/* Block 1: Your voice, not ours */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text side — left on desktop */}
            <div>
              <h3 className="text-3xl md:text-4xl font-playfair font-bold mb-6">Your voice, not ours.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">Ivangel crawls your church website and learns your tone, vocabulary, and style. Every output sounds like you wrote it — because it's built on your words, your theology, your heart for your community.</p>
            </div>
            {/* Visual side — right on desktop */}
            <div
              className="w-full h-72 rounded-3xl p-8 flex flex-col justify-end -rotate-2 bg-primary"
              style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
            >
              <div
                className="bg-card p-6 rounded-2xl w-4/5 ml-auto translate-y-4"
                style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
              >
                <p className="font-semibold mb-1">Voice Match: 94%</p>
                <p className="text-sm text-muted-foreground">Grace Community Church</p>
              </div>
            </div>
          </div>

          {/* Block 2: Series-aware content */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mt-20">
            {/* Visual side — left on desktop */}
            <div
              className="order-2 md:order-1 w-full h-72 rounded-3xl p-8 flex flex-col justify-center rotate-2 bg-secondary"
              style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="bg-card p-4 rounded-xl w-2/5"
                  style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                >
                  <p className="font-semibold text-sm mb-2">Week 3</p>
                  <div className="w-full h-2 bg-muted rounded-full mb-1.5" />
                  <div className="w-4/5 h-2 bg-muted rounded-full" />
                </div>
                <div className="border-t-2 border-dashed border-white/40 w-8 flex-shrink-0" />
                <div
                  className="bg-card p-4 rounded-xl w-2/5"
                  style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
                >
                  <p className="font-semibold text-sm mb-2">Week 4</p>
                  <div className="w-full h-2 bg-muted rounded-full mb-1.5" />
                  <div className="w-4/5 h-2 bg-muted rounded-full" />
                </div>
              </div>
            </div>
            {/* Text side — right on desktop */}
            <div className="order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-playfair font-bold mb-6">Series-aware content.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">Running a sermon series? Ivangel connects this week's message to last week's. Cross-references, callbacks, and continuity across every content type — your community gets a coherent journey, not isolated fragments.</p>
            </div>
          </div>

          {/* Block 3: Every platform, ready to go */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mt-20">
            {/* Text side — left on desktop */}
            <div>
              <h3 className="text-3xl md:text-4xl font-playfair font-bold mb-6">Every platform, ready to go.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">Optimised for Facebook, Instagram, TikTok, X, email, and podcast directories. Export as PDF, DOCX, or copy to clipboard. Social handles auto-inserted. Your content, your way.</p>
            </div>
            {/* Visual side — right on desktop */}
            <div
              className="w-full h-72 rounded-3xl p-8 flex flex-wrap items-center justify-center gap-3 -rotate-1 bg-accent/20 border border-accent/30"
              style={{ boxShadow: "0 10px 40px -10px rgba(58,53,47,0.1), 0 2px 10px -2px rgba(58,53,47,0.05)" }}
            >
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">Facebook</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">Instagram</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">TikTok</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">X</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">PDF</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">DOCX</span>
              <span className="bg-card rounded-lg px-4 py-2 text-sm font-medium shadow-sm">Clipboard</span>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-card relative z-10">
        <div ref={pricingRef} className="max-w-4xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-center mb-4">
            Simple, honest pricing.
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Professional ministry tools that fit your church budget.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Single Church */}
            <Card className="shadow-[0_10px_40px_-10px_rgba(58,53,47,0.1),0_2px_10px_-2px_rgba(58,53,47,0.05)]">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium text-muted-foreground">Single Church</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-playfair font-bold">£19</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">All 6 content types</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">15+ languages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">Style guide matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">Sermon series tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">PDF &amp; DOCX export</span>
                  </li>
                </ul>
                <Button asChild className="w-full" size="lg">
                  <Link to="/signup">Start 14-day free trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Multi-site */}
            <Card className="border-primary border-2 shadow-[0_10px_40px_-10px_rgba(58,53,47,0.1),0_2px_10px_-2px_rgba(58,53,47,0.05)]">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium text-muted-foreground">Multi-site</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-playfair font-bold">£49</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">All 6 content types</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">15+ languages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">Style guide matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">Sermon series tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">PDF &amp; DOCX export</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-secondary flex-shrink-0" weight="fill" />
                    <span className="text-sm">Multiple church profiles</span>
                  </li>
                </ul>
                <Button asChild className="w-full" size="lg">
                  <Link to="/signup">Start 14-day free trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-8">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 relative z-10">
        <div ref={faqRef} className="max-w-3xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="border border-border/50 rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                What kind of content does Ivangel create?
              </AccordionTrigger>
              <AccordionContent>
                Ivangel generates text-based content only: social media posts, bible study guides, daily devotionals, podcast descriptions, email newsletters, and event promotions. No images or video — just well-crafted words ready to copy, edit, and share.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border/50 rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                How does the free trial work?
              </AccordionTrigger>
              <AccordionContent>
                You get 14 days of full access to every feature — all content types, all languages, style guide matching. No credit card required to start. Cancel anytime.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border/50 rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                Can it match our church's voice and style?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Provide your church website URL and Ivangel analyses your tone, vocabulary, and theological emphasis. Every output is shaped by your voice, not a generic template.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border/50 rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                What languages are supported?
              </AccordionTrigger>
              <AccordionContent>
                15+ languages including Spanish, Korean, Arabic, French, Portuguese, German, Mandarin, Hindi, Tagalog, Welsh, and more. Generate up to 3 languages simultaneously.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border/50 rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                Do I need technical skills to use this?
              </AccordionTrigger>
              <AccordionContent>
                Not at all. Paste your sermon transcript, choose what you want, and copy the results. If you can use email, you can use Ivangel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Warm CTA */}
      <section className="py-20 md:py-28 bg-primary relative z-10">
        <div ref={ctaRef} className="max-w-4xl mx-auto text-center px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-primary-foreground">
            Ready to give your team their week back?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join the beta. Keep your voice. Save your team hours. Welcome everyone in their language.
          </p>
          <Button asChild variant="secondary" size="lg" className="text-lg px-8 py-6">
            <Link to="/signup">Start your 14-day free trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 md:px-12 py-10 border-t border-border/50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span className="font-playfair font-bold text-lg">Ivangel</span>
            </div>

            {/* Center: Links */}
            <div className="flex gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="mailto:support@ivangel.co" className="hover:text-primary transition-colors">Support</a>
            </div>

            {/* Right: Company info */}
            <p className="text-xs text-muted-foreground text-center md:text-right">
              IN FOCUS OPERATIONS LIMITED<br />Company No. 16707659
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Built with care for the modern church.
          </p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;
