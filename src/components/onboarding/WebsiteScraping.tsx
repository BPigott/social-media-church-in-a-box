import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CircleNotch, CheckCircle, Globe } from "phosphor-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shape consumed by the `generate-style-guide` edge function:
 * `websiteContent.content` is an array of `{ title, url, markdown }` pages.
 */
export interface WebsiteContent {
  pagesScraped: number;
  content: Array<{ title?: string; url?: string; markdown?: string }>;
}

interface WebsiteScrapingProps {
  /** URL captured in Step 1. When absent, the step opens in manual-paste mode. */
  websiteUrl?: string | null;
  onComplete: (content: WebsiteContent) => void;
  onSkip: () => void;
}

const SCRAPING_MESSAGES = [
  "Reading how your church already communicates… 📖",
  "Getting a feel for your tone and vibe… ✨",
  "Capturing your vision and values… 🎯",
  "Discovering your ministries and story… 🙏",
  "Almost there — wrapping up… 🎁",
];

type State = "loading" | "success" | "manual";

const MIN_MANUAL_CHARS = 50;

export const WebsiteScraping = ({ websiteUrl, onComplete, onSkip }: WebsiteScrapingProps) => {
  const [state, setState] = useState<State>(websiteUrl ? "loading" : "manual");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [scraped, setScraped] = useState<WebsiteContent | null>(null);
  const [manualContent, setManualContent] = useState("");
  const startedRef = useRef(false);

  // Animate the loading messages while the scrape runs.
  useEffect(() => {
    if (state !== "loading") return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 4, 95));
      setMessageIndex((i) => (i + 1) % SCRAPING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [state]);

  // Kick off the scrape once on mount when a URL is present.
  useEffect(() => {
    if (!websiteUrl || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("scrape-church-website", {
          body: { websiteUrl },
        });
        if (error) throw error;

        if (data?.success && data.data?.content?.length) {
          setScraped(data.data as WebsiteContent);
          setProgress(100);
          setState("success");
          return;
        }
        // No usable content returned — fall back to manual paste.
        setState("manual");
      } catch (err) {
        console.error("Website scraping failed:", err);
        setState("manual");
      }
    })();
  }, [websiteUrl]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-10">
        <CircleNotch size={56} className="animate-spin text-primary" />
        <div className="max-w-md space-y-2 text-center">
          <h3 className="font-playfair text-2xl font-bold">{SCRAPING_MESSAGES[messageIndex]}</h3>
          <p className="text-muted-foreground">
            We're reading your website to learn how your church already speaks.
          </p>
        </div>
        <div className="w-full max-w-md space-y-2">
          <Progress value={progress} className="h-2.5" />
        </div>
      </div>
    );
  }

  if (state === "success" && scraped) {
    const pages = scraped.content.slice(0, 6);
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <CheckCircle size={48} className="text-green-600" weight="fill" />
          <h3 className="font-playfair text-2xl font-bold">We've read your website</h3>
          <p className="max-w-md text-muted-foreground">
            We picked up {scraped.pagesScraped || scraped.content.length} page
            {(scraped.pagesScraped || scraped.content.length) === 1 ? "" : "s"} from your site —
            here's a peek at what we found.
          </p>
        </div>

        <ul className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
          {pages.map((page, i) => (
            <li key={i} className="flex items-start gap-3">
              <Globe size={18} className="mt-0.5 flex-shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{page.title || "Page"}</p>
                <p className="truncate text-xs text-muted-foreground">{page.url}</p>
              </div>
            </li>
          ))}
        </ul>

        <Button onClick={() => onComplete(scraped)} size="lg" className="w-full">
          Looks right — continue →
        </Button>
        <button
          type="button"
          onClick={() => setState("manual")}
          className="mx-auto block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Paste content manually instead
        </button>
      </div>
    );
  }

  // Manual paste — used when there's no URL, or the scrape couldn't read the site.
  const canUse = manualContent.trim().length >= MIN_MANUAL_CHARS;
  const handleUseManual = () => {
    onComplete({
      pagesScraped: 1,
      content: [
        {
          title: "Pasted website content",
          url: websiteUrl || "manual",
          markdown: manualContent.trim(),
        },
      ],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h3 className="font-playfair text-2xl font-bold">Tell us how your church communicates</h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          {websiteUrl
            ? "We couldn't read your website automatically — no problem."
            : "No website? No problem."}{" "}
          Paste some text that sounds like your church — your About page, values, or a recent blog
          post all work well.
        </p>
      </div>

      <Textarea
        value={manualContent}
        onChange={(e) => setManualContent(e.target.value)}
        placeholder="Paste website content here…"
        className="min-h-[180px] text-[15px] leading-relaxed"
      />

      <Button onClick={handleUseManual} disabled={!canUse} size="lg" className="w-full">
        {canUse ? "Use this content →" : "Paste a little more to continue"}
      </Button>
      <button
        type="button"
        onClick={onSkip}
        className="mx-auto block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Skip — I'll add this later
      </button>
    </div>
  );
};
