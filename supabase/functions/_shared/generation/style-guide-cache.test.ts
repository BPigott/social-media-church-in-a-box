// Tests for style-guide-cache.ts helpers.
//
// Run: deno test --allow-env --allow-net --allow-read supabase/functions/_shared/generation/style-guide-cache.test.ts

import {
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  buildGeminiFailoverUserPrompt,
  isContentFilterError,
  stripDashes,
} from "./style-guide-cache.ts";
import { assertStringIncludes } from "https://deno.land/std@0.220.0/assert/mod.ts";

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

// The Gemini failover trigger predicate. Must match Anthropic 400 content-filter
// errors and ONLY those: not 429 rate limits, not 5xx server errors, not empty
// responses, not generic 400s. Wrong predicate = either missed failovers or
// failover firing on the happy path (burning budget for no reason).

Deno.test("isContentFilterError: matches Anthropic 400 + content filtering message", () => {
  const err = new Error(
    `[bible-study] Anthropic API 400: {"type":"error","error":{"type":"invalid_request_error","message":"Output blocked by content filtering policy"},"request_id":"req_011CbPRcFJKcwdr3sPYG6smw"}`,
  );
  assertEquals(isContentFilterError(err), true);
});

Deno.test("isContentFilterError: matches when 'content filtering' appears in mixed case", () => {
  const err = new Error(
    `Anthropic API 400: {"message":"Output blocked by CONTENT FILTERING policy"}`,
  );
  assertEquals(isContentFilterError(err), true);
});

Deno.test("isContentFilterError: does not match generic 400s without content-filter message", () => {
  const err = new Error(
    `[bible-study] Anthropic API 400: {"error":{"message":"Invalid max_tokens"}}`,
  );
  assertEquals(isContentFilterError(err), false);
});

Deno.test("isContentFilterError: does not match 429 rate-limit errors", () => {
  const err = new Error(`[bible-study] Anthropic API 429: rate_limit_error`);
  assertEquals(isContentFilterError(err), false);
});

Deno.test("isContentFilterError: does not match 5xx server errors", () => {
  const err = new Error(`[bible-study] Anthropic API 500: internal_server_error`);
  assertEquals(isContentFilterError(err), false);
});

Deno.test("isContentFilterError: does not match empty-response errors", () => {
  const err = new Error(`[bible-study] empty response from Anthropic`);
  assertEquals(isContentFilterError(err), false);
});

Deno.test("isContentFilterError: does not match missing API key errors", () => {
  const err = new Error(`ANTHROPIC_API_KEY not configured`);
  assertEquals(isContentFilterError(err), false);
});

Deno.test("isContentFilterError: returns false for non-Error values", () => {
  assertEquals(isContentFilterError("Anthropic API 400 content filtering"), false);
  assertEquals(isContentFilterError(null), false);
  assertEquals(isContentFilterError(undefined), false);
  assertEquals(isContentFilterError({ message: "Anthropic API 400 content filtering" }), false);
});

// Gemini failover sends a slightly different user prompt to compensate for
// two observed Gemini behaviours: NIV-text truncation and unconsolidated
// overlapping references. The addendum is the only difference vs Anthropic's
// user prompt, so these tests guard against accidental deletion or drift.

Deno.test("buildGeminiFailoverUserPrompt: preserves the original prompt verbatim", () => {
  const original = "# Context\nChurch: Leicester Vineyard\n\n# Editorial brief\n...";
  const result = buildGeminiFailoverUserPrompt(original);
  assertStringIncludes(result, original);
});

Deno.test("buildGeminiFailoverUserPrompt: appends the NIV-full-text rendering note", () => {
  const result = buildGeminiFailoverUserPrompt("original");
  assertStringIncludes(result, "render the FULL NIV text from the brief");
});

Deno.test("buildGeminiFailoverUserPrompt: appends the overlapping-reference consolidation note", () => {
  const result = buildGeminiFailoverUserPrompt("original");
  assertStringIncludes(result, "If two references overlap");
});

Deno.test("buildGeminiFailoverUserPrompt: addendum comes AFTER the original prompt", () => {
  const original = "ORIGINAL_PROMPT_MARKER";
  const result = buildGeminiFailoverUserPrompt(original);
  const originalIndex = result.indexOf(original);
  const addendumIndex = result.indexOf("Rendering notes");
  assertEquals(originalIndex >= 0, true);
  assertEquals(addendumIndex > originalIndex, true);
});
