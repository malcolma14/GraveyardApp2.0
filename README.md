# GraveyardApp 2.0 — Richest Person in the Graveyard

A single-page, zero-dependency web app: a memorial leaderboard of history's
wealthiest souls, rendered as a moonlit graveyard. Because you can't take it
with you.

## Running it

Open [`Richest Person in the Graveyard.html`](<Richest%20Person%20in%20the%20Graveyard.html>)
in any modern browser. No build step, no server, no dependencies.

## Features

- **Graveyard leaderboard** — each person is a headstone; the stone's size
  scales with their (inflation-adjusted) net worth, and the current #1 gets a
  golden headstone and a crown.
- **Search & sort** — filter by name; sort by wealth, name, or year of death.
- **Stats bar** — souls at rest, combined fortune, and the current richest.
- **Bury someone new** — add your own entries (name, years, net worth,
  epitaph) via a modal form; custom graves persist in `localStorage` and can
  be removed on hover.
- **Atmosphere** — twinkling stars, a glowing moon, hover-to-reveal epitaphs,
  and the Steve Jobs quote that inspired the title.

## A note on the design source

This implementation was requested from a shared design file at
`https://api.anthropic.com/v1/design/h/KqlncmvYkPCIQPtYxbsURQ?open_file=Richest+Person+in+the+Graveyard.html`,
but that link returned **404 Not Found** at implementation time (the share
appears to have expired), so the design and its readme could not be read.
Everything here is a best-effort interpretation built from the file name and
the project context. If the original design differs, re-share the file and
this page can be reworked to match.
