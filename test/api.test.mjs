// Checks for the /api/subscribe Vercel function (run: `npm test`).
// Mocks global.fetch so no real Mailchimp call is made.
import crypto from "node:crypto";
import handler from "../api/subscribe.js";

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + name + (detail ? "  (" + detail + ")" : "")); }
  else { fail++; console.log("  FAIL " + name + (detail ? "  (" + detail + ")" : "")); }
}
function mockRes() {
  return {
    statusCode: null, body: null, headers: {},
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    setHeader(k, v) { this.headers[k] = v; }
  };
}

async function run() {
  // 1) Non-POST -> 405
  let res = mockRes();
  await handler({ method: "GET" }, res);
  check("GET -> 405", res.statusCode === 405);

  // 2) Cross-origin POST -> 403 (Origin host must match our own host)
  res = mockRes();
  await handler(
    { method: "POST", headers: { origin: "https://evil.example", host: "app.example" }, body: {} },
    res
  );
  check("cross-origin POST -> 403", res.statusCode === 403);
  res = mockRes();
  await handler(
    { method: "POST", headers: { origin: "not a url", host: "app.example" }, body: {} },
    res
  );
  check("malformed Origin -> 403", res.statusCode === 403);

  // 3) POST without env -> 503 (soft failure; UI still unlocks)
  delete process.env.MAILCHIMP_API_KEY;
  delete process.env.MAILCHIMP_LIST_ID;
  delete process.env.MAILCHIMP_SERVER_PREFIX;
  res = mockRes();
  await handler({ method: "POST", body: { firstName: "Sam", email: "sam@example.com", consent: true, profile: "A" } }, res);
  check("POST without env -> 503", res.statusCode === 503);

  process.env.MAILCHIMP_API_KEY = "test-key";
  process.env.MAILCHIMP_LIST_ID = "testlist";
  process.env.MAILCHIMP_SERVER_PREFIX = "us00";

  // 4) Invalid bodies -> 400 (each failing condition in isolation)
  const valid = { firstName: "Sam", email: "sam@example.com", consent: true, profile: "A", investableAssets: 750000 };
  res = mockRes();
  await handler({ method: "POST", body: { firstName: "", email: "nope", consent: false } }, res);
  check("POST invalid body -> 400", res.statusCode === 400);
  res = mockRes();
  await handler({ method: "POST", body: { ...valid, consent: false } }, res);
  check("consent=false alone -> 400", res.statusCode === 400);
  res = mockRes();
  await handler({ method: "POST", body: { ...valid, email: "not-an-email" } }, res);
  check("bad email alone -> 400", res.statusCode === 400);
  res = mockRes();
  await handler({ method: "POST", body: { ...valid, profile: "Z" } }, res);
  check("unknown profile -> 400 (no tag injection)", res.statusCode === 400);

  // 5) Valid body + mocked Mailchimp success -> 200
  let calls = [];
  global.fetch = async (url, opts) => {
    calls.push({ url, opts, body: opts && opts.body ? JSON.parse(opts.body) : null });
    return { ok: true, status: 200, json: async () => ({}) };
  };
  res = mockRes();
  await handler(
    {
      method: "POST",
      headers: { origin: "https://app.example", host: "app.example" },
      body: { firstName: "Sam", email: "Sam@Example.com", consent: true, profile: "A", investableAssets: 2800000 }
    },
    res
  );
  check("POST valid (same-origin) -> 200", res.statusCode === 200);

  const put = calls.find((c) => c.opts.method === "PUT");
  const expectHash = crypto.createHash("md5").update("sam@example.com").digest("hex");
  check("email lowercased + md5-hashed in URL", put && put.url.endsWith("/members/" + expectHash), expectHash);
  check("merge_fields carry FNAME", put && put.body.merge_fields.FNAME === "Sam");
  check("PROFILE derived server-side from the letter", put && put.body.merge_fields.PROFILE === "The richest person in the graveyard");
  check("merge_fields carry ASSETS (number)", put && put.body.merge_fields.ASSETS === 2800000);
  check("status_if_new = pending (double opt-in)", put && put.body.status_if_new === "pending");
  check("Mailchimp calls carry a timeout signal", put && put.opts.signal instanceof AbortSignal);

  const tagCall = calls.find((c) => c.url.endsWith("/tags"));
  check("adds derived profile name as a tag", !!tagCall && tagCall.body.tags[0].name === "The richest person in the graveyard");

  // No raw quiz/calculator data is ever forwarded.
  const wire = JSON.stringify(calls, (k, v) => (v instanceof AbortSignal ? "[signal]" : v));
  const forbidden = ["rrsp", "tfsa", "nonreg", "spending", "savings", "answers", "q1", "retireAge"];
  check("no raw answers/inputs in any request", forbidden.every((k) => wire.indexOf(k) === -1));

  // 6) Merge-field 400 -> retry with FNAME only, still succeeds.
  calls = [];
  let n = 0;
  global.fetch = async (url, opts) => {
    calls.push({ url, opts, body: opts && opts.body ? JSON.parse(opts.body) : null });
    if (opts.method === "PUT") {
      n++;
      return { ok: n > 1, status: n > 1 ? 200 : 400, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  res = mockRes();
  await handler(
    { method: "POST", body: { firstName: "Dana", email: "dana@example.com", consent: true, profile: "D", investableAssets: 4000000 } },
    res
  );
  const puts = calls.filter((c) => c.opts.method === "PUT");
  check("retries PUT after a 400", puts.length === 2);
  check("retry sends only FNAME", puts[1] && Object.keys(puts[1].body.merge_fields).join(",") === "FNAME");
  check("subscribe still succeeds -> 200", res.statusCode === 200);

  // 7) Network failure -> 502 (client still unlocks; UI shows the delayed note)
  global.fetch = async () => {
    throw new Error("boom");
  };
  res = mockRes();
  await handler({ method: "POST", body: { firstName: "Kim", email: "kim@example.com", consent: true, profile: "B" } }, res);
  check("network throw -> 502", res.statusCode === 502);

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}

run();
