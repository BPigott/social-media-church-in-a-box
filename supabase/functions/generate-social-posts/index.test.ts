import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";

const BASE_URL = "http://localhost:54321/functions/v1";
const TEST_JWT = Deno.env.get("TEST_JWT") ?? "";

async function callGenerate(body: Record<string, unknown>, jwt?: string) {
  return fetch(`${BASE_URL}/generate-social-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt ?? TEST_JWT}`,
    },
    body: JSON.stringify(body),
  });
}

Deno.test("missing idempotency_key returns 400", async () => {
  const res = await callGenerate({
    transcript: "a".repeat(200),
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "idempotency_key required");
});

Deno.test("content safety blocks prohibited content", async () => {
  const res = await callGenerate({
    idempotency_key: crypto.randomUUID(),
    transcript: "fuck this sermon about grace",
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.violations, "object");
});

Deno.test("expired subscription returns 402", async () => {
  const expiredJwt = Deno.env.get("EXPIRED_JWT");
  if (!expiredJwt) {
    console.warn("EXPIRED_JWT not set — skipping subscription enforcement test");
    return;
  }
  const res = await callGenerate(
    {
      idempotency_key: crypto.randomUUID(),
      transcript: "a".repeat(200),
      contentTypes: ["social_media"],
      platforms: ["facebook"],
      churchId: "00000000-0000-0000-0000-000000000001",
    },
    expiredJwt
  );
  assertEquals(res.status, 402);
  const body = await res.json();
  assertEquals(body.subscription_status, "expired");
});

Deno.test("duplicate idempotency_key returns existing result without calling Claude again", async () => {
  const key = crypto.randomUUID();
  const payload = {
    idempotency_key: key,
    transcript: "a".repeat(200),
    contentTypes: ["social_media"],
    platforms: ["facebook"],
    churchId: "00000000-0000-0000-0000-000000000001",
  };

  const first = await callGenerate(payload);
  assertEquals(first.status, 200);

  const second = await callGenerate(payload);
  assertEquals(second.status, 200);

  const body1 = await first.json();
  const body2 = await second.json();
  assertEquals(JSON.stringify(body1), JSON.stringify(body2));
});
