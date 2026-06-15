// Vercel serverless function: subscribe a visitor to Mailchimp from the result gate.
//
// Receives ONLY { firstName, email, consent, profile, profileName, investableAssets }.
// The raw quiz answers and calculator inputs never reach the server — the profile and
// the investable-asset total are computed client-side and are all that is shared.
//
// Secrets come from environment variables set in Vercel (never in the client bundle):
//   MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX
//
// Optional audience merge fields (create them in Mailchimp to capture more than the
// name): PROFILE (text) and ASSETS (number). If they don't exist the function retries
// with just FNAME, so a subscribe still succeeds. The profile is also added as a tag
// (tags are auto-created by Mailchimp).

import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
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
  const profile = String(body.profile || "").trim().slice(0, 8);
  const profileName = String(body.profileName || "").trim().slice(0, 120);
  const assetsNum = Number(body.investableAssets);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk || !firstName || !consent) {
    return res.status(400).json({ error: "Invalid submission." });
  }

  const auth = "Basic " + Buffer.from("anystring:" + apiKey).toString("base64");
  const hash = crypto.createHash("md5").update(email).digest("hex");
  const memberUrl =
    "https://" + prefix + ".api.mailchimp.com/3.0/lists/" + listId + "/members/" + hash;

  const fullMergeFields = { FNAME: firstName };
  if (profileName) fullMergeFields.PROFILE = profileName;
  if (Number.isFinite(assetsNum)) fullMergeFields.ASSETS = Math.round(assetsNum);

  async function upsert(mergeFields) {
    return fetch(memberUrl, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: mergeFields
      })
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
    const tagName = profileName || profile;
    if (tagName) {
      try {
        await fetch(memberUrl + "/tags", {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ tags: [{ name: tagName, status: "active" }] })
        });
      } catch (e) {
        /* tagging is non-critical */
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Mailchimp." });
  }
}
