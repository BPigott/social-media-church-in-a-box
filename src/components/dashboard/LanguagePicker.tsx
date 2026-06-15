import { useState, useMemo } from "react";
import { Plus, Star, X, MagnifyingGlass, Check } from "phosphor-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LANGUAGE_NAMES, LANGUAGE_NATIVE, getSortedLanguages } from "@/lib/languages";
import { cn } from "@/lib/utils";

interface LanguagePickerProps {
  outputLanguages: string[];
  primaryLanguage: string;
  onToggle: (code: string) => void;
  onPrimaryChange: (code: string) => void;
}

const MAX_LANGUAGES = 3;

export function LanguagePicker({
  outputLanguages,
  primaryLanguage,
  onToggle,
  onPrimaryChange,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const atLimit = outputLanguages.length >= MAX_LANGUAGES;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getSortedLanguages().filter(([code, name]) => {
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        (LANGUAGE_NATIVE[code] ?? "").toLowerCase().includes(q) ||
        code.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Languages ({outputLanguages.length} of {MAX_LANGUAGES})
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {outputLanguages.map((code) => {
          const isPrimary = code === primaryLanguage;
          const locked = code === "en";
          return (
            <div key={code} className="relative">
              <button
                type="button"
                onClick={() => setMenuFor((m) => (m === code ? null : code))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  "border-accent bg-accent font-semibold text-accent-foreground",
                  isPrimary && "ring-2 ring-accent ring-offset-2 ring-offset-card"
                )}
              >
                {isPrimary && <Star size={12} weight="fill" />}
                {LANGUAGE_NAMES[code] ?? code}
              </button>

              {menuFor === code && (
                <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => {
                        onPrimaryChange(code);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Star size={14} /> Set as primary
                    </button>
                  )}
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggle(code);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      <X size={14} /> Remove language
                    </button>
                  )}
                  {locked && (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">
                      English is always included.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!atLimit && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Plus size={14} /> Add
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div className="mb-2 flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                <MagnifyingGlass size={14} className="text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 22 languages…"
                  className="h-6 border-0 p-0 text-sm focus-visible:ring-0"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {results.map(([code, name]) => {
                  const selected = outputLanguages.includes(code);
                  const locked = code === "en";
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={locked || (!selected && outputLanguages.length >= MAX_LANGUAGES)}
                      onClick={() => {
                        if (!locked && !selected) {
                          onToggle(code);
                          setOpen(false);
                          setQuery("");
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted disabled:cursor-default",
                        selected && "bg-accent/10"
                      )}
                    >
                      <span>
                        {name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {locked ? "· always on" : (LANGUAGE_NATIVE[code] ?? "")}
                        </span>
                      </span>
                      {selected && <Check size={14} className="text-accent" weight="bold" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {atLimit && (
        <p className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          Maximum {MAX_LANGUAGES} languages reached. Remove one to add another.
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        ★ = primary · tap a chip to manage it. English is the source for all translations.
      </p>
    </div>
  );
}
