import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Tutorial } from "@/config/tutorials";
import { cn } from "@/lib/utils";

// ─── VideoDialog ──────────────────────────────────────────────────────────────

export interface VideoDialogProps {
  tutorial: Tutorial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoDialog({ tutorial, open, onOpenChange }: VideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="font-playfair text-xl">
            {tutorial.title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          {/* No autoPlay: with audio enabled, browsers block autoplay inside a
              portaled dialog and the video just sits paused on the poster
              (looks broken). The branded poster carries a clear play glyph,
              and native controls let the user start playback explicitly. */}
          <video
            key={tutorial.src}
            className="w-full rounded-xl bg-black"
            controls
            poster={tutorial.poster || undefined}
            style={{ aspectRatio: "16 / 9" }}
          >
            <source src={tutorial.src} />
            Your browser does not support HTML video.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

export interface VideoCardProps {
  tutorial: Tutorial;
  className?: string;
}

export function VideoCard({ tutorial, className }: VideoCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group w-full text-left rounded-2xl overflow-hidden border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
        aria-label={`Play video: ${tutorial.title}`}
      >
        {/* Poster — the branded thumbnail already carries play affordance + duration. */}
        <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
          {tutorial.poster ? (
            <img
              src={tutorial.poster}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary">
              <span className="font-playfair font-bold text-primary-foreground text-2xl select-none">
                ivangel
              </span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="p-4">
          <p className="font-semibold text-sm text-foreground leading-snug mb-1">
            {tutorial.title}
          </p>
          {tutorial.blurb && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {tutorial.blurb}
            </p>
          )}
        </div>
      </button>

      <VideoDialog tutorial={tutorial} open={open} onOpenChange={setOpen} />
    </>
  );
}
