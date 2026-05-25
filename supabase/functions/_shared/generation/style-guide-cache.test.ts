// Tests for style-guide-cache.ts helpers.
//
// Run: deno test --allow-env --allow-net --allow-read supabase/functions/_shared/generation/style-guide-cache.test.ts

import {
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { stripDashes } from "./style-guide-cache.ts";

Deno.test("stripDashes: replaces em dash surrounded by whitespace with comma", () => {
  assertEquals(stripDashes("something — else"), "something, else");
});

Deno.test("stripDashes: replaces en dash surrounded by whitespace with comma", () => {
  assertEquals(stripDashes("something – else"), "something, else");
});

Deno.test("stripDashes: replaces multiple dashes in a phrase", () => {
  assertEquals(stripDashes("This is — well — fine"), "This is, well, fine");
});

// Critical: Scripture verse ranges use en dashes with NO surrounding whitespace.
// They must be preserved verbatim, otherwise "Mark 6:30–44" becomes "Mark 6:30, 44".
Deno.test("stripDashes: preserves en-dash verse ranges (no surrounding whitespace)", () => {
  assertEquals(stripDashes("Mark 6:30–44"), "Mark 6:30–44");
});

Deno.test("stripDashes: preserves em-dash with no surrounding whitespace", () => {
  // Rare in real copy, but the same rule applies for safety.
  assertEquals(stripDashes("word—word"), "word—word");
});

Deno.test("stripDashes: leaves regular hyphens alone", () => {
  assertEquals(stripDashes("hyphen-word"), "hyphen-word");
});

Deno.test("stripDashes: handles dash at start/end with whitespace on the inside", () => {
  // Trailing space after the comma is acceptable (cosmetic, not semantic).
  assertEquals(stripDashes("— leading"), ", leading");
  assertEquals(stripDashes("trailing —"), "trailing, ");
});
