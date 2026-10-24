// Regression test for Lockpick finding LP-4SJ838: the site served no
// Content-Security-Policy header. Run with `npm run test:headers`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

const headersFor = (path) =>
  Object.fromEntries(
    (config.headers ?? [])
      .filter(({ source }) => new RegExp(`^${source}$`).test(path))
      .flatMap(({ headers }) => headers.map(({ key, value }) => [key, value])),
  );

const directives = (policy) =>
  Object.fromEntries(
    policy.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
      const [name, ...sources] = d.split(/\s+/);
      return [name, sources];
    }),
  );

for (const path of ["/", "/dashboard", "/billing"]) {
  test(`${path} sends an enforced CSP that blocks framing, base and plugins`, () => {
    const csp = headersFor(path)["Content-Security-Policy"];
    assert.ok(csp, "Content-Security-Policy header missing");
    const d = directives(csp);
    assert.deepEqual(d["frame-ancestors"], ["'none'"]);
    assert.deepEqual(d["base-uri"], ["'self'"]);
    assert.deepEqual(d["object-src"], ["'none'"]);
  });

  test(`${path} sends a report-only script policy without unsafe script sources`, () => {
    const csp = headersFor(path)["Content-Security-Policy-Report-Only"];
    assert.ok(csp, "Content-Security-Policy-Report-Only header missing");
    const d = directives(csp);
    assert.deepEqual(d["script-src"], ["'self'"]);
    assert.ok(d["connect-src"].includes("https://*.supabase.co"), "Supabase API must stay reachable");
    assert.ok(d["connect-src"].includes("wss://*.supabase.co"), "Supabase realtime must stay reachable");
    assert.ok(d["font-src"].includes("https://fonts.gstatic.com"), "Google Fonts must stay loadable");
  });
}

test("SPA rewrite to index.html is unchanged", () => {
  assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
});
