// Vercel serverless function: subscribe a visitor to Mailchimp from the result gate.
//
// Receives ONLY { firstName, email, consent, profile, investableAssets }.
// The raw quiz answers and calculator inputs never reach the server — the profile and
// the investable-asset total are computed client-side and are all that is shared.
// The human-readable profile name is derived here from the A–D letter, so clients
// can't inject arbitrary tag or merge-field content.
//
// New contacts are created as "pending" (double opt-in): Mailchimp emails a
// confirmation link and only people who click it join the audience — CASL-safe, and
// it defangs scripted abuse of this open endpoint.
//
// Secrets come from environment variables set in Vercel (never in the client bundle):
//   MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX
//
// Optional audience merge fields (create them in Mailchimp to capture more than the
// name): PROFILE (text) and ASSETS (number). If they don't exist the function retries
// with just FNAME, so a subscribe still succeeds. The profile name is also added as a
// tag (tags are auto-created by Mailchimp).

import crypto from "node:crypto";

const PROFILE_NAMES = {
  A: "The richest person in the graveyard",
  B: "The waiting room",
  C: "The builder",
  D: "Generosity in motion"
};

const FETCH_TIMEOUT_MS = 8000; // a hung Mailchimp call must not run out the function

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Browsers attach Origin to cross-site POSTs (including preflight-less
  // text/plain ones) — reject anything not aimed at our own host. Requests
  // without an Origin header (same-origin GET-less clients, curl) pass.
  const headers = req.headers || {};
  if (headers.origin) {
    let originHost = null;
    try {
      originHost = new URL(headers.origin).host;
    } catch (e) {
      /* malformed origin — treated as mismatch */
    }
    if (!originHost || originHost !== headers.host) {
      return res.status(403).json({ error: "Cross-origin requests are not allowed." });
    }
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const prefix = process.env.MAILCHIMP_SERVER_PREFIX;
  if (!apiKey || !listId || !prefix) {
    // Not configured yet — report a soft failure; the UI unlocks results anyway.
    return res.status(503).json({ error: "Mailchimp is not configured." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const firstName = String(body.firstName || "").trim().slice(0, 100);
  const email = String(body.email || "").trim().toLowerCase();
  const consent = body.consent === true;
  const profile = String(body.profile || "").trim();
  const assetsNum = Number(body.investableAssets);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const profileOk = Object.prototype.hasOwnProperty.call(PROFILE_NAMES, profile);
  if (!emailOk || !firstName || !consent || !profileOk) {
    return res.status(400).json({ error: "Invalid submission." });
  }
  const profileName = PROFILE_NAMES[profile];

  const auth = "Basic " + Buffer.from("anystring:" + apiKey).toString("base64");
  const hash = crypto.createHash("md5").update(email).digest("hex");
  const memberUrl =
    "https://" + prefix + ".api.mailchimp.com/3.0/lists/" + listId + "/members/" + hash;

  const fullMergeFields = { FNAME: firstName, PROFILE: profileName };
  if (Number.isFinite(assetsNum)) fullMergeFields.ASSETS = Math.round(assetsNum);

  async function upsert(mergeFields) {
    return fetch(memberUrl, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "pending",
        merge_fields: mergeFields
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
  }

  try {
    let r = await upsert(fullMergeFields);
    // If custom merge fields (PROFILE / ASSETS) aren't set up in the audience,
    // Mailchimp returns 400 — retry with just the always-present FNAME.
    if (!r.ok && r.status === 400) {
      r = await upsert({ FNAME: firstName });
    }
    if (!r.ok) {
      return res.status(502).json({ error: "Mailchimp rejected the request." });
    }

    // Tag with the result profile (best-effort; auto-created by Mailchimp).
    try {
      await fetch(memberUrl + "/tags", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [{ name: profileName, status: "active" }] }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
    } catch (e) {
      /* tagging is non-critical */
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Mailchimp." });
  }
}
