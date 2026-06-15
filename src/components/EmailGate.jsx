import { useState } from "react";
import { CONTENT } from "../data/content.js";

// The unlock gate. On a valid submission it POSTs name + email + the shared
// summary (profile + investable-asset total) to /api/subscribe, then unlocks the
// full result. Unlock happens on a valid submit regardless of the API result, so
// a transient Mailchimp error never traps a user behind their own results; the
// caller is told whether the send succeeded (to show a "guide delayed" note).
export function EmailGate({ profile, profileName, investableAssets, onUnlock }) {
  const D = CONTENT.emailCapture;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "Add your first name so the guide knows who it's for.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "That email doesn't look complete.";
    if (!consent) errs.consent = "Tick the box to unlock your results and get the guide.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    let sendOk = false;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name.trim(),
          email: email.trim(),
          consent: true,
          profile,
          profileName,
          investableAssets
        })
      });
      sendOk = res.ok;
    } catch (err) {
      sendOk = false;
    }
    setSubmitting(false);
    onUnlock(sendOk);
  }

  return (
    <div className="rpg-card rpg-gate" data-screen-label="Unlock results">
      <div>
        <h2 className="rpg-headline" style={{ fontSize: "22px", fontWeight: 300, marginBottom: "8px" }}>
          {D.heading}
        </h2>
        <p className="rpg-body" style={{ fontSize: "15px" }}>
          {D.body}
        </p>
      </div>
      <form className="rpg-form" onSubmit={submit} noValidate>
        <div className="rpg-field">
          <label htmlFor="rpg-first-name">First name</label>
          <input
            id="rpg-first-name"
            className={"rpg-input" + (errors.name ? " rpg-input--error" : "")}
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name ? <span className="rpg-field-error">{errors.name}</span> : null}
        </div>
        <div className="rpg-field">
          <label htmlFor="rpg-email">Email</label>
          <input
            id="rpg-email"
            className={"rpg-input" + (errors.email ? " rpg-input--error" : "")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email ? <span className="rpg-field-error">{errors.email}</span> : null}
        </div>
        <label className="rpg-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{D.consent}</span>
        </label>
        {errors.consent ? <span className="rpg-field-error">{errors.consent}</span> : null}
        <p className="rpg-gate-reassure">
          <svg className="rpg-gate-lock" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>
            Your detailed answers stay in your browser. Only your name, email, result and
            investable-asset total are shared.
          </span>
        </p>
        <div>
          <button className="rpg-btn" type="submit" disabled={submitting}>
            {submitting ? "Unlocking…" : D.button}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmailGate;
