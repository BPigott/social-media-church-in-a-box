import { AppShell } from "@/components/layout/AppShell";
import { VideoCard } from "@/components/video/VideoDialog";
import { TUTORIALS } from "@/config/tutorials";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How long does generating content take?",
    a: "Usually under a minute. Adding more languages or generating several pieces at once can take a little longer, but it's still quick — make a cup of tea and it'll be ready.",
  },
  {
    q: "The content doesn't sound like us — how do I fix that?",
    a: "Open Settings → Style Guide and edit your voice profile directly. If your website has changed, use the Refresh button on the Church Information tab to re-crawl it; ivangel will incorporate the updated tone on your next generation.",
  },
  {
    q: "Can I edit content after it's generated?",
    a: "Yes. Every piece is editable inline in the results panel. Make your changes, then copy or download — your edits stick.",
  },
  {
    q: "How do I add another language, or fix a translation?",
    a: "Use the language picker on the results panel to add up to three languages alongside English. To regenerate a translation, edit the English version and click \"Re-translate from English\".",
  },
  {
    q: "Where do my past generations go?",
    a: "Everything ivangel has ever generated for your church lives in the Library. You can search, expand a date or platform, and download anything you've made.",
  },
  {
    q: "What can I upload as a sermon?",
    a: "TXT, PDF, DOCX or DOC files. If you don't have a transcript, switch to \"Upcoming event\" and write a short description of what's coming up — ivangel can generate from that instead.",
  },
  {
    q: "How do I update church details or our website?",
    a: "Settings → Church Information. Update your details, then click Refresh to re-crawl your website so your style guide stays current.",
  },
  {
    q: "A video won't play or looks blank — what should I try?",
    a: "Refresh the page first, then check your internet connection. If it still won't load, try another browser. If that fails too, get in touch and we'll take a look.",
  },
  {
    q: "How does billing work and how do I cancel?",
    a: "ivangel is £25 per month. You can manage your subscription or cancel anytime from the Billing page — no contracts, no cancellation fees.",
  },
  {
    q: "Is there a limit on how much I can generate?",
    a: "No. Generation is unlimited on the plan — produce as much content as your church needs, every week.",
  },
  {
    q: "Is our content private and secure?",
    a: "Yes. Each church has its own private library — your sermons, voice profile and generated content are visible only to your church account. We don't share data between churches, and your content is never used to train AI models.",
  },
];

const Help = () => {
  const publishedTutorials = TUTORIALS.filter((t) => t.published);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="mb-2 h-[3px] w-10 rounded bg-primary" />
          <h1 className="font-playfair text-3xl font-bold">Help &amp; Videos</h1>
          <p className="mt-1 italic text-muted-foreground">
            Short video guides to get the most from ivangel.
          </p>
        </div>

        {/* Video grid — hosted, verified videos only. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTutorials.map((tutorial) => (
            <VideoCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="mb-2 h-[3px] w-10 rounded bg-primary" />
            <h2 className="font-playfair text-2xl font-bold">
              Frequently asked questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border/40 px-0 bg-transparent"
              >
                <AccordionTrigger className="text-left font-playfair text-lg md:text-xl hover:no-underline py-5 text-foreground/90">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </AppShell>
  );
};

export default Help;
