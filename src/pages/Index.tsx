import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { List, CheckCircle } from "phosphor-react";
import { Facebook, Instagram, Twitter, Mail, FileText, Clipboard, Music } from "lucide-react";

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
  { id: 'en', name: 'English', color: 'hsl(100 13% 54%)', text: "Don't just broadcast. Converse. Bring your community closer, no matter what language they speak at home.", pos: { top: '40%', left: '50%' }, animDuration: '6s', animDelay: '0s' },
  { id: 'es', name: 'Español', color: 'hsl(10 56% 54%)', text: "No solo transmitas. Conversa. Acerca a tu comunidad, sin importar el idioma que hablen en casa.", pos: { top: '15%', left: '25%' }, animDuration: '7s', animDelay: '-2s' },
  { id: 'kr', name: '한국어', color: 'hsl(36 62% 57%)', text: "단순히 방송하지 마십시오. 대화하십시오. 집에서 어떤 언어를 사용하든 커뮤니티를 더 가깝게 만드십시오.", pos: { top: '65%', left: '80%' }, animDuration: '5s', animDelay: '-4s' },
  { id: 'ar', name: 'العربية', color: 'hsl(24 14% 42%)', text: "لا تكتفِ بالبث. تواصل. قرّب مجتمعك، بغض النظر عن اللغة التي يتحدثون بها في المنزل.", pos: { top: '20%', left: '70%' }, animDuration: '8s', animDelay: '-1s' },
  { id: 'cy', name: 'Cymraeg', color: 'hsl(10 56% 54%)', text: "Peidiwch â darlledu yn unig. Sgwrsiwch. Dewch â'ch cymuned yn nes, ni waeth pa iaith y maent yn ei siarad gartref.", pos: { top: '70%', left: '20%' }, animDuration: '6.5s', animDelay: '-3s' },
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
                className="absolute top-8 right-8 w-72 p-6 bg-card rounded-2xl rotate-3 z-10 border border-border/40 backdrop-blur-sm shadow-tactile"
              >
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Devotional</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <p className="font-playfair text-lg text-foreground leading-snug mb-3">
                  "Grace isn't about waiting for people to come to you; it's about going to where they are..."
                </p>
                <p className="text-xs font-medium text-muted-foreground italic">Day 1 &bull; 2 min read</p>
              </div>

              {/* Sage card — tilted left */}
              <div
                className="absolute top-32 left-0 w-64 p-6 bg-secondary text-secondary-foreground rounded-2xl -rotate-6 z-20 border border-white/10 shadow-tactile"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Guía de Estudio</p>
                </div>
                <p className="text-sm font-medium leading-relaxed mb-3">
                  1. ¿Cómo podemos practicar esta gracia activa en nuestra comunidad esta semana?
                </p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">Pregunta 01</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Strip */}
      <div className="relative z-10 border-t border-border/30 py-8">
        <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Built for churches like yours</p>
          <div className="flex items-center gap-8 md:gap-12 text-muted-foreground/50">
            <div className="text-center">
              <p className="text-2xl font-playfair font-bold text-foreground">15+</p>
              <p className="text-xs text-muted-foreground">Languages</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-2xl font-playfair font-bold text-foreground">6</p>
              <p className="text-xs text-muted-foreground">Content types</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-2xl font-playfair font-bold text-foreground">&lt;5 min</p>
              <p className="text-xs text-muted-foreground">Per sermon</p>
            </div>
          </div>
        </div>
      </div>

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
      <section id="how-it-works" className="py-24 md:py-32 bg-background relative z-10 border-t border-border/30">
        <div ref={howItWorksRef} className="max-w-6xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20">

            {/* Sticky Left Column */}
            <div className="md:col-span-5">
              <div className="sticky top-32">
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">The Methodology</span>
                <h2 className="text-4xl md:text-5xl font-playfair font-bold leading-tight mb-6">
                  Your message, <br/>architected for the week.
                </h2>
                <p className="text-lg text-muted-foreground">We removed the friction between the pulpit and the digital world.</p>
              </div>
            </div>

            {/* Scrolling Right Column */}
            <div className="md:col-span-6 md:col-start-7 space-y-16 mt-12 md:mt-0">

              {/* Step 1 */}
              <div className="relative pl-8 md:pl-12 border-l border-border/60">
                <span className="absolute -left-[18px] top-0 text-sm font-bold bg-background text-primary py-1 px-2 font-playfair italic">I.</span>
                <h3 className="text-2xl font-playfair font-bold mb-3">The Ingestion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your raw audio, video, or pasted text transcript. The engine instantly analyzes your theological framework, tone, and pacing.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-8 md:pl-12 border-l border-border/60">
                <span className="absolute -left-[20px] top-0 text-sm font-bold bg-background text-primary py-1 px-2 font-playfair italic">II.</span>
                <h3 className="text-2xl font-playfair font-bold mb-3">The Expansion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Select your required outputs. Within moments, the AI generates highly contextual social threads, study guides, and devotionals in up to 22 languages simultaneously.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative pl-8 md:pl-12 border-l border-border/60">
                <span className="absolute -left-[22px] top-0 text-sm font-bold bg-background text-primary py-1 px-2 font-playfair italic">III.</span>
                <h3 className="text-2xl font-playfair font-bold mb-3">The Deployment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Review your perfectly formatted text. Edit on the fly, export to PDF, or copy directly to your clipboard for instant scheduling.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Content Types — Editorial Index */}
      <section className="py-20 md:py-28 relative z-10">
        <div ref={contentTypesRef} className="max-w-6xl mx-auto px-6 md:px-12 opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">What You Get</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-4">
            One sermon. Six ways to reach your community.
          </h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl">
            Choose the content types you need — Ivangel generates them all from a single transcript.
          </p>

          <Tabs defaultValue="social" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">

              {/* Left: Vertical Tab Nav */}
              <TabsList className="md:col-span-4 flex flex-col items-start bg-transparent h-auto gap-0 border-l border-border/40">
                <TabsTrigger value="social" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Social Media Posts
                </TabsTrigger>
                <TabsTrigger value="study" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Bible Study Guides
                </TabsTrigger>
                <TabsTrigger value="devotional" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Daily Devotionals
                </TabsTrigger>
                <TabsTrigger value="podcast" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Podcast Descriptions
                </TabsTrigger>
                <TabsTrigger value="newsletter" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Email Newsletters
                </TabsTrigger>
                <TabsTrigger value="event" className="w-full justify-start text-left pl-6 py-4 text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:-ml-px text-muted-foreground hover:text-foreground transition-colors">
                  Event Promotions
                </TabsTrigger>
              </TabsList>

              {/* Right: Content Panels */}
              <div className="md:col-span-8">
                {/* Social Media Posts */}
                <TabsContent value="social" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-accent" />
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">Grace Community Church</p>
                        <p className="text-xs text-muted-foreground">@gracechurch</p>
                      </div>
                    </div>
                    <p className="text-card-foreground leading-relaxed mb-4">
                      "Grace isn't passive — it's the most active force in the universe. This Sunday we explored what it means to carry that into Monday morning."
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tap the link in bio to read the full devotional series this week.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs text-primary font-medium">#SundaySermon</span>
                      <span className="text-xs text-primary font-medium">#ActiveGrace</span>
                      <span className="text-xs text-primary font-medium">#ChurchLife</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Bible Study Guides */}
                <TabsContent value="study" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Small Group Discussion Guide</p>
                    <div className="space-y-5">
                      <div className="flex gap-4 items-start">
                        <span className="text-sm font-bold text-primary font-playfair italic mt-0.5">1.</span>
                        <p className="text-card-foreground leading-relaxed">What does "active grace" look like in your workplace or neighbourhood this week?</p>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="text-sm font-bold text-primary font-playfair italic mt-0.5">2.</span>
                        <p className="text-card-foreground leading-relaxed">Read James 2:14–17. How does this passage reframe the sermon's central idea?</p>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="text-sm font-bold text-primary font-playfair italic mt-0.5">3.</span>
                        <p className="text-card-foreground leading-relaxed">Share a moment when someone extended grace to you unexpectedly. What changed?</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Daily Devotionals */}
                <TabsContent value="devotional" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <div className="flex items-center justify-between mb-5 border-b border-border/50 pb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Day 1 &bull; Monday</p>
                      <p className="text-xs text-muted-foreground italic">2 min read</p>
                    </div>
                    <h4 className="font-playfair text-xl font-bold mb-3 text-card-foreground">The Weight of a Small Kindness</h4>
                    <p className="text-card-foreground leading-relaxed mb-4">
                      "Carry each other's burdens, and in this way you will fulfil the law of Christ." — Galatians 6:2
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      Today's reflection: grace doesn't always announce itself. Sometimes it arrives as a text message, a meal left on a doorstep, or five quiet minutes of listening.
                    </p>
                    <div className="mt-5 pt-4 border-t border-border/40">
                      <p className="text-xs font-medium text-primary italic">Reflect: Who in your circle needs a small kindness today?</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Podcast Descriptions */}
                <TabsContent value="podcast" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Episode 42 &bull; Season 3</p>
                    <h4 className="font-playfair text-xl font-bold mb-3 text-card-foreground">Active Grace: Beyond the Pew</h4>
                    <p className="text-card-foreground leading-relaxed mb-4">
                      Pastor James unpacks what happens when Sunday's message meets Monday's reality. Drawing from James 2 and personal stories from the congregation, this episode challenges us to move grace from concept to practice.
                    </p>
                    <div className="border-t border-border/40 pt-4 space-y-2">
                      <p className="text-xs text-muted-foreground"><span className="font-semibold">00:00</span> — Introduction &amp; recap</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold">04:30</span> — The theology of active grace</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold">18:15</span> — Congregation stories</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Email Newsletters */}
                <TabsContent value="newsletter" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Subject Line</p>
                        <p className="text-base font-medium text-card-foreground">This week: turning Sunday's grace into Monday's action</p>
                      </div>
                      <div className="border-t border-border/40 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
                        <p className="text-sm text-card-foreground leading-relaxed">
                          Dear Grace Community family — this Sunday, Pastor James reminded us that grace is a verb. Here's how to live it out this week, plus your devotional guide, small group questions, and details on next Saturday's community outreach...
                        </p>
                      </div>
                      <div className="border-t border-border/40 pt-4">
                        <p className="text-xs text-muted-foreground italic">Estimated read time: 3 minutes &bull; 480 words</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Event Promotions */}
                <TabsContent value="event" className="mt-0">
                  <div className="bg-card rounded-2xl p-8 shadow-tactile border border-border/30">
                    <h4 className="font-playfair text-xl font-bold mb-4 text-card-foreground">Easter Sunday Service</h4>
                    <div className="space-y-3 border-t border-border/40 pt-4">
                      {[
                        { label: "Date", value: "April 20, 2025" },
                        { label: "Time", value: "9:00 AM & 11:00 AM" },
                        { label: "Location", value: "Main Sanctuary" },
                        { label: "Childcare", value: "Available for ages 0–5" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm py-1 border-b border-border/20 last:border-0">
                          <span className="text-muted-foreground font-medium">{label}</span>
                          <span className="text-card-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                      Join us for a morning of celebration, worship, and community. Invite your neighbours — everyone is welcome.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Tapestry Map — Language Feature */}
      <section className="py-20 md:py-28 bg-card relative z-10">
        <div ref={tapestryRef} className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col items-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
          {/* Section header */}
          <div className="text-center max-w-2xl mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Multilingual Outreach</span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
              One sermon, every language your community speaks.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hover over a language to see how your pastoral voice translates across cultures. 15+ languages supported — instantly.
            </p>
          </div>

          {/* Interactive Map Area */}
          <div className="w-full max-w-4xl h-[500px] relative bg-background rounded-3xl overflow-hidden shadow-tactile border border-border/50">

            {/* Central Display Card */}
            <div aria-live="polite" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-card p-8 rounded-2xl shadow-tactile z-30 transition-all duration-500">
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
                  boxShadow: `0 10px 20px -5px ${lang.color}80`,
                  animationDuration: lang.animDuration,
                  animationDelay: lang.animDelay,
                }}
                aria-label={`View translation in ${lang.name}`}
              >
                {lang.id.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Note below map */}
          <p className="text-muted-foreground text-center mt-6 text-sm">
            Also available in: French, Portuguese, German, Mandarin, Hindi, Swahili, and more.
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
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">During onboarding, Ivangel crawls your church website and analyses your sermons to learn your tone, vocabulary, theological emphasis, and pastoral style. It builds a voice profile unique to your ministry.</p>
              <p className="text-lg text-muted-foreground leading-relaxed">Every output sounds like you wrote it — because it's built on your words. And you can refine your voice profile at any time from your settings.</p>
            </div>
            {/* Visual side — right on desktop */}
            <div
              className="w-full min-h-[320px] rounded-3xl p-8 flex flex-col justify-between -rotate-2 bg-primary shadow-tactile"
            >
              <div className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-widest mb-4">Voice Profile</div>
              <div className="space-y-3 flex-1">
                <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-primary-foreground text-xs font-semibold">Theological Tone</span>
                    <span className="text-primary-foreground/80 text-xs">Reformed · Pastoral</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="w-[88%] h-full bg-primary-foreground/90 rounded-full" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-primary-foreground text-xs font-semibold">Warmth &amp; Approachability</span>
                    <span className="text-primary-foreground/80 text-xs">High</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-primary-foreground/90 rounded-full" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-primary-foreground text-xs font-semibold">Scripture Usage</span>
                    <span className="text-primary-foreground/80 text-xs">Frequent · NIV</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="w-[76%] h-full bg-primary-foreground/90 rounded-full" />
                  </div>
                </div>
              </div>
              <div
                className="bg-card p-4 rounded-2xl mt-4 shadow-tactile"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Voice Match: 94%</p>
                    <p className="text-xs text-muted-foreground">Grace Community Church</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Editable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Series-aware content */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mt-20">
            {/* Visual side — left on desktop */}
            <div
              className="order-2 md:order-1 w-full h-72 rounded-3xl p-8 flex flex-col justify-center rotate-2 bg-secondary shadow-tactile"
            >
              <div className="flex items-center gap-3">
                <div
                  className="bg-card p-4 rounded-xl w-[45%] shadow-tactile"
                >
                  <p className="font-semibold text-xs mb-2">Week 3 <span className="font-normal text-muted-foreground">· Forgiveness</span></p>
                  <p className="text-[11px] text-muted-foreground leading-snug">"As we explored last week, grace precedes forgiveness..."</p>
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="border-t-2 border-dashed border-white/40 w-6" />
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">linked</span>
                  <div className="border-t-2 border-dashed border-white/40 w-6" />
                </div>
                <div
                  className="bg-card p-4 rounded-xl w-[45%] shadow-tactile"
                >
                  <p className="font-semibold text-xs mb-2">Week 4 <span className="font-normal text-muted-foreground">· Restoration</span></p>
                  <p className="text-[11px] text-muted-foreground leading-snug">"Building on last week's theme of forgiveness, we turn to restoration..."</p>
                </div>
              </div>
            </div>
            {/* Text side — right on desktop */}
            <div className="order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-playfair font-bold mb-6">Series-aware content.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">Running a sermon series? Ivangel keeps track. Tag each sermon with its series and week number, and the AI weaves that context into every output — referencing the series theme, maintaining consistent messaging, and framing each week within the bigger story.</p>
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
              className="w-full min-h-[288px] rounded-3xl p-8 flex flex-wrap items-center justify-center gap-4 -rotate-1 bg-accent/20 border border-accent/30 shadow-tactile"
            >
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Facebook size={20} className="text-[#1877F2]" />
                <span className="text-sm font-medium">Facebook</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Instagram size={20} className="text-[#E4405F]" />
                <span className="text-sm font-medium">Instagram</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.89a8.1 8.1 0 0 0 4.76 1.52V6.97a4.83 4.83 0 0 1-1-.28z"/></svg>
                <span className="text-sm font-medium">TikTok</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Twitter size={20} />
                <span className="text-sm font-medium">X</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Mail size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <FileText size={20} className="text-[#D32F2F]" />
                <span className="text-sm font-medium">PDF</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <FileText size={20} className="text-[#2B579A]" />
                <span className="text-sm font-medium">DOCX</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Clipboard size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium">Clipboard</span>
              </div>
              <div className="bg-card rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-tactile transition-shadow">
                <Music size={20} className="text-[#8B5CF6]" />
                <span className="text-sm font-medium">Podcast</span>
              </div>
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

          <div className="max-w-md mx-auto">
            {/* Church Plan */}
            <Card className="border-primary border-2 shadow-tactile">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium text-muted-foreground">Church Plan</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-playfair font-bold">£25</span>
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
                    <span className="text-sm">Unlimited content generation</span>
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

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-border/40 px-0 bg-transparent">
              <AccordionTrigger className="text-left font-playfair text-xl md:text-2xl hover:no-underline py-6 text-foreground/90">
                What kind of content does Ivangel create?
              </AccordionTrigger>
              <AccordionContent>
                Ivangel generates text-based content only: social media posts, bible study guides, daily devotionals, podcast descriptions, email newsletters, and event promotions. No images or video — just well-crafted words ready to copy, edit, and share.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-border/40 px-0 bg-transparent">
              <AccordionTrigger className="text-left font-playfair text-xl md:text-2xl hover:no-underline py-6 text-foreground/90">
                How does the free trial work?
              </AccordionTrigger>
              <AccordionContent>
                You get 14 days of full access to every feature — all content types, all languages, style guide matching. No credit card required to start. Cancel anytime.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-border/40 px-0 bg-transparent">
              <AccordionTrigger className="text-left font-playfair text-xl md:text-2xl hover:no-underline py-6 text-foreground/90">
                Can it match our church's voice and style?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Provide your church website URL and Ivangel analyses your tone, vocabulary, and theological emphasis. Every output is shaped by your voice, not a generic template.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-border/40 px-0 bg-transparent">
              <AccordionTrigger className="text-left font-playfair text-xl md:text-2xl hover:no-underline py-6 text-foreground/90">
                What languages are supported?
              </AccordionTrigger>
              <AccordionContent>
                15+ languages including Spanish, Korean, Arabic, French, Portuguese, German, Mandarin, Hindi, Tagalog, Welsh, and more. Generate up to 3 languages simultaneously.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b border-border/40 px-0 bg-transparent">
              <AccordionTrigger className="text-left font-playfair text-xl md:text-2xl hover:no-underline py-6 text-foreground/90">
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
          <p className="text-sm font-bold uppercase tracking-widest text-primary-foreground/60 mb-6">Save 8+ hours every week</p>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-primary-foreground">
            Ready to give your team their week back?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Keep your voice. Reach every language. Turn one sermon into a full week of content — before Monday morning coffee.
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
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
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
