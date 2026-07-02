# The Richest Person in the Graveyard

A mobile-first, single-page financial self-assessment for **Adam Malcolm, CFP, MFA-P**
(Strategic Generosity, IG Wealth Management). Twelve questions and a live retirement
projection help a visitor see *where they stand* — and, if they choose, unlock their full
results and a tailored guide.

Built with **Vite + React**. Fonts are self-hosted and the projection math runs entirely in
the browser, so the experience makes no third-party network calls on its own.

## The flow

1. **Landing** — the brand promise, one big question.
2. **Eight mindset questions** — tap to advance; an intentionality score builds quietly.
3. **Section bridge** — "now let's run your numbers."
4. **Projection calculator** — age, province, RRSP/TFSA/non-registered balances, savings,
   spending and investment style feed a year-by-year projection to age 95, with estate and
   estimated tax-at-death figures (FP Canada 2026 assumptions; EY provincial tax cards;
   IG probate schedules). Retirement withdrawals are grossed up for income tax: the
   RRSP/RRIF-sourced portion of each draw is taxed at an editable average rate (default 25%);
   TFSA and non-registered withdrawals are treated as tax-free in life (non-registered gains
   are still estimated at death). All assumptions are visible and adjustable in the drawer.
5. **Result** — a gauge and one of four profiles are shown for free; the full projection,
   the explanation and the biggest opportunity **unlock** after the visitor enters their
   name + email and opts to share their result profile and investable-asset total.
6. **Booking** — "Book a conversation" opens Adam's Microsoft Bookings page in a modal.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
```

Build / preview the production bundle:

```sh
npm run build
npm run preview
```

## Email capture (Mailchimp)

The result gate POSTs to a Vercel serverless function at [`api/subscribe.js`](api/subscribe.js),
which adds the visitor to a Mailchimp audience. **Only** the first name, email, result
profile and investable-asset total are sent — never the raw answers or calculator inputs.

Set these environment variables in the Vercel project (Production + Preview); copy
`.env.example` to `.env` for local `vercel dev`:

| Variable | Where to find it |
| --- | --- |
| `MAILCHIMP_API_KEY` | Mailchimp → Account & billing → Extras → API keys |
| `MAILCHIMP_LIST_ID` | Mailchimp → Audience → Settings → Audience name and defaults → Audience ID |
| `MAILCHIMP_SERVER_PREFIX` | the data centre in your account/API key, e.g. `us21` |

Optional: create two audience **merge fields** to capture more than the name —
`PROFILE` (text) and `ASSETS` (number). If they don't exist the function still subscribes
with the name and adds the profile as a **tag** (tags are auto-created). If the variables
are unset, the gate still unlocks the visitor's results and shows a "guide may be delayed"
note.

## Deploy (Vercel)

Vercel auto-detects the Vite build (`dist/`) and the function in `api/`. Connect the repo,
set the environment variables above, and deploy. `vercel.json` only sets response headers
(CSP and friends, plus long-lived caching for fonts) — build and routing stay auto-detected.
New Mailchimp contacts are created as **pending** (double opt-in): they confirm by email
before joining the audience.

## Design source

Recreated from the Claude Design handoff (`Graveyard_App_Design_Filehandoff.zip`). Brand
tokens live in [`src/styles/tokens.css`](src/styles/tokens.css); component styles in
[`src/styles/app.css`](src/styles/app.css). The disclaimer, consent and privacy strings in
[`src/data/content.js`](src/data/content.js) are interim wording pending IG compliance
sign-off (see the note at the top of that file).

> This tool is for education and reflection. It is not financial, tax or legal advice and it
> is not a financial plan.
